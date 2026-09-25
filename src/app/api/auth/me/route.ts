import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    let token: string | undefined;

    // 1. Check Cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/admin_session=([^;]+)/);
    if (match) {
      token = match[1];
    }

    // 2. Check Authorization Header
    const authHeader = request.headers.get('Authorization');
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    // 3. Verify JWT
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    const { payload } = await jwtVerify(token, new TextEncoder().encode(jwtSecret));

    const userId = payload.userId as number | undefined;
    const email = payload.email as string | undefined;
    const role = (payload.role as string) || 'partner';

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
        email: dbUser?.email || email || (role === 'admin' ? 'admin@owl.com' : ''),
        name: dbUser?.name || (payload.name as string) || (role === 'admin' ? '부엉이 관리자' : '파트너'),
        role: dbUser?.role || role,
        partnerId: partnerData?.id || (payload.partnerId as number | null),
        partner: partnerData,
      },
    });
  } catch (error) {
    console.error('Auth /me verification error:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }
}
