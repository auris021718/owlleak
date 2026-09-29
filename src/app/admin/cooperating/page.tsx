"use client";

import { useState, useEffect } from "react";
import {
  Wrench,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Award,
  CreditCard,
  Building2,
  Sparkles
} from "lucide-react";
import { getPartnerClassification, COOPERATING_SPECIALTIES } from "@/lib/partnerType";

interface Partner {
  id: number;
  companyName: string;
  contactName?: string | null;
  phone: string;
  email?: string | null;
  specialty?: string | null;
  region?: string | null;
  partnerCode?: string | null;
  status: string; // 'active' | 'pending' | 'inactive'
  rating: number;
  completedJobs: number;
  memo?: string | null;
  createdAt: string;
  _count?: {
    tasks: number;
  };
}

export default function AdminCooperatingPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("전체");

  // Modals
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    specialty: "방수",
    region: "서울 강남구",
    partnerCode: "",
    status: "active",
    rating: 5.0,
    completedJobs: 0,
    memo: ""
  });

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/partners");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Filter specifically for cooperating companies (방수, 타일, 미장, 도배, 목수, 전기, 배관내시경, 하수도고압세척 등)
        const cooperatingList = json.data.filter((p: Partner) =>
          getPartnerClassification(p.specialty).isCooperating
        );
        setPartners(cooperatingList);
      }
    } catch (e) {
      console.error("Failed to fetch cooperating partners:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleOpenAddModal = () => {
    setFormData({
      companyName: "",
      contactName: "",
      phone: "",
      email: "",
      specialty: "방수",
      region: "서울 강남구",
      partnerCode: `COOP-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "active",
      rating: 5.0,
      completedJobs: 0,
      memo: ""
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (partner: Partner) => {
    setSelectedPartner(partner);
    setFormData({
      companyName: partner.companyName || "",
      contactName: partner.contactName || "",
      phone: partner.phone || "",
      email: partner.email || "",
      specialty: partner.specialty || "방수",
      region: partner.region || "",
      partnerCode: partner.partnerCode || "",
      status: partner.status || "active",
      rating: partner.rating || 5.0,
      completedJobs: partner.completedJobs || 0,
      memo: partner.memo || ""
    });
    setIsEditModalOpen(true);
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditModalOpen && selectedPartner) {
        const res = await fetch(`/api/partners/${selectedPartner.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (json.success) {
          fetchPartners();
          setIsEditModalOpen(false);
          setSelectedPartner(null);
        } else {
          alert(json.error || "수정 실패");
        }
      } else if (isAddModalOpen) {
        const res = await fetch("/api/partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (json.success) {
          fetchPartners();
          setIsAddModalOpen(false);
        } else {
          alert(json.error || "등록 실패");
        }
      }
    } catch (e) {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (partnerId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/partners/${partnerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setPartners((prev) =>
          prev.map((p) => (p.id === partnerId ? { ...p, status: newStatus } : p))
        );
      }
    } catch (e) {
      alert("상태 변경 오류가 발생했습니다.");
    }
  };

  const handleDeletePartner = async (partnerId: number) => {
    if (!confirm("정말 이 협력사를 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/partners/${partnerId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setPartners((prev) => prev.filter((p) => p.id !== partnerId));
      }
    } catch (e) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // Filtered list
  const filteredPartners = partners.filter((p) => {
    const matchSearch =
      (p.companyName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.contactName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.phone || "").includes(search) ||
      (p.region?.toLowerCase() || "").includes(search.toLowerCase());

    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchSpecialty =
      specialtyFilter === "전체" ||
      (p.specialty && p.specialty.includes(specialtyFilter));

    return matchSearch && matchStatus && matchSpecialty;
  });

  // Metrics
  const totalCount = partners.length;
  const pendingCount = partners.filter((p) => p.status === "pending").length;
  const activeCount = partners.filter((p) => p.status === "active").length;
  const monthlyRevenue = activeCount * 55000;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wrench className="text-blue-600" size={26} />
            협력사 관리
            <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-full">
              월 55,000원 정기구독 요금제
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            방수·타일·미장·도배·목수·전기·내시경·고압세척 전문 협력업체 프로필 및 구독 현황을 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPartners}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            title="새로고침"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-blue-600" : ""} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
          >
            <Plus size={16} />
            신규 협력사 등록
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">총 등록 협력사</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{totalCount}개소</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Wrench size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/30 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-amber-700">가입 승인 대기</p>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              )}
            </div>
            <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}개소</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600">활동 중 (승인완료)</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{activeCount}개소</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-blue-600">협력사 월 구독 매출 (MRR)</p>
            <p className="text-2xl font-black text-blue-700 mt-1">{monthlyRevenue.toLocaleString()}원</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            <CreditCard size={24} />
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
                statusFilter === "all"
                  ? "bg-white text-slate-900 shadow-sm font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              전체 ({partners.length})
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
                statusFilter === "pending"
                  ? "bg-white text-amber-700 shadow-sm font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              승인 대기 ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                statusFilter === "active"
                  ? "bg-white text-emerald-700 shadow-sm font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              활동 중 ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                statusFilter === "inactive"
                  ? "bg-white text-slate-700 shadow-sm font-bold"
                  : "hover:text-slate-900"
              }`}
            >
              정지/미활동 ({partners.filter((p) => p.status === "inactive").length})
            </button>
          </div>

          {/* Search & Specialty Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="협력사명, 대표자, 지역 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
              />
              <Search size={15} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="전체">모든 협력업종</option>
              {COOPERATING_SPECIALTIES.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Partners Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">협력사명 / 코드</th>
                <th className="px-6 py-4">대표자 / 연락처</th>
                <th className="px-6 py-4">주 전문분야</th>
                <th className="px-6 py-4">활동 지역</th>
                <th className="px-6 py-4">구독 요금</th>
                <th className="px-6 py-4">상태</th>
                <th className="px-6 py-4 text-center">승인/상태관리</th>
                <th className="px-6 py-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <Wrench className="mx-auto mb-2 text-slate-300" size={32} />
                    일치하는 협력사 정보가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredPartners.map((partner) => {
                  const isPending = partner.status === "pending";
                  const isActive = partner.status === "active";
                  const isInactive = partner.status === "inactive";

                  return (
                    <tr key={partner.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-black flex items-center justify-center border border-blue-200">
                            {partner.companyName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{partner.companyName}</p>
                            <span className="text-[11px] font-mono text-slate-400">
                              {partner.partnerCode || `#COOP-${partner.id}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-800">{partner.contactName || "-"}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-500 font-mono mt-0.5">
                          <Phone size={11} className="text-slate-400" />
                          {partner.phone}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg text-xs border border-blue-200">
                            <Wrench size={11} className="text-blue-500" />
                            {partner.specialty || "방수"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600 text-xs">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                          <span>{partner.region || "서울/경기"}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg">
                          월 55,000원
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-full text-xs border border-amber-200">
                            <Clock size={12} />
                            승인 대기
                          </span>
                        )}
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-xs border border-emerald-200">
                            <CheckCircle2 size={12} />
                            활동 중
                          </span>
                        )}
                        {isInactive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-500 font-bold rounded-full text-xs border border-slate-200">
                            <XCircle size={12} />
                            정지
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {isPending ? (
                          <button
                            onClick={() => handleStatusChange(partner.id, "active")}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                          >
                            가입 승인하기
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            {isActive ? (
                              <button
                                onClick={() => handleStatusChange(partner.id, "inactive")}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
                              >
                                정지 처리
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(partner.id, "active")}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg transition-colors border border-emerald-200"
                              >
                                재활성화
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(partner)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="수정"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeletePartner(partner.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="삭제"
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

      {/* Add / Edit Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="text-blue-600" size={20} />
                {isEditModalOpen ? "협력사 정보 수정" : "신규 협력사 등록 (월 55,000원)"}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePartner} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">협력사명 *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="예: 서울방수개발"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">대표자명</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="예: 홍길동"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">연락처 *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="010-1234-5678"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">이메일</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="coop@example.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">주 협력업종 *</label>
                  <select
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {COOPERATING_SPECIALTIES.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">활동 지역</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="서울 강남구/서초구"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">협력사 코드</label>
                  <input
                    type="text"
                    value={formData.partnerCode}
                    onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value })}
                    placeholder="COOP-1001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">계정 상태</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="active">활동 중 (승인완료)</option>
                    <option value="pending">가입 승인 대기</option>
                    <option value="inactive">정지/비활성</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
                >
                  {saving ? "저장 중..." : isEditModalOpen ? "수정 완료" : "협력사 등록 완료"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
