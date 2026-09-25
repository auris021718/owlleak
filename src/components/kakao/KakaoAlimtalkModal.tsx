"use client";

import { useState } from "react";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Phone,
  Building2,
  ExternalLink,
  Sparkles,
  AlertCircle
} from "lucide-react";

interface KakaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTemplate?: "ESTIMATE_DISPATCH" | "EMERGENCY_DISPATCH" | "TASK_COMPLETED" | "SETTLEMENT_PAID";
  defaultPhone?: string;
  defaultParams?: Record<string, any>;
}

const TEMPLATE_OPTIONS = [
  { id: "ESTIMATE_DISPATCH", label: "고객 견적서 발송 안내" },
  { id: "EMERGENCY_DISPATCH", label: "협력사 긴급 출동 요청" },
  { id: "TASK_COMPLETED", label: "시공 완료 및 하자보증서 발급" },
  { id: "SETTLEMENT_PAID", label: "파트너 정산금 입금 완료 안내" },
];

export default function KakaoAlimtalkModal({
  isOpen,
  onClose,
  defaultTemplate = "ESTIMATE_DISPATCH",
  defaultPhone = "010-1234-5678",
  defaultParams = {},
}: KakaoModalProps) {
  const [templateId, setTemplateId] = useState(defaultTemplate);
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone);
  const [params, setParams] = useState({
    customerName: defaultParams.customerName || "홍길동",
    partnerName: defaultParams.partnerName || "서울누수종합방수",
    leakLocation: defaultParams.leakLocation || "서울 강남구 역삼동 화장실",
    works: defaultParams.works || "누수 정밀 탐지 + 배관 보수",
    detectionFee: defaultParams.detectionFee || 350000,
    estimatedPrice: defaultParams.estimatedPrice || "500,000 ~ 800,000",
    amount: defaultParams.amount || 350000,
    address: defaultParams.address || "서울 강남구 역삼동 123",
    taskTitle: defaultParams.taskTitle || "역삼동 아파트 온수배관 누수 수리",
  });

  const [sending, setSending] = useState(false);
  const [sentResult, setSentResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleSend = async () => {
    setSending(true);
    setSentResult(null);
    try {
      const res = await fetch("/api/kakao/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          templateId,
          templateParams: params,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSentResult(json.data);
      } else {
        alert(json.error || "발송 실패");
      }
    } catch (e) {
      alert("알림톡 발송 중 오류가 발생했습니다.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FEE500] text-[#3C1E1E] flex items-center justify-between font-bold">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#3C1E1E] rounded-lg flex items-center justify-center text-[#FEE500]">
              <MessageSquare size={16} />
            </div>
            <span className="text-base tracking-tight">카카오 비즈메시지 알림톡 발송 센터</span>
          </div>
          <button
            onClick={onClose}
            className="text-[#3C1E1E]/70 hover:text-[#3C1E1E] p-1 rounded-lg hover:bg-black/10 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          {/* Left: Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">알림톡 템플릿 선택</label>
              <select
                value={templateId}
                onChange={(e) => {
                  setTemplateId(e.target.value as any);
                  setSentResult(null);
                }}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white text-xs font-semibold"
              >
                {TEMPLATE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">수신 전화번호</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 text-xs font-mono"
                />
              </div>
            </div>

            {/* Dynamic variable inputs */}
            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2.5">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">메시지 변수 설정</p>
              
              {templateId === "ESTIMATE_DISPATCH" && (
                <>
                  <div>
                    <span className="text-xs text-gray-500 block mb-0.5">고객명</span>
                    <input
                      type="text"
                      value={params.customerName}
                      onChange={(e) => setParams({ ...params, customerName: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-0.5">현장 위치</span>
                    <input
                      type="text"
                      value={params.leakLocation}
                      onChange={(e) => setParams({ ...params, leakLocation: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-0.5">탐지비 (원)</span>
                    <input
                      type="number"
                      value={params.detectionFee}
                      onChange={(e) => setParams({ ...params, detectionFee: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                </>
              )}

              {templateId === "EMERGENCY_DISPATCH" && (
                <>
                  <div>
                    <span className="text-xs text-gray-500 block mb-0.5">협력사명</span>
                    <input
                      type="text"
                      value={params.partnerName}
                      onChange={(e) => setParams({ ...params, partnerName: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-0.5">현장 주소</span>
                    <input
                      type="text"
                      value={params.address}
                      onChange={(e) => setParams({ ...params, address: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                </>
              )}

              {templateId === "SETTLEMENT_PAID" && (
                <>
                  <div>
                    <span className="text-xs text-gray-500 block mb-0.5">수령 파트너사</span>
                    <input
                      type="text"
                      value={params.partnerName}
                      onChange={(e) => setParams({ ...params, partnerName: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-0.5">지급 정산액 (원)</span>
                    <input
                      type="number"
                      value={params.amount}
                      onChange={(e) => setParams({ ...params, amount: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                </>
              )}

              {templateId === "TASK_COMPLETED" && (
                <>
                  <div>
                    <span className="text-xs text-gray-500 block mb-0.5">고객명</span>
                    <input
                      type="text"
                      value={params.customerName}
                      onChange={(e) => setParams({ ...params, customerName: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-0.5">시공 파트너명</span>
                    <input
                      type="text"
                      value={params.partnerName}
                      onChange={(e) => setParams({ ...params, partnerName: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                    />
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={sending || !phoneNumber}
              className="w-full py-3 bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] font-black rounded-2xl shadow transition-all flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#3C1E1E] border-t-transparent rounded-full animate-spin"></div>
                  알림톡 발송 중...
                </>
              ) : (
                <>
                  <Send size={16} />
                  알림톡 즉시 발송
                </>
              )}
            </button>
          </div>

          {/* Right: Kakao Talk Phone Mockup Preview */}
          <div className="bg-[#B2C7D9] p-4 rounded-3xl border border-gray-200 flex flex-col shadow-inner">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 text-xs text-[#3C1E1E] font-bold">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-yellow-400 border border-[#3C1E1E]"></span>
                부엉이누수 알림톡
              </span>
              <span className="text-[10px] bg-black/10 px-2 py-0.5 rounded-full">카카오 비즈인증</span>
            </div>

            <div className="flex-1 py-4 space-y-3">
              {/* Bubble */}
              <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-black/5 text-xs text-gray-800 space-y-2">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="font-bold text-yellow-800 flex items-center gap-1">
                    <Sparkles size={13} className="text-yellow-500" />
                    알림톡 도착
                  </span>
                  <span className="text-[10px] text-gray-400">오전 10:30</span>
                </div>

                <div className="whitespace-pre-line leading-relaxed font-sans text-[11px] text-gray-700">
                  {templateId === "ESTIMATE_DISPATCH" && (
                    <>
                      <p className="font-bold text-gray-900 mb-1">[부엉이누수탐지랩 견적 안내]</p>
                      안녕하세요, <strong>{params.customerName}</strong>님.<br />
                      요청하신 누수 탐지 및 공사 견적서가 도착했습니다.<br /><br />
                      ■ 현장 위치: {params.leakLocation}<br />
                      ■ 신청 공종: {params.works}<br />
                      ■ 예상 탐지비: {params.detectionFee?.toLocaleString()}원<br />
                      ■ 예상 공사비: {params.estimatedPrice}원<br /><br />
                      담당 엔지니어가 빠른 시일 내 연락드려 일정을 조율할 예정입니다.
                    </>
                  )}

                  {templateId === "EMERGENCY_DISPATCH" && (
                    <>
                      <p className="font-bold text-red-600 mb-1">[긴급 출동 요청 — {params.partnerName} 대표님]</p>
                      인근 지역에 긴급 누수 탐지 요청이 접수되었습니다.<br /><br />
                      ■ 고객명: {params.customerName}님<br />
                      ■ 현장 주소: {params.address}<br />
                      ■ 긴급 여부: 즉시 출동 요망<br /><br />
                      수락하시려면 앱에서 [수락] 버튼을 눌러주세요.
                    </>
                  )}

                  {templateId === "TASK_COMPLETED" && (
                    <>
                      <p className="font-bold text-emerald-700 mb-1">[시공 완료 및 보증서 발급]</p>
                      {params.customerName}님, 요청하신 누수 공사가 성공적으로 완료되었습니다.<br /><br />
                      ■ 시공 업체: {params.partnerName}<br />
                      ■ 하자 보증: 시공일로부터 2년 무상 보증<br /><br />
                      현장 시공 전/후 사진과 보증서를 링크에서 확인하세요.
                    </>
                  )}

                  {templateId === "SETTLEMENT_PAID" && (
                    <>
                      <p className="font-bold text-blue-700 mb-1">[정산금 지급 완료]</p>
                      {params.partnerName} 대표님, 시공 완료 건에 대한 정산금이 정상 입금되었습니다.<br /><br />
                      ■ 지급 금액: {params.amount?.toLocaleString()}원<br />
                      ■ 지급 일시: {new Date().toLocaleDateString("ko-KR")}<br /><br />
                      부엉이누수탐지랩과 함께해 주셔서 감사합니다.
                    </>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-center font-bold rounded-xl text-xs flex items-center justify-center gap-1">
                    <span>상세 링크 바로가기</span>
                    <ExternalLink size={12} />
                  </div>
                </div>
              </div>

              {/* Delivery Success Toast */}
              {sentResult && (
                <div className="p-3 bg-emerald-600 text-white rounded-2xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <div>
                    <p className="font-bold">발송 완료 (Mock Delivery)</p>
                    <p className="text-[10px] opacity-90">ID: {sentResult.messageId}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
