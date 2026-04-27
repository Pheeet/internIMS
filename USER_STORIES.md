# User Stories - Internship Management System

## System Structure & Infrastructure Requirements

### US-001: Email & CMU Entra ID Dual Login
**As a** System Administrator  
**I want** users to login with two methods  
**So that** users have flexible authentication options

**Acceptance Criteria:**
- [ ] Login page displays two distinct login methods
- [ ] Method 1: Email + Password form
- [ ] Method 2: "Login with CMU Entra ID" button
- [ ] Both methods redirect authenticated users to appropriate dashboard

---

### US-002: CMU Entra ID Access Control
**As a** System Administrator  
**I want** the system to validate Entra ID users against the database  
**So that** unauthorized users are denied access immediately

**Acceptance Criteria:**
- [ ] When user logs in via CMU Entra ID, system checks if email exists in database
- [ ] If email not found, show rejection message with "Please contact Admin" notice
- [ ] Rejected attempt is logged in Audit Log
- [ ] Email is sent to Admin with failed login attempt details

---

### US-003: Session Management & Auto Logout
**As a** System Administrator  
**I want** automatic session timeout after inactivity  
**So that** inactive sessions don't pose security risks

**Acceptance Criteria:**
- [ ] Session expires after 24 hours of inactivity
- [ ] User is automatically logged out when session expires
- [ ] User receives warning notification 5 minutes before timeout
- [ ] Redirect to login page with message upon timeout

---

### US-004: Cloud Storage Integration for Documents
**As a** System Administrator  
**I want** uploaded documents stored on Cloud Storage (AWS S3 or Google Cloud Storage)  
**So that** server performance is not impacted by document storage

**Acceptance Criteria:**
- [ ] All document uploads directed to cloud storage service
- [ ] Document URLs stored in database point to cloud storage
- [ ] Download functionality retrieves documents from cloud storage
- [ ] Storage quota limits enforced per user/system-wide

---

### US-005: Comprehensive Audit Logging
**As a** System Administrator / Super Admin  
**I want** all important admin actions logged with timestamp and user info  
**So that** there is complete traceability of system modifications

**Acceptance Criteria:**
- [ ] Admin/Super Admin additions recorded with: who, what, when
- [ ] Admin/Super Admin deletions recorded with: who, what, when
- [ ] Document downloads logged with: who, what file, when
- [ ] Role assignments logged with: who assigned, to whom, when
- [ ] Deactivations/deletions logged with: who, which user, when
- [ ] Audit logs accessible through admin dashboard
- [ ] Audit logs cannot be modified or deleted

---

### US-006: Responsive Design Implementation
**As a** User (All Roles)  
**I want** the system UI to be responsive  
**So that** I can use the system on both desktop and mobile devices

**Acceptance Criteria:**
- [ ] All pages display correctly on mobile devices (320px+)
- [ ] All pages display correctly on tablets (768px+)
- [ ] All pages display correctly on desktop (1024px+)
- [ ] Navigation adapts to screen size (mobile menu, desktop nav)
- [ ] Forms are easy to fill on mobile
- [ ] Images and tables scale appropriately

---

## Super Admin Role Features

### US-007: Super Admin Full System Access
**As a** Super Admin  
**I want** complete access and control over all system features  
**So that** I can manage the entire system equivalent to Admin roles

**Acceptance Criteria:**
- [ ] Super Admin has all Admin permissions
- [ ] Super Admin can manage other Admin accounts
- [ ] Super Admin can manage all Student accounts
- [ ] Super Admin can access all system logs and reports
- [ ] Super Admin can modify system-wide settings

---

### US-008: Role Assignment to New Admins
**As a** Super Admin  
**I want** to assign Admin role to new email addresses  
**So that** new administrators can manage the system

**Acceptance Criteria:**
- [ ] Super Admin can input new email address in admin panel
- [ ] System generates temporary password for new Admin
- [ ] New Admin receives welcome email with temporary credentials
- [ ] New Admin forced to change password on first login
- [ ] Role assignment logged in Audit Log

