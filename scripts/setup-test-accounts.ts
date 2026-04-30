import "dotenv/config";

import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { Role, UserStatus } from "../src/generated/prisma/enums";

const ADMIN_EMAIL = "admin@test.com";
const ADMIN_PASSWORD = "Admin1234!";
const STUDENT_EMAIL = "student@test.com";
const SALT_ROUNDS = 12;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function main() {
  const connectionString = getRequiredEnv("DATABASE_URL");
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

    await prisma.$transaction(async (tx) => {
      const existingStudent = await tx.user.findUnique({
        where: { email: STUDENT_EMAIL },
        select: { id: true },
      });

      if (existingStudent) {
        await tx.user.delete({
          where: { id: existingStudent.id },
        });
      }

      const adminUser = await tx.user.upsert({
        where: { email: ADMIN_EMAIL },
        update: {
          passwordHash: adminPasswordHash,
          role: Role.ADMIN,
          status: UserStatus.ACTIVE,
          deletedAt: null,
        },
        create: {
          email: ADMIN_EMAIL,
          passwordHash: adminPasswordHash,
          role: Role.ADMIN,
          status: UserStatus.ACTIVE,
        },
        select: { id: true },
      });

      await tx.adminProfile.upsert({
        where: { userId: adminUser.id },
        update: {
          firstNameTh: "ผู้ดูแล",
          lastNameTh: "ทดสอบ",
          phoneNumber: "0811111111",
          positionTitle: "Test Admin",
          department: "QA",
        },
        create: {
          userId: adminUser.id,
          firstNameTh: "ผู้ดูแล",
          lastNameTh: "ทดสอบ",
          phoneNumber: "0811111111",
          positionTitle: "Test Admin",
          department: "QA",
        },
      });
    });

    console.log("Test account setup complete");
    console.log(`Admin ready: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    console.log(`Student reset: ${STUDENT_EMAIL} removed if it existed`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(`Failed to set up test accounts: ${error.message}`);
  } else {
    console.error("Failed to set up test accounts: unknown error");
  }

  process.exit(1);
});
