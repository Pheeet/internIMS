import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db";

export const dynamic = "force-dynamic"; // Never cache health-check responses

export async function GET(): Promise<NextResponse> {
  const result = await checkDatabaseConnection();

  const status = result.connected ? 200 : 503;

  return NextResponse.json(
    {
      status: result.connected ? "ok" : "error",
      database: {
        connected: result.connected,
        latencyMs: result.latencyMs,
        ...(result.error ? { error: result.error } : {}),
      },
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}
