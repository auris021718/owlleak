import crypto from 'crypto';
import prisma from '@/lib/prisma';

/**
 * 카카오 알림톡 (Solapi) 공용 발송 모듈
 *
 * - 템플릿 본문의 #{변수}가 단일 기준이다. 테스트 모드의 미리보기 문구도 같은 본문에서 렌더링한다.
 * - ALIMTALK_MODE=test (기본): 실제 발송 없이 DB 기록만 남긴다.
 * - ALIMTALK_MODE=real: Solapi API로 실제 발송한다. 필수 설정(API 키/시크릿, 채널 pfId,
 *   발신번호, 템플릿별 심사 코드)이 하나라도 없으면 조용히 테스트로 속이지 않고 실패로 반환한다.
 * - 템플릿 코드는 카카오 심사 통과 후 발급되며, 템플릿별로 환경변수로 주입한다.
 */

export interface AlimtalkTemplateDef {
  title: string;
  /** 카카오 심사 등록용 본문 (#{변수} 표기) */
  body: string;
  buttonText: string;
  buttonPath: string;
  /** 심사 통과 후 발급되는 Solapi 템플릿 코드를 넣을 환경변수 이름 */
  envKey: string;
  variables: (p: Record<string, any>) => Record<string, string>;
}

const won = (v: unknown, fallback: string): string => {
  const n = Number(String(v ?? '').replace(/[^0-9]/g, ''));
  return n > 0 ? `${n.toLocaleString()}원` : fallback;
};

const priceText = (v: unknown, fallback: string): string => {
  const s = String(v ?? '').trim();
  if (!s) return fallback;
  return s.endsWith('원') ? s : `${s}원`;
};

export const ALIMTALK_TEMPLATES: Record<string, AlimtalkTemplateDef> = {
  ESTIMATE_DISPATCH: {
    title: '[부엉이누수탐지랩] 견적서 발송 안내',
    body: `[부엉이누수탐지랩 견적 안내]
안녕하세요, #{고객명}님.
요청하신 누수 탐지 및 공사 견적서가 도착했습니다.

■ 현장 위치: #{현장위치}
■ 피해 부위: #{피해부위}
■ 신청 공종: #{신청공종}
■ 예상 탐지비: #{탐지비}
■ 예상 공사비: #{공사비}

담당 엔지니어가 빠른 시일 내 연락드려 일정을 조율할 예정입니다.`,
    buttonText: '견적서 상세 확인하기',
    buttonPath: '/estimate',
    envKey: 'SOLAPI_TEMPLATE_ESTIMATE',
    variables: (p) => ({
      고객명: String(p.customerName || '고객'),
      현장위치: String(p.leakLocation || p.location || '현장'),
      피해부위: String(p.damage || '미지정'),
      신청공종: String(p.works || '누수 정밀 탐지'),
      탐지비: won(p.detectionFee, '300,000원'),
      공사비: priceText(p.estimatedPrice || p.estimate, '현장 확인 후 안내'),
    }),
  },
  EMERGENCY_DISPATCH: {
    title: '[부엉이누수] 긴급 출동 요청',
    body: `[긴급 출동 요청 — #{파트너명} 대표님]
인근 지역에 긴급 누수 탐지 요청이 접수되었습니다.

■ 고객명: #{고객명}님
■ 현장 주소: #{현장주소}
■ 요청 분야: #{요청분야}
■ 긴급 여부: 즉시 출동 요망

수락하시려면 앱에서 [수락] 버튼을 눌러주세요.`,
    buttonText: '배정 수락하기',
    buttonPath: '/dashboard',
    envKey: 'SOLAPI_TEMPLATE_EMERGENCY',
    variables: (p) => ({
      파트너명: String(p.partnerName || '협력사'),
      고객명: String(p.customerName || '고객'),
      현장주소: String(p.address || '지역 미상'),
      요청분야: String(p.works || '누수탐지/방수'),
    }),
  },
  TASK_COMPLETED: {
    title: '[부엉이누수] 시공 완료 및 하자보증서 발급',
    body: `[시공 완료 안내]
#{고객명}님, 요청하신 누수 공사가 성공적으로 완료되었습니다.

■ 시공 업체: #{시공업체}
■ 공사 내용: #{공사내용}
■ 하자 보증 기간: 시공일로부터 2년 무상 보증

현장 시공 전/후 사진과 보증서를 링크에서 확인하실 수 있습니다.`,
    buttonText: '시공 사진 및 보증서 보기',
    buttonPath: '/',
    envKey: 'SOLAPI_TEMPLATE_COMPLETED',
    variables: (p) => ({
      고객명: String(p.customerName || '고객'),
      시공업체: String(p.partnerName || '부엉이 협력점'),
      공사내용: String(p.works || '배관 보수 및 방수 복구'),
    }),
  },
  SETTLEMENT_PAID: {
    title: '[부엉이누수] 파트너 정산금 지급 완료 안내',
    body: `[정산금 지급 완료]
#{파트너명} 대표님, 시공 완료 건에 대한 정산금이 정상 입금되었습니다.

■ 대상 작업: #{작업명}
■ 지급 금액: #{지급금액}
■ 지급 일시: #{지급일시}

부엉이누수탐지랩과 함께해 주셔서 감사합니다.`,
    buttonText: '정산 명세서 조회',
    buttonPath: '/dashboard',
    envKey: 'SOLAPI_TEMPLATE_SETTLEMENT',
    variables: (p) => ({
      파트너명: String(p.partnerName || '파트너'),
      작업명: String(p.taskTitle || '누수 공사'),
      지급금액: won(p.amount, '0원'),
      지급일시: String(p.paidDate || new Date().toLocaleDateString('ko-KR')),
    }),
  },
};

