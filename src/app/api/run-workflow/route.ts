import { tasks } from "@trigger.dev/sdk/v3";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

import { generateTextTask } from "@/trigger/geminiTask";
import { ffmpegTask } from "@/trigger/ffmpegTask";
import { cropTask } from "@/trigger/cropTask";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { nodes, edges } = body;

    if (!nodes || !edges) {
      return NextResponse.json(
        { success: false, error: "Nodes or edges missing" },
        { status: 400 }
      );
    }

    /* ---------------------------
       Ensure workflow exists (scoped to user)
    --------------------------- */

    let workflow = await prisma.workflow.findFirst({
      where: {
        name: "Main Workflow",
        userId: userId,
      },
    });

    if (!workflow) {
      workflow = await prisma.workflow.create({
        data: {
          userId: userId,
          name: "Main Workflow",
          nodes,
          edges,
        },
      });
    } else {
      workflow = await prisma.workflow.update({
        where: { id: workflow.id },
        data: {
          nodes,
          edges,
        },
      });
    }

    /* ---------------------------
       Create Run Entry
    --------------------------- */

    const workflowRun = await prisma.run.create({
      data: {
        workflowId: workflow.id,
        status: "PENDING",
      },
    });

    console.log(`[Backend] Created Run ID: ${workflowRun.id}`);

    /* ---------------------------
       Router Logic
    --------------------------- */

    const hasLLM = nodes.some((n: any) => n.type === "geminiLLM");
    const hasExtractFrame = nodes.some((n: any) => n.type === "extractFrame");
    const hasCrop = nodes.some((n: any) => n.type === "cropImage");

    const payload = {
      nodes,
      edges,
      runId: workflowRun.id,
    };

    /* ---------------------------
       STEP 1: Extract Frame
    --------------------------- */

    if (hasExtractFrame) {
      console.log("Triggering FFmpeg Extract Task...");

      const videoNode = nodes.find((n: any) => n.type === "videoUpload");
      const extractNode = nodes.find((n: any) => n.type === "extractFrame");

      const extractNodeRun = await prisma.nodeRun.create({
        data: {
          runId: workflowRun.id,
          nodeId: extractNode?.id || videoNode?.id || "extract-node",
          nodeType: "extractFrame",
          status: "RUNNING",
          input: {
            videoUrl: videoNode?.data?.value,
          },
        },
      });

      await tasks.trigger<typeof ffmpegTask>("ffmpeg-process", {
        ...payload,
        workflowId: workflow.id,
        videoUrl: videoNode?.data?.value,
        type: "extract",
        nodeRunId: extractNodeRun.id,
      });
    }

    /* ---------------------------
       STEP 2: Crop Image
    --------------------------- */

    else if (hasCrop) {
      console.log("Triggering Crop Task...");

      const cropNode = nodes.find((n: any) => n.type === "cropImage");
      const width = cropNode?.data?.width || 500;
      const height = cropNode?.data?.height || 500;

      const imageNode =
        nodes.find((n: any) => n.type === "imageUpload") ||
        nodes.find((n: any) => n.type === "extractFrame");

      const cropNodeRun = await prisma.nodeRun.create({
        data: {
          runId: workflowRun.id,
          nodeId: cropNode?.id || "crop-node",
          nodeType: "cropImage",
          status: "RUNNING",
          input: {
            imageUrl: imageNode?.data?.value,
            width,
            height,
          },
        },
      });

      await tasks.trigger<typeof cropTask>("crop-image", {
        ...payload,
        workflowId: workflow.id,
        imageUrl: imageNode?.data?.value,
        width,
        height,
        nodeRunId: cropNodeRun.id,
      });
    }

    /* ---------------------------
       STEP 3: Gemini (LLM)
    --------------------------- */

    else if (hasLLM) {
      console.log("Triggering Gemini Task...");

      const llmNode = nodes.find((n: any) => n.type === "geminiLLM");

      const llmNodeRun = await prisma.nodeRun.create({
        data: {
          runId: workflowRun.id,
          nodeId: llmNode?.id || "llm-node",
          nodeType: "geminiLLM",
          status: "RUNNING",
        },
      });

      // Pass only nodeRunId (workflowId is not needed for the task)
      await tasks.trigger<typeof generateTextTask>("generate-text", {
        ...payload,
        nodeRunId: llmNodeRun.id,
      });
    }

    /* ---------------------------
       No valid node
    --------------------------- */

    else {
      await prisma.run.update({
        where: { id: workflowRun.id },
        data: {
          status: "FAILED",
          outputData: {
            error: "No action node found",
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      runId: workflowRun.id,
    });
  } catch (error: any) {
    console.error("Workflow Route Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to initiate workflow",
      },
      { status: 500 }
    );
  }
}