---

### US-009: Admin Email Modification
**As a** Super Admin  
**I want** to edit Admin email addresses  
**So that** I can update contact information as needed

**Acceptance Criteria:**
- [ ] Super Admin can modify email of existing Admin
- [ ] Email change requires confirmation from Super Admin
- [ ] Email change requires confirmation from target Admin
- [ ] Old email no longer has access after change
- [ ] Modification logged in Audit Log
- [ ] Email notification sent to both old and new email addresses

---

### US-010: Admin Account Deactivation & Deletion
**As a** Super Admin  
**I want** to deactivate or delete Admin accounts  
**So that** I can manage access when issues arise

**Acceptance Criteria:**
- [ ] Super Admin can deactivate Admin account (reversible)
- [ ] Super Admin can permanently delete Admin account (irreversible)
- [ ] Deactivation/deletion requires confirmation
- [ ] Deactivated account cannot login but data preserved
- [ ] Deleted account data handled according to privacy policy
- [ ] Student deactivation/deletion also supported
- [ ] All actions logged in Audit Log
- [ ] Notification sent to affected Admin

---

## Admin Role Features

### US-011: Email Whitelist Requirement
**As a** Admin  
**I want** to enforce that only whitelisted emails can login  
**So that** only authorized students can access the system

**Acceptance Criteria:**
- [ ] Users can only login with pre-registered email in backend
- [ ] Non-registered emails see "Email not registered" message
- [ ] Suggestion to contact Admin provided to unauthorized users

---

### US-012: Single Student Email Addition
**As a** Admin  
**I want** to add individual student emails one at a time  
**So that** I can manually register students

**Acceptance Criteria:**
- [ ] Admin can input single email address in admin panel
- [ ] System generates random secure password automatically
- [ ] Password meets security requirements (mix of uppercase, lowercase, numbers, symbols)
- [ ] Generated password displayed/copied to admin
- [ ] Student email and temporary password stored in database
- [ ] Email sent to student with login credentials
- [ ] Action logged in Audit Log

---

### US-013: Bulk Student Import via CSV
**As a** Admin  
**I want** to import multiple student emails via CSV file  
**So that** I can register many students at once

**Acceptance Criteria:**
- [ ] Admin can upload CSV file with student emails
- [ ] CSV format: one email per line (or specific format)
- [ ] System validates email format before import
- [ ] Duplicate emails rejected with warning
- [ ] System generates secure passwords for all valid emails
- [ ] Import results show success/failure count
- [ ] Failed imports display specific error reasons
- [ ] All successfully imported students receive email with credentials
- [ ] Bulk import logged in Audit Log
- [ ] CSV file stored for reference/audit

---

### US-014: Automated Email Delivery for Credentials
**As a** Admin  
**I want** the system to send passwords to students automatically  
**So that** students receive their login credentials promptly

**Acceptance Criteria:**
- [ ] Email sent automatically after password generation (single add)
- [ ] Email sent automatically after bulk import completion
- [ ] Email includes: student email, temporary password, login link
- [ ] Email includes instructions to change password on first login
- [ ] Email has Admin contact information for support
- [ ] Email delivery status tracked and reported
- [ ] Failed delivery alerts Admin for manual follow-up

---

### US-015: Student Personal Data Management
**As a** Admin  
**I want** to view, manage, and edit student personal information and documents  
**So that** I can oversee complete student records

**Acceptance Criteria:**
- [ ] Admin can view student profile data (name, ID, contact, etc.)
- [ ] Admin can edit student personal information if necessary
- [ ] Admin can view all student uploaded documents
- [ ] Admin can download student documents
- [ ] Admin can delete/remove student documents if needed
- [ ] Admin can view when documents were uploaded
- [ ] All data modifications logged in Audit Log

---

### US-016: Document & Application Status Management
**As a** Admin  
**I want** to change status of student documents and internship applications  
**So that** I can guide students through the approval workflow

