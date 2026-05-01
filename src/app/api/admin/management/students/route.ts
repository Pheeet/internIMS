import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        deletedAt: null,
      },
      include: {
        studentProfile: true,
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

    const result = students.map((student) => {
      const creatorLog = student.auditLogsTargeted[0];
      const creator = creatorLog?.actionByUser;
      const addedByName = creator 
        ? (creator.adminProfile?.firstNameTh && creator.adminProfile?.lastNameTh 
            ? `${creator.adminProfile.firstNameTh} ${creator.adminProfile.lastNameTh}` 
            : creator.email.split("@")[0])
        : "ระบบ";

      return {
        id: student.id,
        email: student.email,
        firstNameTh: student.studentProfile?.firstNameTh || null,
        lastNameTh: student.studentProfile?.lastNameTh || null,
        role: student.role,
        createdAt: student.createdAt,
        addedByName,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, password, prefix, firstNameTh, lastNameTh } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    let passwordHash: string | null = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "STUDENT",
        status: "ACTIVE",
        studentProfile: {
          create: {
            prefix: prefix || "นาย",
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
        description: `Added new student: ${email}`
      }
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error("Error adding student:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
