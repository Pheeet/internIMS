import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "./route";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

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

vi.mock("next-auth", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("DELETE /api/admin/management/admins/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createParams = (id: string) => Promise.resolve({ id });
  
  it("returns 403 if no session", async () => {
    (getSession as any).mockResolvedValue(null);
    const response = await DELETE(new Request("http://localhost"), { params: createParams("id") });
    const data = await response.json();
    expect(response.status).toBe(403);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 401 if admin user not found in DB", async () => {
    (getSession as any).mockResolvedValue({ user: { email: "super@test.com", role: "SUPER_ADMIN" } });
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const response = await DELETE(new Request("http://localhost"), { params: createParams("id") });
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 403 if not SUPER_ADMIN", async () => {
    (getSession as any).mockResolvedValue({ user: { role: "ADMIN" } });
    
    const response = await DELETE(new Request("http://localhost"), { params: createParams("target-id") });
    const data = await response.json();
    
    expect(response.status).toBe(403);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 404 if admin to delete not found", async () => {
    (getSession as any).mockResolvedValue({ user: { email: "super@test.com", role: "SUPER_ADMIN" } });
    (prisma.user.findUnique as any)
      .mockResolvedValueOnce({ id: "super-id", email: "super@test.com" }) // Admin session user
      .mockResolvedValueOnce(null); // Target user not found

    const response = await DELETE(new Request("http://localhost"), { params: createParams("invalid-id") });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Admin not found");
  });

  it("returns 400 if trying to delete self", async () => {
    (getSession as any).mockResolvedValue({ user: { email: "super@test.com", role: "SUPER_ADMIN" } });
    (prisma.user.findUnique as any)
      .mockResolvedValueOnce({ id: "super-id", email: "super@test.com" })
      .mockResolvedValueOnce({ id: "super-id", email: "super@test.com" });

    const response = await DELETE(new Request("http://localhost"), { params: createParams("super-id") });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Cannot revoke yourself");
  });

  it("successfully revokes admin access", async () => {
    (getSession as any).mockResolvedValue({ user: { email: "super@test.com", role: "SUPER_ADMIN" } });
    (prisma.user.findUnique as any)
      .mockResolvedValueOnce({ id: "super-id", email: "super@test.com" })
      .mockResolvedValueOnce({ id: "target-id", email: "target@test.com" });
    (prisma.user.update as any).mockResolvedValue({});
    (prisma.auditLog.create as any).mockResolvedValue({});

    const response = await DELETE(new Request("http://localhost"), { params: createParams("target-id") });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(prisma.user.update).toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it("returns 500 on database error", async () => {
    (getSession as any).mockResolvedValue({ user: { email: "super@test.com", role: "SUPER_ADMIN" } });
    (prisma.user.findUnique as any).mockRejectedValue(new Error("DB Error"));

    const response = await DELETE(new Request("http://localhost"), { params: createParams("target-id") });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal Server Error");
  });
});
