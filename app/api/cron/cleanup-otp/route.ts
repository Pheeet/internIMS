import { NextResponse } from "next/server";
import { cleanupExpiredOtps } from "@/lib/password-reset-otp";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  return token !== "" && token === secret;
}

async function runCleanup(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const cleanedCount = await cleanupExpiredOtps();
    return NextResponse.json({
      success: true,
      cleanedCount,
      message: `Cleaned ${cleanedCount} expired OTP record(s)`,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to cleanup expired OTP records" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return runCleanup(request);
}

export async function POST(request: Request) {
  return runCleanup(request);
}
