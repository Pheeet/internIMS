"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import type { AdminInternshipFormValues } from "@/lib/schemas/admin-internship.schema";
import { Prisma } from "@/src/generated/prisma/client";

// Update internship status directly
export async function updateInternshipStatus(
  internshipId: string,
  newStatus: "PENDING" | "REJECTED" | "APPROVED" | "EDIT_REQUESTED" | "COMPLETED",
  remarks?: string
) {
  const session = await getSession();
  if (!session?.user?.email) return { success: false, error: "Unauthorized" };

  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!adminUser) return { success: false, error: "Unauthorized" };

  try {
    // Fetch current internship to get old status
    const currentInternship = await prisma.internship.findUnique({
      where: { id: internshipId },
    });

    if (!currentInternship) {
      return { success: false, error: "Internship not found" };
    }

    const oldStatus = currentInternship.status;

    const internship = await prisma.internship.update({
      where: { id: internshipId },
      data: {
        status: newStatus as any,
        remarks: remarks || null,
        // Clear snapshot when approved so future re-reviews start fresh
        ...(newStatus === "APPROVED" && { previousSnapshot: Prisma.DbNull }),
      },
    });

    await prisma.auditLog.create({
      data: {
        actionBy: adminUser.id,
        actionType: "STATUS_CHANGED",
        resourceType: "INTERNSHIP",
        resourceId: internshipId,
        targetUserId: internship.studentId,
        oldValue: oldStatus,
        newValue: newStatus,
        description: `แอดมินเปลี่ยนสถานะจาก ${oldStatus} เป็น ${newStatus}${remarks ? ` (หมายเหตุ: ${remarks})` : ""}`,
      },
    });


    revalidatePath("/intern/admin/internships");
    revalidatePath("/intern/admin");
    revalidatePath("/intern/student");
    revalidatePath("/api/student/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update status:", error);
    return { success: false, error: error.message };
  }
}

