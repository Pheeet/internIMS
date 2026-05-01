# Internship Management System (IMS) 🏥
**ระบบจัดการการฝึกงาน คณะพยาบาลศาสตร์ มหาวิทยาลัยเชียงใหม่**

ระบบเว็บแอปพลิเคชันสำหรับบริหารจัดการข้อมูลการฝึกงานของนักศึกษาแบบครบวงจร พัฒนาด้วยเทคโนโลยีสมัยใหม่ เน้นความปลอดภัย และการใช้งานที่ง่ายสำหรับทั้งนักศึกษาและเจ้าหน้าที่

---

## 🌟 ฟีเจอร์สำคัญ (Key Features)

### 🎓 สำหรับนักศึกษา (Students)
- **CMU OAuth Integration**: เข้าสู่ระบบผ่าน CMU IT Account อย่างปลอดภัย ไม่ต้องจำรหัสผ่านใหม่
- **Comprehensive Profile**: จัดการข้อมูลส่วนตัว การศึกษา และผู้ติดต่อฉุกเฉินในที่เดียว
- **Smart Application Form**: ระบบกรอกข้อมูลการฝึกงานที่ช่วยตรวจสอบความถูกต้องเบื้องต้น
- **Document Center**: อัปโหลดและจัดการเอกสารสำคัญ พร้อมระบบป้องกันการแก้ไขหลังได้รับการอนุมัติ
- **Real-time Status Tracking**: ติดตามสถานะคำร้องได้ทันที พร้อมระบบแจ้งเตือนหากต้องมีการแก้ไขข้อมูล

### 🛡️ สำหรับผู้ดูแลระบบ (Administrators)
- **Centralized Dashboard**: ดูภาพรวมและจัดการคำร้องทั้งหมดผ่านระบบ Filter อัจฉริยะ
- **Advanced Review System**: ระบบตรวจสอบข้อมูลที่สามารถระบุจุดแก้ไข (Flag) ได้รายฟิลด์
- **Visual Diff Viewer**: ตรวจสอบการเปลี่ยนแปลงของข้อมูลได้อย่างชัดเจนเมื่อนักศึกษามีการแก้ไข
- **User Whitelisting**: ควบคุมการเข้าถึงระบบโดยการระบุอีเมลผู้ที่มีสิทธิ์ใช้งาน
- **Telegram Notification Bot**: รับการแจ้งเตือนกิจกรรมสำคัญผ่าน Telegram ทันที
- **Automated Maintenance**: ระบบ Cron Job สำหรับล้างไฟล์ขยะและจัดการประวัติกิจกรรมอัตโนมัติ

---

## 📅 นโยบายการเก็บรักษาข้อมูล (Data Retention)
- **Audit Logs (ประวัติกิจกรรม)**: ระบบจะเก็บรักษาประวัติกิจกรรมทั้งหมดไว้เป็นเวลา **10 ปี** เพื่อใช้ในการตรวจสอบย้อนหลัง
- **Orphaned Files (ไฟล์ขยะ)**: ไฟล์ที่อัปโหลดค้างไว้โดยไม่มีการบันทึก จะถูกลบอัตโนมัติภายใน 24 ชั่วโมง
- **Student Documents**: เอกสารการฝึกงานจะถูกเก็บรักษาไว้ตามระเบียบของคณะฯ จนกว่าจะมีการดำเนินการลบโดยผู้ดูแลระบบ

---

## 🛠 เทคโนโลยีที่ใช้ (Tech Stack)

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion (Animations), Lucide Icons
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Managed Service)
- **Auth**: NextAuth.js (Google OAuth & CMU OAuth)
- **Notifications**: Telegram Bot API

---

## 🚀 การติดตั้งและเริ่มต้นใช้งาน (Installation)

### 1. เตรียมความพร้อม (Prerequisites)
- Node.js 20.x ขึ้นไป
- PostgreSQL Database

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่า Environment Variables
คัดลอกไฟล์ตัวอย่างและกรอกข้อมูลให้ครบถ้วน:
```bash
cp .env.local.example .env.local
```

### 4. เตรียมฐานข้อมูล
```bash
npx prisma migrate dev
npx prisma generate
```

### 5. เริ่มรันระบบ
```bash
npm run dev
```

---

## 🔑 การตั้งค่า Super Admin คนแรก (First-time Setup)

เนื่องจากระบบใช้ OAuth และไม่มีฐานข้อมูลเริ่มต้น คุณต้องสร้างบัญชี Super Admin คนแรกด้วยตนเองผ่านสคริปต์:

1. กำหนดอีเมลของคุณ (ที่ใช้เข้า Google/CMU) ในไฟล์ `.env.local`:
   ```env
   SUPER_ADMIN_EMAIL="your-email@cmu.ac.th"
   SUPER_ADMIN_PASSWORD="กำหนดรหัสผ่านอะไรก็ได้ (ระบบสร้างเพื่อ Schema แต่จะใช้ OAuth เข้าจริง)"
   ```
2. รันสคริปต์สร้าง Super Admin:
   ```bash
   npm run create-super-admin
   ```
3. เข้าสู่ระบบผ่านหน้าเว็บด้วย **OAuth (Google/CMU)** โดยใช้อีเมลเดียวกับที่ระบุไว้ ระบบจะมอบสิทธิ์ Super Admin ให้ทันทีครับ

---

## 🔐 Required Environment Variables ก่อน Deploy

ตัวแปร environment ต่อไปนี้ **ต้องกำหนดก่อน deploy ทุกครั้ง** มิฉะนั้นแอปจะ crash ตั้งแต่ startup:

| Variable | ข้อกำหนด | ตัวอย่าง |
|---|---|---|
| `SESSION_PASSWORD` | ต้องยาว **อย่างน้อย 32 ตัวอักษร** (ใช้เข้ารหัส session cookie ด้วย iron-session) | `openssl rand -hex 32` |
| `HEALTH_CHECK_TOKEN` | ต้องกำหนดเสมอ (endpoint `/api/health/db` จะปิดทุก request ถ้าไม่มี token นี้) | `openssl rand -hex 24` |

> **คำเตือน:** ถ้า `SESSION_PASSWORD` ไม่ถูกตั้งค่าหรือสั้นกว่า 32 ตัวอักษร เซิร์ฟเวอร์จะหยุดทำงานทันทีพร้อม error `SESSION_PASSWORD must be set and at least 32 characters long`

สร้างค่าทั้งสองด้วยคำสั่ง:
```bash
echo "SESSION_PASSWORD=$(openssl rand -hex 32)"
echo "HEALTH_CHECK_TOKEN=$(openssl rand -hex 24)"
```

---

## ⚙️ การตั้งค่า Cron Jobs
ระบบมี Endpoint สำหรับงานอัตโนมัติ (ต้องส่ง `Bearer <CRON_SECRET>` ใน Header):
- `GET /api/cron/cleanup-logs`: ล้าง Log ที่เก่ากว่า 10 ปี
- `GET /api/cron/cleanup-orphaned-files`: ลบไฟล์อัปโหลดที่ไม่มีการอ้างอิง

---

## 📧 ติดต่อสอบถาม
หากพบปัญหาการใช้งานหรือต้องการความช่วยเหลือกรุณาติดต่อ:
- **หน่วยพัฒนาเทคโนโลยีสารสนเทศ คณะพยาบาลศาสตร์**
- **Email:** nupong.pr@cmu.ac.th

---
© 2026 Internship Management System · Faculty of Nursing, CMU
