import { z } from "zod";

const phoneRegex = /^0[0-9]{9}$/;
const nameRegex = /^[a-zA-Zก-๙\s.]+$/; // ตัวอักษรไทย/อังกฤษ จุด และช่องว่างเท่านั้น

export const studentInternshipSchema = z.object({
  // Step 1: Personal Info
  prefix: z.string().min(1, "กรุณาเลือกคำนำหน้าชื่อ"),
  firstNameTh: z.string()
    .min(2, "ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร")
    .regex(nameRegex, "ชื่อต้องเป็นตัวอักษรเท่านั้น (ห้ามมีตัวเลขหรืออักขระพิเศษ)"),
  lastNameTh: z.string()
    .min(2, "นามสกุลต้องมีความยาวอย่างน้อย 2 ตัวอักษร")
    .regex(nameRegex, "นามสกุลต้องเป็นตัวอักษรเท่านั้น (ห้ามมีตัวเลขหรืออักขระพิเศษ)"),
  phoneNumber: z.string()
    .regex(phoneRegex, "กรุณากรอกเบอร์โทรศัพท์ 10 หลักให้ถูกต้อง (เช่น 0812345678)"),
  emergencyPhone: z.string()
    .regex(phoneRegex, "กรุณากรอกเบอร์โทรศัพท์ผู้ปกครอง 10 หลักให้ถูกต้อง"),
  contactAddress: z.string()
    .min(10, "กรุณากรอกที่อยู่โดยละเอียด (อย่างน้อย 10 ตัวอักษร)"),
  guardianName: z.string()
    .min(2, "กรุณากรอกชื่อผู้ปกครองให้ถูกต้อง")
    .regex(nameRegex, "ชื่อผู้ปกครองต้องเป็นตัวอักษรเท่านั้น"),
  guardianRelationship: z.enum(["บิดา", "มารดา", "พี่น้อง", "อื่นๆ"] as const, {
    error: "กรุณาระบุความสัมพันธ์ที่ถูกต้อง",
  }),

  // Step 2: Education Info
  educationLevel: z.string().min(1, "กรุณาระบุระดับการศึกษา"),
  institution: z.string().min(2, "กรุณาระบุชื่อสถาบันให้ถูกต้อง"),
  faculty: z.string().min(2, "กรุณาระบุชื่อคณะให้ถูกต้อง"),
  major: z.string().min(2, "กรุณาระบุชื่อสาขาให้ถูกต้อง"),
  advisorName: z.string()
    .min(2, "กรุณากรอกชื่ออาจารย์ที่ปรึกษาให้ถูกต้อง")
    .regex(nameRegex, "ชื่ออาจารย์ต้องไม่มีตัวเลขหรืออักขระพิเศษ"),
  advisorPhone: z.string()
    .regex(phoneRegex, "กรุณากรอกเบอร์โทรศัพท์อาจารย์ให้ถูกต้อง"),

  // Step 3: Internship Info
  position: z.string().min(2, "กรุณาระบุตำแหน่งที่ชัดเจน"),
  department: z.string().min(2, "กรุณาระบุหน่วยงานให้ถูกต้อง"),
  company: z.string().min(2, "กรุณาระบุชื่อบริษัทให้ถูกต้อง"),
  supervisorName: z.string().min(2, "กรุณาระบุชื่อผู้ดูแลให้ถูกต้อง"),
  startDate: z.string().min(1, "กรุณาระบุวันที่เริ่มฝึกงาน"),
  endDate: z.string().min(1, "กรุณาระบุวันที่สิ้นสุดฝึกงาน"),
  remarks: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end > start;
}, {
  message: "วันที่สิ้นสุดการฝึกงานต้องมาหลังวันที่เริ่มฝึกงาน",
  path: ["endDate"],
});
