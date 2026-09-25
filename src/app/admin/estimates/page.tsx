"use client";

import { useState, useEffect } from "react";
import {
  FileText, Search, ExternalLink, CalendarClock, Download,
  CheckCircle2, Clock, AlertTriangle, UserCheck, X, Loader2,
  Trash2, Phone, MapPin, Building2, Wrench, ShieldAlert, MessageSquare
} from "lucide-react";
import KakaoAlimtalkModal from "@/components/kakao/KakaoAlimtalkModal";

interface Estimate {
  id: number;
  customerPhone?: string;
  leakLocation?: string;
  leakAmount?: string;
  urgency?: string;
  floorLevel?: string;
  heatingTarget?: string;
  boilerBrand?: string;
  boilerError?: string;
  damageAreas?: string[];
  timing?: string;
  detectChecks?: string[];
  detectionFee?: number;
  requiredWorks?: string[];
  estimatedMinPrice?: number;
  estimatedMaxPrice?: number;
  detectionDetails?: string;
  parking?: boolean;
  elevator?: boolean;
  managerCheck?: boolean;
  downstairsCheck?: boolean;
  createdAt: string;
  customer?: { id: number; name: string; phone: string; address: string };
  task?: {
    id: number;
    title: string;
    status: string;
    partner?: { id: number; companyName: string; phone: string; specialty: string };
  };
}

