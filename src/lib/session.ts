import { cookies } from "next/headers";
import { sealData, unsealData } from "iron-session";
import { prisma } from "@/src/lib/prisma";

export interface SessionData {
  userId: string;
}

const SESSION_COOKIE = "ims_session_v2";
if (!process.env.SESSION_PASSWORD || process.env.SESSION_PASSWORD.length < 32) {
  throw new Error("SESSION_PASSWORD must be set and at least 32 characters long");
}
const SESSION_PASSWORD: string = process.env.SESSION_PASSWORD;
// Password map enables key rotation: add new id+secret at front, keep old entries for unsealing
const SESSION_PASSWORDS: { [key: string]: string } = {
  "1": SESSION_PASSWORD,
};

export async function getSession(): Promise<(SessionData & { user: SessionUser }) | null> {
  const cookieStore = await cookies();
  const encryptedSession = cookieStore.get(SESSION_COOKIE)?.value;
  if (!encryptedSession) return null;

  try {
    const sessionData = await unsealData<SessionData>(encryptedSession, {
      password: SESSION_PASSWORDS,
    });
    
    const user = await prisma.user.findUnique({
      where: { id: sessionData.userId },
      include: {
        adminProfile: {
          select: { firstNameTh: true, lastNameTh: true }
        },
        studentProfile: {
          select: { firstNameTh: true, lastNameTh: true }
        }
      }
    });

    if (!user) return null;

    // Derive name from profiles
    const profile = user.adminProfile || user.studentProfile;
    const name = profile ? `${profile.firstNameTh ?? ""} ${profile.lastNameTh ?? ""}`.trim() : user.email;

    return {
      ...sessionData,
      user: {
        id: user.id,
        email: user.email,
        name: name || user.email,
        role: user.role,
      },
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const encryptedSession = await sealData(
    { userId },
    { password: SESSION_PASSWORDS }
  );

  cookieStore.set(SESSION_COOKIE, encryptedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface MockSession {
  user: SessionUser;
}
