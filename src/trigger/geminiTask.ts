import { task } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

async function imageToBase64(url: string) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Failed to fetch image from URL");
  }

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

export const generateTextTask = task({
  id: "generate-text",

  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 30000,
    maxTimeoutInMs: 60000,
  },

  run: async (payload: {
    nodes: any[];
    edges: any[];
    runId: string;
    prompt?: string;
    imageUrl?: string;
    nodeRunId?: string; // 👈 added optional field
  }) => {
    const startTime = Date.now();

    const apiKey =
      process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY missing in environment variables");
    }

    try {
      console.log(`[Task] Processing Run: ${payload.runId}`);

      /* -------------------------
         Find Gemini Node
      ------------------------- */
      const llmNode = payload.nodes.find((n) => n.type === "geminiLLM");

      if (!llmNode) {
        throw new Error("No LLM node found in workflow");
      }

      /* -------------------------
         Create or retrieve NodeRun entry
      ------------------------- */
      let nodeRunId = payload.nodeRunId;

      // If nodeRunId is not provided, create a new NodeRun (original behaviour)
      if (!nodeRunId) {
        const newRun = await prisma.nodeRun.create({
          data: {
            runId: payload.runId,
            nodeId: llmNode.id,
            nodeType: "geminiLLM",
            status: "RUNNING",
          },
        });
        nodeRunId = newRun.id;
      } else {
        // If nodeRunId is provided, optionally update its status to RUNNING (already set by route)
        // This ensures the record reflects the running state if needed.
        await prisma.nodeRun.update({
          where: { id: nodeRunId },
          data: { status: "RUNNING" },
        });
      }

      /* -------------------------
         Get incoming edges
      ------------------------- */
      const incomingEdges = payload.edges.filter((e) => e.target === llmNode.id);

      let systemPrompt = "";
      let userMessages: string[] = [];
      let imageUrl: string | null = null;

      for (const edge of incomingEdges) {
        const sourceNode = payload.nodes.find((n) => n.id === edge.source);
        if (!sourceNode) continue;

        if (edge.targetHandle === "system") {
          if (sourceNode.type === "textInput") {
            systemPrompt = sourceNode.data?.value || "";
          }
        }

        if (edge.targetHandle === "user") {
          if (sourceNode.type === "textInput") {
            userMessages.push(sourceNode.data?.value || "");
          }
        }

        if (edge.targetHandle === "image") {
          if (sourceNode.type === "imageUpload") {
            imageUrl = sourceNode.data?.value || null;
          }
          if (sourceNode.type === "cropImage") {
            imageUrl = sourceNode.data?.value || null;
          }
          if (sourceNode.type === "extractFrame") {
            imageUrl = sourceNode.data?.value || null;
          }
        }
      }

      const combinedUserMessage = userMessages.join("\n");
      const finalPrompt = `
System:
${systemPrompt}

User:
${combinedUserMessage}
      `;

      console.log("PROMPT:", finalPrompt);
      console.log("IMAGE URL:", imageUrl);

      /* -------------------------
         Initialize Gemini
      ------------------------- */
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelName = llmNode.data?.model || "gemini-1.5-flash";
      const model = genAI.getGenerativeModel({ model: modelName });

      let result;

      if (imageUrl) {
        const fullUrl =
          imageUrl.startsWith("http")
            ? imageUrl
            : `http://localhost:3000${imageUrl}`;

        const base64Image = await imageToBase64(fullUrl);

        result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                { text: finalPrompt },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64Image,
                  },
                },
              ],
            },
          ],
        });
      } else {
        result = await model.generateContent(finalPrompt);
      }

      const response = await result.response;
      const text = response.text();

      /* -------------------------
         Update Run
      ------------------------- */
      await prisma.run.update({
        where: { id: payload.runId },
        data: {
          status: "COMPLETED",
          outputData: { text },
        },
      });

      /* -------------------------
         Update NodeRun – use specific ID if available, otherwise fallback to updateMany
      ------------------------- */
      if (nodeRunId) {
        await prisma.nodeRun.update({
          where: { id: nodeRunId },
          data: {
            status: "COMPLETED",
            output: { text },
            duration: (Date.now() - startTime) / 1000, // keep seconds to match original
          },
        });
      } else {
        await prisma.nodeRun.updateMany({
          where: {
            runId: payload.runId,
            nodeId: llmNode.id,
          },
          data: {
            status: "COMPLETED",
            output: { text },
            duration: (Date.now() - startTime) / 1000,
          },
        });
      }

      console.log(`[Task] Run ${payload.runId} completed`);

      return { text };
    } catch (error: any) {
      console.error("[Task Error]:", error);

      let errorDetail = "AI Task Failed";
      if (error.status === 429 || error.message?.includes("429")) {
        errorDetail = "Gemini Quota Exceeded";
      }

      await prisma.run.update({
        where: { id: payload.runId },
        data: {
          status: "FAILED",
          outputData: { error: errorDetail },
        },
      });

      /* -------------------------
         Update NodeRun on error – use specific ID if available
      ------------------------- */
      if (payload.nodeRunId) {
        await prisma.nodeRun.update({
          where: { id: payload.nodeRunId },
          data: {
            status: "FAILED",
            output: { error: errorDetail },
            duration: (Date.now() - startTime) / 1000,
          },
        });
      } else {
        await prisma.nodeRun.updateMany({
          where: { runId: payload.runId },
          data: {
            status: "FAILED",
            output: { error: errorDetail },
          },
        });
      }

      throw error;
    }
  },
});