export default function AdminEstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "assigned" | "unassigned">("all");

  // Modal states
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [assignModalEst, setAssignModalEst] = useState<Estimate | null>(null);
  const [alimtalkTargetEst, setAlimtalkTargetEst] = useState<Estimate | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [estRes, ptrRes] = await Promise.all([
        fetch("/api/estimates"),
        fetch("/api/partners?status=active"),
      ]);
      const estJson = await estRes.json();
      const ptrJson = await ptrRes.json();

      if (estJson.success && Array.isArray(estJson.data)) {
        setEstimates(estJson.data);
      }
      if (ptrJson.success && Array.isArray(ptrJson.data)) {
        setPartners(ptrJson.data);
      }
    } catch (err) {
      console.error("Failed to load admin estimates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignPartner = async () => {
    if (!assignModalEst || isAssigning) return;
    try {
      setIsAssigning(true);
      const res = await fetch(`/api/estimates/${assignModalEst.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: selectedPartnerId || null }),
      });
      const json = await res.json();
      if (json.success) {
        setEstimates(estimates.map((e) => (e.id === assignModalEst.id ? json.data : e)));
        setAssignModalEst(null);
        setSelectedPartnerId("");
      }
    } catch (err) {
      console.error("Failed to assign partner:", err);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteEstimate = async (id: number) => {
    if (!confirm("이 견적을 삭제하시겠습니까? 연결된 작업도 함께 삭제됩니다.")) return;
    try {
      await fetch(`/api/estimates/${id}`, { method: "DELETE" });
      setEstimates(estimates.filter((e) => e.id !== id));
      if (selectedEstimate?.id === id) setSelectedEstimate(null);
    } catch (err) {
      console.error("Failed to delete estimate:", err);
    }
  };

  const handleExportCSV = () => {
    if (estimates.length === 0) return;
    const headers = ["접수번호", "접수일시", "고객명", "연락처", "누수위치", "긴급도", "최소예상가", "최대예상가", "배정협력사"];
    const rows = estimates.map((e) => [
      `EST-${String(e.id).padStart(4, "0")}`,
      new Date(e.createdAt).toLocaleString("ko-KR"),
      e.customer?.name || "미상",
      e.customerPhone || e.customer?.phone || "",
      `"${e.leakLocation || ""}"`,
      e.urgency || "보통",
      e.estimatedMinPrice || 0,
      e.estimatedMaxPrice || 0,
      e.task?.partner?.companyName || "미배정",
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `부엉이누수_견적목록_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEstimates = estimates.filter((est) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (est.customerPhone || "").includes(query) ||
      (est.leakLocation || "").toLowerCase().includes(query) ||
      (est.customer?.name || "").toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "assigned"
        ? Boolean(est.task?.partner)
        : !est.task?.partner;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText size={24} className="text-emerald-600" />
            견적 및 작업 배정 관리
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            총 {estimates.length}건의 접수 견적을 조회하고 파트너를 배정하세요.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Download size={15} /> 엑셀 (CSV) 다운로드
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {[
            { id: "all", label: `전체 (${estimates.length})` },
            { id: "unassigned", label: `미배정 대기 (${estimates.filter((e) => !e.task?.partner).length})` },
            { id: "assigned", label: `배정 완료 (${estimates.filter((e) => e.task?.partner).length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                statusFilter === tab.id ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="고객명, 연락처, 누수위치 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
          />
          <Search size={15} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 size={28} className="animate-spin text-emerald-600" />
            <p className="text-xs">견적 데이터를 불러오는 중...</p>
          </div>
        ) : filteredEstimates.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            조건에 맞는 견적 내역이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">접수번호</th>
                  <th className="px-5 py-3.5">접수일시</th>
                  <th className="px-5 py-3.5">고객명 / 연락처</th>
                  <th className="px-5 py-3.5">누수 위치</th>
                  <th className="px-5 py-3.5">예상 견적가</th>
                  <th className="px-5 py-3.5">배정 협력사</th>
                  <th className="px-5 py-3.5 text-center">관리 액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEstimates.map((est) => {
                  const reqWorks = (est.requiredWorks as string[]) || [];
                  const isAssigned = Boolean(est.task?.partner);

                  return (
                    <tr key={est.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 text-slate-400 font-mono font-bold">
                        EST-{String(est.id).padStart(4, "0")}
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-medium">
                        {new Date(est.createdAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}{" "}
                        <span className="text-slate-400 text-[11px]">
                          {new Date(est.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800">{est.customer?.name || "익명 고객"}</div>
                        <div className="text-slate-400 font-mono mt-0.5">
                          {est.customerPhone || est.customer?.phone || "-"}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700 max-w-[200px] truncate">
                        <div className="font-medium truncate">{est.leakLocation || "-"}</div>
                        {est.urgency === "긴급" && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            긴급 출동
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-extrabold text-slate-900">
                          {new Intl.NumberFormat("ko-KR").format(est.estimatedMinPrice || 0)}원
                          <span className="text-slate-400 font-normal mx-1">~</span>
                          {new Intl.NumberFormat("ko-KR").format(est.estimatedMaxPrice || 0)}원
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {isAssigned ? (
                          <span className="inline-flex items-center gap-1.5 text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full text-xs font-bold">
                            <Building2 size={13} /> {est.task?.partner?.companyName}
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setAssignModalEst(est);
                              setSelectedPartnerId("");
                            }}
                            className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold transition"
                          >
                            <UserCheck size={13} /> 파트너 배정하기
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedEstimate(est)}
                            className="px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg transition"
                          >
                            상세보기
                          </button>
                          <button
                            onClick={() => setAlimtalkTargetEst(est)}
                            className="px-2.5 py-1.5 bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] font-bold rounded-lg transition flex items-center gap-1 text-xs"
                            title="고객 알림톡 발송"
                          >
                            <MessageSquare size={12} />
                            알림톡
                          </button>
                          {isAssigned && (
                            <button
                              onClick={() => {
                                setAssignModalEst(est);
                                setSelectedPartnerId(String(est.task?.partner?.id || ""));
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium rounded-lg transition"
                            >
                              재배정
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteEstimate(est.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                            title="견적 삭제"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Partner Assignment Modal */}
      {assignModalEst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <UserCheck size={18} className="text-emerald-600" />
                협력사 배정
              </h3>
              <button
                onClick={() => setAssignModalEst(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-600 border border-slate-100">
              <p><strong>접수번호:</strong> EST-{String(assignModalEst.id).padStart(4, "0")}</p>
              <p><strong>고객명:</strong> {assignModalEst.customer?.name || "고객"}</p>
              <p><strong>누수 위치:</strong> {assignModalEst.leakLocation || "현장"}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">담당 협력사 선택 *</label>
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium bg-white"
              >
                <option value="">-- 협력사를 선택하세요 --</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.companyName} ({p.specialty || "종합"} · {p.region || "전체"} · 평점 {p.rating}★)
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setAssignModalEst(null)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 text-xs"
              >
                취소
              </button>
              <button
                onClick={handleAssignPartner}
                disabled={isAssigning || !selectedPartnerId}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition text-xs flex items-center justify-center gap-1.5"
              >
                {isAssigning ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                배정 확정
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Estimate Modal */}
      {selectedEstimate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl p-7 shadow-2xl overflow-y-auto space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono font-bold text-slate-400">EST-{String(selectedEstimate.id).padStart(4, "0")}</span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">견적서 상세 내역</h2>
              </div>
              <button
                onClick={() => setSelectedEstimate(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer & Location */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div>
                <p className="text-slate-400 font-semibold mb-1">고객 정보</p>
                <p className="font-bold text-slate-800 text-sm">{selectedEstimate.customer?.name || "익명"}</p>
                <p className="text-slate-600 mt-0.5">{selectedEstimate.customerPhone || selectedEstimate.customer?.phone}</p>
                <p className="text-slate-500 mt-1">{selectedEstimate.customer?.address || "주소 미입력"}</p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold mb-1">현장 환경</p>
                <p className="text-slate-700">난방: {selectedEstimate.heatingTarget || "개별난방"} ({selectedEstimate.floorLevel || "층수 미입력"})</p>
                <p className="text-slate-700 mt-0.5">보일러: {selectedEstimate.boilerBrand || "없음"} (에러: {selectedEstimate.boilerError || "없음"})</p>
                <p className="text-slate-700 mt-0.5">
                  주차: {selectedEstimate.parking ? "가능" : "불가"} / E/V: {selectedEstimate.elevator ? "있음" : "없음"}
                </p>
              </div>
            </div>

            {/* Damage and Check items */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-800">피해 증상 및 누수 위치</h4>
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 text-slate-700">
                <p><strong>누수 위치:</strong> {selectedEstimate.leakLocation || "-"}</p>
                <p className="mt-1"><strong>증상 및 시점:</strong> {selectedEstimate.timing || selectedEstimate.leakAmount || "기록 없음"}</p>
              </div>

              {selectedEstimate.detectionDetails && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-800 mb-1">탐지 소견 및 상세 분석</p>
                  <p className="text-slate-600 leading-relaxed">{selectedEstimate.detectionDetails}</p>
                </div>
              )}
            </div>

            {/* Price calculation summary */}
            <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl text-white">
              <div className="flex justify-between items-center mb-2 text-xs text-slate-300">
                <span>기본 탐지비: {new Intl.NumberFormat("ko-KR").format(selectedEstimate.detectionFee || 0)}원</span>
                <span>긴급도: {selectedEstimate.urgency || "보통"}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-white/10">
                <span className="font-semibold text-sm">최종 예상 견적가</span>
                <span className="text-2xl font-extrabold text-yellow-400">
                  {new Intl.NumberFormat("ko-KR").format(selectedEstimate.estimatedMinPrice || 0)}원 ~ {new Intl.NumberFormat("ko-KR").format(selectedEstimate.estimatedMaxPrice || 0)}원
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEstimate(null)}
                className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl text-xs hover:bg-slate-700"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kakao Alimtalk Modal */}
      {alimtalkTargetEst && (
        <KakaoAlimtalkModal
          isOpen={!!alimtalkTargetEst}
          onClose={() => setAlimtalkTargetEst(null)}
          defaultTemplate="ESTIMATE_DISPATCH"
          defaultPhone={alimtalkTargetEst.customerPhone || alimtalkTargetEst.customer?.phone || "010-0000-0000"}
          defaultParams={{
            customerName: alimtalkTargetEst.customer?.name || "고객",
            leakLocation: alimtalkTargetEst.leakLocation || "현장",
            works: Array.isArray(alimtalkTargetEst.requiredWorks) ? alimtalkTargetEst.requiredWorks.join(", ") : "누수 정밀 탐지",
            detectionFee: alimtalkTargetEst.detectionFee || 300000,
            estimatedPrice: alimtalkTargetEst.estimatedMinPrice
              ? `${alimtalkTargetEst.estimatedMinPrice.toLocaleString()} ~ ${alimtalkTargetEst.estimatedMaxPrice?.toLocaleString() || ""}`
              : "300,000 ~ 500,000",
          }}
        />
      )}

    </div>
  );
}

