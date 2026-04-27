import React from "react";
import {
  Html,
  Body,
  Section,
  Text,
  Link,
  Container,
} from "@react-email/components";

interface InternshipChangeRequestedEmailProps {
  studentName: string;
  studentEmail: string;
  faculty: string;
  major: string;
  position: string;
  company: string;
  flaggedFields?: string[];
  remarks?: string;
}

export function InternshipChangeRequestedEmail({
  studentName,
  studentEmail,
  faculty,
  major,
  position,
  company,
  flaggedFields = [],
  remarks,
}: InternshipChangeRequestedEmailProps) {
  const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/intern/admin/internships`;

  return (
    <Html lang="th">
      <Body style={{ fontFamily: "sans-serif", backgroundColor: "#f5f5f5" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
          {/* Header */}
          <Section
            style={{
              backgroundColor: "#F59E0B",
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
              ✏️ นักศึกษาขอแก้ไขข้อมูลฝึกงาน
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
              นักศึกษาได้ส่งแบบฟอร์มฝึกงานที่มีการแก้ไขตามคำขอ กรุณาตรวจสอบการแก้ไขอีกครั้ง
            </Text>

            {/* Student Info */}
            <Section
              style={{
                backgroundColor: "#f9f9f9",
                borderLeft: "4px solid #F59E0B",
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

            {/* Flagged Fields */}
            {flaggedFields.length > 0 && (
              <Section
                style={{
                  backgroundColor: "#fff3cd",
                  borderLeft: "4px solid #F59E0B",
                  padding: "15px",
                  marginBottom: "20px",
                  borderRadius: "4px",
                }}
              >
                <Text
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#856404",
                    margin: "0 0 10px 0",
                  }}
                >
                  📌 ส่วนที่ขอให้แก้ไข:
                </Text>
                {flaggedFields.map((field, idx) => (
                  <Text
                    key={idx}
                    style={{
                      fontSize: "14px",
                      color: "#856404",
                      margin: "5px 0",
                      paddingLeft: "15px",
                    }}
                  >
                    • {field}
                  </Text>
                ))}
              </Section>
            )}

            {/* Remarks */}
            {remarks && (
              <Section
                style={{
                  backgroundColor: "#f0f0f0",
                  padding: "15px",
                  marginBottom: "20px",
                  borderRadius: "4px",
                }}
              >
                <Text
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#333333",
                    margin: "0 0 8px 0",
                  }}
                >
                  💬 หมายเหตุจากผู้ตรวจสอบ:
                </Text>
                <Text
                  style={{
                    fontSize: "14px",
                    color: "#555555",
                    margin: "0",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {remarks}
                </Text>
              </Section>
            )}

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
                  backgroundColor: "#F59E0B",
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
