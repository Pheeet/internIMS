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
 * CMU OAuth callback — registered redirect URI: /intern/api/auth/callback
 * Validates CSRF state, exchanges code for a token, fetches CMU basic info,
 * then issues a session cookie and redirects to /intern/dashboard.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !state) {
    return NextResponse.redirect(new URL("/intern/login", BASE_URL), { status: 302 });
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;

  if (!storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL("/intern/login?error=oauth_state_mismatch", BASE_URL),
      { status: 302 }
    );
  }

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

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(
        new URL("/intern/login?error=oauth_token_failed", BASE_URL),
        { status: 302 }
      );
    }

    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) {
      return NextResponse.redirect(
        new URL("/intern/login?error=oauth_token_failed", BASE_URL),
        { status: 302 }
      );
    }

    const userInfoRes = await fetch(userInfoUrl, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    console.log("[CMU OAuth] userInfoRes status:", userInfoRes.status);
    console.log("[CMU OAuth] userInfoRes headers:", Object.fromEntries(userInfoRes.headers.entries()));
    const userInfoText = await userInfoRes.clone().text();
    console.log("[CMU OAuth] userInfoRes body:", userInfoText);

    if (!userInfoRes.ok) {
      return NextResponse.redirect(
        new URL("/intern/login?error=oauth_userinfo_failed", BASE_URL),
        { status: 302 }
      );
    }

    const userInfo = (await userInfoRes.json()) as CmuBasicInfo;

    const email = userInfo.cmuitaccount?.toLowerCase();
    if (!email) {
      return NextResponse.redirect(
        new URL("/intern/login?error=oauth_userinfo_failed", BASE_URL),
        { status: 302 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.redirect(
        new URL("/intern/login?error=unauthorized", BASE_URL),
        { status: 302 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.redirect(
        new URL("/intern/login?error=suspended", BASE_URL),
        { status: 302 }
      );
    }

    let displayName = user.email;
    if (user.role === "STUDENT") {
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: user.id },
        select: { prefix: true, firstNameTh: true, lastNameTh: true },
      });
      if (profile) {
        displayName = `${profile.prefix}${profile.firstNameTh} ${profile.lastNameTh}`.trim();
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

    return NextResponse.redirect(new URL("/intern/dashboard", BASE_URL), { status: 302 });
  } catch {
    return NextResponse.redirect(
      new URL("/intern/login?error=oauth_error", BASE_URL),
      { status: 302 }
    );
  }
}
