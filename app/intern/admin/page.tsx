import DashboardClient from "./DashboardClient";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const ACTION_TITLE_MAP: Record<string, string> = {
  UPDATE_INFO: "แก้ไขข้อมูลนักศึกษา",
  STATUS_CHANGED: "อัปเดตสถานะคำร้อง",
  USER_ADDED: "เพิ่มผู้ใช้งาน",
  USER_DELETED: "ลบผู้ใช้งาน",
  DOCUMENT_DOWNLOADED: "ดาวน์โหลดเอกสาร",
};

function buildDisplayNameFromEmail(email?: string | null): string {
  if (!email) return "Unknown";
  return email.split("@")[0] || email;
}

function buildUserName(user?: {
  email?: string | null;
  adminProfile?: { firstNameTh?: string | null; lastNameTh?: string | null } | null;
  studentProfile?: { firstNameTh?: string | null; lastNameTh?: string | null } | null;
} | null): string {
  if (!user) return "System";

  const adminFullName = `${user.adminProfile?.firstNameTh ?? ""} ${user.adminProfile?.lastNameTh ?? ""}`.trim();
  if (adminFullName) return adminFullName;

  const studentFullName = `${user.studentProfile?.firstNameTh ?? ""} ${user.studentProfile?.lastNameTh ?? ""}`.trim();
  if (studentFullName) return studentFullName;

  return buildDisplayNameFromEmail(user.email);
}

export default async function AdminDashboardPage() {
  const session = await getSession();
  const pendingStatuses = ["PENDING"] as const;
  const activeStatuses = ["APPROVED", "EDIT_REQUESTED"] as const;

  const [pendingApplicationsCount, activeInternsCount, recentPending, activeInterns, recentActivities] = await Promise.all([
    prisma.internship.count({
      where: { status: { in: pendingStatuses as any } },
    }),
    prisma.internship.count({
      where: { status: { in: activeStatuses as any } },
    }),
    prisma.internship.findMany({
      where: { status: { in: pendingStatuses as any } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        position: true,
        department: true,
        company: true,
        createdAt: true,
        student: {
          select: {
            email: true,
            studentProfile: {
              select: {
                firstNameTh: true,
                lastNameTh: true,
                major: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
    }),
    prisma.internship.findMany({
      where: { status: { in: activeStatuses as any } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        position: true,
        department: true,
        company: true,
        createdAt: true,
        student: {
          select: {
            email: true,
            studentProfile: {
              select: {
                firstNameTh: true,
                lastNameTh: true,
                major: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        actionType: true,
        description: true,
        createdAt: true,
        actionByUser: {
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
    }),
  ]);

  const mapRow = (item: (typeof recentPending)[number]) => ({
    id: item.id,
    position: item.position,
    departmentUnit: item.company ?? item.department ?? "-",
    createdAt: item.createdAt.toISOString(),
    profile: {
      firstName: item.student.studentProfile?.firstNameTh ?? "ไม่ระบุ",
      lastName: item.student.studentProfile?.lastNameTh ?? "",
      major: item.student.studentProfile?.major ?? "-",
      profilePictureUrl: item.student.studentProfile?.profilePictureUrl ?? null,
      user: {
        email: item.student.email,
      },
    },
  });

  const activities = recentActivities.map((act) => {
    const actorName = buildUserName(act.actionByUser);
    const targetName = buildUserName(act.targetUser);

    return {
      id: act.id,
      action: act.actionType,
      title: ACTION_TITLE_MAP[act.actionType] ?? "กิจกรรมระบบ",
      description: act.description ?? `${actorName} → ${targetName}`,
      date: act.createdAt.toISOString(),
    };
  });

  const adminName = session?.user?.name?.trim()
    ? session.user.name
    : buildDisplayNameFromEmail(session?.user?.email);

  return (
    <DashboardClient
      adminName={adminName}
      stats={{ pendingApplicationsCount, activeInternsCount }}
      recentSubmissions={recentPending.map(mapRow)}
      activeInterns={activeInterns.map(mapRow)}
      activities={activities}
    />
  );
}
