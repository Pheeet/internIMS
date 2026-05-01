
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const email = "test2@gmail.com";
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      internships: {
        include: {
          attachments: true
        }
      }
    }
  });

  if (!user) {
    console.log(`User with email ${email} not found.`);
    return;
  }

  console.log("USER:", user.email);
  if (user.internships.length === 0) {
    console.log("No internships found.");
  } else {
    user.internships.forEach((internship) => {
      console.log(`INTERNSHIP (ID: ${internship.id}, Status: ${internship.status})`);
      internship.attachments.forEach((att) => {
        console.log(`  - ATTACHMENT (Name: ${att.fileName}, Status: ${att.status}, Reason: ${att.rejectReason || "N/A"})`);
      });
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
