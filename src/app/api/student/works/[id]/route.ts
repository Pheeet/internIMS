import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const work = await prisma.work.findUnique({
      where: { id },
    });

    if (!work) {
      return NextResponse.json({ error: "Work not found" }, { status: 404 });
    }

    if (work.studentId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete file from disk
    const filePath = path.join(process.cwd(), "public", work.fileUrl);
    try {
      await fs.unlink(filePath);
    } catch (e) {
      console.warn(`Failed to delete file: ${filePath}`, e);
    }

    // Delete record from DB
    await prisma.work.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting work:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
