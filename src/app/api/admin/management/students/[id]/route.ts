import { NextResponse } from "next/server";
import { requireAdminUser } from "@/src/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdminUser();

    const { id } = await params;

    const studentToDelete = await prisma.user.findUnique({
      where: { id },
    });

    if (!studentToDelete || studentToDelete.role !== "STUDENT") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id },
      data: { 
        deletedAt: new Date(),
        email: `${studentToDelete.email}_deleted_${Date.now()}`
      },
    });

    await prisma.auditLog.create({
      data: {
        actionBy: adminUser.id,
        actionType: "USER_DELETED",
        resourceType: "USER",
        resourceId: id,
        targetUserId: id,
        description: `Deleted student access for ${studentToDelete.email}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
