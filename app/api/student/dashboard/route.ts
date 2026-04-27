import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";


function mapStudentAction(actionType: string): string {
  const map: Record<string, string> = {
    SUBMIT: "คุณส่งแบบฟอร์มฝึกงานแล้ว",
    RESUBMIT: "คุณส่งแบบฟอร์มฝึกงานใหม่อีกครั้ง",
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
    APPROVED: "อนุมัติแล้ว",
    REJECTED: "ถูกตีกลับ",
    EDIT_REQUESTED: "รอแก้ไข",
    COMPLETED: "จบการฝึกงาน",
  };

  return map[status] ?? status;
}

function translateAuditDescription(description: string | null | undefined, actionType: string): string {
  if (!description) {
    return mapStudentAction(actionType);
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
    return `เปลี่ยนสถานะเป็น: ${translateStatusLabel(statusChangedMatch[1])}${statusChangedMatch[2]}`;
  }

  return description
    .replace(/^Admin แก้ไขข้อมูลนักศึกษา/, "ผู้ดูแลแก้ไขข้อมูลนักศึกษา")
    .replace(/\bPENDING\b/g, translateStatusLabel("PENDING"))
    .replace(/\bAPPROVED\b/g, translateStatusLabel("APPROVED"))
    .replace(/\bREJECTED\b/g, translateStatusLabel("REJECTED"))
    .replace(/\bEDIT_REQUESTED\b/g, translateStatusLabel("EDIT_REQUESTED"))
    .replace(/\bCOMPLETED\b/g, translateStatusLabel("COMPLETED"));
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
    recentActivities: activities.map((activity) => ({
      id: activity.id,
      action: activity.actionType,
      description: translateAuditDescription(activity.description, activity.actionType),
      createdAt: activity.createdAt.toISOString(),
    })),
  };

  return NextResponse.json(response);
}