**Acceptance Criteria:**
- [ ] Admin can set status to: Pending, Approved, Rejected
- [ ] Admin can set status to: "Request Edit" (returns to student for revision)
- [ ] Admin can set status to: "Completed" (only when internship verified)
- [ ] When "Request Edit" sent, student receives notification with feedback
- [ ] Status change notifications sent to student automatically
- [ ] Admin can add comments/feedback with status change
- [ ] Student can see comments on their application
- [ ] Status change history visible in audit trail
- [ ] Approved applications proceed to next stage automatically
- [ ] All status changes recorded with Admin ID and timestamp

---

## Student Role Features

### US-017: Student Email Login Requirement
**As a** Student  
**I want** to login with pre-registered email and password  
**So that** only authorized students can access their account

**Acceptance Criteria:**
- [ ] Student can login with registered email and provided password
- [ ] Unregistered emails see error message with contact info
- [ ] Password field masks characters
- [ ] Failed login attempts recorded
- [ ] Account lockout after X failed attempts (configurable)

---

### US-018: Password Reset Functionality
**As a** Student  
**I want** to reset my password if I forget it  
**So that** I can regain access to my account

**Acceptance Criteria:**
- [ ] Login page displays "Forgot Password?" link
- [ ] Click leads to password reset page
- [ ] Student enters registered email
- [ ] System sends reset link to email (valid for 24 hours)
- [ ] Reset link leads to secure password change form
- [ ] Student must enter new password twice (confirmation)
- [ ] New password meets security requirements
- [ ] Account unlocked upon successful password reset
- [ ] Confirmation email sent after successful reset

---

### US-019: Forced Profile Completion on First Login
**As a** Student  
**I want** to be required to complete profile information on first login  
**So that** the system has complete student data

**Acceptance Criteria:**
- [ ] First login redirects to Profile page (not dashboard)
- [ ] Profile form requires all mandatory fields: name, ID, phone, address, etc.
- [ ] Form has validation for each field
- [ ] Submit button disabled until all fields valid
- [ ] Cannot access other pages until profile completed
- [ ] Clear instructions on what information needed

---

### US-020: Profile Completion to Internship Form Redirect
**As a** Student  
**I want** to be redirected to Internship Form after saving profile  
**So that** I can proceed with application submission

**Acceptance Criteria:**
- [ ] After clicking "Save Profile" with valid data
- [ ] Profile data saved to database
- [ ] Student automatically redirected to Internship Form page
- [ ] Form has pre-filled data if available
- [ ] Student can see progress indicator (Profile → Internship Form → Dashboard)
- [ ] Back button on Internship Form goes to edit profile if needed

---

### US-021: Internship Form to Dashboard Redirect
**As a** Student  
**I want** to be redirected to Dashboard after submitting internship form  
**So that** I can monitor the status of my application

**Acceptance Criteria:**
- [ ] After clicking "Submit" on Internship Form
- [ ] Form data saved to database
- [ ] Student automatically redirected to Dashboard
- [ ] Dashboard displays submitted application status
- [ ] Clear confirmation message shown
- [ ] Student can view submitted data (read-only)

---

### US-022: Submit Confirmation & Immutable Application
**As a** Student  
**I want** my application to be locked after final submission  
**So that** I cannot accidentally modify submitted data

**Acceptance Criteria:**
- [ ] Final submit button requires explicit confirmation dialog
- [ ] Dialog warns: "Once submitted, you cannot edit. Proceed?"
- [ ] Only Admin can "Request Edit" to allow re-submission
- [ ] When Admin requests edit, student can unlock and modify
- [ ] Student cannot re-lock without Admin approval
- [ ] Submission timestamp recorded
- [ ] Cannot re-submit the same application

---

### US-023: Document Upload Validation
**As a** Student  
**I want** the system to validate documents I upload  
**So that** only correct file types and sizes are accepted

