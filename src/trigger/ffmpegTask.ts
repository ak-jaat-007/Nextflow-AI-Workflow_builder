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
  videoUrl: string;
  type: "extract";
  nodes: any[];
  edges: any[];
  nodeRunId: string; // 👈 new field
};

export const ffmpegTask = task({
  id: "ffmpeg-process",

  run: async (payload: Payload): Promise<{ image: string }> => {
    const startTime = Date.now();

    try {
      console.log("[FFMPEG] Processing video:", payload.videoUrl);

      const input = path.join(
        process.cwd(),
        "public",
        payload.videoUrl.replace(/^\/+/, "")
      );

      const outputFolder = path.join(process.cwd(), "public", "uploads");

      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
      }

      const frameName = `frame-${Date.now()}.jpg`;
      const outputPath = path.join(outputFolder, frameName);
      const outputUrl = `/uploads/${frameName}`;

      await new Promise<void>((resolve, reject) => {
        ffmpeg(input)
          .screenshots({
            count: 1,
            filename: frameName,
            folder: outputFolder,
          })
          .on("end", () => {
            console.log("[FFMPEG] Frame extracted:", frameName);
            resolve();
          })
          .on("error", (err: Error) => {
            console.error("[FFMPEG ERROR]", err);
            reject(err);
          });
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

      // ✅ Update Run (existing code)
      await prisma.run.update({
        where: { id: payload.runId },
        data: {
          status: "COMPLETED",
          outputData: {
            image: outputUrl,
          },
        },
      });

      return { image: outputUrl };
    } catch (error) {
      console.error("[FFMPEG TASK FAILED]", error);

      // ❌ Update NodeRun with failure (store error in output)
      await prisma.nodeRun.update({
        where: { id: payload.nodeRunId },
        data: {
          status: "FAILED",
          output: {
            error: error instanceof Error ? error.message : "Frame extraction failed",
          },
          duration: Date.now() - startTime,
        },
      });

      // ❌ Update Run (existing code)
      await prisma.run.update({
        where: { id: payload.runId },
        data: {
          status: "FAILED",
          outputData: {
            error: "Frame extraction failed",
          },
        },
      });

      throw error;
    }
  },
});