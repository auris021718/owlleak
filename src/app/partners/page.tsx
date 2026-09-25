"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Phone, Mail, Users, Briefcase,
  Star, CheckCircle2, Clock, XCircle, Building2,
  Search, Filter, MapPin, Hash, Loader2, Trash2,
  CreditCard, DollarSign, Receipt, ArrowUpRight
} from "lucide-react";

type PartnerStatus = "active" | "pending" | "inactive";
type PartnerType = "누수" | "방수" | "배관" | "도배" | "미장" | "전기" | "타일" | "목수" | "하수도고압세척" | "마루부분시공";

interface Partner {
  id: number | string;
  companyName: string;
  specialty?: string;
  contactName?: string;
  phone: string;
  email?: string;
  region?: string;
  partnerCode?: string;
  status: PartnerStatus;
  rating: number;
  completedJobs: number;
  memo?: string;
  _count?: { tasks: number };
}

interface SettlementItem {
  id: number;
  partnerId: number;
  amount: number;
  status: string;
  createdAt: string;
  task?: { title: string };
  partner?: { companyName: string };
}

const TYPE_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  누수: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" },
  방수: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  배관: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  도배: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  미장: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  전기: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  타일: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  목수: { bg: "bg-lime-50", text: "text-lime-700", border: "border-lime-200" },
  하수도고압세척: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  마루부분시공: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
};

const STATUS_CONFIG: Record<PartnerStatus, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  active: {
    label: "활성",
    icon: <CheckCircle2 size={12} />,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  pending: {
    label: "검토중",
    icon: <Clock size={12} />,
    bg: "bg-yellow-50",
    text: "text-yellow-700",
  },
  inactive: {
    label: "비활성",
    icon: <XCircle size={12} />,
    bg: "bg-gray-100",
    text: "text-gray-500",
  },
};

const PARTNER_TYPES: PartnerType[] = ["누수", "방수", "배관", "도배", "미장", "전기", "타일", "목수", "하수도고압세척", "마루부분시공"];

