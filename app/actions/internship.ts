"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

import { resend } from "@/lib/resend";
import { InternshipSubmittedEmail } from "@/emails/internship-submitted";
import { InternshipChangeRequestedEmail } from "@/emails/internship-change-requested";
import { Prisma } from "@/src/generated/prisma/client";

async function sendInternshipNotificationEmail(
  internshipId: string,
  isChangeRequest: boolean
) {
  try {
    console.log("[NOTIFY][internship] start", { internshipId, isChangeRequest });

    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        student: {
          include: { studentProfile: true },
        },
      },
    });

    if (!internship?.student?.studentProfile) {
      console.warn("[DEBUG] Could not find internship or student profile for email:", internshipId);
      return;
    }

    const studentProfile = internship.student.studentProfile;
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    console.log("[NOTIFY][internship] env", {
      hasAdminNotificationEmail: Boolean(adminEmail),
      adminNotificationEmail: adminEmail || "<undefined>",
      resendFromEmail: fromEmail,
    });

    if (!adminEmail) {
      console.warn("[DEBUG] ADMIN_NOTIFICATION_EMAIL not configured");
      return;
    }

    const studentName = `${studentProfile.prefix} ${studentProfile.firstNameTh} ${studentProfile.lastNameTh}`;
    const studentEmail = internship.student.email;
    const faculty = studentProfile.faculty || "ไม่ระบุ";
    const major = studentProfile.major || "ไม่ระบุ";
    const position = internship.position || "ไม่ระบุ";
    const company = internship.company || internship.department || "ไม่ระบุ";

    if (isChangeRequest) {
      console.log("[NOTIFY][internship] sending change-request email", {
        internshipId,
        to: adminEmail,
        studentEmail,
      });

      const resendResult = await resend.emails.send({
        from: fromEmail,
        to: adminEmail,
        subject: "นักศึกษาขอแก้ไขข้อมูลฝึกงาน - การฝึกงาน",
        react: InternshipChangeRequestedEmail({
          studentName,
          studentEmail,
          faculty,
          major,
          position,
          company,
          flaggedFields: internship.flaggedFields as string[] | undefined,
          remarks: internship.remarks || undefined,
        }),
      });

      console.log("[NOTIFY][internship] resend success (change-request)", {
        internshipId,
        resendId: resendResult?.data?.id,
        resendError: resendResult?.error || null,
      });
      console.log("[DEBUG] Change request email sent for internship:", internshipId);
    } else {
      console.log("[NOTIFY][internship] sending submitted email", {
        internshipId,
        to: adminEmail,
        studentEmail,
      });

      const resendResult = await resend.emails.send({
        from: fromEmail,
        to: adminEmail,
        subject: "มีคำร้องฝึกงานใหม่รอการตรวจสอบ",
        react: InternshipSubmittedEmail({
          studentName,
          studentEmail,
          faculty,
          major,
          position,
          company,
        }),
      });

      console.log("[NOTIFY][internship] resend success (submitted)", {
        internshipId,
        resendId: resendResult?.data?.id,
        resendError: resendResult?.error || null,
      });
      console.log("[DEBUG] Internship submitted email sent for internship:", internshipId);
    }
  } catch (error) {
    console.error("[DEBUG] Failed to send internship notification email:", error);
    // Don't throw - email failure should not block the submission
  }
}
export async function submitInternshipApplication(
  _prevState: unknown,
  formData: FormData
) {
  const session = await getSession();

  if (!session?.user?.email) {
    return { success: false, error: "กรุณาเข้าสู่ระบบ" };
  }

  // Resolve real DB user from mock email
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser) {
    return { success: false, error: "ไม่พบผู้ใช้งานในระบบ" };
  }

  const userId = dbUser.id;

  const position = formData.get("position") as string;
  const department = formData.get("department") as string;
  const company = formData.get("company") as string;
  const supervisorName = formData.get("supervisorName") as string;
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;
  const remarks = formData.get("remarks") as string;

  // Education fields
  const educationLevel = formData.get("educationLevel") as string;
  const institution = formData.get("institution") as string;
  const faculty = formData.get("faculty") as string;
  const major = formData.get("major") as string;
  const advisorName = formData.get("advisorName") as string;
  const advisorPhone = formData.get("advisorPhone") as string;

  // Personal Info fields
  const prefix = formData.get("prefix") as string;
  const firstNameTh = formData.get("firstNameTh") as string;
  const lastNameTh = formData.get("lastNameTh") as string;
  const gender = formData.get("gender") as string;
  const dobStr = formData.get("dob") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const emergencyPhone = formData.get("emergencyPhone") as string;
  const contactAddress = formData.get("contactAddress") as string;
  const guardianName = formData.get("guardianName") as string;
  const guardianRelationship = formData.get("guardianRelationship") as string;
  const dob = dobStr ? new Date(dobStr) : undefined;

  const fields: Record<string, string[]> = {};
  // Personal info validation
  if (!prefix) fields.prefix = ["กรุณาเลือกคำนำหน้าชื่อ"];
  if (!firstNameTh) fields.firstNameTh = ["กรุณากรอกชื่อ"];
  if (!lastNameTh) fields.lastNameTh = ["กรุณากรอกนามสกุล"];
  if (!phoneNumber) fields.phoneNumber = ["กรุณากรอกเบอร์โทรศัพท์"];
  if (!emergencyPhone) fields.emergencyPhone = ["กรุณากรอกเบอร์โทรฉุกเฉิน"];
  if (!contactAddress) fields.contactAddress = ["กรุณากรอกที่อยู่"];
  if (!guardianName) fields.guardianName = ["กรุณากรอกชื่อผู้ปกครอง"];
  if (!guardianRelationship) fields.guardianRelationship = ["กรุณาระบุความสัมพันธ์"];
  if (!position) fields.position = ["กรุณาระบุตำแหน่ง"];
  if (!department) fields.department = ["กรุณาระบุหน่วยงาน"];
  if (!supervisorName) fields.supervisorName = ["กรุณาระบุชื่อผู้ดูแล"];
  if (!startDateStr) fields.startDate = ["กรุณาระบุวันที่เริ่ม"];
  if (!endDateStr) fields.endDate = ["กรุณาระบุวันที่สิ้นสุด"];

  // Education validation
  if (!educationLevel) fields.educationLevel = ["กรุณาระบุระดับการศึกษา"];
  if (!institution) fields.institution = ["กรุณาระบุสถาบันการศึกษา"];
  if (!faculty) fields.faculty = ["กรุณาระบุคณะ"];
  if (!major) fields.major = ["กรุณาระบุสาขาวิชา"];
  if (!advisorName) fields.advisorName = ["กรุณาระบุชื่ออาจารย์ที่ปรึกษา"];
  if (!advisorPhone) fields.advisorPhone = ["กรุณาระบุเบอร์โทรศัพท์อาจารย์ที่ปรึกษา"];

  if (Object.keys(fields).length > 0) {
    return { success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน", fields };
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (endDate <= startDate) {
    return {
      success: false,
      error: "วันที่สิ้นสุดต้องมาหลังวันที่เริ่ม",
      fields: { endDate: ["วันที่สิ้นสุดต้องมาหลังวันที่เริ่ม"] },
    };
  }

  // File Handling
  const attachments = formData.getAll("attachments") as File[];
  const profilePicture = formData.get("profilePicture") as File | null;

  async function saveFile(file: File, subDir: string) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadDir = path.join(process.cwd(), "public", "uploads", subDir);
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    
    let uniqueName: string;
    if (subDir === "profiles") {
      const ext = file.name.split(".").pop() || "jpg";
      uniqueName = `${userId}_${Date.now()}.${ext}`;
    } else {
      uniqueName = `${crypto.randomUUID()}-${file.name}`;
    }
    
    const filePath = path.join(uploadDir, uniqueName);
    await fs.writeFile(filePath, buffer);
    
    return `/uploads/${subDir}/${uniqueName}`;
  }

  async function deleteFile(fileUrl: string | null | undefined) {
    if (!fileUrl) return;
    try {
      const filePath = path.join(process.cwd(), "public", fileUrl);
      await fs.unlink(filePath);
    } catch (err) {
      console.error("Failed to delete file:", fileUrl, err);
    }
  }

  try {
    // Load existing internship/profile BEFORE any updates so snapshot compares old -> new correctly.
    const existing = await prisma.internship.findFirst({
      where: { studentId: userId },
      include: { student: { include: { studentProfile: true } } },
    });

    // Update education info on StudentProfile
    const currentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { profilePictureUrl: true }
    });

    const newProfilePic = profilePicture && profilePicture.size > 0 
      ? await saveFile(profilePicture, "profiles") 
      : undefined;

    if (newProfilePic && currentProfile?.profilePictureUrl) {
      await deleteFile(currentProfile.profilePictureUrl);
    }

    await prisma.studentProfile.update({
      where: { userId },
      data: {
        ...(educationLevel && { educationLevel }),
        ...(institution && { institution }),
        ...(faculty && { faculty }),
        ...(major && { major }),
        ...(advisorName !== null && { advisorName }),
        ...(advisorPhone !== null && { advisorPhone }),
        ...(newProfilePic && { profilePictureUrl: newProfilePic }),
        // Added Personal Info
        ...(prefix && { prefix }),
        ...(firstNameTh && { firstNameTh }),
        ...(lastNameTh && { lastNameTh }),
        ...(gender && { gender }),
        ...(dob && { dob }),
        ...(phoneNumber && { phoneNumber }),
        ...(emergencyPhone && { emergencyPhone }),
        ...(contactAddress && { contactAddress }),
        ...(guardianName !== null && { guardianName }),
        ...(guardianRelationship !== null && { guardianRelationship }),
      },
    });

    // Upsert internship
    if (existing) {
      // Allowed to resubmit if REJECTED, APPROVED, or EDIT_REQUESTED
      const allowedToEdit = ["REJECTED", "APPROVED", "EDIT_REQUESTED"];
      if (!allowedToEdit.includes(existing.status)) {
        return { success: false, error: "ไม่สามารถแก้ไขข้อมูลได้ เนื่องจากสถานะถูกล็อคแล้ว" };
      }

      // Build previousSnapshot from current internship + profile before overwriting
      const profile = existing.student?.studentProfile;
      const snapshot = {
        // Personal info
        prefix: profile?.prefix,
        firstNameTh: profile?.firstNameTh,
        lastNameTh: profile?.lastNameTh,
        gender: profile?.gender,
        dob: profile?.dob?.toISOString() ?? null,
        phoneNumber: profile?.phoneNumber,
        emergencyPhone: profile?.emergencyPhone,
        contactAddress: profile?.contactAddress,
        guardianName: profile?.guardianName,
        guardianRelationship: profile?.guardianRelationship,
        // Education info
        educationLevel: profile?.educationLevel,
        institution: profile?.institution,
        faculty: profile?.faculty,
        major: profile?.major,
        advisorName: profile?.advisorName,
        advisorPhone: profile?.advisorPhone,
        // Internship info
        position: existing.position,
        department: existing.department,
        company: existing.company,
        supervisorName: existing.supervisorName,
        startDate: existing.startDate?.toISOString() ?? null,
        endDate: existing.endDate?.toISOString() ?? null,
        remarks: existing.remarks,
      };

      let newStatus = existing.status;
      if (existing.status === "REJECTED") {
        newStatus = "PENDING";
      } else if (existing.status === "APPROVED") {
        newStatus = "EDIT_REQUESTED";
      } else if (existing.status === "EDIT_REQUESTED") {
        newStatus = "EDIT_REQUESTED";
      }

      await prisma.internship.update({
        where: { id: existing.id },
        data: {
          position, department, company, supervisorName, startDate, endDate,
          remarks: remarks || null,
          status: newStatus as any,
          flaggedFields: Prisma.JsonNull, // Clear old flags when resubmitting
          // Save snapshot when coming from a fixed state (REJECTED or APPROVED)
          ...((existing.status === "REJECTED" || existing.status === "APPROVED") && { previousSnapshot: snapshot }),
        },
      });

      // Resubmission should reopen previously rejected files for review.
      await prisma.attachment.updateMany({
        where: {
          internshipId: existing.id,
          status: "REJECTED",
        },
        data: {
          status: "PENDING",
          rejectReason: null,
        },
      });

      await prisma.auditLog.create({
        data: {
          actionBy: userId,
          actionType: "RESUBMIT",
          resourceType: "INTERNSHIP",
          resourceId: existing.id,
          targetUserId: userId,
          description: "นักศึกษาส่งแบบฟอร์มฝึกงานใหม่อีกครั้ง",
        },
      });
    } else {
      const created = await prisma.internship.create({
        data: { studentId: userId, position, department, company, supervisorName, startDate, endDate, remarks },
      });

      await prisma.auditLog.create({
        data: {
          actionBy: userId,
          actionType: "SUBMIT",
          resourceType: "INTERNSHIP",
          resourceId: created.id,
          targetUserId: userId,
          description: `นักศึกษาส่งแบบฟอร์มฝึกงาน ตำแหน่ง: ${position}`,
        },
      });
    }

    // Handle Attachments
    const keptFiles = formData.getAll("keptFiles") as string[];
        // Get the final internship ID and status for email sending
        const finalInternship = await prisma.internship.findFirst({
          where: { studentId: userId },
          orderBy: { createdAt: "desc" },
          select: { id: true, status: true },
        });
    const finalInternshipId = existing ? existing.id : (await prisma.internship.findFirst({
        where: { studentId: userId },
        orderBy: { createdAt: "desc" }
    }))?.id;

    if (finalInternshipId) {
      // Cleanup old attachments that were removed by the student
      if (existing) {
        // Send email notification based on status
        if (finalInternship) {
          const isChangeRequest = finalInternship.status === "EDIT_REQUESTED";
          console.log("[NOTIFY][internship] trigger", {
            internshipId: finalInternship.id,
            status: finalInternship.status,
            isChangeRequest,
          });
          await sendInternshipNotificationEmail(finalInternship.id, isChangeRequest);
        } else {
          console.warn("[NOTIFY][internship] trigger skipped: finalInternship not found", {
            userId,
          });
        }

        const oldAttachments = await prisma.attachment.findMany({
          where: { 
            internshipId: finalInternshipId,
            id: { notIn: keptFiles }
          }
        });
        
        for (const old of oldAttachments) {
          await deleteFile(old.fileUrl);
        }
        
        await prisma.attachment.deleteMany({
          where: { 
            internshipId: finalInternshipId,
            id: { notIn: keptFiles }
          }
        });
      }

      for (const file of attachments) {
        if (file.size === 0) continue;
        const fileUrl = await saveFile(file, "internships");
        await prisma.attachment.create({
          data: {
            studentId: userId,
            internshipId: finalInternshipId,
            fileName: file.name,
            fileUrl,
            fileType: file.type || path.extname(file.name).slice(1),
            fileSize: file.size,
          },
        });
      }
    }
    await prisma.user.update({
      where: { id: userId },
      data: { internship_submitted: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to submit internship:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }

  redirect("/intern/student");
}
