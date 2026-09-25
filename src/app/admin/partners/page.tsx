"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Phone,
  Mail,
  MapPin,
  Wrench,
  Edit2,
  Trash2,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  Award
} from "lucide-react";

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

const SPECIALTY_OPTIONS = [
  "전체",
  "누수탐지",
  "방수",
  "배관",
  "배관내시경",
  "하수도고압세척",
  "타일",
  "미장",
  "도배",
  "목수",
  "마루부분시공",
  "전기"
];

export default function AdminPartnersPage() {
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
    specialty: "누수탐지",
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
        setPartners(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch partners:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

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
        if (selectedPartner?.id === partnerId) {
          setSelectedPartner((prev) => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        alert(json.error || "상태 변경 실패");
      }
    } catch (e) {
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleDeletePartner = async (partnerId: number, companyName: string) => {
    if (!confirm(`'${companyName}' 파트너사를 삭제하시겠습니까?\n배정된 작업이 있는 경우 문제가 발생할 수 있습니다.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/partners/${partnerId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setPartners((prev) => prev.filter((p) => p.id !== partnerId));
        if (selectedPartner?.id === partnerId) {
          setSelectedPartner(null);
          setIsEditModalOpen(false);
        }
      } else {
        alert(json.error || "삭제 실패");
      }
    } catch (e) {
      alert("파트너 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      companyName: "",
      contactName: "",
      phone: "",
      email: "",
      specialty: "누수탐지",
      region: "서울 강남구",
      partnerCode: `PARTNER-${Math.floor(1000 + Math.random() * 9000)}`,
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
      specialty: partner.specialty || "누수탐지",
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
          setPartners((prev) =>
            prev.map((p) => (p.id === selectedPartner.id ? json.data : p))
          );
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
          setPartners((prev) => [json.data, ...prev]);
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

  // Summary Metrics
  const totalCount = partners.length;
  const pendingCount = partners.filter((p) => p.status === "pending").length;
  const activeCount = partners.filter((p) => p.status === "active").length;
  const avgRating =
    totalCount > 0
      ? (
          partners.reduce((sum, p) => sum + (p.rating || 0), 0) / totalCount
        ).toFixed(1)
      : "5.0";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="text-blue-600" size={26} />
            파트너사 관리
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            등록된 협력업체 프로필, 가입 승인 및 전문분야/지역 현황을 관리합니다.
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
            신규 파트너 등록
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">총 파트너사</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{totalCount}개소</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Building2 size={24} />
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

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">평균 만족 평점</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-black text-slate-800">{avgRating}</p>
              <div className="flex text-amber-400">
                <Star size={16} fill="currentColor" />
              </div>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
            <Award size={24} />
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
              전체 ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === "pending"
                  ? "bg-amber-500 text-white shadow-sm font-bold"
                  : "hover:text-slate-900 text-amber-700"
              }`}
            >
              승인 대기
              {pendingCount > 0 && (
                <span className="bg-white text-amber-700 px-1.5 py-0.2 rounded-full text-[10px]">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                statusFilter === "active"
                  ? "bg-emerald-600 text-white shadow-sm font-bold"
                  : "hover:text-slate-900 text-emerald-700"
              }`}
            >
              활동 중 ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter("inactive")}
              className={`px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                statusFilter === "inactive"
                  ? "bg-slate-700 text-white shadow-sm font-bold"
                  : "hover:text-slate-900 text-slate-500"
              }`}
            >
              정지/미활동
            </button>
          </div>

          {/* Search & Specialty Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="업체명, 대표자, 지역, 연락처..."
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
              {SPECIALTY_OPTIONS.map((spec) => (
                <option key={spec} value={spec}>
                  {spec === "전체" ? "모든 전문분야" : spec}
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
                <th className="px-6 py-4">업체명 / 코드</th>
                <th className="px-6 py-4">대표자 / 연락처</th>
                <th className="px-6 py-4">전문분야</th>
                <th className="px-6 py-4">활동 지역</th>
                <th className="px-6 py-4">평점 / 완료작업</th>
                <th className="px-6 py-4">상태</th>
                <th className="px-6 py-4 text-center">승인/상태관리</th>
                <th className="px-6 py-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <Building2 className="mx-auto mb-2 text-slate-300" size={32} />
                    일치하는 파트너 정보가 없습니다.
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
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-black flex items-center justify-center border border-blue-100">
                            {partner.companyName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{partner.companyName}</p>
                            <span className="text-[11px] font-mono text-slate-400">
                              {partner.partnerCode || `#${partner.id}`}
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
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg text-xs">
                          <Wrench size={11} className="text-slate-500" />
                          {partner.specialty || "누수탐지"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-600 text-xs">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                          <span>{partner.region || "전국"}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-0.5 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Star size={11} fill="currentColor" />
                            {partner.rating?.toFixed(1) || "5.0"}
                          </span>
                          <span className="text-xs text-slate-500 font-semibold">
                            {partner.completedJobs || 0}건 완료
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            <Clock size={12} /> 승인 대기
                          </span>
                        )}
                        {isActive && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} /> 활동 중
                          </span>
                        )}
                        {isInactive && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            <XCircle size={12} /> 정지됨
                          </span>
                        )}
                      </td>

                      {/* Quick Approval Action */}
                      <td className="px-6 py-4 text-center">
                        {isPending ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleStatusChange(partner.id, "active")}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                            >
                              <CheckCircle2 size={12} /> 승인
                            </button>
                            <button
                              onClick={() => handleStatusChange(partner.id, "inactive")}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all border border-rose-200"
                            >
                              반려
                            </button>
                          </div>
                        ) : (
                          <select
                            value={partner.status}
                            onChange={(e) => handleStatusChange(partner.id, e.target.value)}
                            className="text-xs font-semibold px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="active">활동 (Active)</option>
                            <option value="pending">승인대기 (Pending)</option>
                            <option value="inactive">정지 (Inactive)</option>
                          </select>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(partner)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="상세 정보 및 수정"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeletePartner(partner.id, partner.companyName)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="파트너 삭제"
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

      {/* Modal: Add or Edit Partner */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={20} className="text-blue-400" />
                <h3 className="font-bold text-lg">
                  {isEditModalOpen ? "파트너사 정보 수정 및 관리" : "신규 파트너사 등록"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePartner} className="p-6 space-y-4 text-sm max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    업체명 (상호명) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="예: 서울누수종합방수"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    대표자 / 담당자명
                  </label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="예: 김기술"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    대표 연락처 *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="010-1234-5678"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    로그인 이메일
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="partner@owl.com"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    주요 전문분야
                  </label>
                  <select
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {SPECIALTY_OPTIONS.filter((s) => s !== "전체").map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    활동 지역 (권역)
                  </label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="예: 서울 강남/서초/송파"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    상태
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="active">활동 중 (승인완료)</option>
                    <option value="pending">가입 승인 대기</option>
                    <option value="inactive">활동 정지 (일시정지)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    평점 (0.0 ~ 5.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 5.0 })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    완료 작업 수
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.completedJobs}
                    onChange={(e) => setFormData({ ...formData, completedJobs: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  파트너 식별 코드
                </label>
                <input
                  type="text"
                  value={formData.partnerCode}
                  onChange={(e) => setFormData({ ...formData, partnerCode: e.target.value })}
                  placeholder="PARTNER-XXXX"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  관리자 메모 / 특이사항
                </label>
                <textarea
                  rows={3}
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  placeholder="장비 보유 현황(적외선 카메라, 내시경 100m 등), 작업 가능 시간대 등 기록"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      저장 중...
                    </>
                  ) : (
                    "저장하기"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
