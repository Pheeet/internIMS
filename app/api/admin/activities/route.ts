import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type LogGroup =
  | "Status flow"
  | "Leave"
  | "Document"
  | "Info update"
  | "Account management"
  | "Export";

type ToneColor = "green" | "red" | "yellow" | "sky" | "violet" | "orange" | "teal";

const ACTION_GROUP_MAP: Record<string, { group: LogGroup; toneColor: ToneColor }> = {
  SUBMIT_DOC: { group: "Status flow", toneColor: "green" },
  FLAG_FIELDS: { group: "Status flow", toneColor: "red" },
  STUDENT_RESUBMIT: { group: "Status flow", toneColor: "green" },
  APPROVE_DOC: { group: "Status flow", toneColor: "green" },
  RE_APPROVE_DOC: { group: "Status flow", toneColor: "green" },
  MARK_COMPLETED: { group: "Status flow", toneColor: "teal" },
  STATUS_CHANGED: { group: "Status flow", toneColor: "green" },
  SUBMIT: { group: "Status flow", toneColor: "green" },
  RESUBMIT: { group: "Status flow", toneColor: "green" },
  SUBMIT_LEAVE: { group: "Leave", toneColor: "green" },
  APPROVE_LEAVE: { group: "Leave", toneColor: "green" },
  REJECT_LEAVE: { group: "Leave", toneColor: "red" },
  RE_UPLOAD_DOC: { group: "Document", toneColor: "green" },
  DELETE_DOC: { group: "Document", toneColor: "red" },
  DOCUMENT_DOWNLOADED: { group: "Document", toneColor: "sky" },
  UPDATE_INFO: { group: "Info update", toneColor: "yellow" },
  UPDATE_PROFILE: { group: "Info update", toneColor: "sky" },
  CHANGE_PASSWORD: { group: "Info update", toneColor: "sky" },
  PASSWORD_RESET: { group: "Account management", toneColor: "sky" },
  USER_ADDED: { group: "Account management", toneColor: "violet" },
  ADD_STUDENT: { group: "Account management", toneColor: "violet" },
  ASSIGN_ADMIN: { group: "Account management", toneColor: "violet" },
  REVOKE_ADMIN: { group: "Account management", toneColor: "orange" },
  USER_DELETED: { group: "Account management", toneColor: "orange" },
  DEACTIVATE_USER: { group: "Account management", toneColor: "orange" },
  EXPORT: { group: "Export", toneColor: "teal" },
};

function normalizeActorRole(role?: string | null): "admin" | "student" {
  return role && ["ADMIN", "SUPER_ADMIN"].includes(role) ? "admin" : "student";
}

function displayNameFromUser(user?: {
  email?: string | null;
  adminProfile?: { firstNameTh?: string | null; lastNameTh?: string | null } | null;
  studentProfile?: { firstNameTh?: string | null; lastNameTh?: string | null } | null;
} | null): string {
  if (!user) return "System";

  const adminFullName = `${user.adminProfile?.firstNameTh ?? ""} ${user.adminProfile?.lastNameTh ?? ""}`.trim();
  if (adminFullName) return adminFullName;

  const studentFullName = `${user.studentProfile?.firstNameTh ?? ""} ${user.studentProfile?.lastNameTh ?? ""}`.trim();
  if (studentFullName) return studentFullName;

  if (!user.email) return "System";
  return user.email.split("@")[0] || user.email;
}

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role?.toUpperCase();
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      actionType: true,
      oldValue: true,
      newValue: true,
      description: true,
      createdAt: true,
      actionByUser: {
        select: {
          role: true,
          email: true,
          adminProfile: {
            select: {
              firstNameTh: true,
              lastNameTh: true,
            },
          },
          studentProfile: {
            select: {
              firstNameTh: true,
              lastNameTh: true,
            },
          },
        },
      },
      targetUser: {
        select: {
          email: true,
          adminProfile: {
            select: {
              firstNameTh: true,
              lastNameTh: true,
            },
          },
          studentProfile: {
            select: {
              firstNameTh: true,
              lastNameTh: true,
            },
          },
        },
      },
    },
  });

  const formattedLogs = logs.map((log) => {
    const mapped = ACTION_GROUP_MAP[log.actionType] ?? {
      group: "Status flow" as LogGroup,
      toneColor: "green" as ToneColor,
    };

    const actorName = displayNameFromUser(log.actionByUser);
    const targetName = displayNameFromUser(log.targetUser);

    return {
      id: log.id,
      action: log.actionType,
      group: mapped.group,
      toneColor: mapped.toneColor,
      actorName,
      actorRole: normalizeActorRole(log.actionByUser?.role),
      targetName,
      details: log.description ?? null,
      oldValue: log.oldValue ?? null,
      newValue: log.newValue ?? null,
      createdAt: log.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ logs: formattedLogs });
}
