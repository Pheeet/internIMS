const path = require('path');
const { PrismaClient } = require(path.resolve(__dirname, '../src/generated/prisma'));
const prisma = new PrismaClient();

async function main() {
  const attachments = await prisma.attachment.findMany({
    take: 5,
    select: { fileUrl: true }
  });
  console.log(JSON.stringify(attachments, null, 2));
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
