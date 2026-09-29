import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, nameOrCompany, phone, email, newPassword } = body;

    const cleanInputPhone = (phone || '').replace(/[^0-9]/g, '');

    // ─── 1. 아이디(이메일) 찾기 ───
    if (mode === 'find_id') {
      if (!phone && !nameOrCompany) {
        return NextResponse.json(
          { success: false, error: '이름(업체명) 또는 휴대폰 번호를 입력해 주세요.' },
          { status: 400 }
        );
      }

      // Demo accounts fallback match
      if (
        cleanInputPhone === '0100000000' ||
        cleanInputPhone === '01000000000' ||
        (nameOrCompany && nameOrCompany.includes('관리자'))
      ) {
        return NextResponse.json({
          success: true,
          email: 'admin@owl-leak.kr',
          name: '부엉이 관리자',
          role: 'admin',
        });
      }

      if (
        cleanInputPhone === '01012345678' ||
        (nameOrCompany && (nameOrCompany.includes('한성') || nameOrCompany.includes('김한성')))
      ) {
        return NextResponse.json({
          success: true,
          email: 'hansung@example.com',
          name: '김한성 (한성방수)',
          role: 'partner',
        });
      }

      // DB search
      try {
        const users = await prisma.user.findMany({
          include: { partner: true },
        });

        const matched = users.find((u) => {
          const userPhoneClean = (u.phone || '').replace(/[^0-9]/g, '');
          const partnerPhoneClean = (u.partner?.phone || '').replace(/[^0-9]/g, '');
          const nameMatch =
            nameOrCompany &&
            (u.name.toLowerCase().includes(nameOrCompany.trim().toLowerCase()) ||
              u.partner?.companyName.toLowerCase().includes(nameOrCompany.trim().toLowerCase()) ||
              u.partner?.contactName?.toLowerCase().includes(nameOrCompany.trim().toLowerCase()));

          const phoneMatch =
            cleanInputPhone &&
            (userPhoneClean.includes(cleanInputPhone) || partnerPhoneClean.includes(cleanInputPhone));

          return nameMatch || phoneMatch;
        });

        if (matched) {
          return NextResponse.json({
            success: true,
            email: matched.email,
            name: matched.partner?.companyName || matched.name,
            createdAt: matched.createdAt,
          });
        }
      } catch (dbError) {
        console.error('DB error during find_id:', dbError);
      }

      return NextResponse.json(
        { success: false, error: '입력하신 정보와 일치하는 회원 계정을 찾을 수 없습니다.' },
        { status: 444 }
      );
    }

    // ─── 2. 비밀번호 재설정 ───
    if (mode === 'reset_password') {
      if (!email || !phone || !newPassword) {
        return NextResponse.json(
          { success: false, error: '이메일, 휴대폰 번호, 새 비밀번호를 모두 입력해 주세요.' },
          { status: 400 }
        );
      }

      if (newPassword.length < 4) {
        return NextResponse.json(
          { success: false, error: '비밀번호는 최소 4자 이상이어야 합니다.' },
          { status: 400 }
        );
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Demo fallback check
      if (normalizedEmail === 'admin@owl-leak.kr' || normalizedEmail === 'hansung@example.com') {
        return NextResponse.json({
          success: true,
          message: '데모 계정 비밀번호 확인이 완료되었습니다. 새 비밀번호로 로그인해 주세요.',
        });
      }

      // DB search and update
      try {
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { partner: true },
        });

        if (!user) {
          return NextResponse.json(
            { success: false, error: '해당 이메일로 가입된 회원 계정이 없습니다.' },
            { status: 404 }
          );
        }

        const userPhoneClean = (user.phone || '').replace(/[^0-9]/g, '');
        const partnerPhoneClean = (user.partner?.phone || '').replace(/[^0-9]/g, '');

        if (
          cleanInputPhone &&
          !userPhoneClean.includes(cleanInputPhone) &&
          !partnerPhoneClean.includes(cleanInputPhone)
        ) {
          return NextResponse.json(
            { success: false, error: '등록된 휴대폰 번호 정보가 일치하지 않습니다.' },
            { status: 400 }
          );
        }

        // Update password hash
        const hashedPassword = hashPassword(newPassword);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash: hashedPassword },
        });

        return NextResponse.json({
          success: true,
          message: '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해 주세요.',
        });
      } catch (dbError) {
        console.error('DB error during reset_password:', dbError);
        return NextResponse.json(
          { success: false, error: '비밀번호 변경 처리 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: false, error: '유효하지 않은 요청 모드입니다.' }, { status: 400 });
  } catch (err) {
    console.error('Find account error:', err);
    return NextResponse.json({ success: false, error: '계정 찾기 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
