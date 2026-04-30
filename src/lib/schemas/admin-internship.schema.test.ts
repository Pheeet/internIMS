import { describe, it, expect } from "vitest";
import { adminInternshipSchema } from "./admin-internship.schema";

describe("adminInternshipSchema", () => {
  const validData = {
    prefix: "Mr.",
    firstNameTh: "John",
    lastNameTh: "Doe",
    gender: "Male",
    phoneNumber: "0812345678",
    contactAddress: "123 Street",
    emergencyPhone: "0898765432",
    educationLevel: "Bachelor",
    institution: "CMU",
    major: "CS",
    position: "Dev",
    startDate: "2023-01-01",
    endDate: "2023-12-31",
  };

  it("validates correct data", () => {
    const result = adminInternshipSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("fails if required fields are missing", () => {
    const result = adminInternshipSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      expect(fieldErrors.prefix).toBeDefined();
      expect(fieldErrors.firstNameTh).toBeDefined();
      expect(fieldErrors.lastNameTh).toBeDefined();
    }
  });

  it("validates optional fields when provided", () => {
    const dataWithOptionals = {
      ...validData,
      dob: "1990-01-01",
      guardianName: "Jane Doe",
      faculty: "Engineering",
      advisorName: "Dr. Smith",
      company: "Tech Corp",
      remarks: "Excellent",
    };
    const result = adminInternshipSchema.safeParse(dataWithOptionals);
    expect(result.success).toBe(true);
  });

  it("fails on empty strings for required fields", () => {
    const invalidData = { ...validData, prefix: "" };
    const result = adminInternshipSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("validates boundary values for dates", () => {
    const dataWithDates = {
      ...validData,
      startDate: "2023-01-01",
      endDate: "2023-01-01", // Same day
    };
    const result = adminInternshipSchema.safeParse(dataWithDates);
    expect(result.success).toBe(true);
  });
});
