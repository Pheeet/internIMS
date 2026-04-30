import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";


function mapStudentAction(actionType: string): string {
  const map: Record<string, string> = {
    SUBMIT: "คุณส่งแบบฟอร์มฝึกงานแล้ว",
    RESUBMIT: "คุณมีการแก้ไขเอกสารและส่งใหม่",
    SUBMIT_DOC: "คุณส่งเอกสารฝึกงาน",
    RE_UPLOAD_DOC: "คุณอัปโหลดเอกสารใหม่",
    DELETE_DOC: "มีการลบเอกสาร",
    APPROVE_DOC: "คำร้องของคุณได้รับอนุมัติ",
    REJECT_DOC: "คำร้องของคุณถูกตีกลับ",
    SUBMIT_LEAVE: "คุณยื่นใบลา",
    APPROVE_LEAVE: "ใบลาของคุณได้รับอนุมัติ",
    REJECT_LEAVE: "ใบลาของคุณไม่ผ่านการอนุมัติ",
    UPDATE_INFO: "คุณอัปเดตข้อมูลส่วนตัว",
    STATUS_CHANGED: "สถานะคำร้องของคุณเปลี่ยนแปลง",
    USER_ADDED: "บัญชีของคุณถูกสร้างในระบบ",
  };

  return map[actionType] ?? actionType;
}

function translateStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: "รอดำเนินการ",
    APPROVED: "อนุมัติ",
    REJECTED: "ถูกตีกลับ",
    EDIT_REQUESTED: "รอการแก้ไข",
    COMPLETED: "จบการฝึกงาน",
  };

  return map[status] ?? status;
}

