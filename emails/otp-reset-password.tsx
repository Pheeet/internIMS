import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface OtpResetPasswordEmailProps {
  otp: string;
  expiresInMinutes: number;
}

export function OtpResetPasswordEmail({
  otp,
  expiresInMinutes,
}: OtpResetPasswordEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>รหัส OTP สำหรับรีเซ็ตรหัสผ่านของคุณคือ {otp}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>รหัส OTP สำหรับรีเซ็ตรหัสผ่าน</Heading>
          <Text style={paragraph}>
            ใช้รหัสด้านล่างเพื่อดำเนินการรีเซ็ตรหัสผ่านของคุณ
          </Text>

          <Section style={otpSection}>
            <Text style={otpText}>{otp}</Text>
          </Section>

          <Text style={paragraph}>
            รหัสนี้จะหมดอายุใน <strong>{expiresInMinutes} นาที</strong>
          </Text>

          <Hr style={divider} />

          <Text style={warningText}>
            หากคุณไม่ได้เป็นผู้ขอรหัส OTP นี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: "Arial, sans-serif",
  margin: 0,
  padding: "24px 0",
};

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  margin: "0 auto",
  maxWidth: "520px",
  padding: "32px 28px",
};

const heading = {
  color: "#111827",
  fontSize: "24px",
  fontWeight: 700,
  margin: "0 0 12px",
  textAlign: "center" as const,
};

const paragraph = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
  textAlign: "center" as const,
};

const otpSection = {
  backgroundColor: "#fff7ed",
  border: "1px solid #fdba74",
  borderRadius: "14px",
  margin: "24px 0",
  padding: "20px 16px",
};

const otpText = {
  color: "#ea580c",
  fontSize: "40px",
  fontWeight: 800,
  letterSpacing: "10px",
  lineHeight: "40px",
  margin: 0,
  textAlign: "center" as const,
};

const divider = {
  borderColor: "#e5e7eb",
  margin: "24px 0 16px",
};

const warningText = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "22px",
  margin: 0,
  textAlign: "center" as const,
};

export default OtpResetPasswordEmail;