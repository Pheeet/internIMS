import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (dbUser.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Fetch the existing attachment to verify ownership and get current status
    const existing = await prisma.attachment.findUnique({
      where: { id },
      select: {
        id: true,
        studentId: true,
        internshipId: true,
        status: true,
        fileUrl: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    if (existing.studentId !== dbUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only PDF, PNG, JPG are allowed." }, { status: 400 });
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 5MB limit." }, { status: 400 });
    }

    // Save new file to /public/uploads/internships/
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), "public", "uploads", "internships");

    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const uniqueName = `${crypto.randomUUID()}-${file.name}`;
    const filePath = path.join(uploadDir, uniqueName);
    await fs.writeFile(filePath, buffer);
    const newFileUrl = `/uploads/internships/${uniqueName}`;

    // Delete old file from disk
    if (existing.fileUrl) {
      try {
        const oldPath = path.join(process.cwd(), "public", existing.fileUrl);
        await fs.unlink(oldPath);
      } catch (e) {
        console.error("Failed to delete old file:", e);
      }
    }

    const previousStatus = existing.status;

    // Update attachment in DB: reset status to PENDING, update file metadata
    const updated = await prisma.attachment.update({
      where: { id },
      data: {
        fileName: file.name,
        fileUrl: newFileUrl,
        fileType: file.type,
        fileSize: file.size,
        status: "PENDING",
        rejectReason: null,
      },
    });

    // Update internship status based on previous attachment status
    if (existing.internshipId) {
      const newInternshipStatus = previousStatus === "APPROVED" ? "EDIT_REQUESTED" : "PENDING";
      await prisma.internship.update({
        where: { id: existing.internshipId },
        data: { status: newInternshipStatus as any },
      });

      // Log the re-upload action
      await prisma.auditLog.create({
        data: {
          actionBy: dbUser.id,
          actionType: "RE_UPLOAD_DOC",
          resourceType: "ATTACHMENT",
          resourceId: id,
          targetUserId: dbUser.id,
          description: `นักศึกษาอัปโหลดเอกสาร "${file.name}" ใหม่`,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error re-uploading attachment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
