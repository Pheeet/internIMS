"use server";

import bcrypt from "bcrypt";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function changePasswordAction(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.email) {
    return { success: false, error: "กรุณาเข้าสู่ระบบ" };
  }

  const oldPwd = formData.get("oldPwd") as string;
  const newPwd = formData.get("newPwd") as string;
  const confirmPwd = formData.get("confirmPwd") as string;

  if (!oldPwd || !newPwd || !confirmPwd) {
    return { success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน" };
  }

  if (newPwd !== confirmPwd) {
    return { success: false, error: "รหัสผ่านใหม่ไม่ตรงกัน" };
  }

  const passwordRules = [
    newPwd.length >= 12,
    /[A-Z]/.test(newPwd),
    /[a-z]/.test(newPwd),
    /[^A-Za-z0-9]/.test(newPwd),
    /\d/.test(newPwd),
  ];
  if (!passwordRules.every(Boolean)) {
    return { success: false, error: "รหัสผ่านใหม่ไม่ตรงตามเงื่อนไขความปลอดภัย" };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user || !user.passwordHash) {
    return { success: false, error: "ไม่พบบัญชีผู้ใช้" };
  }

  const valid = await bcrypt.compare(oldPwd, user.passwordHash);
  if (!valid) {
    return { success: false, error: "รหัสผ่านเดิมไม่ถูกต้อง" };
  }

  const wasFirstLogin = user.is_first_login;
  const newHash = await bcrypt.hash(newPwd, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      is_first_login: false,
    },
  });

  return {
    success: true,
    redirectUrl: wasFirstLogin ? "/intern/student/profile" : "/intern/student",
  };
}