**Acceptance Criteria:**
- [ ] Allowed file types: PDF, JPEG, PNG only
- [ ] File size limit: 5 MB per file
- [ ] Upload prevents files exceeding size limit
- [ ] Upload prevents files of unsupported types
- [ ] Error message clearly states file requirements
- [ ] File type/size checked on client-side (instant feedback)
- [ ] File type/size validated on server-side (security)
- [ ] Multiple file uploads allowed (with individual validation)
- [ ] Progress indicator shown during upload
- [ ] Confirmation message upon successful upload

---

### US-024: Internship Completion Verification
**As a** Admin/Super Admin  
**I want** to verify and mark internship as completed after student finishes  
**So that** the system records successful internship completion

**Acceptance Criteria:**
- [ ] Only Admin/Super Admin can change status to "Completed"
- [ ] Student cannot change status to "Completed" on their own
- [ ] Admin/Super Admin can set status to "Completed" via Admin Dashboard
- [ ] Completion action requires admin to review final documents
- [ ] Optional: Admin can add completion notes/remarks
- [ ] System records: Admin ID, timestamp, and updated_by field
- [ ] Student receives notification when internship marked as Completed
- [ ] Completion status change is logged in Audit Log
- [ ] Cannot revert Completed status once set (only Super Admin override)
- [ ] Dashboard shows visual indicator for Completed internships

---

## Implementation Priority Matrix

| Priority | User Stories |
|----------|-------------|
| **Critical (Phase 1)** | US-017, US-018, US-019, US-020, US-012, US-011 |
| **High (Phase 2)** | US-001, US-002, US-021, US-023, US-015, US-016, US-024 |
| **Medium (Phase 3)** | US-003, US-004, US-013, US-014, US-006 |
| **Low (Phase 4)** | US-005, US-007, US-008, US-009, US-010 |

---

## Technical Requirements Summary

### Authentication
- Email/Password login
- CMU Entra ID OAuth integration
- Session management with 24-hour timeout
- Password reset functionality
- Account lockout after failed attempts

### Data Management
- User profiles (Students, Admins, Super Admin)
- Internship applications with status tracking
- Document management with cloud storage integration
- Audit logging for all critical actions

### Document Handling
- File type validation (PDF, JPEG, PNG)
- File size limits (5 MB max)
- Cloud storage integration (AWS S3 or GCS)
- Download and deletion capabilities

### UI/UX
- Responsive design for all screen sizes
- Workflow guidance (Profile → Internship Form → Dashboard)
- Status indicators and progress tracking
- Clear error messages and validation feedback

### Security
- HTTPS/SSL encryption
- Password security requirements
- Email verification
- Audit trail logging
- Access control based on roles

---

## Development Checklist

### Backend Requirements
- [ ] User authentication service
- [ ] Role-based access control (RBAC)
- [ ] Entra ID OAuth integration
- [ ] Email service integration
- [ ] Cloud storage integration
- [ ] Audit logging system
- [ ] Password reset token management
- [ ] Session management

### Frontend Requirements
- [ ] Login page with dual methods
- [ ] Student dashboard
- [ ] Admin panel
- [ ] Profile completion page
- [ ] Internship form
- [ ] File upload component
- [ ] Responsive layouts
- [ ] Status indicators

### Database Requirements
- [ ] Users table with roles
- [ ] Admin profiles table
- [ ] Student profiles table
- [ ] Internship applications table (with COMPLETED status)
- [ ] Document storage metadata table
- [ ] Audit logs table

---

## Entity Relationship Summary

- Super Admin: ข้อมูลอยู่ใน `users` (`role = SUPER_ADMIN`) และ `admin_profiles`
- Admin: ข้อมูลอยู่ใน `users` (`role = ADMIN`) และ `admin_profiles`
- Student: ข้อมูลอยู่ใน `users` (`role = STUDENT`) และ `student_profiles`

### Why This Design

