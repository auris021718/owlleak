import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sendAlimtalk } from "@/lib/alimtalk";

/**
 * 알림톡 수동 발송 (관리자/파트너 대시보드용)
 * - [보안] 로그인 세션 필수. 고객 견적 접수의 자동 발송은 /api/estimate가 서버 내부에서 직접 처리한다.
 *   (공개 엔드포인트로 두면 임의 번호로 스팸·과금이 발생할 수 있어 잠갔다)
 * - 실제 발송 로직은 src/lib/alimtalk.ts 공용 모듈을 쓴다.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "인증이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const { phoneNumber, templateId = "ESTIMATE_DISPATCH", templateParams = {} } = body;

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "전화번호를 입력해주세요." }, { status: 400 });
    }

    const result = await sendAlimtalk({
      to: String(phoneNumber),
      templateId: String(templateId),
      params: templateParams,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "알림톡 발송에 실패했습니다.", data: result },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        result.mode === "real"
          ? "알림톡이 실제 고객님께 성공적으로 발송되었습니다."
          : "알림톡 발송 테스트가 완료되었습니다. (테스트 모드)",
      data: {
        mode: result.mode,
        messageId: result.messageId,
        recipient: result.recipient,
        templateId: result.templateId,
        title: result.title,
        content: result.content,
        sentAt: new Date().toISOString(),
        status: result.status,
      },
    });
  } catch (error) {
    console.error("[Kakao Alimtalk Error]:", error);
    return NextResponse.json(
      { success: false, error: "알림톡 처리 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
