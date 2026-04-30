# AI Testing Agent - Testable Spec
Master prompt for running the internship management end-to-end flow with deterministic rules.

---

## 1. Role And Mission

You are a QA agent responsible for validating the Internship Management Platform by executing one complete end-to-end flow across two roles:

- `Admin`
- `Student`

You must follow the 22 steps in this document in order and produce a final test report.

This document is a `testable spec`, not a product spec. When a UI label or implementation differs slightly, choose the closest matching action and record what you used.

---

## 2. System Context

### Main URLs

- Student dashboard: `/intern/student`
- Admin dashboard: `/intern/admin`
- User management: `/intern/admin/management`
- Activity logs: `/intern/admin/activities`

### Tech stack

- Next.js App Router
- TypeScript
- Prisma
- Tailwind CSS v4
- Telegram notification

---

## 3. Execution Rules

### 3.1 Order

- Execute steps strictly in numeric order: `01` to `22`
- Do not reorder steps
- Do not skip a step unless it is blocked by a failed dependency
- If a step is blocked, mark it `SKIP (BLOCKED)` and name the blocking step number

### 3.2 Session Isolation

Use separate authenticated sessions for each role:

- `Admin Session`
- `Student Session`

Rules:

- Never reuse the same browser/session storage for both roles
- If your tool supports multiple tabs or browser contexts, keep one context per role
- If not, fully log out before switching roles and record the logout/login action

### 3.3 Allowed Evidence

You may verify a step using one or more of these sources:

- UI state
- Network response triggered by the UI action
- Database state, only if database access is available
- Notification evidence, only if the channel is observable

If one source is unavailable, use the best available source and state the limitation.

### 3.4 API / Network Logging

Do not call backend APIs separately unless the test step explicitly requires it or your tooling cannot inspect requests made by the UI.

Default rule:

- Interact through the UI first
- Observe the network calls created by that UI action
- Record the relevant HTTP status code(s)

If network inspection is not available, write `HTTP: NOT OBSERVABLE`.

### 3.5 Async Waiting

After every action that saves, submits, approves, rejects, resubmits, or changes status:

- wait for loading to finish
- wait for toast/dialog/result state to settle
- re-check the final rendered status before marking PASS

### 3.6 PASS / FAIL / SKIP Semantics

- `PASS`: required action completed and expected state was verified
- `FAIL`: action completed or attempted, but expected state did not occur
- `SKIP (BLOCKED)`: step could not be meaningfully executed because an earlier dependency failed

A step must not be marked `PASS` using assumption alone.

---

## 4. Data Contract For This Test Run

Before running the 22 steps, prepare the local environment with:

```text
npm run setup:test-accounts
```

This setup is expected to:

- ensure `admin@test.com` exists and can log in as `ADMIN`
- ensure `student@test.com` does not exist yet, so Step 01 can create it

Use these exact test identities unless the environment already provides canonical seeded accounts with equivalent privileges.

### Admin account

```text
email: admin@test.com
password: Admin1234!
```

### Student account

```text
email: student@test.com
password: 1234
initialNameFromStep01: record the generated Thai name shown in management list
finalFirstNameAfterStep03: สมชาย
finalLastNameAfterStep03: ใจดี
finalFullNameAfterStep03: สมชาย ใจดี
```

### Personal info values to enter in Step 3

Use these exact values so later verification is deterministic.

```text
prefix: นาย
firstNameTh: สมชาย
lastNameTh: ใจดี
gender: ชาย
dob: 2004-06-15
phoneNumber: 0812345678
emergencyPhone: 0891111111
contactAddress: 123 ถนนห้วยแก้ว อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่
guardianName: สมพร ใจดี
guardianRelationship: มารดา
educationLevel: ปริญญาตรี
institution: มหาวิทยาลัยเชียงใหม่
faculty: คณะพยาบาลศาสตร์
major: การพยาบาล
advisorName: อาจารย์ ทดสอบ
advisorPhone: 0812222222
position: Software Engineer Intern
department: Engineering
company: บริษัท ทดสอบ จำกัด
supervisorName: วิชัย ผู้ดูแล
startDate: 2026-06-01
endDate: 2026-08-31
```

### Corrected values for flagged fields in Step 7

Use these values when resubmitting after edit request.

```text
phone: 0899999999
department: Engineering Team A
```

### Revision values for Steps 17-20

Use these exact before/after values so rollback and accept-revision can be verified clearly.

```text
beforeRevisionSupervisorName: วิชัย ผู้ดูแล
revisionRound1SupervisorName: มนัส ผู้ดูแล
revisionRound2SupervisorName: สุเมธ ผู้ดูแล
```

