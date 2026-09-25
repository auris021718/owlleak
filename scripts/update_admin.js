const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function updateAdmin() {
  const hash = crypto.createHash('sha256').update('owlleak0815').digest('hex');
  const user = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: 'admin@owl-leak.kr',
        passwordHash: hash
      }
    });
    console.log('ADMIN UPDATED:', user.id, '-> admin@owl-leak.kr');
  } else {
    await prisma.user.create({
      data: {
        email: 'admin@owl-leak.kr',
        passwordHash: hash,
        name: '부엉이 관리자',
        phone: '010-0000-0000',
        role: 'admin'
      }
    });
    console.log('ADMIN CREATED: admin@owl-leak.kr');
  }
}

updateAdmin()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
  });
