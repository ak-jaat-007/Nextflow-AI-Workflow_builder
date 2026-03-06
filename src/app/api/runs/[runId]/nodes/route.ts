import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { runId: string } }
) {
  try {
    const { runId } = params;

    const nodeRuns = await prisma.nodeRun.findMany({
      where: { runId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(nodeRuns);
  } catch (error) {
    console.error("Fetch node details error:", error);
    return NextResponse.json(
      { error: "Failed to fetch node details" },
      { status: 500 }
    );
  }
}