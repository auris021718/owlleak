import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, companyName, contactName, phone, specialty, region } = body;

    if (!email || !password || !companyName || !phone) {
      return NextResponse.json(
        { success: false, error: '이메일, 비밀번호, 업체명, 전화번호는 필수 입력 항목입니다.' },
        { status: 400 }
      );
    }

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: '이미 등록된 이메일 계정입니다.' },
        { status: 400 }
      );
    }

    const hashedPassword = hashPassword(password);

    // Create user and partner transactionally
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name: contactName || companyName,
        phone,
        role: 'partner',
        partner: {
          create: {
            companyName,
            contactName: contactName || null,
            phone,
            email,
            specialty: specialty || '누수',
            region: region || '서울',
            status: 'pending', // Pending approval by admin
            rating: 5.0,
            completedJobs: 0,
          },
        },
      },
      include: {
        partner: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다. 관리자 승인 후 정식 활성화됩니다.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        partnerId: newUser.partner?.id,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: '회원가입 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
