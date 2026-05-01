# รายงาน Security Review

วันที่ตรวจ: 2026-05-01

ขอบเขตที่ตรวจ:
- โค้ดภายใต้ `src/`
- `middleware.ts`
- dependency จาก `package.json`
- ผลลัพธ์ `npm audit`, `npm audit --omit=dev`, และ `npm ls`

วิธีการตรวจ:
- อ่าน source code จุดที่เกี่ยวกับ auth, session, OAuth, server actions, API routes, file upload และ file storage
- รัน `npm audit --json`, `npm audit --omit=dev --json`, `npm audit`
- ตรวจ dependency path เพิ่มด้วย `npm ls next postcss prisma @prisma/dev @hono/node-server @mapbox/node-pre-gyp tar`
- ทำ inventory ทุกไฟล์ใต้ `src/` แล้วสแกนแบบ full-source review แยกตามหมวดไฟล์

สถานะการครอบคลุมรอบ full scan:
- ไฟล์ทั้งหมดใต้ `src/`: 110 ไฟล์
- application-owned code ที่ตรวจเชิงเนื้อหา: 74 ไฟล์
- test files ที่ตรวจเชิง leakage/mocks: 6 ไฟล์
- generated Prisma artifacts: 21 ไฟล์
- vendored UI components ใต้ `src/components/ui`: 15 ไฟล์

หมายเหตุเรื่อง coverage:
- รอบนี้ครอบคลุม inventory ของ `src/` ทั้งหมดแล้ว
- ไฟล์ application-owned ถูกอ่านและไล่หา pattern เสี่ยงเชิงเนื้อหา
- ไฟล์ generated/vendor ถูกนับรวมใน inventory และถูก pattern-scan แต่ไม่ถือเป็น manual line-by-line audit เพราะไม่ใช่โค้ดที่ทีมพัฒนาเขียนเองโดยตรง

## สรุปผู้บริหาร

หลังทำ full scan ใต้ `src/` พบประเด็นด้านความปลอดภัยในโค้ดที่ยืนยันได้ 8 จุด โดยจุดที่เร่งด่วนที่สุดยังคงเป็นการออกแบบ session cookie ที่สามารถถูกแก้ไขค่าได้จากฝั่ง client และมีหลาย route/action ที่เชื่อค่า `role` และ `id` จาก cookie โดยตรง ทำให้เกิดความเสี่ยงต่อ privilege escalation และการเข้าถึงข้อมูลของผู้ใช้อื่น

จากรอบ full scan นี้ พบประเด็นเพิ่มจากรายงานเดิมที่ควรใส่ในลำดับแก้ด้วย คือ endpoint ค้นหาข้อมูลนักศึกษาฝั่ง archive ที่เช็กเพียงว่ามี session แต่ไม่เช็ก role และ health-check route ที่เปิดเผยรายละเอียดการเชื่อมต่อฐานข้อมูลต่อผู้เรียกที่ไม่ต้องยืนยันตัวตน

ด้าน dependency พบช่องโหว่จาก `npm audit` ทั้งหมด 7 รายการ แบ่งเป็น High 2 รายการ และ Moderate 5 รายการ โดยรายการที่มีแนวทางแก้ชัดที่สุดตอนนี้คือ chain ของ `bcrypt -> @mapbox/node-pre-gyp -> tar` ส่วน advisory ของ `next` และ `prisma` ยังผูกกับ upstream release ปัจจุบัน ทำให้ยังไม่มี stable upgrade path ที่ดีกว่ารุ่นที่ใช้อยู่ในวันที่ตรวจ

## ตารางสรุปรายการทั้งหมด