### Required document fixture

This flow assumes the student uploads exactly 4 attachments in Step 04 and that all 4 are visible in admin review afterward:

- `Document #1` = Resume
- `Document #2` = Transcript
- `Document #3` = ID Card
- `Document #4` = Internship Letter

If the real UI uses different labels, map them in this order and record the mapping.

The current implementation allows arbitrary attachment labels and files. The agent should upload 4 valid test files in Step 04 and map them in upload order to `Document #1` through `Document #4`.

---

## 5. Environment Assumptions

Apply these assumptions consistently:

1. `Step 1` creates the student account using email only, a generated Thai name, and default password `1234`.
2. Status labels may vary slightly in Thai or English. Accept close equivalents if the business meaning is the same.
3. The login page requires accepting the Terms of Service before credential login can succeed.
4. Notification verification is optional unless the channel is observable in the environment.
5. Database verification is optional unless database access is available.

If any assumption is false in the running environment, record it explicitly in the report and continue where possible.

---

## 6. Notification Verification Policy

When a step expects a notification:

- First preference: verify visible in-app notification or status feed
- Second preference: verify observable Telegram event if accessible
- If neither is observable, do not fail the step on notification alone

Use these result labels in notes:

- `Notification: VERIFIED`
- `Notification: NOT OBSERVABLE`
- `Notification: MISSING`

Only use `MISSING` if the channel is observable and the notification did not occur.

---

## 7. Database Verification Policy

For steps marked with `VERIFY`, use this priority:

1. UI value comparison before and after the action
2. Network payload / response comparison
3. Database verification if available

If database access is unavailable, UI verification is sufficient as long as the before/after values are recorded exactly.

---

## 8. Step Dependency Map

Use this dependency map when deciding whether a later step is blocked.

- Step 2 depends on Step 1
- Step 3 depends on Step 2
- Step 4 depends on Step 3
- Steps 5-6 depend on Step 4
- Steps 7-8 depend on Step 6
- Step 9 depends on Step 8
- Steps 10-13 depend on Step 9
- Steps 14-15 depend on Step 13
- Step 16 depends on Step 15
- Steps 17-20 depend on Step 16
- Step 21 depends on Step 20
- Step 22 depends on Step 21

---

## 9. TEST FLOW - 22 Deterministic Steps

### PHASE 1 - Create Student And First Submission

#### STEP 01 - [ADMIN] Add Student

```text
Role: Admin
Precondition:
  - Admin session is authenticated

Action:
  1. Go to /intern/admin/management
  2. Click "เพิ่มนักศึกษา" or "Add Student"
  3. Enter:
     - email: student@test.com
  4. Save / Confirm

Verify:
  - Student appears in the management list
  - A success message indicates the default password is `1234`
  - The generated student row appears even if the displayed Thai name is random at this stage
  - Relevant save/create request returns HTTP 200 or 201 if observable

PASS:
  - Student row exists and create action succeeded with default password `1234`

FAIL:
  - Create action errors
  - Student row does not appear
  - Visible duplicate/conflict prevents account creation
```

#### STEP 02 - [STUDENT] Login

```text
Role: Student
Precondition:
  - Step 01 passed

Action:
  1. Open the login page in Student session
  2. Accept the Terms of Service if the modal or consent gate appears
  3. Login with:
     - email: student@test.com
     - password: 1234

Verify:
  - Redirect lands on /intern/student or equivalent student dashboard
  - Student dashboard is visible
  - Login request returns HTTP 200 or equivalent success if observable

PASS:
  - Student can log in and reaches the dashboard

FAIL:
  - Authentication fails
  - Wrong redirect
  - Student dashboard is inaccessible after login
```

#### STEP 03 - [STUDENT] Fill Personal Info

```text
Role: Student
Precondition:
  - Step 02 passed

Action:
  1. Open the internship form used by the student flow
  2. Fill all required fields using:
     - prefix: นาย
     - firstNameTh: สมชาย
     - lastNameTh: ใจดี
     - gender: ชาย
     - dob: 2004-06-15
     - phoneNumber: 0812345678
     - emergencyPhone: 0891111111
     - contactAddress: 123 ถนนห้วยแก้ว อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่
     - guardianName: สมพร ใจดี
     - guardianRelationship: มารดา
     - educationLevel: ปริญญาตรี
     - institution: มหาวิทยาลัยเชียงใหม่
     - faculty: คณะพยาบาลศาสตร์
     - major: การพยาบาล
     - advisorName: อาจารย์ ทดสอบ
     - advisorPhone: 0812222222
     - position: Software Engineer Intern
     - department: Engineering
     - company: บริษัท ทดสอบ จำกัด
     - supervisorName: วิชัย ผู้ดูแล
     - startDate: 2026-06-01
     - endDate: 2026-08-31
  3. Upload a profile picture if the current form requires one before submission
  4. Save or keep the data ready for submit according to the real UI flow

Verify:
  - The form shows no blocking validation error for required fields
  - The entered values remain present in the UI before final submit
  - If the form saves immediately, record the save request status
  - If the form saves only on submit, record that this step completed by preparing valid input data

PASS:
  - All required fields are populated with the exact values above and the form is ready to submit

FAIL:
  - Required fields cannot be completed
  - Validation blocks required fields unexpectedly
  - Entered values disappear or differ before submit
```

