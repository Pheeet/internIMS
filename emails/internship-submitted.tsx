import React from "react";
import {
  Html,
  Body,
  Section,
  Text,
  Link,
  Container,
} from "@react-email/components";

interface InternshipSubmittedEmailProps {
  studentName: string;
  studentEmail: string;
  faculty: string;
  major: string;
  position: string;
  company: string;
}

export function InternshipSubmittedEmail({
  studentName,
  studentEmail,
  faculty,
  major,
  position,
  company,
}: InternshipSubmittedEmailProps) {
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/intern/admin/internships`;

  return (
    <Html lang="th">
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f5f5f5" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
          {/* Header */}
          <Section
            style={{
              backgroundColor: "#9E76B4",
              borderRadius: "8px 8px 0 0",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: "24px",
                fontWeight: "bold",
                margin: "0",
              }}
            >
              📋 มีคำร้องฝึกงานใหม่รอการตรวจสอบ
            </Text>
          </Section>

          {/* Content */}
          <Section
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "0 0 8px 8px",
              padding: "30px",
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <Text
              style={{
                fontSize: "16px",
                color: "#333333",
                marginBottom: "20px",
              }}
            >
              สวัสดีครับ/ค่ะ
            </Text>

            <Text
              style={{
                fontSize: "16px",
                color: "#333333",
                marginBottom: "20px",
              }}
            >
              มีนักศึกษารายใหม่ส่งแบบฟอร์มฝึกงาน กรุณาตรวจสอบและทำการอนุมัติ
            </Text>

            {/* Student Info */}
            <Section
              style={{
                backgroundColor: "#f9f9f9",
                borderLeft: "4px solid #9E76B4",
                padding: "15px",
                marginBottom: "20px",
                borderRadius: "4px",
              }}
            >
              <Text
                style={{
                  fontSize: "14px",
                  color: "#666666",
                  margin: "8px 0",
                }}
              >
                <strong>ชื่อนักศึกษา:</strong> {studentName}
              </Text>
              <Text
                style={{
                  fontSize: "14px",
                  color: "#666666",
                  margin: "8px 0",
                }}
              >
                <strong>อีเมล:</strong> {studentEmail}
              </Text>
              <Text
                style={{
                  fontSize: "14px",
                  color: "#666666",
                  margin: "8px 0",
                }}
              >
                <strong>คณะ:</strong> {faculty}
              </Text>
              <Text
                style={{
                  fontSize: "14px",
                  color: "#666666",
                  margin: "8px 0",
                }}
              >
                <strong>สาขาวิชา:</strong> {major}
              </Text>
              <Text
                style={{
                  fontSize: "14px",
                  color: "#666666",
                  margin: "8px 0",
                }}
              >
                <strong>ตำแหน่ง:</strong> {position}
              </Text>
              <Text
                style={{
                  fontSize: "14px",
                  color: "#666666",
                  margin: "8px 0",
                }}
              >
                <strong>สถานที่ฝึก:</strong> {company}
              </Text>
            </Section>

            {/* CTA Button */}
            <Section
              style={{
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              <Link
                href={adminUrl}
                style={{
                  backgroundColor: "#9E76B4",
                  color: "#ffffff",
                  padding: "12px 30px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  fontWeight: "bold",
                  display: "inline-block",
                }}
              >
                ไปยังหน้าตรวจสอบ
              </Link>
            </Section>

            <Text
              style={{
                fontSize: "14px",
                color: "#999999",
                marginTop: "20px",
                borderTop: "1px solid #e0e0e0",
                paddingTop: "15px",
              }}
            >
              ระบบส่งอีเมลนี้โดยอัตโนมัติ กรุณาอย่ากดตอบกลับ
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
