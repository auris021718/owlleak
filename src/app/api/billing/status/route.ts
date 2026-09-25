import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/admin_session=([^;]+)/);
    const token = match ? match[1] : null;

    if (!token) {
      return NextResponse.json({ authenticated: false, subscription: null }, { status: 200 });
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));
    const partnerId = payload.partnerId as number | null;
    const role = (payload.role as string) || 'partner';

    if (!partnerId && role !== 'admin') {
      return NextResponse.json({ authenticated: true, isMaster: false, subscription: null }, { status: 200 });
    }

    // If partnerId exists, fetch subscription & payment history
    if (partnerId) {
      const subscription = await prisma.subscription.findUnique({
        where: { partnerId },
        include: {
          payments: {
            orderBy: { paidAt: 'desc' },
            take: 10,
          },
        },
      });

      const isMaster = subscription?.status === 'active';

      return NextResponse.json({
        authenticated: true,
        isMaster,
        subscription,
      });
    }

    // If Admin, return overall subscription stats
    const totalSubscribers = await prisma.subscription.count({
      where: { status: 'active' },
    });
    const totalMRR = totalSubscribers * 99000;

    return NextResponse.json({
      authenticated: true,
      isAdmin: true,
      totalSubscribers,
      totalMRR,
    });
  } catch (error) {
    console.error('Billing status error:', error);
    return NextResponse.json({ error: '구독 정보 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
