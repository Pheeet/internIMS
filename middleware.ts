import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/src/lib/rate-limit";

const PUBLIC_PATHS = [
  "/intern/login",
  "/api/auth",
  "/intern/api/auth",
  "/api/cron",
  "/api/health",
  "/uploads",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root → /intern/login
  if (pathname === "/" || pathname === "/intern" || pathname === "/register" || pathname.startsWith("/register/")) {
    return NextResponse.redirect(new URL("/intern/login", request.url));
  }

  // Allow public paths through
  if (
    PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    ) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.\w+$/) // static assets
  ) {
    // Rewrite /uploads/* to /api/uploads/* to bypass Next.js static file cache
    if (pathname.startsWith("/uploads/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/api" + pathname;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Redirect old student paths to new ones
  if (pathname === "/intern/profile") {
    return NextResponse.redirect(new URL("/intern/student/profile", request.url));
  }
  if (pathname === "/intern/internship") {
    return NextResponse.redirect(new URL("/intern/student/internship", request.url));
  }

  // Check session cookie (ims_session_v2 - encrypted with iron-session)
  const sessionValue = request.cookies.get("ims_session_v2")?.value;
  if (!sessionValue) {
    return NextResponse.redirect(new URL("/intern/login", request.url));
  }

  // Student Guard Logic - Check fresh flags from DB
  const guardPaths = ["/intern/student"];
  const isStudentPath = guardPaths.some((p) => pathname.startsWith(p));

  if (isStudentPath) {
    try {
      // Fetch fresh flags from DB via internal API
      // We pass the new ims_session_v2 cookie so the API can decode it
      const flagsRes = await fetch(new URL("/api/auth/user-flags", request.url), {
        headers: { Cookie: `ims_session_v2=${sessionValue}` },
      });

      if (flagsRes.status === 401) {
        return NextResponse.redirect(new URL("/intern/login", request.url));
      }

      if (flagsRes.ok) {
        const flags = await flagsRes.json();

        // 1. Force profile completion
        if (!flags.profile_completed && pathname !== "/intern/student/profile") {
          return NextResponse.redirect(new URL("/intern/student/profile", request.url));
        }

        // 2. Force internship submission
        if (
          flags.profile_completed &&
          !flags.internship_submitted &&
          pathname !== "/intern/student/internship-form"
        ) {
          return NextResponse.redirect(new URL("/intern/student/internship-form", request.url));
        }
      }
    } catch (error) {
      console.error("Middleware student guard error:", error);
      return NextResponse.next();
    }
  }

  // --- Rate Limiting Phase ---
  
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

  // 1. Admin Management Endpoints (20 per IP per minute)
  if (pathname.startsWith("/api/admin")) {
    const adminLimit = await rateLimit(`admin:${ip}`, { interval: 60 * 1000, limit: 20 });
    if (!adminLimit.success) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "Retry-After": Math.ceil((adminLimit.reset - Date.now()) / 1000).toString() }
      });
    }
  }

  // 2. Student Attachment Re-upload (10 per user per hour)
  if (pathname.match(/^\/api\/student\/attachments\/[^/]+\/reupload$/)) {
    const uploadLimit = await rateLimit(`upload:${sessionValue}`, { interval: 60 * 60 * 1000, limit: 10 });
    if (!uploadLimit.success) {
      return new NextResponse("Upload limit exceeded. Please try again later.", {
        status: 429,
        headers: { "Retry-After": Math.ceil((uploadLimit.reset - Date.now()) / 1000).toString() }
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
