import { task } from "@trigger.dev/sdk/v3";
import ffmpeg from "fluent-ffmpeg";
// import ffmpegPath from "ffmpeg-static";
import path from "path";
import fs from "fs";
import { prisma } from "@/lib/prisma";

// ffmpeg.setFfmpegPath(ffmpegPath as string);

type Payload = {
  runId: string;
  workflowId: string;
  imageUrl: string;
  width: number;
  height: number;
  nodes: any[];
  edges: any[];
  nodeRunId: string; // 👈 new field added
};

export const cropTask = task({
  id: "crop-image",

  run: async (payload: Payload): Promise<{ image: string }> => {
    const startTime = Date.now(); // 👈 track duration

    try {
      console.log("[CROP] Processing image:", payload.imageUrl);

      /* -------------------------
         Resolve input path
      --------------------------*/

      const input = path.join(
        process.cwd(),
        "public",
        payload.imageUrl.replace(/^\/+/, "")
      );

      /* -------------------------
         Ensure uploads folder
      --------------------------*/

      const outputFolder = path.join(
        process.cwd(),
        "public",
        "uploads"
      );

      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
      }

      /* -------------------------
         Output file
      --------------------------*/

      const outputName = `crop-${Date.now()}.jpg`;

      const outputPath = path.join(
        outputFolder,
        outputName
      );

      const outputUrl = `/uploads/${outputName}`;

      /* -------------------------
         Run FFMPEG crop
      --------------------------*/

      await new Promise<void>((resolve, reject) => {
        ffmpeg(input)
          .videoFilters(
            `crop=${payload.width}:${payload.height}:0:0`
          )
          .output(outputPath)
          .on("end", () => {
            console.log("[CROP] Image cropped:", outputName);
            resolve();
          })
          .on("error", (err: Error) => {
            console.error("[CROP ERROR]", err);
            reject(err);
          })
          .run();
      });

      /* -------------------------
         Update workflow nodes
      --------------------------*/

      const updatedNodes = payload.nodes.map((node: any) => {
        if (node.type === "cropImage") {
          return {
            ...node,
            data: {
              ...node.data,
              value: outputUrl,
            },
          };
        }
        return node;
      });

      await prisma.workflow.update({
        where: { id: payload.workflowId },
        data: {
          nodes: updatedNodes,
        },
      });

      /* -------------------------
         Save run result
      --------------------------*/

      await prisma.run.update({
        where: { id: payload.runId },
        data: {
          status: "COMPLETED",
          outputData: {
            image: outputUrl,
          },
        },
      });

      // ✅ Update NodeRun with success
      await prisma.nodeRun.update({
        where: { id: payload.nodeRunId },
        data: {
          status: "COMPLETED",
          output: { image: outputUrl },
          duration: Date.now() - startTime,
        },
      });

      console.log("[CROP] Task completed");

      return { image: outputUrl };

    } catch (error) {

      console.error("[CROP FAILED]", error);

      // ❌ Update NodeRun with failure (store error in output)
      await prisma.nodeRun.update({
        where: { id: payload.nodeRunId },
        data: {
          status: "FAILED",
          output: {
            error: error instanceof Error ? error.message : "Crop failed",
          },
          duration: Date.now() - startTime,
        },
      });

      await prisma.run.update({
        where: { id: payload.runId },
        data: {
          status: "FAILED",
          outputData: {
            error: "Crop failed",
          },
        },
      });

      throw error;
    }
  },
});