import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// [보안] bcrypt 해싱 + 임시 비밀번호 자동 생성 (하드코딩 '1234!' 제거)
import { hashPassword, randomPassword } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const specialty = searchParams.get('specialty');
    const search = searchParams.get('search');

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (specialty) {
      where.specialty = specialty;
    }
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { region: { contains: search, mode: 'insensitive' } },
      ];
    }

    const partners = await prisma.partner.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ success: true, data: partners });
  } catch (error) {
    console.error('Failed to fetch partners:', error);
    return NextResponse.json({ success: false, error: '협력사 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      companyName,
      contactName,
      phone,
      email,
      specialty,
      region,
      partnerCode,
      memo,
      password,
    } = body;

    if (!companyName || !phone) {
      return NextResponse.json({ success: false, error: '업체명과 전화번호는 필수입니다.' }, { status: 400 });
    }

    let userId: number | null = null;
    // [보안] 비밀번호 미입력 시 '1234!' 같은 고정값 대신 1회성 임시 비밀번호 생성
    let temporaryPassword: string | null = null;
    if (email) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const plainPw = password && String(password).length >= 8 ? String(password) : randomPassword(12);
        if (!password || String(password).length < 8) {
          temporaryPassword = plainPw;
        }
        const newUser = await prisma.user.create({
          data: {
            email,
            passwordHash: await hashPassword(plainPw),
            name: contactName || companyName,
            phone,
            role: 'partner',
          },
        });
        userId = newUser.id;
      }
    }

    const partner = await prisma.partner.create({
      data: {
        companyName,
        contactName: contactName || null,
        phone,
        email: email || null,
        specialty: specialty || '방수',
        region: region || null,
        partnerCode: partnerCode || null,
        memo: memo || null,
        status: 'pending',
        rating: 5.0,
        completedJobs: 0,
        userId,
      },
      include: {
        user: true,
      },
    });

    // [보안] 응답에서 passwordHash 제거 (민감 정보 노출 방지)
    const safePartner = {
      ...partner,
      user: partner.user
        ? (({ passwordHash: _omit, ...rest }) => rest)(partner.user as any)
        : null,
    };

    return NextResponse.json({
      success: true,
      data: safePartner,
      // 임시 비밀번호가 생성된 경우 1회만 전달 (관리자가 파트너에게 별도 전달)
      ...(temporaryPassword ? { temporaryPassword } : {}),
    });
  } catch (error) {
    console.error('Failed to create partner:', error);
    return NextResponse.json({ success: false, error: '협력사 등록 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
