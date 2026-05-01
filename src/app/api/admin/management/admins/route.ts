import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "SUPER_ADMIN") {
      console.warn("[DEBUG] Unauthorized access to admins endpoint, role:", user?.role);
      return NextResponse.json({ error: "Unauthorized - SUPER_ADMIN role required" }, { status: 403 });
    }

    const admins = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
        deletedAt: null,
      },
      include: {
        adminProfile: true,
        auditLogsTargeted: {
          where: { actionType: "USER_ADDED" },
          include: { 
            actionByUser: { 
              include: { adminProfile: true } 
            } 
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const result = admins.map((admin) => {
      const creatorLog = admin.auditLogsTargeted[0];
      const creator = creatorLog?.actionByUser;
      const addedByName = creator 
        ? (creator.adminProfile?.firstNameTh && creator.adminProfile?.lastNameTh 
            ? `${creator.adminProfile.firstNameTh} ${creator.adminProfile.lastNameTh}` 
            : creator.email.split("@")[0])
        : "ระบบ";

      return {
        id: admin.id,
        email: admin.email,
        firstNameTh: admin.adminProfile?.firstNameTh || null,
        lastNameTh: admin.adminProfile?.lastNameTh || null,
        role: admin.role,
        createdAt: admin.createdAt,
        addedByName,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser || adminUser.role !== "SUPER_ADMIN") {
      console.warn("[DEBUG] Unauthorized POST to admins endpoint, role:", adminUser?.role);
      return NextResponse.json({ error: "Unauthorized - SUPER_ADMIN role required" }, { status: 403 });
    }

    const { email, firstNameTh, lastNameTh } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        role: "ADMIN",
        status: "ACTIVE",
        adminProfile: {
          create: {
            firstNameTh: firstNameTh || email.split("@")[0],
            lastNameTh: lastNameTh || "ไม่ได้ระบุ"
          }
        }
      },
    });

    await prisma.auditLog.create({
      data: {
        actionBy: adminUser.id,
        actionType: "USER_ADDED",
        resourceType: "USER",
        resourceId: user.id,
        targetUserId: user.id,
        description: `Added new admin: ${email}`
      }
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error("Error adding admin:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