#### STEP 04 - [STUDENT] Submit First Round

```text
Role: Student
Precondition:
  - Step 03 passed

Action:
  1. Upload 4 valid attachments for the internship submission
  2. Record the upload order as:
     - Document #1
     - Document #2
     - Document #3
     - Document #4
  3. If the UI still requires a profile picture, ensure it is attached
  4. Click "ส่งเอกสาร" or "Submit"
  5. Confirm submission

Verify:
  - Status changes to Pending Review or equivalent
  - Submit request returns HTTP 200/201 if observable

PASS:
  - Submission completes and review status is visible

FAIL:
  - Submit action errors
  - Required uploads are impossible
  - Status does not change
```

### PHASE 2 - Admin Review Round 1 And Request Edit

#### STEP 05 - [ADMIN] Flag Fields And Enter Reasons

```text
Role: Admin
Precondition:
  - Step 04 passed

Action:
  1. Go to /intern/admin
  2. Open the application belonging to `student@test.com`
  3. Flag field `phoneNumber` with reason:
     - กรุณากรอกเบอร์ให้ครบ 10 หลัก
  4. Flag field `department` with reason:
     - กรุณาระบุชื่อหน่วยงานให้ชัดเจน

Verify:
  - Both fields show flagged state or review marker
  - Both reasons are saved and still visible after refresh if possible
  - Relevant save request returns HTTP 200/201 if observable

PASS:
  - Two flagged fields and their reasons are persisted

FAIL:
  - Flagging fails
  - Reasons do not persist
```

#### STEP 06 - [ADMIN] Request Edit

```text
Role: Admin
Precondition:
  - Step 05 passed

Action:
  1. Click "ส่งกลับ", "Request Edit", or closest equivalent
  2. Confirm

Verify:
  - Student overall status changes to Rejected or equivalent sent-back state
  - Notification result is recorded using the notification policy
  - Status-change request returns HTTP 200/201 if observable

PASS:
  - Status changes correctly

FAIL:
  - Status does not change
  - Request edit action errors
```

### PHASE 3 - Student Fixes Fields, Resubmits, Admin Approves Personal Info

#### STEP 07 - [STUDENT] Fix Flagged Fields

```text
Role: Student
Precondition:
  - Step 06 passed

Action:
  1. Open /intern/student
  2. Review flagged fields and reasons
  3. Update:
     - phoneNumber: 0899999999
     - department: Engineering Team A
  4. Save

Verify:
  - New values are persisted
  - Review indicator is updated to fixed/edited/resolved or closest equivalent
  - Save request returns HTTP 200/201 if observable

PASS:
  - Corrected values are saved and visibly linked to the flagged fields

FAIL:
  - Values cannot be edited
  - Save fails
  - Old values remain
```

#### STEP 08 - [STUDENT] Resubmit Round 2

```text
Role: Student
Precondition:
  - Step 07 passed

Action:
  1. Click "ส่งใหม่" or "Resubmit"
  2. Confirm

Verify:
  - Status returns to Pending Review or equivalent
  - Resubmit request returns HTTP 200/201 if observable

PASS:
  - Resubmission succeeds

FAIL:
  - Resubmit action errors
  - Status does not change
```

#### STEP 09 - [ADMIN] Approve Personal Info And Unlock Document Review

```text
Role: Admin
Precondition:
  - Step 08 passed

Action:
  1. Open Admin dashboard
  2. Open the application belonging to `student@test.com`
  3. Review the corrected personal info
  4. Click "ยืนยันข้อมูล" or the closest equivalent action that moves the drawer from personal info to document review

Verify:
  - The document review section becomes available in the admin drawer
  - The current application remains reviewable without requiring a status change yet

PASS:
  - Admin can proceed to document review

FAIL:
  - Transition to the document review UI fails
  - Document review remains locked
```

### PHASE 4 - Document Review: Reject 1, Approve 2, Skip 1

