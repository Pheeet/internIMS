import { NextResponse, NextRequest } from "next/server";
import { checkDatabaseConnection } from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic"; // Never cache health-check responses

export async function GET(request: NextRequest): Promise<NextResponse> {
  // 1. Shared Secret Authentication — fail-closed (timing-safe comparison)
  const token = request.headers.get("x-health-token");
  const expectedToken = process.env.HEALTH_CHECK_TOKEN;

  const tokenValid =
    !!expectedToken &&
    !!token &&
    token.length === expectedToken.length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));

  if (!tokenValid) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const result = await checkDatabaseConnection();
  const isProduction = process.env.NODE_ENV === "production";

  const status = result.connected ? 200 : 503;

  // 2. Information Disclosure Prevention
  const responseBody = isProduction
    ? {
        status: result.connected ? "ok" : "error",
        timestamp: new Date().toISOString(),
      }
    : {
        status: result.connected ? "ok" : "error",
        database: {
          connected: result.connected,
          latencyMs: result.latencyMs,
          ...(result.error ? { error: result.error } : {}),
        },
        timestamp: new Date().toISOString(),
      };

  return NextResponse.json(responseBody, { status });
}
