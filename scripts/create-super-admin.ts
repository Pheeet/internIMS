import "dotenv/config";

import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { Role, UserStatus } from "../src/generated/prisma/enums";

const SALT_ROUNDS = 12;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function validateEnv(): {
  connectionString: string;
  email: string;
  password: string;
} {
  const connectionString = getRequiredEnv("DATABASE_URL");
  const email = getRequiredEnv("SUPER_ADMIN_EMAIL");
  const password = getRequiredEnv("SUPER_ADMIN_PASSWORD");

  if (password.length < 8) {
    throw new Error("SUPER_ADMIN_PASSWORD must be at least 8 characters");
  }

  return { connectionString, email, password };
}

async function main() {
  const { connectionString, email, password } = validateEnv();

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existing) {
        throw new Error("SUPER_ADMIN already exists");
      }

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: Role.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
        },
        select: { id: true },
      });

      await tx.adminProfile.create({
        data: { userId: user.id },
      });
    });

    console.log(`Created SUPER_ADMIN: ${email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    // Handle duplicate key race condition similarly to the explicit pre-check.
    const maybeCode = (error as { code?: string }).code;
    if (maybeCode === "P2002") {
      console.error("SUPER_ADMIN already exists");
    } else {
      console.error(`Failed to create SUPER_ADMIN: ${error.message}`);
    }
  } else {
    console.error("Failed to create SUPER_ADMIN: unknown error");
  }

  process.exit(1);
});