#### STEP 10 - [ADMIN] Reject Document #1

```text
Role: Admin
Precondition:
  - Step 09 passed
  - Four document slots are visible

Action:
  1. Open Document #1 mapped as Resume
  2. Click "Reject"
  3. Enter reason:
     - Resume ไม่ครบถ้วน กรุณาเพิ่มประสบการณ์
  4. Confirm

Verify:
  - Document #1 status becomes Rejected
  - Reject reason is visible

PASS:
  - Document #1 is rejected with the exact reason saved

FAIL:
  - Status does not change
  - Reason is missing
```

#### STEP 11 - [ADMIN] Approve Document #2 And #3

```text
Role: Admin
Precondition:
  - Step 10 passed

Action:
  1. Open Document #2 and click Approve
  2. Open Document #3 and click Approve

Verify:
  - Document #2 status is Approved
  - Document #3 status is Approved

PASS:
  - Both documents are approved

FAIL:
  - Either document cannot be approved
  - Final status is incorrect
```

#### STEP 12 - [ADMIN] Leave Document #4 Pending

```text
Role: Admin
Precondition:
  - Step 11 passed

Action:
  1. Observe Document #4
  2. Do not approve or reject it

Verify:
  - Document #4 remains Pending
  - The system still allows the admin to continue to "send back documents"

PASS:
  - Document #4 stays Pending and does not block send-back

FAIL:
  - Document #4 auto-changes unexpectedly
  - System blocks send-back only because Document #4 is still Pending
```

#### STEP 13 - [ADMIN] Send Back Documents Round 2

```text
Role: Admin
Precondition:
  - Step 12 passed

Action:
  1. Click "ส่งกลับเอกสาร" or closest equivalent
  2. Confirm

Verify:
  - Student overall internship status becomes Rejected or equivalent sent-back state
  - Student-visible feedback shows that Document #1 was rejected with its reason

PASS:
  - Send-back succeeds and feedback becomes visible to the student

FAIL:
  - Send-back action errors
  - Student-facing feedback is missing
```

### PHASE 5 - Student Fixes Document, Admin Approves All

#### STEP 14 - [STUDENT] Review Document Statuses

```text
Role: Student
Precondition:
  - Step 13 passed

Action:
  1. Login or return to /intern/student
  2. Open document management
  3. Review all 4 document statuses

Verify:
  - Document #1 is Rejected and shows the reject reason
  - Document #2 is Approved
  - Document #3 is Approved
  - Document #4 is Pending
  - Approved documents are locked or non-editable if the UI supports lock state

PASS:
  - Student sees the exact review outcomes for all four documents

FAIL:
  - Any status is incorrect
  - Reject reason is missing for Document #1
```

#### STEP 15 - [STUDENT] Re-upload Document #1 And Resubmit Documents

```text
Role: Student
Precondition:
  - Step 14 passed

Action:
  1. Upload a replacement file for Document #1
  2. Keep the other accepted files as-is if the UI supports keeping uploaded files
  3. Click the normal submit/resubmit action for the internship form

Verify:
  - Document #1 status becomes Pending Review
  - Document #4 remains Pending

PASS:
  - Replacement upload succeeds and statuses update correctly

FAIL:
  - Upload fails
  - Statuses update incorrectly
```

#### STEP 16 - [ADMIN] Approve Remaining Documents And Approve Internship

```text
Role: Admin
Precondition:
  - Step 15 passed

Action:
  1. Open the application belonging to `student@test.com`
  2. Approve Document #1
  3. Approve Document #4
  4. Click "ยอมรับเข้าฝึกงาน", "Approve Internship", or closest equivalent
  5. Confirm

Verify:
  - Student overall status becomes Approved or equivalent active internship state
  - All 4 documents are no longer pending at the moment of approval

PASS:
  - All remaining approvals complete and student reaches Approved status

FAIL:
  - Any approval fails
  - Final student status is not Approved
```

### PHASE 6 - Revision Review: Reject Once, Accept Once

#### STEP 17 - [STUDENT] Submit Revision Round 1

```text
Role: Student
Precondition:
  - Step 16 passed

Action:
  1. Open /intern/student while status is Approved
  2. Edit supervisorName from:
     - current: วิชัย ผู้ดูแล
     - new: มนัส ผู้ดูแล
  3. Submit the revision

Verify:
  - Revision changes the overall internship status from Approved to Edit Requested or equivalent review state
  - Admin can see a pending revision for this student

PASS:
  - Revision submission succeeds and is visible to admin

FAIL:
  - Revision submit is unavailable when it should be allowed
  - Revision is not visible to admin
```

