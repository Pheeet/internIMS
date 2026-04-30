import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "./route";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { replaceFileAtomically } from "@/lib/storage";
import { NextResponse } from "next/server";

vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    attachment: { findUnique: vi.fn(), update: vi.fn() },
    internship: { update: vi.fn() },
    auditLog: { create: vi.fn() },
  }
}));
vi.mock("@/lib/storage", () => ({ replaceFileAtomically: vi.fn() }));

describe("PATCH reupload attachment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if unauthorized", async () => {
    (getSession as any).mockResolvedValue(null);
    const req = new Request("http://localhost", { method: "PATCH" });
    const response = await PATCH(req, { params: Promise.resolve({ id: "1" }) });
    expect(response.status).toBe(401);
  });

  it("successfully reuploads and updates DB", async () => {
    (getSession as any).mockResolvedValue({ user: { email: "student@test.com" } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: "student-1", role: "STUDENT" });
    (prisma.attachment.findUnique as any).mockResolvedValue({ 
      id: "att-1", 
      studentId: "student-1", 
      fileUrl: "/old.pdf",
      internshipId: "intern-1",
      status: "PENDING"
    });
    (prisma.attachment.update as any).mockResolvedValue({ id: "att-1", fileUrl: "/new.pdf" });
    (prisma.internship.update as any).mockResolvedValue({});
    (prisma.auditLog.create as any).mockResolvedValue({});
    
    (replaceFileAtomically as any).mockImplementation(async (_file: any, _oldUrl: any, _dir: any, cb: any) => {
      return await cb("/new.pdf");
    });

    const fd = new FormData();
    fd.append("file", new File(["test"], "test.pdf", { type: "application/pdf" }));
    const req = new Request("http://localhost", { method: "PATCH", body: fd });
    
    const response = await PATCH(req, { params: Promise.resolve({ id: "att-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.fileUrl).toBe("/new.pdf");
    expect(replaceFileAtomically).toHaveBeenCalled();
    expect(prisma.attachment.update).toHaveBeenCalled();
  });

  it("handles failure when replaceFileAtomically throws", async () => {
    (getSession as any).mockResolvedValue({ user: { email: "student@test.com" } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: "student-1", role: "STUDENT" });
    (prisma.attachment.findUnique as any).mockResolvedValue({ id: "att-1", studentId: "student-1" });
    
    // Simulate storage failure (temp cleanup/old preserved is handled by the utility itself)
    (replaceFileAtomically as any).mockRejectedValue(new Error("Storage Full"));

    const fd = new FormData();
    fd.append("file", new File(["test"], "test.pdf", { type: "application/pdf" }));
    const req = new Request("http://localhost", { method: "PATCH", body: fd });

    const response = await PATCH(req, { params: Promise.resolve({ id: "att-1" }) });
    expect(response.status).toBe(500);
  });
});
