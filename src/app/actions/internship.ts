"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { replaceFileAtomically } from "@/lib/storage";

import { sendTelegramNotification } from "@/lib/telegram";
import { Prisma } from "@/src/generated/prisma/client";
import { studentInternshipSchema } from "@/lib/schemas/student-internship.schema";

async function sendInternshipTelegramNotification(
  internshipId: string,
  oldStatus: string | null,
  newStatus: string
) {
  try {
    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        student: {
          include: { studentProfile: true },
        },
      },
    });

    if (!internship?.student?.studentProfile) return;

    const profile = internship.student.studentProfile;
    const studentName = `${profile.prefix} ${profile.firstNameTh} ${profile.lastNameTh}`;
    const major = profile.major || "ไม่ระบุ";

    // Trigger 0: First Submit (null → PENDING)
    if (oldStatus === null && newStatus === "PENDING") {
      const message = `📨 <b>มีคำร้องฝึกงานใหม่</b>\n\nนักศึกษา: <b>${studentName}</b>\nสาขา: ${major}\nสถานะ: ส่งคำร้องครั้งแรก\n\nโปรดเข้าสู่ระบบเพื่อตรวจสอบ`;
      sendTelegramNotification(message);
    }
    // Trigger 1: REJECTED → PENDING
    else if (oldStatus === "REJECTED" && newStatus === "PENDING") {
      const message = `🔔 <b>นักศึกษาได้แก้ไขและส่งคำร้องฝึกงานใหม่</b>\n\nนักศึกษา: <b>${studentName}</b>\nสาขา: ${major}\nสถานะ: REJECTED → PENDING\n\nโปรดเข้าสู่ระบบเพื่อตรวจสอบ`;
      sendTelegramNotification(message);
    }
    // Trigger 2: APPROVED → EDIT_REQUESTED
    else if (oldStatus === "APPROVED" && newStatus === "EDIT_REQUESTED") {
      const message = `📝 <b>นักศึกษามีการแก้ไขเอกสารและส่งใหม่</b>\n\nนักศึกษา: <b>${studentName}</b>\nสาขา: ${major}\nสถานะ: APPROVED → EDIT_REQUESTED\n\nโปรดเข้าสู่ระบบเพื่อตรวจสอบ`;
      sendTelegramNotification(message);
    }
  } catch (error) {
    console.error("[TELEGRAM] Failed to send notification:", error);
  }
}
export async function submitInternshipApplication(
  _prevState: unknown,
  formData: FormData
) {
  console.log("DEBUG: submitInternshipApplication START");
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
  console.log("DEBUG: userId:", userId);

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

  // 1. Zod Validation for text fields
  const validationData = {
    prefix, firstNameTh, lastNameTh, phoneNumber, emergencyPhone, contactAddress,
    guardianName, guardianRelationship, educationLevel, institution, faculty, major,
    advisorName, advisorPhone, position, department, company, supervisorName,
    startDate: startDateStr, endDate: endDateStr, remarks
  };

  const result = studentInternshipSchema.safeParse(validationData);

  const fields: Record<string, string[]> = {};
  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const path = issue.path[0] as string;
      if (!fields[path]) fields[path] = [];
      fields[path].push(issue.message);
    });
  }

  // 2. Manual File Validation
  const profilePicture = formData.get("profilePicture") as File | null;
  const attachments = formData.getAll("attachments") as File[];
  const existing = await prisma.internship.findFirst({
    where: { studentId: userId },
    include: { student: { include: { studentProfile: true } } }
  });

  // Profile Picture Validation
  if (profilePicture && profilePicture.size > 0) {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(profilePicture.type)) {
      fields.profilePicture = ["กรุณาอัปโหลดไฟล์ภาพนามสกุล JPG หรือ PNG"];
    }
    if (profilePicture.size > 5 * 1024 * 1024) {
      fields.profilePicture = ["กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 5 MB"];
    }
  } else {
    // Check if user already has a profile picture in their profile record
    const userProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { profilePictureUrl: true }
    });
    if (!userProfile?.profilePictureUrl) {
      fields.profilePicture = ["กรุณาอัปโหลดรูปโปรไฟล์"];
    }
  }

  // Attachments Validation
  const keptFilesCount = (formData.getAll("keptFiles") as string[]).length;
  const newFiles = attachments.filter(f => f.size > 0);
  
  const totalFilesCount = keptFilesCount + newFiles.length;
  if (totalFilesCount === 0) {
    fields.attachments = ["กรุณาอัปโหลดเอกสารประกอบอย่างน้อย 1 ไฟล์"];
  } else if (totalFilesCount > 5) {
    fields.attachments = ["อัปโหลดเอกสารได้สูงสุด 5 ไฟล์เท่านั้น"];
  }

  const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
  for (const file of newFiles) {
    if (!allowedTypes.includes(file.type)) {
      fields.attachments = ["รองรับไฟล์ PDF, PNG และ JPG เท่านั้น"];
      break;
    }
    if (file.size > 5 * 1024 * 1024) {
      fields.attachments = ["กรุณาอัปโหลดไฟล์ขนาดไม่เกิน 5 MB ต่อไฟล์"];
      break;
    }
  }

  if (Object.keys(fields).length > 0) {
    return { success: false, error: "ข้อมูลไม่ถูกต้องตามรูปแบบที่กำหนด", fields };
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
  // (Variables already declared above at lines 127-128)

  try {
    // Load existing internship/profile BEFORE any updates so snapshot compares old -> new correctly.
    const existing = await prisma.internship.findFirst({
      where: { studentId: userId },
      include: {
        attachments: true,
        student: { include: { studentProfile: true } }
      },
    });
    console.log("DEBUG: existing found:", !!existing);

    // Atomic Profile Picture Update
    const performProfileUpdate = async (pUrl?: string) => {
      await prisma.studentProfile.update({
        where: { userId },
        data: {
          ...(educationLevel && { educationLevel }),
          ...(institution && { institution }),
          ...(faculty && { faculty }),
          ...(major && { major }),
          ...(advisorName !== null && { advisorName }),
          ...(advisorPhone !== null && { advisorPhone }),
          ...(pUrl && { profilePictureUrl: pUrl }),
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
    };

    if (profilePicture && profilePicture.size > 0) {
      const currentProfile = await prisma.studentProfile.findUnique({
        where: { userId },
        select: { profilePictureUrl: true }
      });
      await replaceFileAtomically(
        profilePicture,
        currentProfile?.profilePictureUrl,
        "profiles",
        performProfileUpdate
      );
    } else {
      await performProfileUpdate();
    }

    // Upsert internship
    if (existing) {
      // ... (keep the same logic for snapshot and update)
      // Allowed to resubmit if REJECTED, APPROVED, EDIT_REQUESTED, or PENDING
      const allowedToEdit = ["REJECTED", "APPROVED", "EDIT_REQUESTED", "PENDING"];
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
        attachmentStatuses: existing.attachments.map(a => ({ id: a.id, status: a.status })),
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
          oldValue: existing.status,
          newValue: newStatus,
          description: "นักศึกษามีการแก้ไขเอกสารและส่งใหม่",
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
    const finalInternshipId = existing ? existing.id : (await prisma.internship.findFirst({
      where: { studentId: userId },
      orderBy: { createdAt: "desc" }
    }))?.id;

    if (finalInternshipId) {
      if (existing) {
        // Find files to delete BEFORE deleting from DB
        const oldAttachments = await prisma.attachment.findMany({
          where: {
            internshipId: finalInternshipId,
            id: { notIn: keptFiles }
          }
        });

        await prisma.attachment.deleteMany({
          where: {
            internshipId: finalInternshipId,
            id: { notIn: keptFiles }
          }
        });

        // Delete from disk ONLY AFTER DB success
        for (const old of oldAttachments) {
          if (old.fileUrl) {
            const oldPath = path.join(process.cwd(), "public", old.fileUrl);
            try { await fs.unlink(oldPath); } catch (e) { console.error("Cleanup failed", e); }
          }
        }
      }

      for (const file of attachments) {
        if (file.size === 0) continue;

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const uploadDir = path.join(process.cwd(), "public", "uploads", "internships");
        await fs.mkdir(uploadDir, { recursive: true });
        const uniqueName = `${crypto.randomUUID()}-${file.name}`;
        const filePath = path.join(uploadDir, uniqueName);
        await fs.writeFile(filePath, buffer);
        const fileUrl = `/uploads/internships/${uniqueName}`;

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

      // Trigger Telegram Notification
      const finalInternship = await prisma.internship.findUnique({
        where: { id: finalInternshipId },
        select: { id: true, status: true },
      });
      if (finalInternship) {
        await sendInternshipTelegramNotification(
          finalInternship.id,
          existing?.status || null,
          finalInternship.status
        );
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