function translateAuditDescription(description: string | null | undefined, actionType: string, newValue?: string | null): string {
  if (!description) {
    return mapStudentAction(actionType);
  }

  // Handle Thai status change description from admin action
  const statusChangeThaiMatch = description.match(/^แอดมินเปลี่ยนสถานะจาก (\w+) เป็น (\w+)(.*)$/);
  if (statusChangeThaiMatch) {
    const [_, oldStatus, newStatus, rest] = statusChangeThaiMatch;
    
    if (oldStatus === "PENDING" && newStatus === "APPROVED") {
      return `ยอมรับเข้าฝึกงาน${rest}`;
    }
    if (newStatus === "REJECTED") {
      return `เอกสารถูกตีกลับ${rest}`;
    }
  }

  const addedStudentMatch = description.match(/^Added new student: (.+)$/);
  if (addedStudentMatch) {
    return `เพิ่มนักศึกษาใหม่: ${addedStudentMatch[1]}`;
  }

  const addedAdminMatch = description.match(/^Added new admin: (.+)$/);
  if (addedAdminMatch) {
    return `เพิ่มผู้ดูแลระบบใหม่: ${addedAdminMatch[1]}`;
  }

  const deletedStudentMatch = description.match(/^Deleted student access for (.+)$/);
  if (deletedStudentMatch) {
    return `ลบสิทธิ์นักศึกษา: ${deletedStudentMatch[1]}`;
  }

  const revokedAdminMatch = description.match(/^Revoked admin access for (.+)$/);
  if (revokedAdminMatch) {
    return `ถอดสิทธิ์ผู้ดูแลระบบ: ${revokedAdminMatch[1]}`;
  }

  const statusChangedMatch = description.match(/^Status changed to: ([A-Z_]+)(.*)$/);
  if (statusChangedMatch) {
    const status = statusChangedMatch[1];
    const rest = statusChangedMatch[2];
    if (status === "APPROVED") return `ยอมรับเข้าฝึกงาน${rest}`;
    if (status === "REJECTED") return `เอกสารถูกตีกลับ${rest}`;
    return `เปลี่ยนสถานะเป็น: ${translateStatusLabel(status)}${rest}`;
  }

  let finalDesc = (description || "")
    .trim()
    .replace(/นักศึกษาขอแก้ไขข้อมูล/g, "นักศึกษามีการแก้ไขเอกสารและส่งใหม่")
    .replace(/คุณส่งแบบฟอร์มฝึกงานใหม่อีกครั้ง/g, "คุณมีการแก้ไขเอกสารและส่งใหม่")
    .replace(/^Admin แก้ไขข้อมูลนักศึกษา/, "ผู้ดูแลแก้ไขข้อมูลนักศึกษา")
    .replace(/\bPENDING\b/g, translateStatusLabel("PENDING"))
    .replace(/\bAPPROVED\b/g, translateStatusLabel("APPROVED"))
    .replace(/\bREJECTED\b/g, translateStatusLabel("REJECTED"))
    .replace(/\bEDIT_REQUESTED\b/g, translateStatusLabel("EDIT_REQUESTED"))
    .replace(/\bCOMPLETED\b/g, translateStatusLabel("COMPLETED"));

  // Prepend status if it's a status change but doesn't have the label yet
  if (actionType === "STATUS_CHANGED") {
    if (newValue === "REJECTED" && !finalDesc.startsWith("เอกสารถูกตีกลับ")) {
      finalDesc = `เอกสารถูกตีกลับ: ${finalDesc}`;
    } else if (newValue === "APPROVED" && !finalDesc.startsWith("ยอมรับเข้าฝึกงาน")) {
      finalDesc = `ยอมรับเข้าฝึกงาน: ${finalDesc}`;
    }
  }

  return finalDesc;
}

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true, email: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (dbUser.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [studentProfile, internship, activities] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId: dbUser.id },
      select: {
        firstNameTh: true,
        lastNameTh: true,
        phoneNumber: true,
        emergencyPhone: true,
        faculty: true,
        major: true,
        educationLevel: true,
        institution: true,
        guardianRelationship: true,
      },
    }),
    prisma.internship.findFirst({
      where: { studentId: dbUser.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        position: true,
        department: true,
        company: true,
        startDate: true,
        endDate: true,
        supervisorName: true,
        remarks: true,
        attachments: {
          select: {
            id: true,
            fileName: true,
            status: true,
            rejectReason: true,
          },
          orderBy: { uploadedAt: "desc" },
        },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [{ targetUserId: dbUser.id }, { actionBy: dbUser.id }],
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        actionType: true,
        description: true,
        oldValue: true,
        newValue: true,
        createdAt: true,
      },
    }),
  ]);


  const response = {
    profile: {
      firstName: studentProfile?.firstNameTh ?? "",
      lastName: studentProfile?.lastNameTh ?? "",
      phone: studentProfile?.phoneNumber ?? "",
      parentPhone: studentProfile?.emergencyPhone ?? "",
      faculty: studentProfile?.faculty ?? "",
      major: studentProfile?.major ?? "",
      educationLevel: studentProfile?.educationLevel ?? "",
      institution: studentProfile?.institution ?? "",
      guardianRelationship: studentProfile?.guardianRelationship ?? "",
      files:
        internship?.attachments.map((file) => ({
          id: file.id,
          fileName: file.fileName,
          status: file.status,
          rejectReason: file.rejectReason,
        })) ?? [],
      internship: internship
        ? {
            id: internship.id,
            internshipStatus: internship.status,
            position: internship.position,
            departmentUnit: internship.company ?? internship.department ?? "",
            startDate: internship.startDate.toISOString(),
            endDate: internship.endDate.toISOString(),
            supervisorName: internship.supervisorName,
            rejectReason: internship.remarks,
          }
        : null,
      user: { email: dbUser.email },
      leaveRequests: [],
    },
    recentActivities: activities.map((activity) => {
      // Determine display action key first
      let displayAction = activity.actionType;
      if (activity.actionType === "STATUS_CHANGED") {
        if (activity.newValue === "REJECTED") displayAction = "REJECT_INTERN";
        else if (activity.newValue === "APPROVED") displayAction = "APPROVE_INTERN";
        else {
          const translated = translateAuditDescription(activity.description, activity.actionType);
          if (translated.startsWith("ยอมรับเข้าฝึกงาน")) displayAction = "APPROVE_INTERN";
          else if (translated.startsWith("เอกสารถูกตีกลับ")) displayAction = "REJECT_INTERN";
        }
      }

      const at = displayAction; // Use the display action for color logic
      let toneColor: "green" | "red" | "yellow" | "sky" | "violet" | "orange" | "teal" | "amber" = "sky";
      
      if (["SUBMIT", "RESUBMIT", "APPROVE_DOC", "SUBMIT_DOC", "APPROVE_LEAVE", "SUBMIT_LEAVE", "APPROVE_INTERN"].includes(at)) toneColor = "green";
      else if (["FLAG_FIELDS", "DELETE_DOC", "REJECT_LEAVE", "REJECT_DOC", "REJECT_INTERN"].includes(at)) toneColor = "red";
      else if (["UPDATE_INFO", "UPDATE_PROFILE", "CHANGE_PASSWORD"].includes(at)) toneColor = "amber";
      else if (["USER_ADDED", "ADD_STUDENT", "ASSIGN_ADMIN"].includes(at)) toneColor = "violet";
      else if (["USER_DELETED", "REVOKE_ADMIN", "DEACTIVATE_USER"].includes(at)) toneColor = "orange";
      else if (["MARK_COMPLETED", "EXPORT"].includes(at)) toneColor = "teal";
      else if (at === "STATUS_CHANGED") {
        if (activity.newValue === "REJECTED") toneColor = "red";
        else if (activity.newValue === "APPROVED") toneColor = "green";
        else if (activity.newValue === "EDIT_REQUESTED") toneColor = "orange";
        else if (activity.newValue === "COMPLETED") toneColor = "sky";
        else toneColor = "green";
      }

      return {
        id: activity.id,
        action: displayAction,
        description: translateAuditDescription(activity.description, activity.actionType, activity.newValue),
        createdAt: activity.createdAt.toISOString(),
        toneColor,
        oldValue: activity.oldValue,
        newValue: activity.newValue,
      };
    }),
  };

  return NextResponse.json(response);
}