export default function PartnersPage() {
  const [activeTab, setActiveTab] = useState<"partners" | "settlements">("partners");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<PartnerStatus | "all">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    companyName: "",
    specialty: "방수" as PartnerType,
    contactName: "",
    phone: "",
    email: "",
    region: "",
    partnerCode: "",
    memo: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [partnerRes, settleRes] = await Promise.all([
        fetch("/api/partners"),
        fetch("/api/settlements"),
      ]);
      const partnerJson = await partnerRes.json();
      const settleJson = await settleRes.json();

      if (partnerJson.success && Array.isArray(partnerJson.data)) {
        setPartners(partnerJson.data);
      }
      if (settleJson.success && Array.isArray(settleJson.data)) {
        setSettlements(settleJson.data);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.phone || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setPartners([json.data, ...partners]);
        setIsModalOpen(false);
        setFormData({ companyName: "", specialty: "방수", contactName: "", phone: "", email: "", region: "", partnerCode: "", memo: "" });
      }
    } catch (err) {
      console.error("Failed to add partner:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number | string, newStatus: PartnerStatus) => {
    setPartners(partners.map(p => p.id === id ? { ...p, status: newStatus } : p));
    try {
      await fetch(`/api/partners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update status:", err);
      fetchData();
    }
  };

  const handleDeletePartner = async (id: number | string) => {
    if (!confirm("이 협력사를 삭제하시겠습니까?")) return;
    setPartners(partners.filter(p => p.id !== id));
    try {
      await fetch(`/api/partners/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete partner:", err);
      fetchData();
    }
  };

  // 필터링된 파트너 목록
  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      p.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.contactName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.specialty || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // 요약 통계
  const totalPartners = partners.length;
  const activePartners = partners.filter((p) => p.status === "active").length;
  const totalJobs = partners.reduce((sum, p) => sum + (p.completedJobs || 0), 0);

  const totalSettled = settlements.filter(s => s.status === "paid").reduce((sum, s) => sum + s.amount, 0);
  const totalPending = settlements.filter(s => s.status === "pending").reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans sm:bg-gray-100 sm:items-center sm:py-10">
      <main className="flex flex-col w-full max-w-md bg-white min-h-screen sm:min-h-full sm:rounded-3xl sm:overflow-hidden sm:shadow-2xl relative">

        {/* 헤더 */}
        <header className="flex items-center justify-between px-4 py-4 bg-slate-900 text-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-2 rounded-full hover:bg-slate-700 transition-colors text-slate-300">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center">
                <Users size={14} className="text-slate-900" />
              </div>
              <h1 className="text-lg font-bold tracking-tight">협력사 포털</h1>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-yellow-400 text-slate-900 text-sm font-bold px-3 py-2 rounded-xl hover:bg-yellow-300 transition-colors shadow"
          >
            <Plus size={16} />
            업체 등록
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900 px-6 pt-2 pb-3 gap-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab("partners")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "partners"
                ? "bg-white text-slate-900 shadow"
                : "text-slate-400 hover:text-white bg-slate-800/80"
            }`}
          >
            협력사 목록
          </button>
          <button
            onClick={() => setActiveTab("settlements")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "settlements"
                ? "bg-white text-slate-900 shadow"
                : "text-slate-400 hover:text-white bg-slate-800/80"
            }`}
          >
            <CreditCard size={13} />
            정산 내역 ({settlements.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-24">
          {activeTab === "partners" ? (
            <>
              {/* 요약 카드 섹션 */}
              <div className="bg-slate-900 px-6 pb-6 pt-2">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-800 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{totalPartners}</div>
                    <div className="text-xs text-slate-400 mt-1">등록 파트너</div>
                  </div>
                  <div className="bg-slate-800 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{activePartners}</div>
                    <div className="text-xs text-slate-400 mt-1">활성 파트너</div>
                  </div>
                  <div className="bg-slate-800 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{totalJobs}</div>
                    <div className="text-xs text-slate-400 mt-1">총 완공</div>
                  </div>
                </div>
              </div>

              {/* 검색 및 필터 */}
              <div className="px-6 py-4 space-y-3 border-b border-gray-100">
                {/* 검색창 */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="업체명, 담당자, 업종으로 검색"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                {/* 상태 필터 */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {(["all", "active", "pending", "inactive"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        filterStatus === status
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {status === "all" ? "전체" : STATUS_CONFIG[status]?.label || status}
                    </button>
                  ))}
                </div>
              </div>

              {/* 파트너 목록 */}
              <div className="px-6 py-4 space-y-3">
                <h2 className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                  <Filter size={12} />
                  파트너 목록 ({filteredPartners.length})
                </h2>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                    <Loader2 size={28} className="animate-spin text-blue-600" />
                    <p className="text-xs">파트너 목록을 불러오는 중...</p>
                  </div>
                ) : filteredPartners.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Building2 size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400 font-medium">조건에 맞는 파트너가 없습니다.</p>
                  </div>
                ) : (
                  filteredPartners.map((partner) => {
                    const typeColor = TYPE_COLOR[partner.specialty || "방수"] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
                    const statusCfg = STATUS_CONFIG[partner.status] || STATUS_CONFIG.pending;
                    return (
                      <div
                        key={partner.id}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group overflow-hidden"
                      >
                        <div className="p-4 pb-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${typeColor.bg} ${typeColor.text} ${typeColor.border}`}>
                                {partner.specialty || "종합설비"}
                              </span>
                              <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                                {statusCfg.icon}
                                {statusCfg.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-yellow-400">
                              {partner.rating > 0 ? (
                                <>
                                  <Star size={13} fill="currentColor" />
                                  <span className="text-xs font-bold text-gray-700">{partner.rating.toFixed(1)}</span>
                                </>
                              ) : (
                                <span className="text-xs text-gray-400">미평가</span>
                              )}
                            </div>
                          </div>

                          <h3 className="font-bold text-gray-900 text-base">{partner.companyName}</h3>
                          {partner.contactName && (
                            <p className="text-sm text-gray-500 mt-0.5">담당자: {partner.contactName}</p>
                          )}

                          <div className="flex flex-wrap gap-2 mt-2">
                            {partner.region && (
                              <span className="flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                                <MapPin size={11} />
                                {partner.region}
                              </span>
                            )}
                            {partner.partnerCode && (
                              <span className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-full font-mono font-semibold">
                                <Hash size={11} />
                                {partner.partnerCode}
                              </span>
                            )}
                          </div>

                          {partner.memo && (
                            <p className="text-xs text-gray-400 mt-2 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
                              💬 {partner.memo}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-50 px-4 py-3 bg-gray-50/50">
                          <div className="flex gap-2 items-center">
                            <a
                              href={`tel:${partner.phone}`}
                              className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"
                            >
                              <Phone size={12} />
                              {partner.phone}
                            </a>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={partner.status}
                              onChange={(e) => handleStatusChange(partner.id, e.target.value as PartnerStatus)}
                              className="text-[11px] px-2 py-1 rounded-md border border-gray-200 bg-white font-medium text-gray-700 outline-none"
                            >
                              <option value="active">활성</option>
                              <option value="pending">검토중</option>
                              <option value="inactive">비활성</option>
                            </select>
                            <button
                              onClick={() => handleDeletePartner(partner.id)}
                              className="p-1 text-gray-300 hover:text-red-500 rounded transition"
                              title="파트너 삭제"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* Settlements Tab */
            <div className="p-6 space-y-4">
              {/* Settlement Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-xs text-emerald-600 font-bold block mb-1">지급 완료 정산</span>
                  <p className="text-xl font-black text-emerald-700">{totalSettled.toLocaleString()}원</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <span className="text-xs text-amber-600 font-bold block mb-1">지급 대기 정산</span>
                  <p className="text-xl font-black text-amber-600">{totalPending.toLocaleString()}원</p>
                </div>
              </div>

              {/* Settlement List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400">파트너 정산 내역 ({settlements.length})</h3>
                {settlements.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    정산 내역이 없습니다.
                  </p>
                ) : (
                  settlements.map((s) => (
                    <div key={s.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-sm">
                          {s.partner?.companyName || `파트너 #${s.partnerId}`}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          s.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {s.status === "paid" ? "지급완료" : "지급대기"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{s.task?.title || "작업 정산"}</span>
                        <span className="font-mono font-bold text-gray-900 text-sm">
                          {s.amount.toLocaleString()}원
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono pt-1 border-t border-gray-50">
                        {new Date(s.createdAt).toLocaleDateString("ko-KR")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 파트너 등록 모달 */}
        {isModalOpen && (
          <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
            <div className="bg-white w-full h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto animate-in slide-in-from-bottom-10 sm:zoom-in flex flex-col">
              <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">협력사 등록</h2>
                  <p className="text-xs text-gray-500 mt-0.5">새 파트너 업체를 등록합니다</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-sm text-gray-500 font-semibold hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors"
                >
                  취소
                </button>
              </div>

              <form onSubmit={handleAddPartner} className="p-6 space-y-5 flex-1">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">업체명 *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="예: 한성방수"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">업종 *</label>
                  <div className="flex flex-wrap gap-2">
                    {PARTNER_TYPES.map((type) => {
                      const color = TYPE_COLOR[type];
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, specialty: type })}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                            formData.specialty === type
                              ? `${color.bg} ${color.text} ${color.border} shadow-sm`
                              : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">담당자명</label>
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="홍길동"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">전화번호 *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="010-0000-0000"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">이메일</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="partner@example.com"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">담당 지역</label>
                    <div className="relative">
                      <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.region}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        placeholder="예: 서울 강남"
                        className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">파트너 코드</label>
                    <div className="relative">
                      <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={formData.partnerCode}
                        onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value.toUpperCase() })}
                        placeholder="PTR-XX-000"
                        className="w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-mono tracking-wide"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">메모 (선택)</label>
                  <textarea
                    value={formData.memo}
                    onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                    placeholder="협력사에 대한 간단한 메모를 남겨주세요."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.companyName || !formData.phone}
                    className="w-full bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-2xl py-4 shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                    협력사 등록하기
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
