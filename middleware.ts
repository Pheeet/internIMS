import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/intern/login",
  "/api/auth",
  "/intern/api/auth",
  "/api/cron",
  "/api/send-otp",
  "/api/verify-otp",
  "/api/health",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root → /intern/login
  if (pathname === "/" || pathname === "/register" || pathname.startsWith("/register/")) {
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
    return NextResponse.next();
  }

  // Redirect old student paths to new ones
  if (pathname === "/intern/profile") {
    return NextResponse.redirect(new URL("/intern/student/profile", request.url));
  }
  if (pathname === "/intern/internship") {
    return NextResponse.redirect(new URL("/intern/student/internship-form", request.url));
  }

  // Check session cookie
  const sessionValue = request.cookies.get("ims_session")?.value;
  if (!sessionValue) {
    return NextResponse.redirect(new URL("/intern/login", request.url));
  }

  // Parse session to check role
  let sessionData;
  try {
    sessionData = JSON.parse(Buffer.from(sessionValue, "base64url").toString("utf-8"));
  } catch (e) {
    return NextResponse.redirect(new URL("/intern/login", request.url));
  }

  const user = sessionData.user;
  const isStudent = user?.role === "STUDENT";

  // Student Guard Logic
  const guardPaths = ["/intern/student", "/intern/change-password"];
  const isGuarded = isStudent && guardPaths.some((p) => pathname.startsWith(p));

  if (isGuarded) {
    try {
      // Fetch fresh flags from DB via internal API
      const flagsRes = await fetch(new URL("/api/auth/user-flags", request.url), {
        headers: { Cookie: `ims_session=${sessionValue}` },
        // Standard fetch in middleware can take a timeout signal if needed, but usually 
        // we want to fail fast or fallback.
      });

      if (flagsRes.status === 401) {
        return NextResponse.redirect(new URL("/intern/login", request.url));
      }

      if (flagsRes.ok) {
        const flags = await flagsRes.json();

        // Allow students to visit change-password voluntarily from the profile menu.
        if (pathname === "/intern/change-password") {
          return NextResponse.next();
        }

        // 1. Force password change
        if (flags.is_first_login) {
          if (pathname !== "/intern/change-password") {
            return NextResponse.redirect(new URL("/intern/change-password", request.url));
          }
          return NextResponse.next();
        }

        // 2. Force profile completion
        if (!flags.profile_completed && pathname !== "/intern/student/profile") {
          return NextResponse.redirect(new URL("/intern/student/profile", request.url));
        }

        // 3. Force internship submission
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
      // Fallback: If API fails, allow user to proceed to avoid total blackout
      return NextResponse.next();
    }
  }

  // Also apply is_first_login guard to /intern/student if not already covered
  // (though the matcher covers it, we want to be explicit for the change-password redirect)

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
