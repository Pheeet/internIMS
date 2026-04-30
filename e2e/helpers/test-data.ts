import path from "path";

export const ADMIN = { email: "admin@test.com", password: "Admin1234!" };
export const STUDENT = { email: "student@test.com", password: "1234" };

export const PROFILE = {
  prefix: "นาย",
  firstNameTh: "สมชาย",
  lastNameTh: "ใจดี",
  gender: "ชาย",
  dob: "2004-06-15",
  phoneNumber: "0812345678",
  emergencyPhone: "0891111111",
  contactAddress: "123 ถนนห้วยแก้ว อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่",
  guardianName: "สมพร ใจดี",
  guardianRelationship: "มารดา",
};

export const EDUCATION = {
  educationLevel: "ปริญญาตรี",
  institution: "มหาวิทยาลัยเชียงใหม่",
  faculty: "คณะพยาบาลศาสตร์",
  major: "การพยาบาล",
  advisorName: "อาจารย์ ทดสอบ",
  advisorPhone: "0812222222",
};

export const INTERNSHIP = {
  position: "Software Engineer Intern",
  department: "Engineering",
  company: "บริษัท ทดสอบ จำกัด",
  supervisorName: "วิชัย ผู้ดูแล",
  startDate: "2026-06-01",
  endDate: "2026-08-31",
};

export const CORRECTED = {
  phone: "0899999999",
  department: "Engineering Team A",
};

export const REVISION = {
  supervisorBefore: "วิชัย ผู้ดูแล",
  round1: "มนัส ผู้ดูแล",
  round2: "สุเมธ ผู้ดูแล",
};

export const FLAG_REASONS = {
  phoneNumber: "กรุณากรอกเบอร์ให้ครบ 10 หลัก",
  department: "กรุณาระบุชื่อหน่วยงานให้ชัดเจน",
};

export const DOC_REJECT_REASON = "Resume ไม่ครบถ้วน กรุณาเพิ่มประสบการณ์";

export const FIXTURES_DIR = path.join(__dirname, "..", "fixtures", "test-docs");
