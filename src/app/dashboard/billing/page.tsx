"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Crown, 
  ShieldCheck, 
  CheckCircle2, 
  CreditCard, 
  Receipt, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  TrendingUp, 
  Coins,
  Wrench,
  Building2,
  Check
} from "lucide-react";

interface PaymentItem {
  id: number;
  amount: number;
  orderId: string;
  status: string;
  receiptUrl: string | null;
  paidAt: string;
}

interface SubscriptionData {
  id: number;
  planType: string;
  status: string;
  price: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  canceledAt: string | null;
  payments: PaymentItem[];
}

interface Classification {
  isCooperating: boolean;
  typeLabel: "협력사" | "파트너";
  planType: "cooperating" | "master";
  planName: string;
  monthlyPrice: number;
}

export default function PartnerBillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [classification, setClassification] = useState<Classification | null>(null);
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cardNumber, setCardNumber] = useState("4902-****-****-8812");
  const [cardExpiry, setCardExpiry] = useState("12/29");
  const [cardOwner, setCardOwner] = useState("대표자");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchBillingStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/status");
      const data = await res.json();
      if (data.authenticated) {
        setIsSubscribed(data.isSubscribed || data.isMaster || false);
        setSubscription(data.subscription);
        setClassification(data.classification);
        setSpecialty(data.specialty);
      }
    } catch (err) {
      console.error("Failed to load billing status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingStatus();
  }, []);

  const handleSubscribe = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const targetPrice = classification?.monthlyPrice || 99000;

    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNumber,
          cardExpiry,
          planPrice: targetPrice,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`🎉 ${classification?.planName || '정기구독'}(${targetPrice.toLocaleString()}원)이 성공적으로 활성화되었습니다!`);
        fetchBillingStatus();
      } else {
        setErrorMsg(data.error || "결제 처리에 실패했습니다.");
      }
    } catch (err) {
      setErrorMsg("구독 신청 중 네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("정기구독을 해지하시겠습니까? 이번 달 만료일까지는 혜택이 유지됩니다.")) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("구독이 정상적으로 해지되었습니다.");
        fetchBillingStatus();
      } else {
        setErrorMsg(data.error || "해지 처리에 실패했습니다.");
      }
    } catch (err) {
      setErrorMsg("해지 처리 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const isCooperating = classification?.isCooperating ?? false;
  const currentPrice = classification?.monthlyPrice ?? 99000;
  const planTitle = classification?.planName ?? (isCooperating ? "협력사 월 정기구독" : "Master 파트너 월 정기구독");

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className={`bg-gradient-to-r ${isCooperating ? "from-slate-900 via-blue-950/40 to-slate-900 border-blue-500/30" : "from-slate-900 via-amber-950/30 to-slate-900 border-amber-500/30"} border rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-96 h-96 ${isCooperating ? "bg-blue-500/10" : "bg-amber-500/10"} rounded-full blur-3xl pointer-events-none`}></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 ${isCooperating ? "bg-blue-500/20 border-blue-500/40 text-blue-300" : "bg-amber-500/20 border-amber-500/40 text-amber-300"} border text-xs font-black rounded-full flex items-center gap-1.5`}>
                {isCooperating ? <Building2 size={14} className="text-blue-400" /> : <Crown size={14} className="text-amber-400" />}
                {isCooperating ? "협력사 정기 멤버십" : "Master 파트너 멤버십"}
              </span>
              {specialty && (
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-[11px] font-medium rounded-full border border-slate-700">
                  주업: {specialty}
                </span>
              )}
              {isSubscribed ? (
                <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold rounded-full flex items-center gap-1">
                  <CheckCircle2 size={12} /> 구독 활성화 중
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-slate-800 text-slate-400 text-[11px] font-semibold rounded-full border border-slate-700">
                  미구독 파트너
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {isCooperating ? "🤝 협력사 월 정기구독 (월 55,000원)" : "👑 Master 파트너 월 정기구독 (월 99,000원)"}
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1.5 leading-relaxed">
              {isCooperating ? (
                <>방수·타일·미장·도배·목수·전기·내시경·고압세척 주업 업체를 위한 <span className="text-blue-300 font-bold">월 55,000원 협력사 전용 멤버십</span>입니다.</>
              ) : (
                <>누수탐지 핵심 파트너를 위한 <span className="text-amber-300 font-bold">월 99,000원 프리미엄 멤버십</span> (일 등록 시 10% 배당 수수료 자동 정산)</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchBillingStatus}
              disabled={loading}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-all flex items-center gap-2 text-xs font-semibold"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              새로고침
            </button>
            <Link
              href="/dashboard"
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl border border-slate-700 transition-all"
            >
              대시보드로 돌아가기
            </Link>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Pricing & Plan Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Feature Card */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div>
                <span className={`text-xs font-bold ${isCooperating ? "text-blue-400" : "text-amber-400"} uppercase tracking-wider`}>
                  {isCooperating ? "COOPERATING PARTNER MEMBERSHIP" : "MASTER PARTNER MEMBERSHIP"}
                </span>
                <h2 className="text-xl font-bold text-white mt-1">{planTitle}</h2>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-black ${isCooperating ? "text-blue-400" : "text-amber-400"}`}>
                  {currentPrice.toLocaleString()}<span className="text-sm font-normal text-slate-400">원 / 월</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">부가세 포함 · 매월 자동 결제</p>
              </div>
            </div>

            {/* Benefit Highlights */}
            <div className="py-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">포함된 멤버십 혜택</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {isCooperating ? (
                  <>
                    <div className="p-4 bg-slate-950/80 border border-blue-500/30 rounded-2xl flex items-start gap-3">
                      <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl mt-0.5">
                        <Wrench size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">전문 분야 현장 일감 알림</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          방수, 타일, 미장, 도배, 목수, 전기 등 <strong className="text-blue-300">내 주업 분야 실시간 현장 연결</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start gap-3">
                      <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl mt-0.5">
                        <Coins size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">파트너 제시 금액 100% 수령</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          파트너가 연결한 후속 복구 공사 시 <strong className="text-emerald-300">파트너가 제시/합의한 시공 금액 100% 수령</strong>.
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-slate-950/80 border border-amber-500/30 rounded-2xl flex items-start gap-3">
                      <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl mt-0.5">
                        <Coins size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">일 등록 10% 배당 수수료 정산</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          내가 등록한 고객을 타 파트너가 시공 완료 시 <strong className="text-amber-300">공사비의 10% 자동 배당 정산</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start gap-3">
                      <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl mt-0.5">
                        <TrendingUp size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">지역 일감 실시간 최우선 배정</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          관할 지역 신규 접수 건 발생 시 1순위 독점 알림 및 자동 추천.
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl mt-0.5">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">AI 진단 및 보험 리포트 무제한</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      현장 사진 AI 심층 분석 및 손해사정사용 공문서 양식 PDF 발급.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl mt-0.5">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">카카오 알림톡 무제한 제공</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      고객 방문 및 견적안 발송 시 카카오 알림톡 무제한 자동 발송.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>🛡️ 안전한 정기 결제 (위약금 없이 언제든 1클릭 해지 가능)</span>
            <span className={isCooperating ? "text-blue-400 font-semibold" : "text-amber-400 font-semibold"}>
              {isCooperating ? "협력사 전용 (월 55,000원)" : "Master 파트너 전용 (월 99,000원)"}
            </span>
          </div>
        </div>

        {/* Subscription / Payment Action Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={20} className={isCooperating ? "text-blue-400" : "text-amber-400"} />
              <h3 className="font-bold text-white text-base">결제 카드 등록 & 관리</h3>
            </div>

            {isSubscribed ? (
              /* Active Subscription Status */
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-300 font-bold">
                      {isCooperating ? "🤝 협력사 멤버십 이용 중" : "👑 Master 파트너 멤버십 이용 중"}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-black rounded">구독 활성</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    다음 결제 예정일: <strong className="text-white">{subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "익월 동일자"}</strong>
                  </p>
                  <p className="text-xs text-slate-300">
                    결제 금액: <strong className={isCooperating ? "text-blue-300" : "text-amber-300"}>{currentPrice.toLocaleString()}원 / 월</strong>
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1 text-xs text-slate-400">
                  <p>• 등록 카드: <span className="text-white font-mono">{cardNumber}</span></p>
                  <p>• 예금주: <span className="text-white">{cardOwner}</span></p>
                </div>

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="w-full py-3 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 text-slate-400 border border-slate-700 hover:border-rose-500/40 text-xs font-bold rounded-2xl transition-all"
                >
                  {submitting ? "처리 중..." : "정기구독 해지하기"}
                </button>
              </div>
            ) : (
              /* Subscription Form */
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">카드 번호</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4902-****-****-8812"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">유효기간</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">소유자</label>
                      <input
                        type="text"
                        value={cardOwner}
                        onChange={(e) => setCardOwner(e.target.value)}
                        placeholder="홍길동"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`w-full py-3.5 ${isCooperating ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white" : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black"} font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2`}
                >
                  {submitting ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <>
                      {isCooperating ? <Wrench size={16} /> : <Crown size={16} />}
                      {currentPrice.toLocaleString()}원/월 결제 등록
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
            <p>• 결제는 등록된 카드로 매월 자동 청구됩니다.</p>
            <p>• 문의: owl-support@owl-leak.kr</p>
          </div>
        </div>
      </div>

      {/* Payment History Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Receipt size={20} className="text-slate-400" />
            <h3 className="font-bold text-white text-base">결제 내역</h3>
          </div>
          <span className="text-xs text-slate-400">최근 {subscription?.payments?.length || 0}건</span>
        </div>

        {subscription?.payments && subscription.payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">결제 일시</th>
                  <th className="py-3 px-4">주문 번호</th>
                  <th className="py-3 px-4">결제 금액</th>
                  <th className="py-3 px-4">상태</th>
                  <th className="py-3 px-4 text-right">영수증</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {subscription.payments.map((pm) => (
                  <tr key={pm.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4">{new Date(pm.paidAt).toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{pm.orderId}</td>
                    <td className="py-3 px-4 font-bold text-white">{pm.amount.toLocaleString()}원</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded border border-emerald-500/30">
                        {pm.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {pm.receiptUrl ? (
                        <a
                          href={pm.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-400 hover:underline font-semibold"
                        >
                          전표 확인
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            아직 결제 내역이 존재하지 않습니다.
          </div>
        )}
      </div>
    </div>
  );
}