// Update both StudentProfile and Internship info from the admin drawer
export async function updateStudentAndInternshipInfo(
  _unused: string,
  internshipId: string | null,
  data: AdminInternshipFormValues
) {
  if (!internshipId) {
    return { success: false, error: "Missing internshipId" };
  }
  try {
    const internshipRef = await prisma.internship.findUnique({ where: { id: internshipId }, select: { studentId: true } });
    if (!internshipRef) {
      return { success: false, error: `ไม่พบข้อมูลการฝึกงาน (id: ${internshipId})` };
    }
    const studentProfileUserId = internshipRef.studentId;
    const existing = await prisma.studentProfile.findFirst({ where: { userId: studentProfileUserId } });
    if (!existing) {
      return { success: false, error: `ไม่พบข้อมูลนักศึกษา (userId: ${studentProfileUserId})` };
    }
    await prisma.studentProfile.update({
      where: { userId: studentProfileUserId },
      data: {
        prefix: data.prefix,
        firstNameTh: data.firstNameTh,
        lastNameTh: data.lastNameTh,
        gender: data.gender,
        dob: data.dob ? new Date(data.dob) : undefined,
        phoneNumber: data.phoneNumber,
        contactAddress: data.contactAddress,
        emergencyPhone: data.emergencyPhone,
        guardianName: data.guardianName,
        guardianRelationship: data.guardianRelationship,
        educationLevel: data.educationLevel,
        institution: data.institution,
        faculty: data.faculty,
        major: data.major,
        advisorName: data.advisorName,
        advisorPhone: data.advisorPhone,
      },
    });

    await prisma.internship.update({
      where: { id: internshipId },
      data: {
        position: data.position,
        department: data.department,
        company: data.company,
        supervisorName: data.supervisorName,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        remarks: data.remarks,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("[updateStudentAndInternshipInfo] Save failed:", error);
    return { success: false, error: error?.message || "Failed to update" };
  }
}

// Manually revert a COMPLETED internship back to APPROVED (e.g. extension granted)
export async function manualRevertToApproved(internshipId: string) {
  try {
    await prisma.internship.update({
      where: { id: internshipId },
      data: { status: "APPROVED" },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to revert" };
  }
}

// Revert EDIT_REQUESTED changes using previousSnapshot and set status back to APPROVED.
export async function revertEditRequestedToApproved(internshipId: string) {
  const session = await getSession();
  if (!session?.user?.email) return { success: false, error: "Unauthorized" };

  try {
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!adminUser) return { success: false, error: "Unauthorized" };

    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        student: {
          include: {
            studentProfile: true,
          },
        },
      },
    });

    if (!internship) {
      return { success: false, error: "ไม่พบข้อมูลการฝึกงาน" };
    }

    if (internship.status !== "EDIT_REQUESTED") {
      return { success: false, error: "สถานะปัจจุบันไม่ใช่รอตรวจสอบการแก้ไข" };
    }

    const profile = internship.student?.studentProfile;
    if (!profile) {
      return { success: false, error: "ไม่พบข้อมูลโปรไฟล์นักศึกษา" };
    }

    const snapshot = (internship.previousSnapshot ?? null) as Record<string, unknown> | null;
    if (!snapshot) {
      return { success: false, error: "ไม่พบข้อมูล snapshot สำหรับการย้อนกลับ" };
    }

    const hasKey = (key: string) => Object.prototype.hasOwnProperty.call(snapshot, key);
    const strOrNull = (value: unknown): string | null => {
      if (value === null || value === undefined) return null;
      return String(value);
    };
    const dateOrNull = (value: unknown): Date | null => {
      if (!value) return null;
      const d = new Date(String(value));
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const nextProfile = {
      prefix: hasKey("prefix") ? (strOrNull(snapshot.prefix) ?? profile.prefix) : profile.prefix,
      firstNameTh: hasKey("firstNameTh") ? (strOrNull(snapshot.firstNameTh) ?? profile.firstNameTh) : profile.firstNameTh,
      lastNameTh: hasKey("lastNameTh") ? (strOrNull(snapshot.lastNameTh) ?? profile.lastNameTh) : profile.lastNameTh,
      gender: hasKey("gender") ? strOrNull(snapshot.gender) : profile.gender,
      dob: hasKey("dob") ? dateOrNull(snapshot.dob) : profile.dob,
      phoneNumber: hasKey("phoneNumber") ? strOrNull(snapshot.phoneNumber) : profile.phoneNumber,
      emergencyPhone: hasKey("emergencyPhone") ? strOrNull(snapshot.emergencyPhone) : profile.emergencyPhone,
      contactAddress: hasKey("contactAddress") ? strOrNull(snapshot.contactAddress) : profile.contactAddress,
      guardianName: hasKey("guardianName") ? strOrNull(snapshot.guardianName) : profile.guardianName,
      guardianRelationship: hasKey("guardianRelationship") ? strOrNull(snapshot.guardianRelationship) : profile.guardianRelationship,
      educationLevel: hasKey("educationLevel") ? strOrNull(snapshot.educationLevel) : profile.educationLevel,
      institution: hasKey("institution") ? strOrNull(snapshot.institution) : profile.institution,
      faculty: hasKey("faculty") ? strOrNull(snapshot.faculty) : profile.faculty,
      major: hasKey("major") ? strOrNull(snapshot.major) : profile.major,
      advisorName: hasKey("advisorName") ? strOrNull(snapshot.advisorName) : profile.advisorName,
      advisorPhone: hasKey("advisorPhone") ? strOrNull(snapshot.advisorPhone) : profile.advisorPhone,
    };

    const nextInternship = {
      position: hasKey("position") ? (strOrNull(snapshot.position) ?? internship.position) : internship.position,
      department: hasKey("department") ? strOrNull(snapshot.department) : internship.department,
      company: hasKey("company") ? strOrNull(snapshot.company) : internship.company,
      supervisorName: hasKey("supervisorName") ? strOrNull(snapshot.supervisorName) : internship.supervisorName,
      startDate: hasKey("startDate") ? (dateOrNull(snapshot.startDate) ?? internship.startDate) : internship.startDate,
      endDate: hasKey("endDate") ? (dateOrNull(snapshot.endDate) ?? internship.endDate) : internship.endDate,
      remarks: hasKey("remarks") ? strOrNull(snapshot.remarks) : internship.remarks,
    };

    const attachmentSnapshots = (snapshot.attachmentStatuses ?? []) as { id: string; status: string }[];
    const currentAttachments = await prisma.attachment.findMany({
      where: { internshipId },
    });

    const attachmentUpdates = currentAttachments.map((a) => {
      const snap = attachmentSnapshots.find((s) => s.id === a.id);
      return prisma.attachment.update({
        where: { id: a.id },
        data: {
          status: snap ? (snap.status as any) : "REJECTED",
          rejectReason: snap ? a.rejectReason : "เอกสารถูกยกเลิกเนื่องจากการย้อนคืนการแก้ไขข้อมูล",
        },
      });
    });

    await prisma.$transaction([
      ...attachmentUpdates,
      prisma.studentProfile.update({
        where: { userId: internship.studentId },
        data: nextProfile,
      }),
      prisma.internship.update({
        where: { id: internshipId },
        data: {
          ...nextInternship,
          status: "APPROVED",
          remarks: null,
          flaggedFields: Prisma.DbNull,
          previousSnapshot: Prisma.DbNull,
          updatedBy: adminUser.id,
        },
      }),
      prisma.auditLog.create({
        data: {
          actionBy: adminUser.id,
          actionType: "STATUS_CHANGED",
          resourceType: "INTERNSHIP",
          resourceId: internshipId,
          targetUserId: internship.studentId,
          oldValue: "EDIT_REQUESTED",
          newValue: "APPROVED",
          description: "แอดมินยกเลิกการแก้ไข (ย้อนข้อมูลจาก snapshot) และเปลี่ยนสถานะกลับเป็น APPROVED พร้อมจัดการสถานะเอกสาร",
        },
      }),
    ]);

    revalidatePath("/intern/admin/internships");
    revalidatePath("/intern/admin");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to revert EDIT_REQUESTED to APPROVED:", error);
    return { success: false, error: error?.message || "ไม่สามารถย้อนข้อมูลได้" };
  }
}

// ─── Persist admin-flagged fields during review ───────────────────────────────
export async function saveFlaggedFields(
  internshipId: string,
  flaggedFields: Record<string, { flagged: boolean; reason: string }>
) {
  try {
    await prisma.internship.update({
      where: { id: internshipId },
      data: { flaggedFields: flaggedFields as any },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to save flags" };
  }
}

// ─── Post-approve edit with audit log ────────────────────────────────────────
// Only called when status === "APPROVED". Diffs old vs new, saves, and writes AuditLog.
export async function updateApprovedStudentInfo(
  _unused: string,
  internshipId: string,
  data: AdminInternshipFormValues
) {
  const session = await getSession();
  if (!session?.user?.email) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!adminUser) {
      return { success: false, error: "Unauthorized" };
    }

    // --- Resolve studentId from internshipId ---
    const internshipRef = await prisma.internship.findUnique({ where: { id: internshipId }, select: { studentId: true } });
    if (!internshipRef) {
      return { success: false, error: `ไม่พบข้อมูลการฝึกงาน (id: ${internshipId})` };
    }
    const studentProfileUserId = internshipRef.studentId;
    // --- Fetch current values for diffing ---
    const currentProfile = await prisma.studentProfile.findFirst({
      where: { userId: studentProfileUserId },
    });
    if (!currentProfile) {
      return { success: false, error: `ไม่พบข้อมูลนักศึกษา (userId: ${studentProfileUserId})` };
    }
    const currentInternship = await prisma.internship.findFirst({
      where: { id: internshipId },
    });

    // --- Build changes array (only changed fields) ---
    const changes: { field: string; oldValue: string; newValue: string }[] = [];
    const profileFields: Array<[keyof typeof currentProfile, keyof AdminInternshipFormValues, string]> = [
      ["prefix", "prefix", "คำนำหน้า"],
      ["firstNameTh", "firstNameTh", "ชื่อ"],
      ["lastNameTh", "lastNameTh", "นามสกุล"],
      ["gender", "gender", "เพศ"],
      ["phoneNumber", "phoneNumber", "เบอร์โทรศัพท์"],
      ["contactAddress", "contactAddress", "ที่อยู่"],
      ["emergencyPhone", "emergencyPhone", "เบอร์ผู้ปกครอง"],
      ["guardianName", "guardianName", "ชื่อผู้ปกครอง"],
      ["guardianRelationship", "guardianRelationship", "ความสัมพันธ์"],
      ["educationLevel", "educationLevel", "ระดับการศึกษา"],
      ["institution", "institution", "สถาบัน"],
      ["faculty", "faculty", "คณะ"],
      ["major", "major", "สาขา"],
      ["advisorName", "advisorName", "อาจารย์ที่ปรึกษา"],
      ["advisorPhone", "advisorPhone", "เบอร์อาจารย์ที่ปรึกษา"],
    ];
    for (const [dbKey, formKey, label] of profileFields) {
      const oldVal = String(currentProfile[dbKey] ?? "");
      const newVal = String((data as any)[formKey] ?? "");
      if (oldVal !== newVal) changes.push({ field: label, oldValue: oldVal, newValue: newVal });
    }
    if (currentInternship) {
      const internFields: Array<[keyof typeof currentInternship, keyof AdminInternshipFormValues, string]> = [
        ["position", "position", "ตำแหน่ง"],
        ["department", "department", "หน่วยงาน"],
        ["company", "company", "บริษัท"],
        ["supervisorName", "supervisorName", "ผู้ดูแล"],
        ["remarks", "remarks", "หมายเหตุ"],
      ];
      for (const [dbKey, formKey, label] of internFields) {
        const oldVal = String((currentInternship as any)[dbKey] ?? "");
        const newVal = String((data as any)[formKey] ?? "");
        if (oldVal !== newVal) changes.push({ field: label, oldValue: oldVal, newValue: newVal });
      }
      // Date fields
      const oldStart = currentInternship.startDate ? new Date(currentInternship.startDate).toISOString().split("T")[0] : "";
      const newStart = data.startDate || "";
      if (oldStart !== newStart) changes.push({ field: "วันเริ่มฝึกงาน", oldValue: oldStart, newValue: newStart });
      const oldEnd = currentInternship.endDate ? new Date(currentInternship.endDate).toISOString().split("T")[0] : "";
      const newEnd = data.endDate || "";
      if (oldEnd !== newEnd) changes.push({ field: "วันสิ้นสุดฝึกงาน", oldValue: oldEnd, newValue: newEnd });
    }

    if (changes.length === 0) return { success: true, changes: [] };

    // --- Save updates ---
    await prisma.studentProfile.update({
      where: { userId: studentProfileUserId },
      data: {
        prefix: data.prefix,
        firstNameTh: data.firstNameTh,
        lastNameTh: data.lastNameTh,
        gender: data.gender,
        dob: data.dob ? new Date(data.dob) : undefined,
        phoneNumber: data.phoneNumber,
        contactAddress: data.contactAddress,
        emergencyPhone: data.emergencyPhone,
        guardianName: data.guardianName,
        guardianRelationship: data.guardianRelationship,
        educationLevel: data.educationLevel,
        institution: data.institution,
        faculty: data.faculty,
        major: data.major,
        advisorName: data.advisorName,
        advisorPhone: data.advisorPhone,
      },
    });
    await prisma.internship.update({
      where: { id: internshipId },
      data: {
        position: data.position,
        department: data.department,
        company: data.company,
        supervisorName: data.supervisorName,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        remarks: data.remarks,
      },
    });

    // --- Write audit log ---
    await prisma.auditLog.create({
      data: {
        actionBy: adminUser.id,
        actionType: "UPDATE_INFO",
        resourceType: "INTERNSHIP",
        resourceId: internshipId,
        targetUserId: studentProfileUserId,
        oldValue: JSON.stringify(changes.map((c) => ({ field: c.field, value: c.oldValue }))),
        newValue: JSON.stringify(changes.map((c) => ({ field: c.field, value: c.newValue }))),
        description: `Admin แก้ไขข้อมูลนักศึกษา ${changes.length} ช่อง`,
      },
    });

    return { success: true, changes };
  } catch (error: any) {
    console.error("[updateApprovedStudentInfo] failed:", error);
    return { success: false, error: error?.message || "Failed to update" };
  }
}
