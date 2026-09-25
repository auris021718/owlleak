import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/admin_session=([^;]+)/);
    const token = match ? match[1] : null;

    if (!token) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));
    const partnerId = payload.partnerId as number | null;

    if (!partnerId) {
      return NextResponse.json({ error: '파트너 계정만 구독 관리가 가능합니다.' }, { status: 400 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { partnerId },
    });

    if (!subscription) {
      return NextResponse.json({ error: '활성화된 구독이 없습니다.' }, { status: 404 });
    }

    const updated = await prisma.subscription.update({
      where: { partnerId },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Master 파트너 구독이 해지되었습니다. 현재 이용 기간 만료일까지는 혜택이 유지됩니다.',
      subscription: updated,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: '구독 해지 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
