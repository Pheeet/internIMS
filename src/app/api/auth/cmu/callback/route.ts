import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";

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
  if (!storedState || state !== storedState) {
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

    // Debug: check client_secret length (should not be empty or have whitespace)
    console.log("[CMU OAuth] client_secret length:", clientSecret?.length ?? 0, "(should be > 0)");
    if (clientSecret?.trim() !== clientSecret) {
      console.warn("[CMU OAuth] WARNING: client_secret may have leading/trailing whitespace!");
    }

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
    console.log("[CMU OAuth] Fetching userInfo from:", userInfoUrl);
    const userInfoRes = await fetch(userInfoUrl, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    console.log("[CMU OAuth] userInfo response status:", userInfoRes.status);
    console.log("[CMU OAuth] userInfo response headers:", {
      contentType: userInfoRes.headers.get("content-type"),
      contentLength: userInfoRes.headers.get("content-length"),
    });

    if (!userInfoRes.ok) {
      const errorBody = await userInfoRes.text();
      console.error("[CMU OAuth] userInfo fetch failed:", {
        status: userInfoRes.status,
        statusText: userInfoRes.statusText,
        body: errorBody,
      });
      return NextResponse.redirect(
        new URL("/intern/login?error=oauth_userinfo_failed", BASE_URL)
      );
    }

    const userInfo = (await userInfoRes.json()) as CmuBasicInfo;
    console.log("[CMU OAuth] userInfo received:", {
      cmuitaccount: userInfo.cmuitaccount ? "[present]" : "[missing]",
      keys: Object.keys(userInfo),
    });

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

    // Build display name from profile
    let displayName = user.email;
    if (user.role === "STUDENT") {
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: user.id },
        select: { prefix: true, firstNameTh: true, lastNameTh: true },
      });
      if (profile) {
        displayName =
          `${profile.prefix}${profile.firstNameTh} ${profile.lastNameTh}`.trim();
      }
    } else {
      const profile = await prisma.adminProfile.findUnique({
        where: { userId: user.id },
        select: { firstNameTh: true, lastNameTh: true },
      });
      if (profile?.firstNameTh) {
        displayName = `${profile.firstNameTh} ${profile.lastNameTh ?? ""}`.trim();
      }
    }

    await setSessionCookie({
      id: user.id,
      email: user.email,
      name: displayName,
      role: user.role,
    });

    return NextResponse.redirect(new URL("/intern/dashboard", BASE_URL));
  } catch {
    return NextResponse.redirect(
      new URL("/intern/login?error=oauth_error", BASE_URL)
    );
  }
}
