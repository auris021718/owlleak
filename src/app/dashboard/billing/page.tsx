"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Crown, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  CreditCard, 
  Calendar, 
  Receipt, 
  ArrowRight, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  Lock, 
  Zap,
  TrendingUp,
  Percent,
  Coins
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

export default function PartnerBillingPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cardNumber, setCardNumber] = useState("4902-****-****-8812");
  const [cardExpiry, setCardExpiry] = useState("12/29");
  const [cardOwner, setCardOwner] = useState("한성방수 대표");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchBillingStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/status");
      const data = await res.json();
      if (data.authenticated) {
        setIsMaster(data.isMaster);
        setSubscription(data.subscription);
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

    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNumber,
          cardExpiry,
          planPrice: 99000,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("👑 Master 파트너 월 정기구독(99,000원)이 성공적으로 활성화되었습니다!");
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
    if (!confirm("Master 파트너 구독을 해지하시겠습니까? 이번 달 만료일까지는 혜택이 유지됩니다.")) return;
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black rounded-full flex items-center gap-1.5">
                <Crown size={14} className="text-amber-400" />
                단일 프리미엄 멤버십
              </span>
              {isMaster ? (
                <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold rounded-full flex items-center gap-1">
                  <CheckCircle2 size={12} /> Master 구독 활성화 중
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-slate-800 text-slate-400 text-[11px] font-semibold rounded-full border border-slate-700">
                  일반 파트너
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              👑 Master 파트너 월 정기구독
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1.5 leading-relaxed">
              일감 최우선 배정, <span className="text-amber-300 font-bold">일 등록 시 10% 배당 수수료 자동 정산</span>, AI 및 보험 리포트 무제한 권한을 제공합니다.
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
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">ALL-IN-ONE MEMBERSHIP</span>
                <h2 className="text-xl font-bold text-white mt-1">부엉이 Master 파트너 단일 요금제</h2>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-amber-400">99,000<span className="text-sm font-normal text-slate-400">원 / 월</span></p>
                <p className="text-[11px] text-slate-500 mt-0.5">부가세 포함 · 매월 자동 결제</p>
              </div>
            </div>

            {/* Benefit Highlights */}
            <div className="py-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">포함된 프리미엄 혜택</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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
                      관할 지역(서초·강남 등) 신규 접수 건 발생 시 1순위 독점 알림 및 자동 추천.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl mt-0.5">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">AI 누수 판독 & 보일러 진단 무제한</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      현장 사진 AI 심층 분석 및 5대 보일러 에러코드 누수 위험도 실시간 진단.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl mt-0.5">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">보험 청구 리포트 & 알림톡 무제한</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      손해사정사용 공문서 양식 PDF 발급 및 고객 방문 카카오 알림톡 무제한.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>🛡️ 안전한 정기 결제 (언제든지 1클릭 위약금 없이 해지 가능)</span>
            <span className="text-amber-400 font-semibold">Master 파트너 전용</span>
          </div>
        </div>

        {/* Subscription / Payment Action Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={20} className="text-amber-400" />
              <h3 className="font-bold text-white text-base">결제 카드 등록 & 관리</h3>
            </div>

            {isMaster ? (
              /* Active Subscription Status */
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-emerald-300 font-bold">👑 Master 멤버십 이용 중</span>
                    <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-black rounded">구독 활성</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    다음 결제 예정일: <strong className="text-white">{subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "익월 동일자"}</strong>
                  </p>
                  <p className="text-xs text-slate-300">
                    결제 금액: <strong className="text-amber-300">99,000원 / 월</strong>
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
                  className="w-full py-3 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 border border-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  구독 해지 신청
                </button>
              </div>
            ) : (
              /* Subscription Form */
              <form onSubmit={handleSubscribe} className="space-y-3.5">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">카드 번호</label>
                  <div className="relative">
                    <CreditCard size={15} className="absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="0000-0000-0000-0000"
                      className="w-full bg-slate-950 border border-slate-700 text-white pl-10 pr-3 py-2.5 rounded-xl text-xs font-mono outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">유효기간</label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2.5 rounded-xl text-xs font-mono outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">카드 소유자명</label>
                    <input
                      type="text"
                      required
                      value={cardOwner}
                      onChange={(e) => setCardOwner(e.target.value)}
                      placeholder="홍길동"
                      className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2.5 rounded-xl text-xs outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <p className="flex items-center gap-1 text-slate-300 font-semibold">
                    <Lock size={12} className="text-amber-400" />
                    토스페이먼츠 보안 빌링 시스템 연동
                  </p>
                  <p>최초 1회 카드 등록 후 매월 99,000원이 자동 결제됩니다.</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Crown size={16} />
                  {submitting ? "결제 처리 중..." : "월 99,000원 Master 파트너 구독하기"}
                </button>
              </form>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[10px] text-slate-500 text-center">
            결제 문의: 1588-0000 (부엉이 파트너 지원센터)
          </div>
        </div>
      </div>

      {/* Payment History / Receipts */}
      {subscription && subscription.payments && subscription.payments.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Receipt size={16} className="text-amber-400" />
              월 정기결제 영수증 내역
            </h3>
            <span className="text-xs text-slate-400">총 {subscription.payments.length}건</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">주문번호</th>
                  <th className="px-4 py-3">플랜명</th>
                  <th className="px-4 py-3">결제 금액</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">결제 일시</th>
                  <th className="px-4 py-3 text-right">전자 영수증</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {subscription.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400">{p.orderId}</td>
                    <td className="px-4 py-3 font-semibold text-white">Master 파트너 월구독</td>
                    <td className="px-4 py-3 font-bold text-amber-400">{p.amount.toLocaleString()}원</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{new Date(p.paidAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => alert(`[전자 영수증 확인]\n주문번호: ${p.orderId}\n금액: ${p.amount.toLocaleString()}원 (부가세 포함)\n승인완료: 토스페이먼츠 정기결제`)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium"
                      >
                        영수증 보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
