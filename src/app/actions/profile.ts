"use server";

import { getCurrentUser } from "@/src/lib/session";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import { replaceFileAtomically } from "@/src/lib/storage";
import { studentProfileSchema } from "@/src/lib/schemas/student-profile.schema";

export async function saveProfileInfo(_prevState: unknown, formData: FormData) {
  const user = await getCurrentUser();

  if (!user?.email) {
    return { success: false, error: "กรุณาเข้าสู่ระบบ" };
  }

  const userId = user.id;
  
  // Guard: Check if internship is COMPLETED
  const internships = await prisma.internship.findMany({
    where: { studentId: userId },
    select: { status: true },
  });

  if (internships.some(i => i.status === "COMPLETED")) {
    return { success: false, error: "ไม่สามารถแก้ไขข้อมูลได้เนื่องจากคุณจบการฝึกงานเรียบร้อยแล้ว" };
  }

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

  // 1. Zod Validation
  const validationData = {
    prefix, firstNameTh, lastNameTh, gender, dob: dobStr,
    phoneNumber, emergencyPhone, contactAddress,
    guardianName, guardianRelationship
  };

  const result = studentProfileSchema.safeParse(validationData);
  const fields: Record<string, string[]> = {};

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const path = issue.path[0] as string;
      if (!fields[path]) fields[path] = [];
      fields[path].push(issue.message);
    });
  }

  // 2. Profile Photo Validation
  if (profilePhoto && profilePhoto.size > 0) {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(profilePhoto.type)) {
      fields.profilePhoto = ["กรุณาอัปโหลดไฟล์ภาพนามสกุล JPG หรือ PNG"];
    }
    if (profilePhoto.size > 5 * 1024 * 1024) {
      fields.profilePhoto = ["กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 5 MB"];
    }
  } else {
    // Check if user already has a profile picture
    const currentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { profilePictureUrl: true }
    });
    if (!currentProfile?.profilePictureUrl) {
      fields.profilePhoto = ["กรุณาอัปโหลดรูปถ่ายชุดนักศึกษา"];
    }
  }

  if (Object.keys(fields).length > 0) {
    return { success: false, error: "ข้อมูลไม่ถูกต้องตามรูปแบบที่กำหนด", fields };
  }

  const dob = new Date(dobStr);

  const performUpsert = async (pUrl?: string) => {
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
      ...(pUrl !== undefined && { profilePictureUrl: pUrl }),
    };

    return await prisma.studentProfile.upsert({
      where: { userId },
      update: updateData,
      create: { userId, ...updateData },
    });
  };

  try {
    // 3. Logic for handling APPROVED -> EDIT_REQUESTED transition
    // Find if there's an APPROVED internship that needs to be moved to EDIT_REQUESTED
    const approvedInternship = await prisma.internship.findFirst({
      where: {
        studentId: userId,
        status: "APPROVED",
      },
      include: { student: { include: { studentProfile: true } } }
    });

    if (approvedInternship) {
      // Create snapshot before updating profile
      const currentProfile = approvedInternship.student.studentProfile;
      const snapshot = {
        ...currentProfile,
        position: approvedInternship.position,
        department: approvedInternship.department,
        company: approvedInternship.company,
        supervisorName: approvedInternship.supervisorName,
        startDate: approvedInternship.startDate,
        endDate: approvedInternship.endDate,
        remarks: approvedInternship.remarks,
      };

      // Transition to EDIT_REQUESTED
      await prisma.internship.update({
        where: { id: approvedInternship.id },
        data: {
          status: "EDIT_REQUESTED",
          previousSnapshot: snapshot as any,
        },
      });
    }

    if (profilePhoto && profilePhoto.size > 0) {
      // Handle profile picture upload — save atomically
      const currentProfile = await prisma.studentProfile.findUnique({
        where: { userId },
        select: { profilePictureUrl: true }
      });

      await replaceFileAtomically(
        profilePhoto,
        currentProfile?.profilePictureUrl,
        "profiles",
        performUpsert
      );
    } else {
      await performUpsert();
    }


    await prisma.auditLog.create({
      data: {
        actionBy: userId,
        actionType: "UPDATE_INFO",
        resourceType: "STUDENT_PROFILE",
        resourceId: userId,
        targetUserId: userId,
        description: approvedInternship 
          ? "นักศึกษาแก้ไขข้อมูลส่วนตัว (เปลี่ยนสถานะเป็นรอตรวจสอบการแก้ไข)" 
          : "นักศึกษาอัปเดตข้อมูลส่วนตัว",
      },
    });
    
    await prisma.user.update({
      where: { id: userId },
      data: { profile_completed: true },
    });

    // If they already have an internship, redirect to dashboard, otherwise to internship form
    const hasInternship = await prisma.internship.findFirst({ where: { studentId: userId } });
    const redirectUrl = hasInternship ? "/intern/student" : "/intern/student/internship-form";

    return { success: true, redirectUrl };
  } catch (error) {
    console.error("Failed to save profile:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" };
  }
}
