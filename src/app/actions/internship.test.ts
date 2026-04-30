process.env.RESEND_API_KEY = "re_mock";

vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    studentProfile: { findUnique: vi.fn(), update: vi.fn() },
    internship: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn(), findUnique: vi.fn() },
    attachment: { findMany: vi.fn(), deleteMany: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));
vi.mock("@/src/generated/prisma/client", () => ({
  Prisma: { JsonNull: "JsonNull" }
}));
vi.mock("@/lib/resend", () => ({ resend: { emails: { send: vi.fn() } } }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("fs/promises", () => ({
  default: {
    unlink: vi.fn(),
    mkdir: vi.fn(),
    access: vi.fn(),
    writeFile: vi.fn(),
  },
  unlink: vi.fn(),
  mkdir: vi.fn(),
  access: vi.fn(),
  writeFile: vi.fn(),
}));
vi.mock("@/lib/storage", () => ({ replaceFileAtomically: vi.fn() }));

import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitInternshipApplication } from "./internship";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import { replaceFileAtomically } from "@/lib/storage";

describe("submitInternshipApplication", () => {
  let consoleSpy: any;
  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Default mocks
    (getSession as any).mockResolvedValue({ user: { email: "test@test.com" } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: "user-1" });
    (prisma.internship.findFirst as any).mockResolvedValue({ 
      id: "intern-1", 
      status: "PENDING",
      student: { studentProfile: { prefix: "Mr" } } 
    });
    (prisma.studentProfile.findUnique as any).mockResolvedValue({ id: "prof-1" });
    (prisma.studentProfile.update as any).mockResolvedValue({});
    (prisma.internship.update as any).mockResolvedValue({});
    (prisma.auditLog.create as any).mockResolvedValue({});
    (prisma.attachment.updateMany as any).mockResolvedValue({});
    (prisma.internship.findUnique as any).mockResolvedValue({ 
      id: "intern-1", 
      status: "PENDING",
      student: {
        user: { email: "test@test.com", name: "Test User" },
        studentProfile: { prefix: "Mr", firstNameTh: "A", lastNameTh: "B" }
      }
    });
  });

  const mockFormData = () => {
    const fd = new FormData();
    fd.append("position", "Intern");
    fd.append("department", "IT");
    fd.append("company", "Google");
    fd.append("supervisorName", "Boss");
    fd.append("startDate", "2023-01-01");
    fd.append("endDate", "2023-06-01");
    fd.append("educationLevel", "Bachelor");
    fd.append("institution", "Uni");
    fd.append("faculty", "Eng");
    fd.append("major", "CS");
    fd.append("advisorName", "Prof");
    fd.append("advisorPhone", "123");
    fd.append("prefix", "Mr");
    fd.append("firstNameTh", "A");
    fd.append("lastNameTh", "B");
    fd.append("gender", "M");
    fd.append("dob", "2000-01-01");
    fd.append("phoneNumber", "123");
    fd.append("emergencyPhone", "123");
    fd.append("contactAddress", "Home");
    fd.append("guardianName", "Mom");
    fd.append("guardianRelationship", "Mother");
    return fd;
  };

  it("deletes removed documents from disk only after DB update success", async () => {
    // Mock current attachments
    const oldFileUrl = "/uploads/internships/old.pdf";
    (prisma.attachment.findMany as any).mockResolvedValue([
      { id: "att-old", fileUrl: oldFileUrl }
    ]);
    (prisma.attachment.deleteMany as any).mockResolvedValue({ count: 1 });

    const fd = mockFormData();
    fd.append("keptFiles", "some-other-id");

    const result = await submitInternshipApplication({}, fd);

    expect(result.success).toBe(true);
    expect(prisma.attachment.deleteMany).toHaveBeenCalled();
    expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining(oldFileUrl));
  });

  it("does NOT delete file from disk if DB update fails", async () => {
    // Force DB failure on deleteMany
    (prisma.attachment.deleteMany as any).mockRejectedValue(new Error("DB Fail"));
    (prisma.attachment.findMany as any).mockResolvedValue([
      { id: "att-old", fileUrl: "/uploads/old.pdf" }
    ]);

    const fd = mockFormData();
    const result = await submitInternshipApplication({}, fd);

    expect(result.success).toBe(false);
    expect(fs.unlink).not.toHaveBeenCalled();
  });

  it("only removes files that were NOT in keptFiles (partial deletion)", async () => {
    (prisma.internship.findFirst as any).mockResolvedValue({ 
      id: "intern-1", 
      status: "PENDING",
      student: { studentProfile: { prefix: "Mr" } } 
    });
    (prisma.attachment.findMany as any).mockResolvedValue([
      { id: "att-1", fileUrl: "/u/1.pdf" },
      { id: "att-2", fileUrl: "/u/2.pdf" }
    ]);
    (prisma.attachment.deleteMany as any).mockResolvedValue({ count: 1 });

    const fd = mockFormData();
    fd.append("keptFiles", "att-1"); // Keep att-1, remove att-2

    const result = await submitInternshipApplication({}, fd);

    expect(result.success).toBe(true);
    expect(prisma.attachment.deleteMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: { notIn: ["att-1"] }
      })
    }));
    expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining("2.pdf"));
  });
});
