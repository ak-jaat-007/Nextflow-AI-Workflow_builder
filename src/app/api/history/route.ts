import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // 👈 import Clerk auth
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth(); // 👈 get authenticated user
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch only runs belonging to workflows owned by this user
    const runs = await prisma.run.findMany({
      where: {
        workflow: {
          userId: userId, // filter by user
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        workflow: true, // optional, if you need workflow details
      },
    });

    return NextResponse.json(runs);
  } catch (error) {
    console.error("Fetch history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}