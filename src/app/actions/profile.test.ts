import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveProfileInfo } from "./profile";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { replaceFileAtomically } from "@/lib/storage";

// Mock dependencies
vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    studentProfile: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/storage", () => ({
  replaceFileAtomically: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("saveProfileInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createFormData = (overrides = {}) => {
    const formData = new FormData();
    const data: Record<string, string | Blob> = {
      prefix: "Mr.",
      firstNameTh: "สมชาย",
      lastNameTh: "ใจดี",
      gender: "Male",
      dob: "1990-01-01",
      phoneNumber: "0812345678",
      emergencyPhone: "0898765432",
      contactAddress: "123 Main St",
      guardianName: "สมหญิง ใจดี",
      guardianRelationship: "Mother",
      ...overrides,
    };

    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    return formData;
  };

  it("returns error if no session exists", async () => {
    (getSession as any).mockResolvedValue(null);
    const result = await saveProfileInfo({}, new FormData());
    expect(result).toEqual({ success: false, error: "กรุณาเข้าสู่ระบบ" });
  });

  it("returns error if session has no email", async () => {
    (getSession as any).mockResolvedValue({ user: {} });
    const result = await saveProfileInfo({}, new FormData());
    expect(result).toEqual({ success: false, error: "กรุณาเข้าสู่ระบบ" });
  });

  it("returns error if user not found in database", async () => {
    (getSession as any).mockResolvedValue({ user: { email: "test@example.com" } });
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const result = await saveProfileInfo({}, new FormData());
    expect(result).toEqual({ success: false, error: "ไม่พบผู้ใช้งานในระบบ" });
  });

  it("returns validation errors if fields are missing", async () => {
    (getSession as any).mockResolvedValue({ user: { email: "test@example.com" } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: "user-123" });
    
    const formData = new FormData(); // Missing all fields
    const result = await saveProfileInfo({}, formData);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe("กรุณากรอกข้อมูลให้ครบถ้วน");
    expect(result.fields).toBeDefined();
    expect(Object.keys(result.fields as any)).toHaveLength(10);
  });

  it("successfully updates profile without photo", async () => {
    (getSession as any).mockResolvedValue({ user: { email: "test@example.com" } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: "user-123" });
    (prisma.studentProfile.upsert as any).mockResolvedValue({});
    (prisma.auditLog.create as any).mockResolvedValue({});
    (prisma.user.update as any).mockResolvedValue({});

    const formData = createFormData();
    const result = await saveProfileInfo({}, formData);

    expect(result).toEqual({ success: true, redirectUrl: "/intern/student/internship-form" });
    expect(prisma.studentProfile.upsert).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "user-123" },
      data: { profile_completed: true }
    }));
  });

  it("successfully updates profile with photo", async () => {
    (getSession as any).mockResolvedValue({ user: { email: "test@example.com" } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: "user-123" });
    (prisma.studentProfile.findUnique as any).mockResolvedValue({ profilePictureUrl: "/uploads/profiles/old.jpg" });
    (prisma.studentProfile.upsert as any).mockResolvedValue({});
    (replaceFileAtomically as any).mockImplementation(async (_f: any, _o: any, _d: any, cb: any) => {
      return await cb("/uploads/profiles/new.jpg");
    });

    const photo = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const formData = createFormData({ profilePhoto: photo });
    
    const result = await saveProfileInfo({}, formData);

    expect(result.success).toBe(true);
    expect(replaceFileAtomically).toHaveBeenCalledWith(
      photo,
      "/uploads/profiles/old.jpg",
      "profiles",
      expect.any(Function)
    );
    expect(prisma.studentProfile.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({
        profilePictureUrl: "/uploads/profiles/new.jpg"
      })
    }));
  });

  it("returns error if photo upload fails", async () => {
    (getSession as any).mockResolvedValue({ user: { email: "test@example.com" } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: "user-123" });
    (prisma.studentProfile.findUnique as any).mockResolvedValue({});
    (replaceFileAtomically as any).mockRejectedValue(new Error("Storage Error"));

    const photo = new File(["test"], "test.jpg", { type: "image/jpeg" });
    const formData = createFormData({ profilePhoto: photo });
    
    const result = await saveProfileInfo({}, formData);

    expect(result).toEqual({ success: false, error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
  });

  it("returns error if database operation fails", async () => {
    (getSession as any).mockResolvedValue({ user: { email: "test@example.com" } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: "user-123" });
    (prisma.studentProfile.upsert as any).mockRejectedValue(new Error("DB Error"));

    const formData = createFormData();
    const result = await saveProfileInfo({}, formData);

    expect(result).toEqual({ success: false, error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
  });
});
