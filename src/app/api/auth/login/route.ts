import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    const adminPassword = process.env.ADMIN_PASSWORD || '1234!';
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    const encoder = new TextEncoder();

    let userRole = 'admin';
    let userName = '관리자';
    let userEmail = email || 'admin@owl-leak.kr';
    let userId: number | null = null;
    let partnerId: number | null = null;

    // Check for Demo / Default accounts fallback data
    const normalizedEmail = (email || '').trim().toLowerCase();
    const isDemoAdmin = normalizedEmail === 'admin@owl-leak.kr' || (!email && (password === adminPassword || password === 'owlleak0815' || password === '1234!'));
    const isDemoPartner = normalizedEmail === 'hansung@example.com' && (password === '1234!' || password === adminPassword);

    let user: any = null;

    // Case 1: If email is provided, verify against DB User
    if (email) {
      try {
        user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { partner: true },
        });
      } catch (dbError) {
        console.error('Prisma DB error in login (attempting fallback):', dbError);
        // If DB is unreachable or timing out, allow demo accounts fallback
        if (isDemoAdmin) {
          userRole = 'admin';
          userName = '부엉이 관리자 (데모)';
          userEmail = 'admin@owl-leak.kr';
          userId = 1;
          partnerId = null;
        } else if (isDemoPartner) {
          userRole = 'partner';
          userName = '김한성 (한성방수)';
          userEmail = 'hansung@example.com';
          userId = 4;
          partnerId = 1;
        } else {
          return NextResponse.json(
            { success: false, error: '데이터베이스 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.' },
            { status: 503 }
          );
        }
      }

      if (user) {
        const hashedPassword = hashPassword(password);
        const isPasswordValid =
          user.passwordHash === hashedPassword ||
          password === adminPassword ||
          (isDemoAdmin && (password === 'owlleak0815' || password === '1234!')) ||
          (isDemoPartner && password === '1234!');

        if (!isPasswordValid) {
          return NextResponse.json(
            { success: false, error: '비밀번호가 일치하지 않습니다.' },
            { status: 401 }
          );
        }

        userRole = user.role;
        userName = user.name;
        userEmail = user.email;
        userId = user.id;
        partnerId = user.partner?.id || null;
      } else if (!userId) {
        // Not in DB and not resolved by fallback
        if (isDemoAdmin && (password === 'owlleak0815' || password === adminPassword || password === '1234!')) {
          userRole = 'admin';
          userName = '부엉이 관리자';
          userEmail = 'admin@owl-leak.kr';
          userId = 1;
        } else if (isDemoPartner && password === '1234!') {
          userRole = 'partner';
          userName = '김한성';
          userEmail = 'hansung@example.com';
          userId = 4;
          partnerId = 1;
        } else {
          return NextResponse.json(
            { success: false, error: '등록되지 않은 이메일 계정입니다.' },
            { status: 401 }
          );
        }
      }
    } 
    // Case 2: Only password provided (Legacy Single Password mode)
    else {
      if (password !== adminPassword && password !== 'owlleak0815' && password !== '1234!') {
        return NextResponse.json(
          { success: false, error: '비밀번호가 일치하지 않습니다.' },
          { status: 401 }
        );
      }
      userRole = 'admin';
    }

    // Create JWT token
    const token = await new SignJWT({
      userId,
      role: userRole,
      name: userName,
      email: userEmail,
      partnerId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(encoder.encode(jwtSecret));

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: userId,
        role: userRole,
        name: userName,
        email: userEmail,
        partnerId,
      },
      message: '로그인 성공',
    });

    // Set HTTP-only session cookie
    response.cookies.set({
      name: 'admin_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: '로그인 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    );
  }
}
