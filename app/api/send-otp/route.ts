import { NextResponse } from "next/server";
import {
  markOtpEmailSendFailed,
  markOtpEmailSent,
  OTP_EXPIRY_MINUTES,
  requestPasswordResetOtp,
} from "@/lib/password-reset-otp";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { OtpResetPasswordEmail } from "@/emails/otp-reset-password";

export async function POST(req: Request) {
  try {
    console.log("[DEBUG] send-otp POST request received");
    const { email } = await req.json();
    const emailStr = typeof email === "string" ? email.trim().toLowerCase() : "";

    console.log("[DEBUG] Email to process:", emailStr);

    if (!emailStr) {
      console.warn("[DEBUG] Empty email provided");
      return NextResponse.json(
        { success: false, message: "กรุณากรอกอีเมล" },
        { status: 400 },
      );
    }

    // Check if email exists in database
    console.log("[DEBUG] Checking if email exists in database...");
    const userExists = await prisma.user.findUnique({
      where: { email: emailStr },
      select: { id: true, email: true },
    });
    console.log("[DEBUG] User exists:", userExists ? "YES" : "NO");

    const requestResult = await requestPasswordResetOtp(emailStr);
    console.log("[DEBUG] requestPasswordResetOtp result:", {
      success: requestResult.success,
      message: requestResult.message,
      hasOtp: !!requestResult.otp,
    });

    if (!requestResult.success) {
      console.error("[DEBUG] OTP request failed:", requestResult.message);
      return NextResponse.json(
        { success: false, message: requestResult.message },
        { status: requestResult.status },
      );
    }

    if (!requestResult.otp) {
      console.log("[DEBUG] No OTP returned (email may not exist), returning success");
      return NextResponse.json({ success: true, message: requestResult.message });
    }

    try {
      console.log("[DEBUG] Sending email via Resend to:", emailStr);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: emailStr,
        subject: "รหัส OTP สำหรับรีเซ็ตรหัสผ่าน",
        react: OtpResetPasswordEmail({
          otp: requestResult.otp,
          expiresInMinutes: OTP_EXPIRY_MINUTES,
        }),
      });
      console.log("[DEBUG] Email sent successfully");
      await markOtpEmailSent(emailStr);
    } catch (emailError) {
      console.error("[DEBUG] Resend email send error:", emailError);
      await markOtpEmailSendFailed(emailStr, `Resend send failed: ${String(emailError)}`);
      return NextResponse.json(
        { success: false, message: "เกิดข้อผิดพลาดในการส่ง OTP", error: String(emailError) },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, message: requestResult.message });
  } catch (error) {
    console.error("[DEBUG] send-otp route error:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการส่ง OTP", error: String(error) },
      { status: 500 },
    );
  }
}