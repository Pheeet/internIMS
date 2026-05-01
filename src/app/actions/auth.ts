"use server";

import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, clearSessionCookie } from "@/src/lib/session";
import { rateLimit } from "@/src/lib/rate-limit";
import { headers } from "next/headers";

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }

  // 1. Rate Limiting — per-IP and per-email (5 attempts per 15 minutes each)
  const headerList = await headers();
  // NOTE: x-forwarded-for trust depends on a trusted reverse proxy (e.g. Vercel, nginx).
  // Without infra-level protection an attacker can spoof this header.
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const [ipLimit, emailLimit] = await Promise.all([
    rateLimit(`login:ip:${ip}`, { interval: 15 * 60 * 1000, limit: 5 }),
    rateLimit(`login:email:${email}`, { interval: 15 * 60 * 1000, limit: 5 }),
  ]);

  if (!ipLimit.success || !emailLimit.success) {
    const reset = Math.min(ipLimit.reset, emailLimit.reset);
    const waitTime = Math.ceil((reset - Date.now()) / 60000);
    return { error: `คุณพยายามเข้าสู่ระบบบ่อยเกินไป กรุณารออีกประมาณ ${waitTime} นาที` };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // 2. Constant-time response: run dummy bcrypt when user not found to prevent
  //    timing-based account enumeration attacks.
  if (!user || !user.passwordHash) {
    await bcrypt.compare(password, "$2b$12$gnHx4Eczq8mBcJvOpnnsSelhOyJ0tYMaG.hYcB3u20EjJ58Hv9G.u");
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  if (user.status !== "ACTIVE") {
    return { error: "บัญชีนี้ถูกระงับการใช้งาน" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  await setSessionCookie(user.id);

  redirect("/intern/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/intern/login");
}
