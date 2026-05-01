import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/src/lib/prisma";
import { setSessionCookie } from "@/src/lib/session";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

/**
 * Microsoft OAuth callback.
 * Exchanges `code` for tokens, verifies email exists in the system,
 * then creates a session and redirects to /dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // User cancelled or provider error → return silently
  if (error || !code || !state) {
    return NextResponse.redirect(new URL("/intern/login", BASE_URL));
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;

  if (!storedState) {
    throw new Error("Microsoft OAuth error: state cookie not found. Possible cookie blocked or sameSite issue.");
  }

  if (state !== storedState) {
    return NextResponse.redirect(new URL("/intern/login?error=oauth_state_mismatch", BASE_URL));
  }

  cookieStore.delete("oauth_state");

  try {
    const clientId = process.env.MICROSOFT_CLIENT_ID!;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!;
    const tenantId = process.env.MICROSOFT_TENANT_ID ?? "common";
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI!;

    // Exchange code for tokens
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          scope: "openid email profile User.Read",
        }),
      }
    );

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL("/intern/login?error=server", BASE_URL));
    }

    const tokens = await tokenRes.json() as { access_token?: string };
    if (!tokens.access_token) {
      return NextResponse.redirect(new URL("/intern/login?error=server", BASE_URL));
    }

    // Get user info from Microsoft Graph
    const userInfoRes = await fetch("https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(new URL("/intern/login?error=server", BASE_URL));
    }

    const userInfo = await userInfoRes.json() as { mail?: string; userPrincipalName?: string };
    const email = (userInfo.mail ?? userInfo.userPrincipalName)?.toLowerCase();

    if (!email) {
      return NextResponse.redirect(new URL("/intern/login?error=server", BASE_URL));
    }

    // Check if email exists in system
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.redirect(new URL("/intern/login?error=unauthorized", BASE_URL));
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.redirect(new URL("/intern/login?error=suspended", BASE_URL));
    }

    await setSessionCookie(user.id);

    return NextResponse.redirect(new URL("/intern/dashboard", BASE_URL));
  } catch {
    return NextResponse.redirect(new URL("/intern/login?error=server", BASE_URL));
  }
}
