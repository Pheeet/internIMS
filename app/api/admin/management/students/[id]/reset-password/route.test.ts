import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import bcrypt from "bcrypt";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed-password"),
  }
}));

vi.mock("next-auth", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("POST /api/admin/management/students/[id]/reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createParams = (id: string) => Promise.resolve({ id });
  const createRequest = (body: any) => new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify(body),
  });

  it("returns 403 if no session", async () => {
    (getSession as any).mockResolvedValue(null);
    const response = await POST(createRequest({}), { params: createParams("id") });
    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 401 if admin user not found in DB", async () => {
    (getSession as any).mockResolvedValue({ user: { email: "admin@test.com", role: "ADMIN" } });
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const response = await POST(createRequest({}), { params: createParams("id") });
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 403 if not authorized role", async () => {
    (getSession as any).mockResolvedValue({ user: { role: "STUDENT" } });
    
    const response = await POST(createRequest({ newPassword: "password123" }), { params: createParams("student-id") });
    const data = await response.json();
    
    expect(response.status).toBe(403);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 if password is too short", async () => {
    (getSession as any).mockResolvedValue({ user: { email: "admin@test.com", role: "ADMIN" } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });

    const response = await POST(createRequest({ newPassword: "123" }), { params: createParams("student-id") });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Invalid password provided");
  });

  it("returns 404 if student not found", async () => {
    (getSession as any).mockResolvedValue({ user: { email: "admin@test.com", role: "ADMIN" } });
    (prisma.user.findUnique as any)
      .mockResolvedValueOnce({ id: "admin-id" }) // Admin
      .mockResolvedValueOnce(null); // Student not found

    const response = await POST(createRequest({ newPassword: "password123" }), { params: createParams("student-id") });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Student not found");
  });

  it("successfully resets student password", async () => {
    (getSession as any).mockResolvedValue({ user: { email: "admin@test.com", role: "ADMIN" } });
    (prisma.user.findUnique as any)
      .mockResolvedValueOnce({ id: "admin-id" }) // Admin
      .mockResolvedValueOnce({ id: "student-id", email: "student@test.com", role: "STUDENT" }); // Student
    (prisma.user.update as any).mockResolvedValue({});
    (prisma.auditLog.create as any).mockResolvedValue({});

    const response = await POST(createRequest({ newPassword: "new-secure-password" }), { params: createParams("student-id") });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it("returns 500 on database error", async () => {
    (getSession as any).mockResolvedValue({ user: { email: "admin@test.com", role: "ADMIN" } });
    (prisma.user.findUnique as any).mockRejectedValue(new Error("DB Error"));

    const response = await POST(createRequest({ newPassword: "password123" }), { params: createParams("student-id") });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal Server Error");
  });
});
