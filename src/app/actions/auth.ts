"use server";

import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, clearSessionCookie } from "@/lib/session";

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.passwordHash) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  if (user.status !== "ACTIVE") {
    return { error: "บัญชีนี้ถูกระงับการใช้งาน" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }

  // Fetch display name from profile
  let displayName = user.email;
  if (user.role === "STUDENT") {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { firstNameTh: true, lastNameTh: true, prefix: true },
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

  redirect("/intern/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/intern/login");
}
