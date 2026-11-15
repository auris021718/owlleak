import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // [보안] 세션 검증은 @/lib/auth 의 getSession으로 통일 (fallback 시크릿 사용 금지)
    const session = await getSession(request);

    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const { userId, email, role } = session;

    let partnerData = null;
    let dbUser = null;

    if (userId || email) {
      dbUser = await prisma.user.findFirst({
        where: userId ? { id: userId } : { email: email! },
        include: {
          partner: {
            include: {
              _count: {
                select: {
                  tasks: true,
                  settlements: true,
                },
              },
            },
          },
        },
      });

      if (dbUser) {
        partnerData = dbUser.partner;
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: dbUser?.id || userId || 0,
        email: dbUser?.email || email || (role === 'admin' ? 'admin@owl-leak.kr' : ''),
        name: dbUser?.name || session.name || (role === 'admin' ? '부엉이 관리자' : '파트너'),
        role: dbUser?.role || role,
        partnerId: partnerData?.id || session.partnerId,
        partner: partnerData,
      },
    });
  } catch (error) {
    console.error('Auth /me verification error:', error);
    return NextResponse.json(
      { authenticated: false, user: null, error: '세션 확인 중 오류가 발생했습니다.' },
      { status: 200 }
    );
  }
}
