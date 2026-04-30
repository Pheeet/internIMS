import { NextResponse } from "next/server";
import { cleanupOrphanedFiles } from "@/lib/storage";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const secret = process.env.CRON_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await cleanupOrphanedFiles();

    return NextResponse.json({
      message: "Orphaned files cleanup successful",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[CRON_FILE_CLEANUP_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
