import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'assigned', 'unassigned', 'all'
    const search = searchParams.get('search');

    const where: any = {};
    if (status === 'assigned') {
      where.task = { isNot: null };
    } else if (status === 'unassigned') {
      where.task = null;
    }

    if (search) {
      where.OR = [
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { leakLocation: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const estimates = await prisma.estimate.findMany({
      where,
      include: {
        customer: true,
        task: {
          include: {
            partner: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: estimates });
  } catch (error) {
    console.error('Failed to fetch estimates:', error);
    return NextResponse.json({ success: false, error: '견적 목록을 불러오지 못했습니다.' }, { status: 500 });
  }
}
