import { NextResponse } from "next/server";
import { verifyPasswordResetOtp } from "@/lib/password-reset-otp";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();
    const emailStr = typeof email === "string" ? email.trim().toLowerCase() : "";
    const otpStr = typeof otp === "string" ? otp.trim() : "";

    if (!emailStr || !otpStr) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 },
      );
    }

    const result = await verifyPasswordResetOtp(emailStr, otpStr);
    return NextResponse.json(
      { success: result.success, message: result.message },
      { status: result.status },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการยืนยัน OTP" },
      { status: 500 },
    );
  }
}