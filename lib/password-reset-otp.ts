import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export const OTP_EXPIRY_MINUTES = 10;
const OTP_EXPIRY_MS = OTP_EXPIRY_MINUTES * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const OTP_RATE_LIMIT_MAX_REQUESTS = 3;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function writeOtpAudit(
  email: string,
  action:
    | "REQUESTED"
    | "SENT"
    | "SEND_FAILED"
    | "VERIFY_FAILED"
    | "VERIFIED"
    | "EXPIRED"
    | "RATE_LIMITED"
    | "USER_NOT_FOUND"
    | "RESET_COMPLETED"
    | "CLEANED_UP",
  opts?: { otpId?: string; message?: string; metadata?: unknown },
) {
  await prisma.passwordResetOtpAudit.create({
    data: {
      email,
      action,
      otpId: opts?.otpId,
      message: opts?.message,
      metadata: opts?.metadata as object | undefined,
    },
  });
}

export async function cleanupExpiredOtps() {
  try {
    const now = new Date();
    const expired = await prisma.passwordResetOtp.findMany({
      where: { expiresAt: { lt: now } },
      select: { id: true, email: true },
    });

    console.log("[DEBUG] cleanupExpiredOtps found:", expired.length, "expired records");

    if (expired.length === 0) {
      return 0;
    }

    await prisma.passwordResetOtpAudit.createMany({
      data: expired.map((item) => ({
        email: item.email,
        action: "CLEANED_UP",
        otpId: item.id,
        message: "Cleanup expired OTP",
    })),
  });

    await prisma.passwordResetOtp.deleteMany({
      where: { id: { in: expired.map((item) => item.id) } },
    });

    console.log("[DEBUG] cleanupExpiredOtps deleted:", expired.length, "records");
    return expired.length;
  } catch (error) {
    console.error("[DEBUG] cleanupExpiredOtps error:", error);
    return 0;
  }
}

