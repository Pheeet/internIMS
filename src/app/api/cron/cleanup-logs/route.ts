import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // 1. Check Authorization
    const authHeader = request.headers.get("authorization");
    const secret = process.env.CRON_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Calculate Cutoff Date (10 years ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 3650);

    // 3. Delete records older than 10 years
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    // 4. Return result
    return NextResponse.json({
      message: "Cleanup successful",
      deletedCount: result.count,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    console.error("[CRON_CLEANUP_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