#### STEP 18 - [ADMIN] Reject Revision Round 1 And Verify Rollback

```text
Role: Admin
Precondition:
  - Step 17 passed

Action:
  1. Open the student's revision review page
  2. Click "ยกเลิกการแก้ไข" or the closest equivalent rollback action
  3. Confirm

VERIFY:
  - Compare the supervisorName value before and after reject
  - Expected post-reject value:
    - supervisorName: วิชัย ผู้ดูแล

PASS:
  - Revision is cancelled and the visible/current value rolls back to วิชัย ผู้ดูแล

FAIL:
  - Value remains มนัส ผู้ดูแล
  - Reject action succeeds but rollback does not happen
```

#### STEP 19 - [STUDENT] Submit Revision Round 2

```text
Role: Student
Precondition:
  - Step 18 passed

Action:
  1. Edit supervisorName again to:
     - สุเมธ ผู้ดูแล
  2. Submit the revision

Verify:
  - Admin can see a second pending revision

PASS:
  - Second revision submission succeeds

FAIL:
  - Submit fails
  - Admin cannot see the new revision
```

#### STEP 20 - [ADMIN] Accept Revision Round 2 And Verify Update

```text
Role: Admin
Precondition:
  - Step 19 passed

Action:
  1. Open the student's revision review page
  2. Click "ยอมรับการแก้ไข" or closest equivalent
  3. Confirm

VERIFY:
  - Compare the supervisorName value before and after accept
  - Expected final value:
    - supervisorName: สุเมธ ผู้ดูแล

PASS:
  - Revision is accepted and the current value becomes สุเมธ ผู้ดูแล

FAIL:
  - Value remains วิชัย ผู้ดูแล
  - Accept action succeeds but data is not updated
```

### PHASE 7 - Complete Internship

#### STEP 21 - [ADMIN] Complete Internship

```text
Role: Admin
Precondition:
  - Step 20 passed

Action:
  1. Go to /intern/admin
  2. Find the application belonging to `student@test.com` with status Approved
  3. Open the student detail
  4. Click "สำเร็จการฝึกงาน" or "Complete Internship"
  5. Enter the full name in one confirmation field:
     - สมชาย ใจดี
  6. Confirm

Verify:
  - Confirmation form/dialog appears
  - Student status changes to Complete or equivalent

PASS:
  - Completion confirmation succeeds and final status becomes Complete

FAIL:
  - Completion action unavailable
  - Full-name confirmation fails
  - Final status does not change
```

#### STEP 22 - [ADMIN + STUDENT] Final Verification

```text
Role: Admin and Student
Precondition:
  - Step 21 passed

Action:
  1. Admin checks the student list in /intern/admin
  2. Student checks their own dashboard in /intern/student
  3. Admin checks /intern/admin/activities

Verify:
  - Admin sees student status Complete
  - Student sees own status Complete
  - Activity log contains the major actions from this flow in chronological order, as far as the UI exposes them

PASS:
  - Both roles see Complete and activity history is present

FAIL:
  - Status differs between roles
  - Activity history is missing or clearly incomplete
```

---

## 10. Step Result Format

For every step, log exactly:

```text
[STEP XX] PASS | FAIL | SKIP (BLOCKED)
Role:
Action taken:
Observed UI result:
Observed HTTP status:
Observed data/status value:
Notification:
Notes:
```

Guidelines:

- `Observed HTTP status` may contain multiple statuses if needed
- If not observable, write `NOT OBSERVABLE`
- `Observed data/status value` must include the exact value for status or field verification when relevant

---

## 11. Final Report Format

After all 22 steps, produce this report:

```text
====================================
TEST REPORT - ระบบฝึกงานนักศึกษา
====================================
Run date: [ISO datetime]
Total steps: 22
PASS: X
FAIL: X
SKIP: X

STEP RESULTS:
[01] ...
[02] ...
...
[22] ...

BUGS FOUND:
- STEP XX: [short bug title]
  Expected: ...
  Actual: ...
  Evidence: UI / HTTP / DB / Notification

ENVIRONMENT NOTES:
- [missing observability, account issue, label mapping, etc.]

FINAL RESULT: PASS | FAIL
====================================
```

`FINAL RESULT` must be:

- `PASS` only if all non-blocked steps pass
- `FAIL` if any executed step fails

---

## 12. Agent Command Summary

- Follow the 22 steps exactly
- Keep Admin and Student sessions isolated
- Prefer UI-driven testing with observed network evidence
- Record exact values for all status and revision checks
- Do not invent missing evidence
- If the environment differs, document the difference and continue where possible
