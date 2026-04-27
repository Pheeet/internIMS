import { z } from "zod";

export const adminInternshipSchema = z.object({
  // Personal info — matches StudentProfile fields
  prefix: z.string().min(1, "กรุณาเลือกคำนำหน้า"),
  firstNameTh: z.string().min(1, "กรุณากรอกชื่อ"),
  lastNameTh: z.string().min(1, "กรุณากรอกนามสกุล"),
  gender: z.string().min(1, "กรุณาเลือกเพศ"),
  dob: z.string().optional(),
  phoneNumber: z.string().min(1, "กรุณากรอกเบอร์โทรศัพท์"),
  contactAddress: z.string().min(1, "กรุณากรอกที่อยู่"),
  emergencyPhone: z.string().min(1, "กรุณากรอกเบอร์ผู้ปกครอง"),
  guardianName: z.string().optional(),
  guardianRelationship: z.string().optional(),

  // Education info
  educationLevel: z.string().min(1, "กรุณาเลือกระดับการศึกษา"),
  institution: z.string().min(1, "กรุณากรอกสถาบัน"),
  faculty: z.string().optional(),
  major: z.string().min(1, "กรุณากรอกสาขา"),
  advisorName: z.string().optional(),
  advisorPhone: z.string().optional(),

  // Internship info — matches Internship fields
  position: z.string().min(1, "กรุณากรอกตำแหน่ง"),
  department: z.string().optional(),
  company: z.string().optional(),
  supervisorName: z.string().optional(),
  startDate: z.string().min(1, "กรุณาระบุวันเริ่มฝึกงาน"),
  endDate: z.string().min(1, "กรุณาระบุวันสิ้นสุดฝึกงาน"),
  remarks: z.string().optional(),
});

export type AdminInternshipFormValues = z.infer<typeof adminInternshipSchema>;
