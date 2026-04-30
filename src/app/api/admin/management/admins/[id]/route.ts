import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const adminToDelete = await prisma.user.findUnique({
      where: { id },
    });

    if (!adminToDelete) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    if (adminToDelete.id === adminUser.id) {
      return NextResponse.json({ error: "Cannot revoke yourself" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id },
      data: { 
        deletedAt: new Date(),
        email: `${adminToDelete.email}_deleted_${Date.now()}`
      },
    });

    await prisma.auditLog.create({
      data: {
        actionBy: adminUser.id,
        actionType: "USER_DELETED",
        resourceType: "USER",
        resourceId: id,
        targetUserId: id,
        description: `Revoked admin access for ${adminToDelete.email}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking admin:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
