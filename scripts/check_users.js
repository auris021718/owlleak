const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { partner: true },
  });
  console.log('TOTAL USERS:', users.length);
  console.log(JSON.stringify(users, null, 2));

  const partners = await prisma.partner.findMany();
  console.log('TOTAL PARTNERS:', partners.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