export async function requestPasswordResetOtp(emailInput: string) {
  try {
    const email = normalizeEmail(emailInput);
    console.log("[DEBUG] requestPasswordResetOtp for email:", email);

    try {
      await cleanupExpiredOtps();
      console.log("[DEBUG] Expired OTPs cleaned up");
    } catch (cleanupError) {
      console.error("[DEBUG] Cleanup error:", cleanupError);
    }

    const since = new Date(Date.now() - OTP_RATE_LIMIT_WINDOW_MS);
    const requestCount = await prisma.passwordResetOtpAudit.count({
      where: {
        email,
        action: "REQUESTED",
        createdAt: { gte: since },
      },
    });
    console.log("[DEBUG] OTP requests in last 15 min:", requestCount);

    if (requestCount >= OTP_RATE_LIMIT_MAX_REQUESTS) {
      console.warn("[DEBUG] Rate limit exceeded for email:", email);
      await writeOtpAudit(email, "RATE_LIMITED", {
        message: "OTP request blocked by rate limit",
        metadata: { requestCount, windowMinutes: 15 },
      });

      return {
        success: false,
        status: 429,
        message: "คุณขอรหัส OTP มากเกินไป กรุณาลองใหม่อีก 15 นาที",
      };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    console.log("[DEBUG] User lookup result:", user ? `Found (id: ${user.id})` : "Not found");

    if (!user) {
      console.log("[DEBUG] User not found, logging audit and returning generic success");
      await writeOtpAudit(email, "USER_NOT_FOUND", {
        message: "OTP requested for unknown email",
      });

      return {
        success: true,
        message: "ถ้าอีเมลนี้อยู่ในระบบ คุณจะได้รับรหัส OTP ในไม่ช้า",
      };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("[DEBUG] Generated OTP:", otp);

    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    console.log("[DEBUG] OTP expires at:", expiresAt);

    const record = await prisma.passwordResetOtp.upsert({
      where: { email },
      update: {
        otpHash,
        expiresAt,
        attempts: 0,
        verifiedAt: null,
        userId: user.id,
      },
      create: {
        email,
        otpHash,
        expiresAt,
        attempts: 0,
        userId: user.id,
      },
      select: { id: true },
    });
    console.log("[DEBUG] OTP record created/updated:", record.id);

    await writeOtpAudit(email, "REQUESTED", {
      otpId: record.id,
      message: "OTP generated for password reset",
    });
    console.log("[DEBUG] Audit logged for REQUESTED");

    console.log("[DEBUG] Returning OTP success response");
    return {
      success: true,
      message: "ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว",
      otp,
      otpId: record.id,
    };
  } catch (error) {
    console.error("[DEBUG] requestPasswordResetOtp exception:", error);
    await writeOtpAudit(emailInput, "SEND_FAILED", {
      message: `OTP request exception: ${String(error)}`,
    });
    return {
      success: false,
      status: 500,
      message: "เกิดข้อผิดพลาดในการขอรหัส OTP",
    };
  }
}

export async function markOtpEmailSent(emailInput: string) {
  try {
    const email = normalizeEmail(emailInput);
    console.log("[DEBUG] markOtpEmailSent for email:", email);

    const record = await prisma.passwordResetOtp.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!record) {
      console.warn("[DEBUG] No OTP record found for email:", email);
    }

    await writeOtpAudit(email, "SENT", {
      otpId: record?.id,
      message: "OTP email sent",
    });
    console.log("[DEBUG] Audit logged for SENT");
  } catch (error) {
    console.error("[DEBUG] markOtpEmailSent error:", error);
  }
}

export async function markOtpEmailSendFailed(emailInput: string, reason: string) {
  try {
    const email = normalizeEmail(emailInput);
    console.log("[DEBUG] markOtpEmailSendFailed for email:", email, "reason:", reason);

    const record = await prisma.passwordResetOtp.findUnique({
      where: { email },
      select: { id: true },
    });

    await writeOtpAudit(email, "SEND_FAILED", {
      otpId: record?.id,
      message: "OTP email send failed",
      metadata: { reason },
    });
    console.log("[DEBUG] Audit logged for SEND_FAILED");
  } catch (error) {
    console.error("[DEBUG] markOtpEmailSendFailed error:", error);
  }
}

export async function verifyPasswordResetOtp(emailInput: string, otpInput: string) {
  const email = normalizeEmail(emailInput);
  const otp = otpInput.trim();

  await cleanupExpiredOtps();

  const record = await prisma.passwordResetOtp.findUnique({
    where: { email },
  });

  if (!record) {
    return {
      success: false,
      status: 400,
      message: "ไม่พบรหัส OTP",
    };
  }

  if (new Date() > record.expiresAt) {
    await writeOtpAudit(email, "EXPIRED", {
      otpId: record.id,
      message: "OTP expired before verification",
    });

    await prisma.passwordResetOtp.delete({ where: { id: record.id } });

    return {
      success: false,
      status: 400,
      message: "รหัส OTP หมดอายุแล้ว",
    };
  }

  const matched = await bcrypt.compare(otp, record.otpHash);
  if (!matched) {
    const nextAttempts = record.attempts + 1;

    if (nextAttempts > OTP_MAX_ATTEMPTS) {
      await writeOtpAudit(email, "VERIFY_FAILED", {
        otpId: record.id,
        message: "OTP verification exceeded max attempts",
        metadata: { attempts: nextAttempts },
      });

      await prisma.passwordResetOtp.delete({ where: { id: record.id } });

      return {
        success: false,
        status: 400,
        message: "ลองใหม่มากเกินไป กรุณาขอรหัส OTP ใหม่",
      };
    }

    await prisma.passwordResetOtp.update({
      where: { id: record.id },
      data: { attempts: nextAttempts },
    });

    await writeOtpAudit(email, "VERIFY_FAILED", {
      otpId: record.id,
      message: "OTP verification failed",
      metadata: { attempts: nextAttempts },
    });

    return {
      success: false,
      status: 400,
      message: "รหัส OTP ไม่ถูกต้อง",
    };
  }

  await prisma.passwordResetOtp.update({
    where: { id: record.id },
    data: { verifiedAt: new Date() },
  });

  await writeOtpAudit(email, "VERIFIED", {
    otpId: record.id,
    message: "OTP verified successfully",
  });

  return {
    success: true,
    status: 200,
    message: "ยืนยันรหัส OTP สำเร็จ",
  };
}

export async function getVerifiedOtp(emailInput: string) {
  const email = normalizeEmail(emailInput);
  await cleanupExpiredOtps();

  const record = await prisma.passwordResetOtp.findUnique({ where: { email } });
  if (!record || !record.verifiedAt || new Date() > record.expiresAt) {
    return null;
  }

  return record;
}

export async function consumeVerifiedOtp(emailInput: string) {
  const email = normalizeEmail(emailInput);
  const record = await prisma.passwordResetOtp.findUnique({ where: { email } });

  if (!record) {
    return;
  }

  await writeOtpAudit(email, "RESET_COMPLETED", {
    otpId: record.id,
    message: "Password reset completed and OTP consumed",
  });

  await prisma.passwordResetOtp.delete({ where: { id: record.id } });
}
