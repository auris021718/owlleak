import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';
import { getPartnerClassification } from '@/lib/partnerType';

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

    // If partnerId exists, fetch partner specialty, subscription & payment history
    if (partnerId) {
      const partner = await prisma.partner.findUnique({
        where: { id: partnerId },
        select: { specialty: true, companyName: true },
      });

      const classification = getPartnerClassification(partner?.specialty);

      const subscription = await prisma.subscription.findUnique({
        where: { partnerId },
        include: {
          payments: {
            orderBy: { paidAt: 'desc' },
            take: 10,
          },
        },
      });

      const isSubscribed = subscription?.status === 'active';

      return NextResponse.json({
        authenticated: true,
        isMaster: isSubscribed,
        isSubscribed,
        classification,
        specialty: partner?.specialty || null,
        companyName: partner?.companyName || null,
        subscription,
      });
    }

    // If Admin, return overall subscription stats
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'active' },
      select: { price: true, planType: true },
    });
    const totalSubscribers = activeSubscriptions.length;
    const totalMRR = activeSubscriptions.reduce((acc, sub) => acc + sub.price, 0);

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
