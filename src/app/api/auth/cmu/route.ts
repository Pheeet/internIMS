import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const CMU_TENANT = "cf81f1df-de59-4c29-91da-a2dfd04aa751";

/**
 * Initiates CMU OAuth flow via Microsoft Entra ID.
 * Generates a CSRF state value, stores it as a short-lived httpOnly cookie,
 * then redirects the browser to the CMU authorize endpoint.
 */
export async function GET() {
  const clientId = process.env.CMU_CLIENT_ID;
  const redirectUri = process.env.CMU_REDIRECT_URI;
  const scope = process.env.CMU_SCOPE ?? "api://cmu/Mis.Account.Read.Me.Basicinfo offline_access";

  console.log("[CMU OAuth] Initiating authorization flow with scope:", scope);

  if (!clientId || !redirectUri) {
    console.error("[CMU OAuth] Missing CMU_CLIENT_ID or CMU_REDIRECT_URI");
    return NextResponse.redirect(new URL("/intern/login?error=server", BASE_URL), { status: 302 });
  }

  const state = randomBytes(32).toString("hex");

  const cookieStore = await cookies();
  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  const authorizeUrl =
    process.env.CMU_OAUTH_URL ??
    `https://login.microsoftonline.com/${CMU_TENANT}/oauth2/v2.0/authorize`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    state,
    prompt: "select_account",
  });

  return NextResponse.redirect(`${authorizeUrl}?${params.toString()}`);
}
