"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  FileText,
  CheckCircle2,
  Clock,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  Download,
  Calendar,
  Wrench,
  Image as ImageIcon,
  Building2,
  RefreshCw,
  AlertCircle
} from "lucide-react";

interface CustomerData {
  id: number;
  name: string | null;
  phone: string;
  address: string | null;
  createdAt: string;
  estimates: any[];
  tasks: any[];
  _count: {
    estimates: number;
    tasks: number;
  };
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // Modals
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/customers");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCustomers(json.data);
      }
    } catch (e) {
      console.error("Failed to fetch customers:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenAddModal = () => {
    setFormData({ name: "", phone: "", address: "" });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (customer: CustomerData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDetailModal = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditModalOpen && selectedCustomer) {
        const res = await fetch(`/api/admin/customers/${selectedCustomer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (json.success) {
          setCustomers((prev) =>
            prev.map((c) => (c.id === selectedCustomer.id ? json.data : c))
          );
          setIsEditModalOpen(false);
          setSelectedCustomer(null);
        } else {
          alert(json.error || "수정 실패");
        }
      } else if (isAddModalOpen) {
        const res = await fetch("/api/admin/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (json.success) {
          setCustomers((prev) => [json.data, ...prev]);
          setIsAddModalOpen(false);
        } else {
          alert(json.error || "등록 실패");
        }
      }
    } catch (e) {
      alert("고객 정보 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async (id: number, name: string | null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`'${name || "미등록"}' 고객 정보를 삭제하시겠습니까?\n연결된 견적 및 작업 내역이 모두 삭제됩니다.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/customers/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
        if (selectedCustomer?.id === id) {
          setIsDetailModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedCustomer(null);
        }
      } else {
        alert(json.error || "삭제 실패");
      }
    } catch (e) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleExportCSV = () => {
    if (customers.length === 0) {
      alert("내보낼 고객 데이터가 없습니다.");
      return;
    }
    const headers = ["고객ID", "고객명", "연락처", "주소", "견적수", "작업수", "등록일시"];
    const rows = customers.map((c) => [
      c.id,
      c.name || "미등록",
      c.phone,
      `"${(c.address || "").replace(/"/g, '""')}"`,
      c._count?.estimates || 0,
      c._count?.tasks || 0,
      new Date(c.createdAt).toLocaleDateString("ko-KR"),
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `owl_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      (c.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (c.phone || "").includes(search) ||
      (c.address?.toLowerCase() || "").includes(search.toLowerCase());

    if (filter === "with-tasks") {
      return matchSearch && (c._count?.tasks || 0) > 0;
    }
    if (filter === "with-estimates") {
      return matchSearch && (c._count?.estimates || 0) > 0;
    }
    return matchSearch;
  });

  const totalCustomers = customers.length;
  const customersWithTasks = customers.filter((c) => (c._count?.tasks || 0) > 0).length;
  const customersWithEstimates = customers.filter((c) => (c._count?.estimates || 0) > 0).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users size={26} className="text-blue-600" />
            고객 관리
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            등록된 고객 목록, 접수된 견적 내역 및 현장 작업 진행 상황을 통합 관리합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCustomers}
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
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
          >
            <Plus size={16} />
            신규 고객 등록
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">총 등록 고객</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{totalCustomers}명</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">견적 접수 고객</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">{customersWithEstimates}명</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FileText size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400">작업 진행/완료 고객</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{customersWithTasks}명</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Wrench size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setFilter("all")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                filter === "all" ? "bg-white text-slate-900 shadow-sm font-bold" : "hover:text-slate-900"
              }`}
            >
              전체 고객 ({totalCustomers})
            </button>
            <button
              onClick={() => setFilter("with-estimates")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                filter === "with-estimates" ? "bg-white text-slate-900 shadow-sm font-bold" : "hover:text-slate-900"
              }`}
            >
              견적 보유 ({customersWithEstimates})
            </button>
            <button
              onClick={() => setFilter("with-tasks")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                filter === "with-tasks" ? "bg-white text-slate-900 shadow-sm font-bold" : "hover:text-slate-900"
              }`}
            >
              작업 진행/완료 ({customersWithTasks})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="고객명, 연락처, 주소 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
            />
            <Search size={15} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">고객명</th>
                <th className="px-6 py-4">연락처</th>
                <th className="px-6 py-4">현장 주소</th>
                <th className="px-6 py-4">견적 내역</th>
                <th className="px-6 py-4">배정 작업</th>
                <th className="px-6 py-4">등록일</th>
                <th className="px-6 py-4 text-right">상세/관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <Users className="mx-auto mb-2 text-slate-300" size={32} />
                    일치하는 고객 정보가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  return (
                    <tr
                      key={customer.id}
                      onClick={() => handleOpenDetailModal(customer)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                        #{customer.id}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                            {(customer.name || "고").charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {customer.name || "미등록 고객"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-slate-400" />
                          {customer.phone}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600 text-xs max-w-xs truncate">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                          <span className="truncate">{customer.address || "주소 미입력"}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-full text-xs">
                          <FileText size={11} />
                          {customer._count?.estimates || 0}건
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-xs">
                          <Wrench size={11} />
                          {customer._count?.tasks || 0}건
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Date(customer.createdAt).toLocaleDateString("ko-KR")}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenDetailModal(customer)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="고객 상세 정보"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={(e) => handleOpenEditModal(customer, e)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="정보 수정"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteCustomer(customer.id, customer.name, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="고객 삭제"
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

      {/* Modal: Customer Detail View */}
      {isDetailModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Header */}
            <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                  {(selectedCustomer.name || "고").charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {selectedCustomer.name || "미등록 고객"}
                    <span className="text-xs font-mono text-slate-400 ml-2">
                      #{selectedCustomer.id}
                    </span>
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Phone size={11} /> {selectedCustomer.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={11} /> {selectedCustomer.address || "주소 미등록"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-sm">
              {/* Estimates Section */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-blue-600" />
                  견적 접수 내역 ({selectedCustomer.estimates?.length || 0}건)
                </h4>

                {(!selectedCustomer.estimates || selectedCustomer.estimates.length === 0) ? (
                  <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-200">
                    접수된 견적 내역이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedCustomer.estimates.map((est) => (
                      <div key={est.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            견적서 #{est.id} · {est.detectionDetails || "누수 탐지"}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {new Date(est.createdAt).toLocaleDateString("ko-KR")}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-200">
                          <div>
                            <span className="text-slate-400 block">긴급여부:</span>
                            <span className="font-semibold text-slate-800">{est.urgency || "일반"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">누수 위치:</span>
                            <span className="font-semibold text-slate-800">{est.leakLocation || "-"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">탐지비:</span>
                            <span className="font-semibold text-blue-600">
                              {est.detectionFee ? `${est.detectionFee.toLocaleString()}원` : "상담 후 안내"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">예상 공사비:</span>
                            <span className="font-semibold text-emerald-600">
                              {est.estimatedMinPrice
                                ? `${est.estimatedMinPrice.toLocaleString()} ~ ${est.estimatedMaxPrice?.toLocaleString() || ""}원`
                                : "협의"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks Section */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Wrench size={18} className="text-emerald-600" />
                  배정된 현장 작업 ({selectedCustomer.tasks?.length || 0}건)
                </h4>

                {(!selectedCustomer.tasks || selectedCustomer.tasks.length === 0) ? (
                  <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-200">
                    배정된 작업 내역이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedCustomer.tasks.map((task) => (
                      <div key={task.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800 block">{task.title}</span>
                            <span className="text-xs text-slate-500">
                              {task.location || selectedCustomer.address || "현장 위치 미지정"}
                            </span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            task.status === "done"
                              ? "bg-emerald-100 text-emerald-700"
                              : task.status === "in-progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            {task.status === "done" ? "작업 완료" : task.status === "in-progress" ? "진행 중" : "예정/대기"}
                          </span>
                        </div>

                        {task.partner && (
                          <div className="flex items-center gap-2 text-xs bg-white p-2.5 rounded-xl border border-slate-200">
                            <Building2 size={14} className="text-blue-600" />
                            <span className="text-slate-500">담당 협력사:</span>
                            <span className="font-bold text-slate-800">{task.partner.companyName}</span>
                            <span className="text-slate-400 font-mono">({task.partner.phone})</span>
                          </div>
                        )}

                        {/* Task Photos */}
                        {task.photos && task.photos.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                              <ImageIcon size={12} /> 현장 사진 ({task.photos.length}장)
                            </p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {task.photos.map((photo: any) => (
                                <div key={photo.id} className="rounded-xl overflow-hidden border border-slate-200 aspect-video relative group">
                                  <img
                                    src={photo.url}
                                    alt={photo.caption || "현장사진"}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                                    {photo.phase === "before" ? "시공전" : photo.phase === "after" ? "시공후" : "진행중"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenEditModal(selectedCustomer);
                }}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Edit2 size={13} />
                고객 정보 수정
              </button>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Customer */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Users size={18} className="text-blue-400" />
                {isEditModalOpen ? "고객 정보 수정" : "신규 고객 등록"}
              </h3>
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

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">고객명</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 홍길동"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">연락처 *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="010-0000-0000"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">현장 주소</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="예: 서울 강남구 역삼동 123-45 101호"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20"
                >
                  {saving ? "저장 중..." : "저장하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
