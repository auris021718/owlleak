const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🌱 Starting database system initialization...');

  // Ensure default Admin Account exists
  const adminEmail = 'admin@owl-leak.kr';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const adminPw = hashPassword('owlleak0815');
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminPw,
        name: '부엉이 관리자',
        phone: '010-0000-0000',
        role: 'admin',
      },
    });
    console.log('✅ Master Admin account created.');
  } else {
    console.log('✅ Master Admin account verified.');
  }

  console.log('🎉 Production database ready.');
}

main()
  .catch((e) => {
    console.error('❌ Error initializing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
