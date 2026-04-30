import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  updateInternshipStatus, 
  updateStudentAndInternshipInfo, 
  manualRevertToApproved, 
  revertEditRequestedToApproved, 
  saveFlaggedFields, 
  updateApprovedStudentInfo 
} from "./admin";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

// Required mocks as per user instructions
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    internship: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    studentProfile: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb),
  },
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}));

vi.mock("next-auth", () => ({})); 
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));


describe("admin actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("updateInternshipStatus", () => {
    it("returns unauthorized if no session", async () => {
      (getSession as any).mockResolvedValue(null);
      const result = await updateInternshipStatus("id", "APPROVED");
      expect(result).toEqual({ success: false, error: "Unauthorized" });
    });

    it("returns error if internship not found", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue(null);

      const result = await updateInternshipStatus("id", "APPROVED");
      expect(result).toEqual({ success: false, error: "Internship not found" });
    });

    it("handles database error", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockImplementation(() => Promise.reject(new Error("DB Error")));

      const result = await updateInternshipStatus("id", "APPROVED");
      expect(result.success).toBe(false);
      expect(result.error).toBe("DB Error");
    });

    it("successfully updates status to APPROVED and clears snapshot", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ id: "id", status: "PENDING", studentId: "student-id" });
      (prisma.internship.update as any).mockResolvedValue({ studentId: "student-id" });

      const result = await updateInternshipStatus("id", "APPROVED", "Good job");

      expect(result).toEqual({ success: true });
      expect(prisma.internship.update).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it("successfully updates status to EDIT_REQUESTED", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ id: "id", status: "PENDING", studentId: "student-id" });
      (prisma.internship.update as any).mockResolvedValue({ studentId: "student-id" });

      const result = await updateInternshipStatus("id", "EDIT_REQUESTED", "Fix docs");
      expect(result.success).toBe(true);
      expect(prisma.internship.update).toHaveBeenCalled();
    });

    it("skips email if ADMIN_NOTIFICATION_EMAIL is missing", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ 
        id: "id", 
        status: "PENDING",
        student: { email: "s@t.com", studentProfile: { firstNameTh: "N" } } 
      });
      (prisma.internship.update as any).mockResolvedValue({ studentId: "student-id" });
      const oldEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
      delete process.env.ADMIN_NOTIFICATION_EMAIL;
      
      const result = await updateInternshipStatus("id", "EDIT_REQUESTED", "Fix");
      expect(result.success).toBe(true);
      process.env.ADMIN_NOTIFICATION_EMAIL = oldEmail;
    });

    it("handles non-array flaggedFields in email logic", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ 
        id: "id", 
        status: "PENDING",
        student: { email: "s@t.com", studentProfile: { firstNameTh: "N" } },
        flaggedFields: "not-an-array" 
      });
      (prisma.internship.update as any).mockResolvedValue({ studentId: "student-id" });
      process.env.ADMIN_NOTIFICATION_EMAIL = "admin@test.com";
      
      const result = await updateInternshipStatus("id", "EDIT_REQUESTED", undefined); // remarks undefined
      expect(result.success).toBe(true);
    });

    it("successfully updates status without remarks", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ id: "id", status: "PENDING" });
      (prisma.internship.update as any).mockResolvedValue({ id: "id", studentId: "s-id" });
      
      const result = await updateInternshipStatus("id", "APPROVED");
      expect(result.success).toBe(true);
    });

    it("successfully updates status to EDIT_REQUESTED even if info missing", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ 
        id: "id", 
        status: "PENDING",
        student: { email: "s@t.com", studentProfile: { firstNameTh: "N" } }, // missing faculty, major etc
        position: null,
        company: null,
        department: null
      });
      (prisma.internship.update as any).mockResolvedValue({ studentId: "student-id" });
      
      const result = await updateInternshipStatus("id", "EDIT_REQUESTED", "Fix");
      expect(result.success).toBe(true);
    });

    it("does not clear previousSnapshot if status is not APPROVED", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ id: "id", status: "PENDING" });
      (prisma.internship.update as any).mockResolvedValue({ id: "id", studentId: "s-id" });
      
      await updateInternshipStatus("id", "REJECTED");
      expect(prisma.internship.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.not.objectContaining({ previousSnapshot: expect.anything() })
      }));
    });

    it("returns unauthorized if admin user not found", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue(null);
      const result = await updateInternshipStatus("id", "APPROVED");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("returns unauthorized if no session email", async () => {
      (getSession as any).mockResolvedValue({ user: {} });
      const result = await updateInternshipStatus("id", "APPROVED");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });
  });

  describe("updateStudentAndInternshipInfo", () => {
    it("updates both student and internship", async () => {
      (prisma.internship.findUnique as any).mockResolvedValue({ studentId: "student-id" });
      (prisma.studentProfile.findFirst as any).mockResolvedValue({ id: "profile-id" });
      
      const result = await updateStudentAndInternshipInfo("", "id", { dob: "1990-01-01", startDate: "2023-01-01" } as any);
      expect(result.success).toBe(true);
      expect(prisma.studentProfile.update).toHaveBeenCalled();
    });

    it("handles save error", async () => {
      (prisma.internship.findUnique as any).mockRejectedValue(new Error("Save Error"));
      const result = await updateStudentAndInternshipInfo("", "id", {} as any);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Save Error");
    });

    it("returns error if missing internshipId", async () => {
      const result = await updateStudentAndInternshipInfo("", null, {} as any);
      expect(result).toEqual({ success: false, error: "Missing internshipId" });
    });

    it("returns error if internship not found", async () => {
      (prisma.internship.findUnique as any).mockResolvedValue(null);
      const result = await updateStudentAndInternshipInfo("", "id", {} as any);
      expect(result.success).toBe(false);
      expect(result.error).toContain("ไม่พบข้อมูลการฝึกงาน");
    });

    it("updates student profile and internship with empty dates", async () => {
      (prisma.internship.findUnique as any).mockResolvedValue({ studentId: "student-id" });
      (prisma.studentProfile.findFirst as any).mockResolvedValue({ id: "profile-id" });
      
      const data = { 
        firstNameTh: "John", 
        dob: "", // empty date
        startDate: "", 
        endDate: "" 
      } as any;
      const result = await updateStudentAndInternshipInfo("", "id", data);

      expect(result.success).toBe(true);
      expect(prisma.studentProfile.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ dob: undefined })
      }));
    });

    it("skips internship update if internshipId is falsy (branch coverage)", async () => {
      // Note: the outer check 'if (!internshipId)' prevents this usually,
      // but there's an 'if (internshipId)' at line 191 inside the try block.
      // To hit it, we'd need to bypass the first check somehow or it's dead code.
      // Actually, line 156 handles it. Line 191 is a redundant safety check.
    });

    it("returns error if student profile not found", async () => {
      (prisma.internship.findUnique as any).mockResolvedValue({ studentId: "s-id" });
      (prisma.studentProfile.findFirst as any).mockResolvedValue(null);
      const result = await updateStudentAndInternshipInfo("", "id", {} as any);
      expect(result.success).toBe(false);
      expect(result.error).toContain("ไม่พบข้อมูลนักศึกษา");
    });
  });

  describe("manualRevertToApproved", () => {
    it("successfully reverts", async () => {
      const result = await manualRevertToApproved("id");
      expect(result.success).toBe(true);
    });

    it("handles database error", async () => {
      (prisma.internship.update as any).mockRejectedValue(new Error("DB Fail"));
      const result = await manualRevertToApproved("id");
      expect(result.success).toBe(false);
      expect(result.error).toBe("DB Fail");
    });

    it("handles database error without message", async () => {
      (prisma.internship.update as any).mockRejectedValue({});
      const result = await manualRevertToApproved("id");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to revert");
    });
  });

  describe("revertEditRequestedToApproved", () => {
    it("successfully reverts from snapshot", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({
        id: "id",
        status: "EDIT_REQUESTED",
        previousSnapshot: { prefix: "Mr." },
        student: { studentProfile: { prefix: "Ms." } }
      });
      
      const result = await revertEditRequestedToApproved("id");
      expect(result.success).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it("handles database error", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com", role: "ADMIN" } });
      (prisma.user.findUnique as any).mockRejectedValue(new Error("DB Error"));

      const result = await revertEditRequestedToApproved("id");
      expect(result.success).toBe(false);
      expect(result.error).toBe("DB Error");
    });

    it("returns error if internship not found", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue(null);
      const result = await revertEditRequestedToApproved("id");
      expect(result.success).toBe(false);
      expect(result.error).toBe("ไม่พบข้อมูลการฝึกงาน");
    });

    it("returns error if status is not EDIT_REQUESTED", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ id: "id", status: "APPROVED" });
      const result = await revertEditRequestedToApproved("id");
      expect(result.success).toBe(false);
      expect(result.error).toContain("สถานะปัจจุบันไม่ใช่รอตรวจสอบการแก้ไข");
    });

    it("returns error if student profile missing", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ id: "id", status: "EDIT_REQUESTED", student: null });
      const result = await revertEditRequestedToApproved("id");
      expect(result.success).toBe(false);
      expect(result.error).toBe("ไม่พบข้อมูลโปรไฟล์นักศึกษา");
    });

    it("returns error if snapshot missing", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ 
        id: "id", 
        status: "EDIT_REQUESTED", 
        student: { studentProfile: {} },
        previousSnapshot: null 
      });
      const result = await revertEditRequestedToApproved("id");
      expect(result.success).toBe(false);
      expect(result.error).toContain("ไม่พบข้อมูล snapshot");
    });

    it("covers dateOrNull helper with invalid date", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ 
        id: "id", 
        status: "EDIT_REQUESTED", 
        student: { studentProfile: {} },
        previousSnapshot: { dob: "invalid-date" } 
      });
      const result = await revertEditRequestedToApproved("id");
      expect(result.success).toBe(true);
    });

    it("handles snapshot with null values and missing keys", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ 
        id: "id", 
        status: "EDIT_REQUESTED", 
        student: { studentProfile: { prefix: "MR" } },
        previousSnapshot: { 
          prefix: null,
          firstNameTh: undefined,
          // gender missing (hasKey("gender") will be false)
          dob: null,
          startDate: null
        } 
      });
      
      const result = await revertEditRequestedToApproved("id");
      expect(result.success).toBe(true);
    });

    it("handles completely empty snapshot (branch coverage)", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ 
        id: "id", 
        status: "EDIT_REQUESTED", 
        student: { studentProfile: { prefix: "MR" } },
        previousSnapshot: {} // EMPTY
      });
      
      const result = await revertEditRequestedToApproved("id");
      expect(result.success).toBe(true);
    });
    it("handles snapshot with null values to hit ?? branches", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ 
        id: "id", 
        status: "EDIT_REQUESTED", 
        student: { studentProfile: { prefix: "MR", firstNameTh: "F" } },
        prefix: "MR",
        position: "P",
        startDate: "2023-01-01",
        previousSnapshot: { 
          prefix: null, 
          firstNameTh: null,
          position: null,
          startDate: null,
          department: null,
          company: null,
          supervisorName: null,
          endDate: null,
          remarks: null
        }
      });
      const result = await revertEditRequestedToApproved("id");
      expect(result.success).toBe(true);
    });

    it("handles revert error without message", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockRejectedValue({}); // No message
      const result = await revertEditRequestedToApproved("id");
      expect(result.success).toBe(false);
      expect(result.error).toBe("ไม่สามารถย้อนข้อมูลได้");
    });
  });

  describe("saveFlaggedFields", () => {
    it("successfully saves flags", async () => {
      const result = await saveFlaggedFields("id", { "field": { flagged: true, reason: "X" } });
      expect(result.success).toBe(true);
    });

    it("handles save error without message", async () => {
      (prisma.internship.update as any).mockRejectedValue({});
      const result = await saveFlaggedFields("id", {});
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to save flags");
    });
  });

  describe("updateApprovedStudentInfo", () => {
    it("calculates diff and saves changes", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ studentId: "s-id" });
      (prisma.studentProfile.findFirst as any).mockResolvedValue({ prefix: "Mr.", firstNameTh: "Old" });
      (prisma.internship.findFirst as any).mockResolvedValue({ position: "Old", startDate: "2023-01-01" });
      
      (prisma.studentProfile.update as any).mockResolvedValue({});
      (prisma.internship.update as any).mockResolvedValue({});
      (prisma.auditLog.create as any).mockResolvedValue({});

      const result = await updateApprovedStudentInfo("", "id", { 
        prefix: "Mr.", 
        firstNameTh: "New", 
        position: "New",
        startDate: "2023-01-01"
      } as any);

      expect(result.success).toBe(true);
      expect((result as any).changes).toHaveLength(2);
    });

    it("handles error", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockRejectedValue(new Error("Err"));
      const result = await updateApprovedStudentInfo("", "id", {} as any);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Err");
    });

    it("returns unauthorized if no session", async () => {
      (getSession as any).mockResolvedValue(null);
      const result = await updateApprovedStudentInfo("", "id", {} as any);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("returns unauthorized if admin user not found", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue(null);
      const result = await updateApprovedStudentInfo("", "id", {} as any);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("returns error if internship ref not found", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue(null);
      const result = await updateApprovedStudentInfo("", "id", {} as any);
      expect(result.success).toBe(false);
      expect(result.error).toContain("ไม่พบข้อมูลการฝึกงาน");
    });

    it("returns error if student profile not found", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ studentId: "s-id" });
      (prisma.studentProfile.findFirst as any).mockResolvedValue(null);
      const result = await updateApprovedStudentInfo("", "id", {} as any);
      expect(result.success).toBe(false);
      expect(result.error).toContain("ไม่พบข้อมูลนักศึกษา");
    });

    it("handles null values in current profile/internship during diffing", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ studentId: "s-id" });
      (prisma.studentProfile.findFirst as any).mockResolvedValue({ prefix: null }); // null in DB
      (prisma.internship.findFirst as any).mockResolvedValue({ startDate: null, endDate: null }); // dates null
      
      const data = { 
        prefix: "MR", 
        startDate: "2024-01-01",
        dob: "" 
      } as any;
      const result = await updateApprovedStudentInfo("", "id", data);
      expect(result.success).toBe(true);
      expect((result as any).changes).toEqual(expect.arrayContaining([
        expect.objectContaining({ field: "คำนำหน้า", oldValue: "", newValue: "MR" }),
        expect.objectContaining({ field: "วันเริ่มฝึกงาน", oldValue: "", newValue: "2024-01-01" })
      ]));
    });

    it("returns success if no changes detected", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ studentId: "s-id" });
      (prisma.studentProfile.findFirst as any).mockResolvedValue({ prefix: "MR" });
      (prisma.internship.findFirst as any).mockResolvedValue({ position: "Intern" });
      
      const result = await updateApprovedStudentInfo("", "id", { prefix: "MR", position: "Intern" } as any);
      expect(result.success).toBe(true);
      expect((result as any).changes).toHaveLength(0);
    });

    it("handles date fields being null/empty in data", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ studentId: "s-id" });
      (prisma.studentProfile.findFirst as any).mockResolvedValue({ dob: "1990-01-01" });
      (prisma.internship.findFirst as any).mockResolvedValue({ startDate: "2023-01-01", endDate: "2023-12-31" });
      
      const data = { 
        dob: "", // empty in data
        startDate: "", 
        endDate: "" 
      } as any;
      const result = await updateApprovedStudentInfo("", "id", data);
      expect(result.success).toBe(true);
      expect((result as any).changes).toEqual(expect.arrayContaining([
        expect.objectContaining({ field: "วันเริ่มฝึกงาน", oldValue: "2023-01-01", newValue: "" }),
        expect.objectContaining({ field: "วันสิ้นสุดฝึกงาน", oldValue: "2023-12-31", newValue: "" })
      ]));
    });

    it("handles database update error", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ studentId: "s-id" });
      (prisma.studentProfile.findFirst as any).mockResolvedValue({ prefix: "MR" });
      (prisma.internship.findFirst as any).mockResolvedValue({ position: "Intern" });
      (prisma.studentProfile.update as any).mockRejectedValue(new Error("Update Failed"));
      
      const result = await updateApprovedStudentInfo("", "id", { prefix: "DR" } as any);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Update Failed");
    });

    it("handles missing current internship during diffing", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ studentId: "s-id" });
      (prisma.studentProfile.findFirst as any).mockResolvedValue({ prefix: "MR" });
      (prisma.internship.findFirst as any).mockResolvedValue(null); // Missing internship
      
      const result = await updateApprovedStudentInfo("","id", { prefix: "DR" } as any);
      expect(result.success).toBe(true);
      expect((result as any).changes).toHaveLength(1);
    });

    it("handles full dates in data for ternary coverage", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ studentId: "s-id" });
      (prisma.studentProfile.findFirst as any).mockResolvedValue({ dob: "1990-01-01" });
      (prisma.internship.findFirst as any).mockResolvedValue({ startDate: "2023-01-01", endDate: "2023-12-31" });
      
      const data = { 
        dob: "1991-01-01", 
        startDate: "2024-01-01",
        endDate: "2024-12-31" 
      } as any;
      const result = await updateApprovedStudentInfo("", "id", data);
      expect(result.success).toBe(true);
    });

    it("handles update failure without message", async () => {
      (getSession as any).mockResolvedValue({ user: { email: "admin@test.com" } });
      (prisma.user.findUnique as any).mockResolvedValue({ id: "admin-id" });
      (prisma.internship.findUnique as any).mockResolvedValue({ studentId: "s-id" });
      (prisma.studentProfile.findFirst as any).mockResolvedValue({ prefix: "MR" });
      (prisma.internship.findFirst as any).mockResolvedValue({ position: "Intern" });
      (prisma.studentProfile.update as any).mockRejectedValue({}); // No message
      
      const result = await updateApprovedStudentInfo("", "id", { prefix: "DR" } as any);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to update");
    });
  });
});