| ลำดับ | หมวด | รายการ | ระดับ | สถานะตอนนี้ | หมายเหตุ |
| --- | --- | --- | --- | --- | --- |
| 1 | Source code | Session cookie ปลอมแปลงได้และเชื่อ `role`/`id` จาก cookie โดยตรง | Critical | ต้องแก้ตอนนี้ | กระทบ authz หลายจุดทั้งระบบ |
| 2 | Source code | Google และ Microsoft OAuth ไม่มี `state` | High | ต้องแก้ตอนนี้ | เสี่ยง login CSRF / account confusion |
| 3 | Source code | Admin server actions หลายตัวไม่มี authorization check ที่เข้มพอ | High | ต้องแก้ตอนนี้ | เป็น code path ใช้งานจริงผ่าน admin UI |
| 4 | Source code | Archive search endpoint เช็กแค่ session ไม่เช็ก role | High | ต้องแก้ตอนนี้ | เป็น authorization bypass |
| 5 | Source code | Helper ลบไฟล์มีความเสี่ยง path traversal | Medium | ต้องแก้ตอนนี้ | ควรปิด dangerous sink ก่อน |
| 6 | Source code | มีการ log ข้อมูล OAuth/debug ที่ไม่ควรออก production | Medium | ต้องแก้ตอนนี้ | เสี่ยงข้อมูลรั่วผ่าน log |
| 7 | Source code | Health-check endpoint เปิดเผยรายละเอียดฐานข้อมูล | Medium | ต้องแก้ตอนนี้ | ควรจำกัดให้ internal/monitoring เท่านั้น |
| 8 | Source code | ไม่มี rate limiting บน login/upload/admin endpoints ที่สำคัญ | Medium | ต้องแก้ตอนนี้ | ลด brute force และ resource exhaustion |
| 9 | Dependency | `bcrypt -> @mapbox/node-pre-gyp -> tar` | High | ต้องแก้ตอนนี้ | อัปเกรด `bcrypt` เป็น `6.0.0` ได้เลย |
| 10 | Dependency | `next -> postcss` advisory | Moderate | ยังไม่ต้องแก้ | รอ provider/upstream ของ Next.js ออกรุ่นที่ patch |
| 11 | Dependency | `prisma -> @hono/node-server` advisory | Moderate | ยังไม่ต้องแก้ | รอ provider/upstream ของ Prisma ออกรุ่นที่ patch |

คำอธิบายสถานะ:
- `ต้องแก้ตอนนี้` = ทีมโปรเจกต์ลงมือแก้หรือ mitigate ได้เองทันที
- `ยังไม่ต้องแก้` = ประเด็นนี้ยังไม่มี stable fix ที่ดีกว่าจาก provider/upstream ในวันที่ตรวจ ควรเฝ้าติดตาม advisory และใช้ mitigation ชั่วคราวไปก่อน

## ผลจาก Full Scan รอบนี้

- ยืนยันได้ว่า inventory ใต้ `src/` ถูกไล่ครบแล้วในระดับรายหมวด
- ไม่พบ `dangerouslySetInnerHTML`, `eval`, `new Function`, raw SQL แบบ unsafe หรือ open redirect จาก input ผู้ใช้ใน application-owned code
- ไม่พบ finding เพิ่มในกลุ่ม `src/components/ui/*` และ `src/generated/prisma/*` ที่ควรนับเป็น app-specific defect โดยตรง
- พบ findings ใหม่ 2 จุดที่เพิ่มจากรายงานเดิม: authorization gap ใน `src/app/api/archive/students/search/route.ts` และ information disclosure ใน `src/app/api/health/db/route.ts`

## Findings จาก Source Code

### 1. Critical: Session cookie ปลอมแปลงได้ และมีหลายจุดเชื่อถือค่าใน cookie โดยตรง

หลักฐาน:
- `src/lib/session.ts` สร้าง `ims_session` จาก `JSON.stringify({ user })` แล้ว encode เป็น `base64url` เท่านั้น ไม่มีการ sign และไม่มีการเข้ารหัส
- `src/app/intern/admin/layout.tsx`, `src/app/intern/dashboard/page.tsx`, `src/app/api/admin/management/admins/route.ts`, `src/app/api/admin/management/students/route.ts`, `src/app/api/admin/activities/route.ts` ใช้ `session.user.role` เพื่ออนุญาตหรือ redirect โดยตรง
- `src/app/actions/profile.ts` และ `src/app/api/auth/user-flags/route.ts` ใช้ `session.user.id` โดยตรง

