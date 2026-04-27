"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { writeFile, unlink } from "fs/promises";
import path from "path";

export async function saveProfileInfo(_prevState: unknown, formData: FormData) {
  const session = await getSession();

  if (!session?.user?.email) {
    return { success: false, error: "กรุณาเข้าสู่ระบบ" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser) {
    return { success: false, error: "ไม่พบผู้ใช้งานในระบบ" };
  }

  const userId = dbUser.id;

  const prefix = formData.get("prefix") as string;
  const firstNameTh = formData.get("firstNameTh") as string;
  const lastNameTh = formData.get("lastNameTh") as string;
  const gender = formData.get("gender") as string;
  const dobStr = formData.get("dob") as string;
  const phoneNumber = formData.get("phoneNumber") as string;
  const emergencyPhone = formData.get("emergencyPhone") as string;
  const contactAddress = formData.get("contactAddress") as string;
  const guardianName = formData.get("guardianName") as string | null;
  const guardianRelationship = formData.get("guardianRelationship") as string | null;
  const profilePhoto = formData.get("profilePhoto") as File | null;

  const fields: Record<string, string[]> = {};
  if (!prefix) fields.prefix = ["กรุณาเลือกคำนำหน้าชื่อ"];
  if (!firstNameTh) fields.firstNameTh = ["กรุณากรอกชื่อ"];
  if (!lastNameTh) fields.lastNameTh = ["กรุณากรอกนามสกุล"];
  if (!gender) fields.gender = ["กรุณาเลือกเพศ"];
  if (!dobStr) fields.dob = ["กรุณาระบุวันเกิด"];
  if (!phoneNumber) fields.phoneNumber = ["กรุณากรอกเบอร์โทรศัพท์"];
  if (!emergencyPhone) fields.emergencyPhone = ["กรุณากรอกเบอร์โทรฉุกเฉิน"];
  if (!contactAddress) fields.contactAddress = ["กรุณากรอกที่อยู่"];
  if (!guardianName) fields.guardianName = ["กรุณากรอกชื่อ-นามสกุลผู้ปกครอง"];
  if (!guardianRelationship) fields.guardianRelationship = ["กรุณาระบุความสัมพันธ์"];

  if (Object.keys(fields).length > 0) {
    return { success: false, error: "กรุณากรอกข้อมูลให้ครบถ้วน", fields };
  }

  const dob = new Date(dobStr);

  // Handle profile picture upload — save to /public/uploads/profiles/
  let profilePictureUrl: string | undefined = undefined;
  if (profilePhoto && profilePhoto.size > 0) {
    try {
      // Get current profile to check for old photo
      const currentProfile = await prisma.studentProfile.findUnique({
        where: { userId },
        select: { profilePictureUrl: true }
      });

      const bytes = await profilePhoto.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = profilePhoto.name.split(".").pop() || "jpg";
      const filename = `${userId}_${Date.now()}.${ext}`;
      const filePath = path.join(process.cwd(), "public", "uploads", "profiles", filename);

      await writeFile(filePath, buffer);
      profilePictureUrl = `/uploads/profiles/${filename}`;

      // Delete old photo if exists
      if (currentProfile?.profilePictureUrl) {
        try {
          const oldPath = path.join(process.cwd(), "public", currentProfile.profilePictureUrl);
          await unlink(oldPath);
        } catch (e) {
          console.error("Failed to delete old profile photo:", e);
        }
      }
    } catch (err) {
      console.error("Failed to save profile picture:", err);
      return { success: false, error: "ไม่สามารถบันทึกรูปภาพได้" };
    }
  }

  try {
    const updateData = {
      prefix,
      firstNameTh,
      lastNameTh,
      gender,
      dob,
      phoneNumber,
      emergencyPhone,
      contactAddress,
      guardianName: guardianName,
      guardianRelationship: guardianRelationship,
      // Only update profilePictureUrl if a new file was uploaded
      ...(profilePictureUrl !== undefined && { profilePictureUrl }),
    };

    await prisma.studentProfile.upsert({
      where: { userId },
      update: updateData,
      create: { userId, ...updateData },
    });

    await prisma.auditLog.create({
      data: {
        actionBy: userId,
        actionType: "UPDATE_INFO",
        resourceType: "STUDENT_PROFILE",
        resourceId: userId,
        targetUserId: userId,
        description: "นักศึกษาอัปเดตข้อมูลส่วนตัว",
      },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { profile_completed: true },
    });

    return { success: true, redirectUrl: "/intern/student/internship-form" };
  } catch (error) {
    console.error("Failed to save profile:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }
}
