import { cookies } from "next/headers";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface MockSession {
  user: SessionUser;
}

const SESSION_COOKIE = "ims_session";

export async function getSession(): Promise<MockSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf-8")) as MockSession;
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const cookieStore = await cookies();
  const payload = Buffer.from(JSON.stringify({ user })).toString("base64url");
  cookieStore.set(SESSION_COOKIE, payload, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// Legacy alias — synchronous callers will need to be updated to await getSession()
export function getMockSession(): MockSession {
  throw new Error(
    "getMockSession() is synchronous and cannot read cookies. Use `await getSession()` instead."
  );
}
