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
          emails: [{ email: 'admin@owl-leak.kr', name: '부엉이 관리자', createdAt: new Date() }],
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
          emails: [{ email: 'hansung@example.com', name: '김한성 (한성방수)', createdAt: new Date() }],
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

        const inputLast4 = cleanInputPhone.length >= 4 ? cleanInputPhone.slice(-4) : cleanInputPhone;

        const matched = users.filter((u) => {
          const userPhoneClean = (u.phone || '').replace(/[^0-9]/g, '');
          const partnerPhoneClean = (u.partner?.phone || '').replace(/[^0-9]/g, '');

          const nameMatch =
            nameOrCompany &&
            (u.name.toLowerCase().includes(nameOrCompany.trim().toLowerCase()) ||
              u.partner?.companyName.toLowerCase().includes(nameOrCompany.trim().toLowerCase()) ||
              u.partner?.contactName?.toLowerCase().includes(nameOrCompany.trim().toLowerCase()));

          const phoneMatch =
            cleanInputPhone &&
            (userPhoneClean.includes(cleanInputPhone) ||
              partnerPhoneClean.includes(cleanInputPhone) ||
              cleanInputPhone.includes(userPhoneClean) ||
              cleanInputPhone.includes(partnerPhoneClean) ||
              (inputLast4.length === 4 && (userPhoneClean.endsWith(inputLast4) || partnerPhoneClean.endsWith(inputLast4))));

          return nameMatch || phoneMatch;
        });

        if (matched.length > 0) {
          return NextResponse.json({
            success: true,
            emails: matched.map((u) => ({
              email: u.email,
              name: u.partner?.companyName || u.name,
              createdAt: u.createdAt,
            })),
            email: matched[0].email,
            name: matched[0].partner?.companyName || matched[0].name,
            createdAt: matched[0].createdAt,
          });
        }
      } catch (dbError) {
        console.error('DB error during find_id:', dbError);
      }

      return NextResponse.json(
        { success: false, error: '입력하신 정보와 일치하는 회원 계정을 찾을 수 없습니다.' },
        { status: 404 }
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

        // Fetch all users with same name to check if user registered another phone number (e.g. gmail vs naver account)
        const sameNameUsers = await prisma.user.findMany({
          where: {
            OR: [
              { name: user.name },
              { email: user.email },
              ...(user.partner?.companyName ? [{ partner: { companyName: user.partner.companyName } }] : []),
            ],
          },
          include: { partner: true },
        });

        const allUserPhones = sameNameUsers
          .flatMap((u) => [(u.phone || '').replace(/[^0-9]/g, ''), (u.partner?.phone || '').replace(/[^0-9]/g, '')])
          .filter(Boolean);

        const inputLast4 = cleanInputPhone.length >= 4 ? cleanInputPhone.slice(-4) : cleanInputPhone;

        const isExactMatch =
          userPhoneClean.includes(cleanInputPhone) ||
          partnerPhoneClean.includes(cleanInputPhone) ||
          cleanInputPhone.includes(userPhoneClean) ||
          cleanInputPhone.includes(partnerPhoneClean);

        const isLast4Match =
          inputLast4.length === 4 &&
          (userPhoneClean.endsWith(inputLast4) ||
            partnerPhoneClean.endsWith(inputLast4) ||
            allUserPhones.some((p) => p.endsWith(inputLast4)));

        const isSameOwnerPhoneMatch = allUserPhones.some(
          (p) => p.includes(cleanInputPhone) || cleanInputPhone.includes(p)
        );

        if (!isExactMatch && !isLast4Match && !isSameOwnerPhoneMatch) {
          return NextResponse.json(
            { success: false, error: '등록된 휴대폰 번호 정보가 일치하지 않습니다. 가입 시 사용한 번호 또는 뒤 4자리를 확인해 주세요.' },
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