ผลกระทบ:
- หากผู้โจมตีสามารถตั้งค่า cookie เองได้ จะสามารถปลอมตัวเป็น user อื่นได้
- สามารถยกระดับสิทธิ์เป็น `ADMIN` หรือ `SUPER_ADMIN` ได้ใน route ที่เชื่อ `role` จาก cookie โดยตรง
- สามารถอ่าน flag ของ user อื่น หรือแก้ไข profile ของ user อื่นได้ในจุดที่ใช้ `session.user.id` ตรง ๆ

แนวทางแก้:
1. เปลี่ยนจาก cookie แบบ encode-only ไปเป็น signed/encrypted session เช่น Auth.js, iron-session หรือ JWT ที่ verify ลายเซ็นทุกครั้ง
2. ตั้ง `secure: process.env.NODE_ENV === "production"` ให้กับ session cookie และกำหนดอายุ cookie ให้เหมาะสม
3. อย่าเชื่อ `role` หรือ `id` จาก cookie โดยตรง ให้เก็บเพียง subject ที่ verify ได้ แล้ว query user จริงจากฐานข้อมูลทุกครั้งก่อน authorize
4. หลังแก้ session format ให้บังคับ invalidation ของ cookie เก่าทั้งหมด

### 2. High: Google และ Microsoft OAuth flow ไม่มีการใช้ `state` ป้องกัน login CSRF

หลักฐาน:
- `src/app/api/auth/google/route.ts` และ `src/app/api/auth/google/callback/route.ts` ไม่มี `state` parameter และไม่มี callback validation
- `src/app/api/auth/microsoft/route.ts` และ `src/app/api/auth/microsoft/callback/route.ts` ไม่มี `state` parameter และไม่มี callback validation
- เทียบกับ `src/app/api/auth/cmu/route.ts` และ `src/app/api/auth/cmu/callback/route.ts` ซึ่งมี pattern ที่ถูกต้องอยู่แล้ว

ผลกระทบ:
- เปิดความเสี่ยง login CSRF / account confusion attack
- ผู้ใช้สามารถถูกผูก session เข้ากับบัญชีที่ตนไม่ได้ตั้งใจล็อกอินได้ หาก flow ถูกบังคับจากภายนอก

แนวทางแก้:
1. ใช้ pattern เดียวกับ CMU OAuth: สร้าง random `state`, เก็บใน httpOnly cookie อายุสั้น, validate ใน callback และลบ cookie ทันทีหลังตรวจผ่าน
2. ถ้าเป็นไปได้ให้ใช้ PKCE เพิ่มเติมสำหรับ OAuth provider เหล่านี้ด้วย

### 3. High: Admin server actions หลายตัวไม่มี authorization check ที่เข้มพอ

หลักฐาน:
- `src/app/actions/admin.ts`
- `updateStudentAndInternshipInfo()` ไม่มีการเช็ก session หรือ role
- `manualRevertToApproved()` ไม่มีการเช็ก session หรือ role
- `saveFlaggedFields()` ไม่มีการเช็ก session หรือ role
- `updateInternshipStatus()` เช็กเพียงว่ามี user ตาม email ในระบบ แต่ไม่ได้ยืนยัน role ว่าเป็น admin
- actions เหล่านี้ถูก import และเรียกใช้จาก `src/components/admin/ApplicationReviewDrawer.tsx` จึงเป็น code path ที่ใช้งานจริง

ผลกระทบ:
- หาก action endpoint ถูกเรียกใช้นอกเส้นทาง admin UI จะเกิดการแก้ไขข้อมูลโดยไม่มีการยืนยันสิทธิ์ที่ server-side
- เมื่อรวมกับปัญหา session cookie ที่ปลอมแปลงได้ ความเสี่ยงจะยิ่งสูงขึ้นมาก

แนวทางแก้:
1. สร้าง helper กลาง เช่น `requireAdminUser()` ที่ทำ 3 อย่างเสมอ: อ่าน session ที่ verify ได้, query user จริงจาก DB, และเช็ก role ว่าเป็น `ADMIN` หรือ `SUPER_ADMIN`
2. เรียก helper นี้เป็นบรรทัดแรกของทุก admin action และ admin route
3. เพิ่ม test สำหรับ unauthorized caller ให้ครบทุก action ที่แก้ข้อมูลสำคัญ

