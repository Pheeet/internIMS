import { z } from "zod";

const phoneRegex = /^0[0-9]{9}$/;
const nameRegex = /^[a-zA-Zก-๙\s.]+$/;

export const studentProfileSchema = z.object({
  prefix: z.string().min(1, "กรุณาเลือกคำนำหน้าชื่อ"),
  firstNameTh: z.string()
    .min(2, "ชื่อต้องมีความยาวอย่างน้อย 2 ตัวอักษร")
    .regex(nameRegex, "ชื่อต้องเป็นตัวอักษรเท่านั้น"),
  lastNameTh: z.string()
    .min(2, "นามสกุลต้องมีความยาวอย่างน้อย 2 ตัวอักษร")
    .regex(nameRegex, "นามสกุลต้องเป็นตัวอักษรเท่านั้น"),
  gender: z.enum(["ชาย", "หญิง", "อื่นๆ"] as const, {
    error: "กรุณาระบุเพศให้ถูกต้อง",
  }),
  dob: z.string().min(1, "กรุณาระบุวันเกิด"),
  phoneNumber: z.string()
    .regex(phoneRegex, "เบอร์โทรศัพท์ 10 หลักให้ถูกต้อง (เช่น 0812345678)"),
  emergencyPhone: z.string()
    .regex(phoneRegex, "เบอร์โทรศัพท์ผู้ปกครอง 10 หลักให้ถูกต้อง"),
  contactAddress: z.string()
    .min(10, "กรุณากรอกที่อยู่โดยละเอียด (อย่างน้อย 10 ตัวอักษร)"),
  guardianName: z.string()
    .min(2, "กรุณากรอกชื่อผู้ปกครองให้ถูกต้อง")
    .regex(nameRegex, "ชื่อผู้ปกครองต้องเป็นตัวอักษรเท่านั้น"),
  guardianRelationship: z.enum(["บิดา", "มารดา", "พี่น้อง", "อื่นๆ"] as const, {
    error: "กรุณาระบุความสัมพันธ์ที่ถูกต้อง",
  }),
});
