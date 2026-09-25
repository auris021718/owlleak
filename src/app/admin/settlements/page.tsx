"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Building2,
  Download,
  RefreshCw,
  DollarSign,
  AlertCircle,
  Eye,
  Trash2,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  MessageSquare
} from "lucide-react";
import KakaoAlimtalkModal from "@/components/kakao/KakaoAlimtalkModal";

interface Settlement {
  id: number;
  partnerId: number;
  taskId: number | null;
  amount: number;
  status: string; // 'pending' | 'paid'
  type?: string; // 'job_payout' | 'registration_dividend'
  rate?: number;
  createdAt: string;
  partner?: {
    id: number;
    companyName: string;
    contactName: string | null;
    phone: string;
  };
  task?: {
    id: number;
    title: string;
    customer?: {
      name: string | null;
      phone: string;
    };
    estimate?: {
      detectionFee: number | null;
      estimatedMinPrice: number | null;
    };
  };
}

interface PartnerOption {
  id: number;
  companyName: string;
}

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modals
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [alimtalkSettlement, setAlimtalkSettlement] = useState<Settlement | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Add Form
  const [formData, setFormData] = useState({
    partnerId: "",
    taskId: "",
    amount: "",
    status: "pending",
  });

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const [settleRes, partnerRes] = await Promise.all([
        fetch("/api/settlements"),
        fetch("/api/partners"),
      ]);
      const settleJson = await settleRes.json();
      const partnerJson = await partnerRes.json();

      if (settleJson.success && Array.isArray(settleJson.data)) {
        setSettlements(settleJson.data);
      }
      if (partnerJson.success && Array.isArray(partnerJson.data)) {
        setPartners(partnerJson.data);
      }
    } catch (e) {
      console.error("Failed to load settlements:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const handleStatusToggle = async (settlementId: number, currentStatus: string) => {
    const newStatus = currentStatus === "pending" ? "paid" : "pending";
    const confirmMsg =
      newStatus === "paid"
        ? "해당 정산 건을 '지급 완료' 처리하시겠습니까?"
        : "해당 정산 건을 다시 '지급 대기' 상태로 변경하시겠습니까?";

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/settlements/${settlementId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setSettlements((prev) =>
          prev.map((s) => (s.id === settlementId ? { ...s, status: newStatus } : s))
        );
      } else {
        alert(json.error || "상태 변경 실패");
      }
    } catch (e) {
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteSettlement = async (settlementId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("정산 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;

    try {
      const res = await fetch(`/api/settlements/${settlementId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setSettlements((prev) => prev.filter((s) => s.id !== settlementId));
        if (selectedSettlement?.id === settlementId) {
          setIsDetailModalOpen(false);
          setSelectedSettlement(null);
        }
      } else {
        alert(json.error || "삭제 실패");
      }
    } catch (e) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partnerId || !formData.amount) {
      alert("파트너사와 정산 금액을 입력해주세요.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: parseInt(formData.partnerId, 10),
          taskId: formData.taskId ? parseInt(formData.taskId, 10) : null,
          amount: parseInt(formData.amount, 10),
          status: formData.status,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSettlements((prev) => [json.data, ...prev]);
        setIsAddModalOpen(false);
        setFormData({ partnerId: "", taskId: "", amount: "", status: "pending" });
      } else {
        alert(json.error || "정산 등록 실패");
      }
    } catch (e) {
      alert("정산 등록 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (settlements.length === 0) {
      alert("내보낼 정산 데이터가 없습니다.");
      return;
    }

    const headers = ["정산ID", "파트너사", "연락처", "관련작업명", "고객명", "정산금액(원)", "상태", "등록일시"];
    const rows = settlements.map((s) => [
      s.id,
      `"${(s.partner?.companyName || "").replace(/"/g, '""')}"`,
      s.partner?.phone || "",
      `"${(s.task?.title || "직접정산").replace(/"/g, '""')}"`,
      s.task?.customer?.name || "-",
      s.amount,
      s.status === "paid" ? "지급완료" : "지급대기",
      new Date(s.createdAt).toLocaleDateString("ko-KR"),
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `owl_settlements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logic
  const filteredSettlements = settlements.filter((s) => {
    const matchSearch =
      (s.partner?.companyName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (s.task?.title?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (s.task?.customer?.name?.toLowerCase() || "").includes(search.toLowerCase());

    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    const matchPartner = partnerFilter === "all" || String(s.partnerId) === partnerFilter;
    const matchType = typeFilter === "all" || (s.type || "job_payout") === typeFilter;

    return matchSearch && matchStatus && matchPartner && matchType;
  });

  // Metrics
  const totalPaid = settlements
    .filter((s) => s.status === "paid")
    .reduce((sum, s) => sum + s.amount, 0);

  const totalPending = settlements
    .filter((s) => s.status === "pending")
    .reduce((sum, s) => sum + s.amount, 0);

  const pendingCount = settlements.filter((s) => s.status === "pending").length;
  const paidCount = settlements.filter((s) => s.status === "paid").length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CreditCard size={26} className="text-blue-600" />
            파트너 정산 관리
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            시공 완료 건에 대한 협력사 정산금 지급 승인, 미지급 내역 및 세무 증빙을 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSettlements}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            title="새로고침"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-blue-600" : ""} />
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold rounded-xl transition-all shadow-sm"
          >
            <Download size={16} className="text-slate-500" />
            CSV 내보내기
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
          >
            <Plus size={16} />
            신규 정산 등록
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-amber-700">미지급 정산 대기액</p>
              {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>}
            </div>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {totalPending.toLocaleString()}원
            </p>
            <span className="text-[11px] font-semibold text-amber-700/80 mt-0.5 block">
              총 {pendingCount}건 대기 중
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600">누적 지급 완료액</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {totalPaid.toLocaleString()}원
            </p>
            <span className="text-[11px] font-semibold text-emerald-600/80 mt-0.5 block">
              총 {paidCount}건 완료
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">총 정산 거래 건수</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{settlements.length}건</p>
            <span className="text-[11px] font-semibold text-slate-400 mt-0.5 block">
              평균 {(settlements.length > 0 ? Math.round((totalPaid + totalPending) / settlements.length) : 0).toLocaleString()}원/건
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Receipt size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">정산 대상 파트너</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{partners.length}개소</p>
            <span className="text-[11px] font-semibold text-slate-400 mt-0.5 block">
              전체 등록 협력사
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Building2 size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 overflow-x-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                statusFilter === "all" ? "bg-white text-slate-900 shadow-sm font-bold" : "hover:text-slate-900"
              }`}
            >
              전체 ({settlements.length})
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === "pending"
                  ? "bg-amber-500 text-white shadow-sm font-bold"
                  : "hover:text-slate-900 text-amber-700"
              }`}
            >
              지급 대기
              {pendingCount > 0 && (
                <span className="bg-white text-amber-700 px-1.5 py-0.2 rounded-full text-[10px]">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter("paid")}
              className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                statusFilter === "paid" ? "bg-emerald-600 text-white shadow-sm font-bold" : "hover:text-slate-900 text-emerald-700"
              }`}
            >
              지급 완료 ({paidCount})
            </button>
          </div>

          {/* Search & Partner Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="파트너사명, 작업명, 고객명..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
              />
              <Search size={15} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 파트너사</option>
              {partners.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.companyName}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">모든 정산 구분</option>
              <option value="job_payout">👷 시공 정산 (90~100%)</option>
              <option value="registration_dividend">💰 10% 일 등록 배당금</option>
            </select>
          </div>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">구분</th>
                <th className="px-6 py-4">파트너사</th>
                <th className="px-6 py-4">관련 현장 작업 / 고객</th>
                <th className="px-6 py-4 text-right">정산 지급액</th>
                <th className="px-6 py-4">상태</th>
                <th className="px-6 py-4">정산 발생일</th>
                <th className="px-6 py-4 text-center">지급 승인 액션</th>
                <th className="px-6 py-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    <CreditCard className="mx-auto mb-2 text-slate-300" size={32} />
                    일치하는 정산 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((settlement) => {
                  const isPaid = settlement.status === "paid";
                  const isPending = settlement.status === "pending";
                  const isDividend = settlement.type === "registration_dividend";

                  return (
                    <tr
                      key={settlement.id}
                      onClick={() => {
                        setSelectedSettlement(settlement);
                        setIsDetailModalOpen(true);
                      }}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                        #{settlement.id}
                      </td>

                      <td className="px-6 py-4">
                        {isDividend ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                            💰 10% 일 등록 배당
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            👷 시공비 ({settlement.rate || 100}%)
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs">
                            <Building2 size={15} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {settlement.partner?.companyName || `파트너 #${settlement.partnerId}`}
                            </p>
                            <span className="text-[11px] font-mono text-slate-400">
                              {settlement.partner?.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {settlement.task ? (
                          <div>
                            <p className="font-medium text-slate-800 text-xs">
                              {settlement.task.title}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              고객: {settlement.task.customer?.name || "미등록"} ({settlement.task.customer?.phone})
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">직접 등록 정산</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="font-mono font-bold text-slate-900 text-base">
                          {settlement.amount.toLocaleString()}원
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} /> 지급 완료
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            <Clock size={12} /> 지급 대기
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(settlement.createdAt).toLocaleDateString("ko-KR")}
                      </td>

                      {/* One Click Approval Action */}
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {isPending ? (
                          <button
                            onClick={() => handleStatusToggle(settlement.id, "pending")}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 mx-auto"
                          >
                            <CheckCircle2 size={13} />
                            지급 완료 처리
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusToggle(settlement.id, "paid")}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-all mx-auto"
                            title="대기 상태로 되돌리기"
                          >
                            지급 취소
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setAlimtalkSettlement(settlement)}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="정산 안내 알림톡 발송"
                          >
                            <MessageSquare size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSettlement(settlement);
                              setIsDetailModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="정산 상세 영수증"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteSettlement(settlement.id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="정산 삭제"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Settlement Detail Receipt */}
      {isDetailModalOpen && selectedSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={20} className="text-blue-400" />
                <h3 className="font-bold text-base">정산 상세 명세서 #{selectedSettlement.id}</h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-xs">수령 파트너사</span>
                  <span className="font-bold text-slate-800">{selectedSettlement.partner?.companyName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-xs">대표자 / 연락처</span>
                  <span className="text-slate-700 text-xs font-mono">{selectedSettlement.partner?.phone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-xs">정산 상태</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedSettlement.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {selectedSettlement.status === "paid" ? "지급 완료" : "지급 대기"}
                  </span>
                </div>
              </div>

              {selectedSettlement.task && (
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-2 text-xs">
                  <p className="font-bold text-blue-900">연결된 현장 작업 정보</p>
                  <p className="text-slate-700 font-medium">{selectedSettlement.task.title}</p>
                  <p className="text-slate-500">고객명: {selectedSettlement.task.customer?.name || "미등록"}</p>
                </div>
              )}

              {/* Amount Breakdown */}
              <div className="border-t border-slate-200 pt-4 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>정산 기준 금액</span>
                  <span className="font-mono">{selectedSettlement.amount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>원천징수/공제 세액 (3.3% 참고)</span>
                  <span className="font-mono text-slate-400">
                    {Math.round(selectedSettlement.amount * 0.033).toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between items-center text-base font-bold text-slate-900 pt-2 border-t border-slate-100">
                  <span>최종 실지급액</span>
                  <span className="text-blue-600 font-mono text-lg">
                    {selectedSettlement.amount.toLocaleString()}원
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                {selectedSettlement.status === "pending" ? (
                  <button
                    onClick={() => {
                      handleStatusToggle(selectedSettlement.id, "pending");
                      setIsDetailModalOpen(false);
                    }}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    지급 완료 승인하기
                  </button>
                ) : (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={14} /> 정상 지급 처리된 건입니다.
                  </span>
                )}

                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Settlement */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <CreditCard size={18} className="text-blue-400" />
                신규 파트너 정산 등록
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSettlement} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">파트너사 선택 *</label>
                <select
                  required
                  value={formData.partnerId}
                  onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">협력사를 선택하세요</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">정산 금액 (원) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="예: 350000"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">정산 상태</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="pending">지급 대기 (Pending)</option>
                  <option value="paid">지급 완료 (Paid)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20"
                >
                  {saving ? "저장 중..." : "정산 등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kakao Alimtalk Modal */}
      {alimtalkSettlement && (
        <KakaoAlimtalkModal
          isOpen={!!alimtalkSettlement}
          onClose={() => setAlimtalkSettlement(null)}
          defaultTemplate="SETTLEMENT_PAID"
          defaultPhone={alimtalkSettlement.partner?.phone || "010-0000-0000"}
          defaultParams={{
            partnerName: alimtalkSettlement.partner?.companyName || "협력사",
            taskTitle: alimtalkSettlement.task?.title || "누수 공사 정산",
            amount: alimtalkSettlement.amount || 350000,
          }}
        />
      )}
    </div>
  );
}
