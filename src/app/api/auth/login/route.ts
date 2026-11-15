import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import prisma from '@/lib/prisma';
import {
  getJwtSecret,
  hashPassword,
  verifyPassword,
  needsRehash,
  timingSafeEqualString,
} from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // [보안] JWT_SECRET이 없으면 서버 설정 오류로 처리 (fallback 시크릿 사용 금지)
    let jwtSecret: Uint8Array;
    try {
      jwtSecret = getJwtSecret();
    } catch {
      console.error('[보안] JWT_SECRET 환경변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { success: false, error: '서버 설정 오류가 발생했습니다. 관리자에게 문의해 주세요.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, password } = body;
    // [보안] 기본값 없음. ADMIN_PASSWORD 환경변수가 필수이며, 마스터 비밀번호 우회는 제거됨.
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!password) {
      return NextResponse.json(
        { success: false, error: '비밀번호를 입력해 주세요.' },
        { status: 400 }
      );
    }

    const normalizedEmail = (email || '').trim().toLowerCase();

    let userRole = 'partner';
    let userName = '';
    let userEmail = normalizedEmail;
    let userId: number | null = null;
    let partnerId: number | null = null;

    // If email is provided, verify against DB User
    if (normalizedEmail) {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { partner: true },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: '등록되지 않은 이메일 계정입니다.' },
          { status: 401 }
        );
      }

      // [보안] bcrypt 검증 (+ 구 SHA-256 해시 호환). 마스터 비밀번호로 타 계정 로그인 불가.
      const isPasswordValid = await verifyPassword(password, user.passwordHash);

      if (!isPasswordValid) {
        return NextResponse.json(
          { success: false, error: '비밀번호가 일치하지 않습니다.' },
          { status: 401 }
        );
      }

      // [보안] 구 SHA-256 해시는 이번 로그인에 성공했으므로 bcrypt로 자동 마이그레이션
      if (needsRehash(user.passwordHash)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: await hashPassword(password) },
        });
      }

      userRole = user.role;
      userName = user.name;
      userEmail = user.email;
      userId = user.id;
      partnerId = user.partner?.id || null;
    } else {
      // Legacy password-only login (Admin default)
      // [보안] 하드코딩 비밀번호('owlleak0815', '1234!') 제거. ADMIN_PASSWORD 환경변수 필수.
      if (!adminPassword || !timingSafeEqualString(password, adminPassword)) {
        return NextResponse.json(
          { success: false, error: '비밀번호가 일치하지 않습니다.' },
          { status: 401 }
        );
      }
      userRole = 'admin';
      userName = '부엉이 관리자';
      userEmail = 'admin@owl-leak.kr';
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
      .sign(jwtSecret);

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
