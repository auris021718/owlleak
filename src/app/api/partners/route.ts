import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

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
    if (email) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const defaultPw = password ? hashPassword(password) : hashPassword('1234!');
        const newUser = await prisma.user.create({
          data: {
            email,
            passwordHash: defaultPw,
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

    return NextResponse.json({ success: true, data: partner });
  } catch (error) {
    console.error('Failed to create partner:', error);
    return NextResponse.json({ success: false, error: '협력사 등록 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
