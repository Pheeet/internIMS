import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/src/lib/prisma";
import { setSessionCookie } from "@/src/lib/session";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const CMU_TENANT = "cf81f1df-de59-4c29-91da-a2dfd04aa751";

interface CmuBasicInfo {
  cmuitaccount?: string;
}

/**
 * CMU OAuth callback.
 * Validates CSRF state, exchanges code for a token, fetches CMU basic info,
 * then issues a session cookie and redirects to /intern/dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(new URL("/intern/login", BASE_URL));
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;

  // Validate CSRF state before anything else
  if (!storedState) {
    throw new Error("CMU OAuth error: state cookie not found. Possible cookie blocked or sameSite issue.");
  }

  if (state !== storedState) {
    return NextResponse.redirect(
      new URL("/intern/login?error=oauth_state_mismatch", BASE_URL)
    );
  }

  // Clear state cookie immediately after validation
  cookieStore.delete("oauth_state");

  try {
    const clientId = process.env.CMU_CLIENT_ID!;
    const clientSecret = process.env.CMU_CLIENT_SECRET!;
    const redirectUri = process.env.CMU_REDIRECT_URI!;
    const tokenUrl =
      process.env.CMU_TOKEN_URL ??
      `https://login.microsoftonline.com/${CMU_TENANT}/oauth2/v2.0/token`;
    const userInfoUrl =
      process.env.CMU_USERINFO_URL ??
      "https://api.cmu.ac.th/mis/cmuaccount/prod/v3/me/basicinfo";

    // Exchange authorization code for access token
    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        scope: "openid profile email",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(
        new URL("/intern/login?error=oauth_token_failed", BASE_URL)
      );
    }

    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL("/intern/login?error=oauth_token_failed", BASE_URL)
      );
    }

    // Fetch CMU basic info — do not persist the access token
    const userInfoRes = await fetch(userInfoUrl, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      return NextResponse.redirect(
        new URL("/intern/login?error=oauth_userinfo_failed", BASE_URL)
      );
    }

    const userInfo = (await userInfoRes.json()) as CmuBasicInfo;
    const email = userInfo.cmuitaccount?.toLowerCase();
    if (!email) {
      return NextResponse.redirect(
        new URL("/intern/login?error=oauth_userinfo_failed", BASE_URL)
      );
    }

    // Check if email exists in system
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.redirect(
        new URL("/intern/login?error=unauthorized", BASE_URL)
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.redirect(
        new URL("/intern/login?error=suspended", BASE_URL)
      );
    }

    await setSessionCookie(user.id);

    return NextResponse.redirect(new URL("/intern/dashboard", BASE_URL));
  } catch {
    return NextResponse.redirect(
      new URL("/intern/login?error=oauth_error", BASE_URL)
    );
  }
}