### 4. High: Archive search endpoint อนุญาตผู้ใช้ที่ login แล้วทุกคนค้นหานักศึกษาได้

หลักฐาน:
- `src/app/api/archive/students/search/route.ts` เช็กเพียงว่ามี session หรือไม่
- route นี้ไม่ได้เช็ก role ว่าต้องเป็น `ADMIN` หรือ `SUPER_ADMIN`
- จากการสแกนภายใต้ `src/` ไม่พบ call site ฝั่ง UI ที่อ้างถึง endpoint นี้ แต่ตัว route ยังคงถูก deploy และเรียกได้ถ้ารู้ path

ผลกระทบ:
- ผู้ใช้ที่ login แล้วแต่ไม่ใช่ admin สามารถค้นหารายชื่อนักศึกษาที่เข้าเงื่อนไขใน archive scope ได้
- เป็น authorization bypass ต่อข้อมูลที่ควรจำกัดเฉพาะฝั่งผู้ดูแล

แนวทางแก้:
1. บังคับ role check เป็น `ADMIN` หรือ `SUPER_ADMIN` ที่ server route โดย query user จริงจาก DB
2. ถ้า endpoint ยังไม่ได้ใช้งานจริง ให้ปิด route ชั่วคราวจนกว่าจะกำหนด policy ครบ
3. เพิ่ม test สำหรับ student caller และ unauthenticated caller

### 5. Medium: ความเสี่ยง path traversal ใน helper ลบไฟล์

หลักฐาน:
- `src/lib/storage.ts` ใช้ `path.join(process.cwd(), "public", oldFileUrl)` และ `path.join(process.cwd(), "public", fileUrl)`
- ค่า `oldFileUrl` และ `fileUrl` มาจากฐานข้อมูล ไม่ได้ถูก normalize/validate ก่อนใช้กับ filesystem

ผลกระทบ:
- ถ้าผู้โจมตีสามารถทำให้ค่าใน DB มี `../` หรือ path ที่ผิดรูปได้ จะมีโอกาสลบไฟล์นอกโฟลเดอร์ uploads
- จุดนี้ยังไม่ใช่ exploit ตรง ๆ ด้วยตัวมันเอง แต่เป็น dangerous sink ที่ควรปิดไว้ก่อน

แนวทางแก้:
1. ใช้ `path.resolve()` แล้วตรวจว่า path ปลายทางยังอยู่ใต้ `UPLOAD_BASE`
2. ปฏิเสธ path ที่มี `..`, drive letter, backslash แปลก ๆ หรือไม่ขึ้นต้นด้วย `/uploads/`
3. เก็บ path ใน DB เป็น relative safe path เท่านั้น เช่น `profiles/<uuid>.png` แทน full URL/path

### 6. Medium: มีการ log ข้อมูล OAuth/debug ที่ไม่ควรออก production log

หลักฐาน:
- `src/app/intern/api/auth/callback/route.ts` log response headers และ body ของ CMU user info endpoint
- `src/app/api/auth/cmu/callback/route.ts` log ความยาว secret, metadata ของ response, และ error body
- `src/app/actions/internship.ts` มี debug log เช่น userId และสถานะการ submit
- `src/components/admin/ApplicationReviewDrawer.tsx` log ข้อมูล review และรายการไฟล์ที่จะอัปเดต
- `src/app/intern/(student)/internship/InternshipForm.tsx` log remarks ภายในและข้อความ feedback ดิบลง console

ผลกระทบ:
- เสี่ยงต่อการรั่วของข้อมูลส่วนบุคคล, token-related data หรือข้อมูลภายในระบบผ่าน log aggregation
- เพิ่ม blast radius หาก log ถูกเข้าถึงโดยผู้ที่ไม่ควรเห็นข้อมูลดังกล่าว

แนวทางแก้:
1. ลบ log ที่พิมพ์ response body, header หรือข้อมูล sensitive ออกจาก production path
2. ถ้าจำเป็นต้องเก็บ log ให้ใช้ structured logging พร้อม redaction
3. ให้ debug log เปิดได้เฉพาะ non-production หรือผ่าน feature flag ที่ชัดเจน

