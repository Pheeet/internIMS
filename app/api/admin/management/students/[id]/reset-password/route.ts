import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const { newPassword } = await req.json();

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Invalid password provided" },
        { status: 400 }
      );
    }

    const student = await prisma.user.findUnique({
      where: { id },
    });

    if (!student || student.role !== "STUDENT") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash: hashedPassword },
    });

    await prisma.auditLog.create({
      data: {
        actionBy: adminUser.id,
        actionType: "PASSWORD_RESET",
        resourceType: "USER",
        resourceId: id,
        targetUserId: id,
        description: `Reset password for student ${student.email}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resetting student password:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
