import { PrismaClient } from '../src/generated/prisma'
const prisma = new PrismaClient()
async function main() {
  const user = await prisma.user.findFirst({ where: { role: 'STUDENT' } })
  console.log(user?.email)
}
main()
