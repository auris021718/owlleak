import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const KAKAO_TEMPLATES: Record<string, { title: string; template: (p: any) => string; buttonText: string }> = {
  ESTIMATE_DISPATCH: {
    title: "[부엉이누수탐지랩] 견적서 발송 안내",
    template: (p: any) => `[부엉이누수탐지랩 견적 안내]
안녕하세요, ${p.customerName || "고객"}님.
요청하신 누수 탐지 및 공사 견적서가 도착했습니다.

■ 현장 위치: ${p.leakLocation || "현장"}
■ 신청 공종: ${p.works || "누수 정밀 탐지"}
■ 예상 탐지비: ${p.detectionFee ? `${Number(p.detectionFee).toLocaleString()}원` : "상담 후 결정"}
■ 예상 공사비: ${p.estimatedPrice ? `${p.estimatedPrice}원` : "현장 확인 후 안내"}

담당 엔지니어가 빠른 시일 내 연락드려 일정을 조율할 예정입니다.`,
    buttonText: "견적서 상세 확인하기",
  },
  EMERGENCY_DISPATCH: {
    title: "[부엉이누수] 🚨 긴급 출동 요청",
    template: (p: any) => `[긴급 출동 요청 — ${p.partnerName || "협력사"} 대표님]
인근 지역에 긴급 누수 탐지 요청이 접수되었습니다.

■ 고객명: ${p.customerName || "고객"}님
■ 현장 주소: ${p.address || "지역 미상"}
■ 요청 분야: ${p.works || "누수탐지/방수"}
■ 긴급 여부: 즉시 출동 요망

수락하시려면 앱에서 [수락] 버튼을 눌러주세요.`,
    buttonText: "배정 수락하기",
  },
  TASK_COMPLETED: {
    title: "[부엉이누수] 시공 완료 및 하자보증서 발급",
    template: (p: any) => `[시공 완료 안내]
${p.customerName || "고객"}님, 요청하신 누수 공사가 성공적으로 완료되었습니다.

■ 시공 업체: ${p.partnerName || "부엉이 협력점"}
■ 공사 내용: ${p.works || "배관 보수 및 방수 복구"}
■ 하자 보증 기간: 시공일로부터 2년 무상 보증

현장 시공 전/후 사진과 보증서를 링크에서 확인하실 수 있습니다.`,
    buttonText: "시공 사진 및 보증서 보기",
  },
  SETTLEMENT_PAID: {
    title: "[부엉이누수] 파트너 정산금 지급 완료 안내",
    template: (p: any) => `[정산금 지급 완료]
${p.partnerName || "파트너"} 대표님, 시공 완료 건에 대한 정산금이 정상 입금되었습니다.

■ 대상 작업: ${p.taskTitle || "누수 공사"}
■ 지급 금액: ${p.amount ? `${Number(p.amount).toLocaleString()}원` : "0원"}
■ 지급 일시: ${new Date().toLocaleDateString("ko-KR")}

부엉이누수탐지랩과 함께해 주셔서 감사합니다.`,
    buttonText: "정산 명세서 조회",
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, templateId = "ESTIMATE_DISPATCH", templateParams = {} } = body;

    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "전화번호를 입력해주세요." }, { status: 400 });
    }

    const templateConfig = KAKAO_TEMPLATES[templateId] || KAKAO_TEMPLATES.ESTIMATE_DISPATCH;
    const messageContent = templateConfig.template(templateParams);

    // Simulate realistic network delay (300-700ms)
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Create a Notification entry in DB for record tracking if user exists or system notification
    try {
      const adminUser = await prisma.user.findFirst({ where: { role: "admin" } });
      if (adminUser) {
        await prisma.notification.create({
          data: {
            userId: adminUser.id,
            type: "ALIMTALK",
            title: `[알림톡 발송] ${templateConfig.title}`,
            message: `수신: ${phoneNumber}\n${messageContent.slice(0, 100)}...`,
          },
        });
      }
    } catch (e) {
      console.warn("Notification logging optional:", e);
    }

    const messageId = `kakao_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return NextResponse.json({
      success: true,
      message: "알림톡이 성공적으로 발송되었습니다.",
      data: {
        messageId,
        recipient: phoneNumber,
        templateId,
        title: templateConfig.title,
        content: messageContent,
        buttonText: templateConfig.buttonText,
        sentAt: new Date().toISOString(),
        status: "DELIVERED",
      },
    });
  } catch (error) {
    console.error("[Kakao Alimtalk Error]:", error);
    return NextResponse.json(
      { success: false, error: "알림톡 발송 중 서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