- **ความปลอดภัย:** ใช้ตาราง `users` เป็นศูนย์กลางสำหรับการยืนยันตัวตน ทำให้ logic การ login และ session management อยู่จุดเดียว แล้วแยกสิทธิ์ด้วยฟิลด์ `role`
- **ความยืดหยุ่น:** การแก้ไขอีเมลหรือสถานะบัญชีของ Admin และ Super Admin ทำได้โดยอัปเดตข้อมูลใน `users` โดยไม่กระทบ profile table
- **ระเบียบข้อมูล:** ข้อมูล student profile ที่มีรายละเอียดมากจะแยกออกจาก admin profile ทำให้ schema อ่านง่ายขึ้น ดูแลง่ายขึ้น และ query ตามบทบาทได้ชัดเจน
- **รองรับการขยายระบบ:** หากภายหลังต้องเพิ่มข้อมูลเฉพาะของ Admin เช่น หน่วยงาน, ตำแหน่ง, หรือสิทธิ์เพิ่มเติม สามารถขยายใน `admin_profiles` ได้โดยไม่ทำให้ `users` พองเกินจำเป็น

---

## Database Schema Details

### Relationship Overview

- `users` 1:1 `admin_profiles` สำหรับผู้ใช้ที่มี role เป็น `ADMIN` หรือ `SUPER_ADMIN`
- `users` 1:1 `student_profiles` สำหรับผู้ใช้ที่มี role เป็น `STUDENT`
- `users` 1:many `internships` สำหรับประวัติการฝึกงานของนักศึกษา
- `users` 1:many `attachments` สำหรับไฟล์เอกสารที่อัปโหลด
- `internships` 1:many `attachments` สำหรับเอกสารที่อ้างอิงกับรายการฝึกงาน
- `users` 1:many `audit_logs` สำหรับการบันทึกผู้กระทำและผู้ถูกกระทำ

### `users` Table

| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, Default: `uuid_generate_v4()` | ID หลักของผู้ใช้งาน |
| `email` | String | Unique, Not Null | อีเมลที่ใช้ล็อกอิน |
| `password_hash` | String | Nullable | รหัสผ่านสำหรับ local login |
| `role` | Enum | Not Null | `SUPER_ADMIN`, `ADMIN`, `STUDENT` |
| `status` | Enum | Default: `ACTIVE` | `ACTIVE`, `INACTIVE` |
| `deleted_at` | Timestamp | Nullable | ใช้สำหรับ soft delete |
| `created_at` | Timestamp | Not Null | วันที่สร้างบัญชี |
| `updated_at` | Timestamp | Not Null | วันที่แก้ไขล่าสุด |

### `admin_profiles` Table

| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | UUID | PK, FK (`users.id`) | อ้างอิงไปยังผู้ใช้ที่เป็น Admin หรือ Super Admin |
| `first_name_th` | String | Nullable | ชื่อจริง |
| `last_name_th` | String | Nullable | นามสกุล |
| `phone_number` | String | Nullable | เบอร์โทรศัพท์ |
| `position_title` | String | Nullable | ตำแหน่งงาน |
| `department` | String | Nullable | หน่วยงานหรือภาคส่วน |
| `created_at` | Timestamp | Not Null | วันที่สร้างข้อมูล |
| `updated_at` | Timestamp | Not Null | วันที่แก้ไขล่าสุด |

### `student_profiles` Table

| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | UUID | PK, FK (`users.id`) | เชื่อมกับตาราง `users` |
| `profile_picture_url` | String | Nullable | ลิงก์รูปจาก Cloud Storage |
| `prefix` | String | Not Null | คำนำหน้า |
| `first_name_th` | String | Not Null | ชื่อจริง |
| `last_name_th` | String | Not Null | นามสกุล |
| `gender` | String | Nullable | เพศ |
| `dob` | Date | Nullable | วันเกิด |
| `phone_number` | String | Nullable | เบอร์โทรศัพท์นักศึกษา |
| `emergency_phone` | String | Nullable | เบอร์ฉุกเฉิน/ผู้ปกครอง |
| `contact_address` | Text | Nullable | ที่อยู่ |
| `education_level` | String | Default: `ปริญญาตรี` | ระดับการศึกษา |
| `institution` | String | Default: `มช.` | สถาบัน |
| `faculty` | String | Default: `วิทยาศาสตร์` | คณะ |
| `major` | String | Default: `CS` | สาขา/ภาควิชา |
| `advisor_name` | String | Nullable | ชื่ออาจารย์ที่ปรึกษา |
| `advisor_phone` | String | Nullable | เบอร์อาจารย์ที่ปรึกษา |
| `created_at` | Timestamp | Not Null | วันที่สร้างข้อมูล |
| `updated_at` | Timestamp | Not Null | วันที่แก้ไขล่าสุด |

