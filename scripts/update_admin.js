const { PrismaClient } = require('@prisma/client');
// [보안] bcrypt 해싱 (하드코딩 'owlleak0815' 제거)
// 사용법: ADMIN_PASSWORD=새비밀번호 node scripts/update_admin.js
// 미지정 시 1회성 임시 비밀번호가 생성되어 콘솔에 표시됩니다.
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function updateAdmin() {
  const plainPassword = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
  const hash = await bcrypt.hash(plainPassword, 12);
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
  if (!process.env.ADMIN_PASSWORD) {
    console.log('==============================================================');
    console.log('임시 비밀번호 (1회만 표시, 안전한 곳에 보관 후 변경):');
    console.log(plainPassword);
    console.log('==============================================================');
  }
}

updateAdmin()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
  });