### 7. Medium: Health-check endpoint เปิดเผยรายละเอียดฐานข้อมูลโดยไม่ต้องยืนยันตัวตน

หลักฐาน:
- `src/app/api/health/db/route.ts` ไม่มี authentication หรือ authorization
- route นี้ส่งกลับ `database.connected`, `latencyMs` และ `error` เมื่อเชื่อมต่อไม่ได้
- `src/lib/db.ts` แปลงข้อความผิดพลาดเป็นข้อความที่ยังบอกลักษณะปัญหา เช่น `ECONNREFUSED`, authentication failure หรือ timeout

ผลกระทบ:
- ผู้โจมตีสามารถใช้ endpoint นี้ตรวจสภาพฐานข้อมูลจากภายนอกได้
- ข้อความ error ช่วยในการ fingerprint สภาพแวดล้อมและ troubleshoot ระบบจากภายนอก ซึ่งไม่ควรเปิดสู่ public internet

แนวทางแก้:
1. จำกัด route นี้ให้เรียกได้จาก internal network, monitoring identity หรือ shared secret
2. ใน production ให้คืนเพียงสถานะ generic เช่น `ok` หรือ `error` โดยไม่เปิดเผยรายละเอียด error ภายใน
3. แยก liveness กับ readiness endpoint ให้ชัดเจนถ้าจำเป็น

### 8. Medium: ไม่มี rate limiting บน login และ upload endpoints ที่สำคัญ

หลักฐาน:
- `src/app/actions/auth.ts` ไม่มี throttling / lockout สำหรับ password login
- `src/app/api/student/attachments/[id]/reupload/route.ts` ไม่มี per-user หรือ per-IP rate limit
- admin management endpoints หลายตัวไม่มี rate limit เช่นการสร้าง user/admin

ผลกระทบ:
- เสี่ยงต่อ brute-force login
- เสี่ยงต่อ resource exhaustion จากการอัปโหลดซ้ำ ๆ แม้มีการจำกัดขนาดไฟล์ต่อครั้งแล้ว

แนวทางแก้:
1. เพิ่ม rate limit ต่อ IP และต่อบัญชีผู้ใช้สำหรับ login
2. เพิ่ม upload quota ต่อ user ต่อช่วงเวลา เช่น 10 ครั้งต่อชั่วโมง
3. คืนค่า `429 Too Many Requests` พร้อม retry window ที่ชัดเจน

## ข้อสังเกตเพิ่มเติมจาก Full Scan

- `src/lib/db.ts` ตั้ง `rejectUnauthorized: false` ใน pg SSL config สำหรับเส้นทาง health-check ซึ่งลดความเข้มของการตรวจ cert ถ้านำไปใช้กับ environment ที่ไม่ควร bypass CA validation
- `src/app/api/admin/*` และ layout หลายจุดยังเชื่อ `session.user.role` จาก cookie ตรง ๆ ประเด็นนี้ถูกรวมไว้ใน finding เรื่อง session forgery แล้ว จึงไม่นับซ้ำเป็นรายไฟล์
- ไม่พบการเรียก raw SQL แบบ unsafe หรือการ render HTML จาก input ผู้ใช้โดยตรงใน application-owned code ใต้ `src/`

## ผลลัพธ์ `npm audit`

ผลจาก `npm audit` และ `npm audit --omit=dev` เท่ากัน เนื่องจาก package ที่ถูก flag ทั้งหมดอยู่ใน `dependencies` ของโปรเจกต์

สรุป:
- Vulnerabilities รวม: 7
- High: 2
- Moderate: 5
- Critical: 0

### รายการที่ควรจัดการก่อน

#### 1. High: `bcrypt@5.1.1` พา `@mapbox/node-pre-gyp@1.0.11` และ `tar@6.2.1` เข้ามา

dependency path:
- `bcrypt@5.1.1 -> @mapbox/node-pre-gyp@1.0.11 -> tar@6.2.1`

รายละเอียด:
- `tar` ถูก flag หลาย advisory กลุ่ม path traversal / arbitrary file overwrite
- จากการตรวจ `npm view bcrypt@6.0.0 dependencies --json` พบว่า `bcrypt@6.0.0` เปลี่ยนไปใช้ `node-gyp-build` และไม่พึ่ง `@mapbox/node-pre-gyp` แล้ว

