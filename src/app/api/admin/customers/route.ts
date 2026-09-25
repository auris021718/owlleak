import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const filter = searchParams.get('filter');

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filter === 'with-tasks') {
      where.tasks = { some: {} };
    } else if (filter === 'with-estimates') {
      where.estimates = { some: {} };
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        estimates: {
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          include: {
            partner: true,
            photos: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { estimates: true, tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: customers });
  } catch (error) {
    console.error('Failed to fetch admin customers:', error);
    return NextResponse.json({ success: false, error: '고객 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, address } = body;

    if (!phone) {
      return NextResponse.json({ success: false, error: '전화번호는 필수입니다.' }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name || '미등록 고객',
        phone,
        address: address || null,
      },
      include: {
        estimates: true,
        tasks: {
          include: { partner: true, photos: true },
        },
        _count: { select: { estimates: true, tasks: true } },
      },
    });

    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    console.error('Failed to create customer:', error);
    return NextResponse.json({ success: false, error: '고객 등록에 실패했습니다.' }, { status: 500 });
  }
}