// 견적 안내 템플릿의 별칭 (기존 호출부 호환)
ALIMTALK_TEMPLATES.TPL_ESTIMATE_002 = ALIMTALK_TEMPLATES.ESTIMATE_DISPATCH;

export function renderTemplate(def: AlimtalkTemplateDef, params: Record<string, any>): string {
  const vars = def.variables(params);
  return def.body.replace(/#\{([^}]+)\}/g, (_, key: string) => vars[key] ?? '');
}

async function logNotification(phoneNumber: string, title: string, content: string) {
  try {
    const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (adminUser) {
      await prisma.notification.create({
        data: {
          userId: adminUser.id,
          type: 'ALIMTALK',
          title: `[알림톡] ${title}`,
          message: `수신: ${phoneNumber}\n${content.slice(0, 120)}...`,
        },
      });
    }
  } catch (e) {
    console.warn('Notification logging optional:', e);
  }
}

export interface AlimtalkResult {
  success: boolean;
  mode: 'real' | 'test';
  status: 'DELIVERED' | 'RECORDED' | 'FAILED' | 'NOT_CONFIGURED' | 'INVALID';
  messageId?: string;
  error?: string;
  recipient: string;
  templateId: string;
  title: string;
  content: string;
}

export async function sendAlimtalk(input: {
  to: string;
  templateId: string;
  params?: Record<string, any>;
}): Promise<AlimtalkResult> {
  const def = ALIMTALK_TEMPLATES[input.templateId] || ALIMTALK_TEMPLATES.ESTIMATE_DISPATCH;
  const params = input.params || {};
  const to = String(input.to || '').replace(/[^0-9]/g, '');
  const content = renderTemplate(def, params);
  const mode: 'real' | 'test' = process.env.ALIMTALK_MODE === 'real' ? 'real' : 'test';
  const base: Pick<AlimtalkResult, 'mode' | 'recipient' | 'templateId' | 'title' | 'content'> = {
    mode,
    recipient: to,
    templateId: input.templateId,
    title: def.title,
    content,
  };

  if (to.length < 10 || to.length > 11) {
    return { ...base, success: false, status: 'INVALID', error: '수신 번호가 올바르지 않습니다.' };
  }

  if (mode === 'test') {
    await logNotification(to, def.title, content);
    return {
      ...base,
      success: true,
      status: 'RECORDED',
      messageId: `kakao_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
  }

  // --- REAL MODE ---
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const pfId = process.env.SOLAPI_PFID;
  const senderPhone = process.env.SOLAPI_SENDER_PHONE;
  const templateCode = process.env[def.envKey];

  const missing = [
    !apiKey && 'SOLAPI_API_KEY',
    !apiSecret && 'SOLAPI_API_SECRET',
    !pfId && 'SOLAPI_PFID',
    !senderPhone && 'SOLAPI_SENDER_PHONE',
    !templateCode && def.envKey,
  ].filter(Boolean) as string[];

  if (missing.length > 0) {
    const error = `알림톡 실발송 설정이 누락됐습니다: ${missing.join(', ')}`;
    console.error('[Alimtalk]', error);
    await logNotification(to, `${def.title} (발송 실패)`, `${error}\n${content}`);
    return { ...base, success: false, status: 'NOT_CONFIGURED', error };
  }

  try {
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(16).toString('hex');
    const signature = crypto.createHmac('sha256', apiSecret as string).update(date + salt).digest('hex');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.owl-leak.kr';
    const link = `${appUrl}${def.buttonPath}`;

    const res = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
      },
      body: JSON.stringify({
        message: {
          to,
          from: senderPhone,
          kakaoOptions: {
            pfId,
            templateId: templateCode,
            variables: def.variables(params),
            buttons: [
              {
                buttonType: 'WL',
                buttonName: def.buttonText,
                linkMo: link,
                linkPc: link,
              },
            ],
          },
        },
      }),
    });

    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      const error = `Solapi 발송 실패 (${res.status}): ${data?.errorMessage || data?.message || '알 수 없는 오류'}`;
      console.error('[Alimtalk]', error, data);
      await logNotification(to, `${def.title} (발송 실패)`, `${error}\n${content}`);
      return { ...base, success: false, status: 'FAILED', error };
    }

    const messageId =
      data?.messageId || data?.messageList?.[0]?.messageId || data?.groupInfo?.groupId || `kakao_real_${Date.now()}`;
    await logNotification(to, def.title, content);
    return { ...base, success: true, status: 'DELIVERED', messageId: String(messageId) };
  } catch (e) {
    const error = `Solapi 호출 오류: ${e instanceof Error ? e.message : String(e)}`;
    console.error('[Alimtalk]', error);
    await logNotification(to, `${def.title} (발송 실패)`, `${error}\n${content}`);
    return { ...base, success: false, status: 'FAILED', error };
  }
}