ข้อเสนอแนะ:
1. อัปเกรด `bcrypt` เป็น `6.0.0`
2. รัน test ที่เกี่ยวกับ auth/password hash หลังอัปเกรด
3. รัน `npm audit` ซ้ำเพื่อยืนยันว่า chain นี้หายไปจริง

คำสั่งแนะนำ:

```bash
npm install bcrypt@6.0.0
npm audit
```

#### 2. Moderate: `next@16.2.4` พา `postcss@8.4.31` ที่มี advisory XSS เข้ามา

dependency path:
- `next@16.2.4 -> postcss@8.4.31`

รายละเอียด:
- advisory: `GHSA-qx2v-qp2m-jg93`
- จากการตรวจ `npm view next version` พบว่า registry ยังรายงาน stable ล่าสุดเป็น `16.2.4` เท่ากับเวอร์ชันที่ใช้อยู่
- `npm audit fix --force` ให้คำแนะนำเรื่อง downgrade เป็นเวอร์ชันเก่ามาก ซึ่งไม่ใช่แนวทางที่ควรใช้

ข้อเสนอแนะ:
1. ติดตาม release note/security advisory ของ Next.js อย่างใกล้ชิด และอัปเดตทันทีเมื่อมีรุ่นที่ bundle `postcss >= 8.5.10`
2. ระหว่างรอ patch upstream ให้หลีกเลี่ยงการนำ CSS ที่มาจากผู้ใช้หรือ untrusted source เข้าสู่ pipeline ที่ stringify เป็น `<style>`
3. ถ้ามีขั้นตอน build image แยก ให้ใช้ dependency scanning/allowlist เพื่อเฝ้าระวังรายการนี้ต่อเนื่อง

#### 3. Moderate: `prisma@7.8.0` พา `@prisma/dev@0.24.3` และ `@hono/node-server@1.19.11` เข้ามา

dependency path:
- `prisma@7.8.0 -> @prisma/dev@0.24.3 -> @hono/node-server@1.19.11`

รายละเอียด:
- advisory ที่ถูก flag คือ middleware bypass ใน `@hono/node-server`
- จากการตรวจ `npm view prisma version` พบว่า stable ล่าสุดยังเป็น `7.8.0` เท่ากับที่ใช้อยู่
- แปลว่าในวันที่ตรวจ ยังไม่มี stable Prisma release ที่เคลียร์ advisory นี้ให้โดยตรง

ข้อเสนอแนะ:
1. ถ้า production runtime ไม่จำเป็นต้องมี Prisma CLI ให้หลีกเลี่ยงการ bundle `prisma` เข้า image runtime
2. พิจารณาย้าย `prisma` ไปเป็น `devDependencies` หรือใช้ multi-stage build ถ้า process deploy ของทีมรองรับ
3. ติดตาม Prisma upstream และอัปเดตทันทีเมื่อมี release ที่อัปเดต `@prisma/dev`

## ลำดับการแก้ที่แนะนำ

1. แก้ session design และ authorization checks ก่อน เพราะเป็นช่องทาง privilege escalation ที่กระทบทั้งระบบ
2. เพิ่ม `state` ให้ Google/Microsoft OAuth ทันที
3. อัปเกรด `bcrypt` เป็น `6.0.0` แล้วรัน `npm audit` ซ้ำ
4. ปิด log ที่เสี่ยง, เพิ่ม rate limit และ harden file path handling
5. ติดตาม patch upstream ของ Next.js และ Prisma ต่อเนื่อง

## หมายเหตุ

- รายงานฉบับนี้สะท้อน full scan ของ inventory ใต้ `src/` แล้ว โดยแยก app-owned, tests, generated และ vendor code ออกจากกันอย่างชัดเจน
- รายงานนี้อิงจาก source inspection และผล `npm audit` ในวันที่ตรวจ ยังไม่ได้ทำ penetration test หรือ dynamic exploit validation
- จุดที่ถูกจัดเป็น Medium บางรายการจะถูกยกระดับผลกระทบทันทีเมื่อรวมกับปัญหา session cookie ที่ปลอมแปลงได้