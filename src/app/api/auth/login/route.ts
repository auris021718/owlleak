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

    // Case 1: If email is provided, verify against DB User
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { partner: true },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: '등록되지 않은 이메일 계정입니다.' },
          { status: 401 }
        );
      }

      const hashedPassword = hashPassword(password);
      if (user.passwordHash !== hashedPassword && password !== adminPassword) {
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
    } 
    // Case 2: Only password provided (Legacy Single Password mode)
    else {
      if (password !== adminPassword) {
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
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
