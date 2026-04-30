import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "works");

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const file = formData.get("file") as File | null;

    if (!title) {
      return NextResponse.json({ error: "กรุณาระบุชื่อผลงาน" }, { status: 400 });
    }

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "กรุณาแนบไฟล์" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "รองรับเฉพาะไฟล์ PDF เท่านั้น" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "ไฟล์ต้องไม่เกิน 10MB" }, { status: 400 });
    }

    // Ensure upload directory exists
    try {
      await fs.access(UPLOAD_DIR);
    } catch {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }

    const fileId = crypto.randomUUID();
    const fileName = `${fileId}.pdf`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    const fileUrl = `/uploads/works/${fileName}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    const work = await prisma.work.create({
      data: {
        title,
        description,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        studentId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, work });
  } catch (error) {
    console.error("Error uploading work:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const works = await prisma.work.findMany({
      where: { studentId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, works });
  } catch (error) {
    console.error("Error fetching works:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