### `internships` Table

| Field Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | ID ของรายการฝึกงาน |
| `student_id` | UUID | FK (users.id) | เชื่อมกับนักศึกษาคนนั้นๆ |
| `position` | String | Not Null | ตำแหน่งที่ฝึกงาน |
| `department` | String | Nullable | แผนก |
| `start_date` | Date | Not Null | วันเริ่มต้นการฝึกงาน |
| `end_date` | Date | Not Null | วันสิ้นสุดการฝึกงาน |
| `supervisor_name` | String | Nullable | ชื่อพี่เลี้ยง |
| `status` | Enum | Default: `PENDING` | สถานะ: `PENDING`, `APPROVED`, `REJECTED`, `EDIT_REQUESTED`, `COMPLETED` |
| `remarks` | Text | Nullable | หมายเหตุ (เช่น เหตุผลที่ให้แก้ไข หรือบันทึกจาก Admin) |
| `updated_by` | UUID | FK (users.id) | Admin ID ที่เป็นคนเปลี่ยนสถานะล่าสุด |
| `created_at` | Timestamp | Not Null, Default: NOW() | วันที่สร้างบันทึก |
| `updated_at` | Timestamp | Not Null, Default: NOW() | วันที่อัปเดตล่าสุด |

---

## Business Logic: Internship Completion Verification

### Workflow States

```
PENDING → APPROVED → COMPLETED
   ↓         ↓
 REJECTED  EDIT_REQUESTED → APPROVED → COMPLETED
```

### Permission Control

| Role | Can View | Can Edit | Can Approve | Can Reject | Can Request Edit | Can Mark Completed |
| --- | --- | --- | --- | --- | --- | --- |
| Student | Own only | Own (if not submitted) | ❌ | ❌ | ❌ | ❌ |
| Admin | All | All | ✅ | ✅ | ✅ | ✅ |
| Super Admin | All | All | ✅ | ✅ | ✅ | ✅ |

### Completion Verification Process

1. **Pre-Completion Condition:**
   - Internship status must be `APPROVED`
   - Current date should be on or after `end_date`
   - All required documents submitted by student

2. **Admin Action:**
   - Admin/Super Admin reviews final documents and internship records
   - Optionally adds remarks (e.g., "All requirements fulfilled", "Grade: A")
   - Clicks "Mark as Completed" button

3. **System Processing:**
   - Status changed from `APPROVED` to `COMPLETED`
   - `updated_by` field populated with Admin's user ID
   - `updated_at` timestamp updated
   - Audit log entry created with: Admin ID, action type, timestamp, old/new status

4. **Post-Completion:**
   - Student receives email notification: "Internship marked as Completed"
   - Dashboard displays "Completed" badge with completion date
   - Cannot revert to previous status (audit trail immutable)
   - Super Admin can override if necessary (with additional audit trail entry)

### Key Requirements

- **Immutability:** Once marked as COMPLETED, status should not revert (only Super Admin can override with reason)
- **Audit Trail:** All status changes, especially to COMPLETED, must be recorded with admin ID and timestamp
- **Notifications:** Student must be notified when status changes, especially to COMPLETED
- **Validation:** System should prevent marking as COMPLETED if end_date is in future
- **Historical Tracking:** `updated_by` field enables tracking which admin made the final verification

---

**Last Updated:** April 22, 2026  
**Status:** Ready for Development
