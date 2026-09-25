"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Phone, MapPin, Wrench, AlertTriangle,
  Bell, BellRing, CheckCircle2, XCircle, Clock, Users,
  ChevronRight, Search, UserPlus, Loader2, Send, Edit, Trash2
} from "lucide-react";
import {
  Customer, PartnerNotification, JobType
} from "@/lib/notificationStore";

const PHASE1_SECONDS = 60; // 1차 알림 대기 시간(초)

const JOB_TYPES: JobType[] = ["누수", "방수", "배관", "도배", "미장", "전기", "타일", "목수", "하수도고압세척", "마루부분시공"];

// 지역 키워드 매칭
function matchRegion(partnerRegion: string, customerRegion: string): boolean {
  if (!partnerRegion || !customerRegion) return false;
  const keywords = customerRegion.split(/[\s·,]+/).filter(Boolean);
  return keywords.some((kw) => partnerRegion.includes(kw));
}

// 협력사 알림 목록 생성
function buildNotificationsFromPartners(
  customer: { region: string },
  partnerList: any[]
): PartnerNotification[] {
  const activePartners = partnerList.filter((p) => p.status === "active");
  return activePartners.map((p) => ({
    partnerId: String(p.id),
    companyName: p.companyName,
    phone: p.phone,
    region: p.region || "전국",
    type: p.specialty || p.type || "누수",
    response: "pending",
    isRegionMatch: matchRegion(p.region || "", customer.region || ""),
  }));
}

// ─── 상태 카드 색상 ────────────────────────────────────────────────────────
const PHASE_CONFIG = {
  phase1:     { label: "지역 알림 중",  bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500"    },
  phase2:     { label: "전체 알림 중",  bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200",  dot: "bg-orange-500 animate-pulse" },
  assigned:   { label: "배정 완료",    bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  unassigned: { label: "미배정",       bg: "bg-gray-100",   text: "text-gray-500",    border: "border-gray-200",    dot: "bg-gray-400"    },
};

// ─── 알림 발송 모달 컴포넌트 ─────────────────────────────────────────────
interface NotificationModalProps {
  customer: Customer;
  onClose: () => void;
  onUpdate: (updated: Customer) => void;
}

function NotificationModal({ customer, onClose, onUpdate }: NotificationModalProps) {
  const [countdown, setCountdown] = useState(PHASE1_SECONDS);
  const [localCustomer, setLocalCustomer] = useState(customer);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const phase = localCustomer.phase;
  const phase1Notified = localCustomer.notifications.filter((n) => n.isRegionMatch);
  const allNotified = localCustomer.notifications;
  const visibleNotifications = phase === "phase1" ? phase1Notified : allNotified;

  // Phase1 → Phase2 자동 전환 타이머
  useEffect(() => {
    if (phase !== "phase1") return;
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Phase2로 전환
          const updated: Customer = { ...localCustomer, phase: "phase2" };
          setLocalCustomer(updated);
          onUpdate(updated);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // 협력사 수락
  const handleAccept = useCallback((partnerId: string, companyName: string) => {
    const updated: Customer = {
      ...localCustomer,
      phase: "assigned",
      assignedPartner: companyName,
      notifications: localCustomer.notifications.map((n) =>
        n.partnerId === partnerId ? { ...n, response: "accepted" } : { ...n, response: "rejected" }
      ),
    };
    clearInterval(timerRef.current!);
    setLocalCustomer(updated);
    onUpdate(updated);
  }, [localCustomer, onUpdate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* 모달 헤더 */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          phase === "phase1" ? "bg-blue-600" : phase === "phase2" ? "bg-orange-500" : "bg-emerald-600"
        } text-white`}>
          <div className="flex items-center gap-2">
            {phase === "assigned" ? (
              <CheckCircle2 size={20} />
            ) : (
              <BellRing size={20} className="animate-bounce" />
            )}
            <div>
              <p className="font-bold text-sm">
                {phase === "phase1" && "1차 알림 발송 — 지역 협력사"}
                {phase === "phase2" && "2차 알림 재발송 — 전체 협력사"}
                {phase === "assigned" && `배정 완료 · ${localCustomer.assignedPartner}`}
              </p>
              <p className="text-xs opacity-80">{localCustomer.name} 고객 · {localCustomer.region}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-sm font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors">
            닫기
          </button>
        </div>

        {/* 카운트다운 바 (Phase1) */}
        {phase === "phase1" && (
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
            <Clock size={16} className="text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-xs text-blue-700 font-semibold mb-1">
                <span>지역 협력사 응답 대기 중...</span>
                <span>{countdown}초 후 전체 재발송</span>
              </div>
              <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                  style={{ width: `${(countdown / PHASE1_SECONDS) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Phase2 안내 배너 */}
        {phase === "phase2" && (
          <div className="px-5 py-3 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
            <Send size={15} className="text-orange-600 flex-shrink-0" />
            <p className="text-xs text-orange-700 font-semibold">
              지역 협력사 미응답 — 전체 {allNotified.length}개 업체에 알림을 재발송했습니다.
            </p>
          </div>
        )}

        {/* 완료 배너 */}
        {phase === "assigned" && (
          <div className="px-5 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800">담당 업체가 배정되었습니다</p>
              <p className="text-xs text-emerald-600">{localCustomer.assignedPartner} — 수락 완료</p>
            </div>
          </div>
        )}

        {/* 협력사 목록 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <p className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
            <Users size={12} />
            {phase === "phase1" ? `지역 매칭 협력사 (${phase1Notified.length})` : `전체 협력사 (${allNotified.length})`}
          </p>

          {visibleNotifications.map((n) => (
            <div key={n.partnerId} className={`rounded-2xl border p-4 transition-all ${
              n.response === "accepted"
                ? "border-emerald-300 bg-emerald-50"
                : n.response === "rejected"
                ? "border-gray-200 bg-gray-50 opacity-50"
                : "border-gray-200 bg-white hover:border-blue-200"
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-gray-900 text-sm">{n.companyName}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{n.type}</span>
                    {n.isRegionMatch && (
                      <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <MapPin size={10} /> 지역 매칭
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin size={10} />
                    <span>{n.region}</span>
                  </div>
                </div>

                <div className="flex-shrink-0 ml-3">
                  {n.response === "accepted" ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full">
                      <CheckCircle2 size={12} /> 수락
                    </span>
                  ) : n.response === "rejected" ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                      <XCircle size={12} /> 거절
                    </span>
                  ) : phase !== "assigned" ? (
                    <button
                      onClick={() => handleAccept(n.partnerId, n.companyName)}
                      className="flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full transition-colors shadow-sm"
                    >
                      <Phone size={11} /> 수락
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      <Loader2 size={11} className="animate-spin" /> 대기
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 하단 액션 */}
        {phase !== "assigned" && (
          <div className="px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              협력사가 <strong>수락</strong> 버튼을 누르면 담당 업체로 배정됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    region: "",
    jobType: "누수" as JobType,
    isUrgent: false,
    detail: "",
    registrationType: "direct" as "direct" | "dividend",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // 페이지 진입 시 DB에서 파트너 및 고객 목록 로드
  useEffect(() => {
    // 1. Fetch partners
    fetch("/api/partners")
      .then((res) => res.json())
      .then((data) => {
        const partnerList = data.success && Array.isArray(data.data) ? data.data : [];
        setPartners(partnerList);

        // 2. Fetch customers
        return fetch("/api/customers")
          .then((res) => res.json())
          .then((custData) => {
            if (Array.isArray(custData)) {
              const withNotis = custData.map((c) => ({
                ...c,
                notifications: c.notifications?.length
                  ? c.notifications
                  : buildNotificationsFromPartners(c, partnerList),
              }));
              setCustomers(withNotis);
            }
          });
      })
      .catch((err) => console.error("Error loading customer data:", err));
  }, []);

  const [filterType, setFilterType] = useState<"all" | "direct" | "dividend">("all");

  const openRegisterModal = () => {
    setFormData({ 
      name: "", 
      phone: "", 
      region: "", 
      jobType: "누수", 
      isUrgent: false, 
      detail: "",
      registrationType: "direct" as "direct" | "dividend"
    });
    setIsEditing(false);
    setEditId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation(); // Card click event prevented
    setFormData({
      name: customer.name,
      phone: customer.phone,
      region: customer.region,
      jobType: customer.jobType,
      isUrgent: customer.isUrgent,
      detail: customer.detail,
      registrationType: (customer as any).registrationType || "direct",
    });
    setIsEditing(true);
    setEditId(customer.id);
    setIsModalOpen(true);
  };

  // 고객 등록 또는 수정
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && editId) {
        // Update logic
        const res = await fetch(`/api/customers/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          // Map back to frontend Customer type
          const updatedCustomer: Customer = {
            ...customers.find((c) => c.id === editId)!,
            ...formData,
          };

          setCustomers(customers.map((c) => (c.id === editId ? updatedCustomer : c)));
          setIsModalOpen(false);
        } else {
          const errorData = await res.json();
          alert(`수정 실패: ${errorData.error || "알 수 없는 오류"}`);
        }
      } else {
        // Registration logic
        const notifications = buildNotificationsFromPartners(formData, partners);
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, phase: "phase1", notifications }),
        });

        if (res.ok) {
          const newCustomer = await res.json();
          const withNotis = { ...newCustomer, notifications };
          setCustomers([withNotis, ...customers]);
          setIsModalOpen(false);
          setFormData({ 
            name: "", 
            phone: "", 
            region: "", 
            jobType: "누수", 
            isUrgent: false, 
            detail: "",
            registrationType: "direct"
          });
        } else {
          const errorData = await res.json();
          alert(`등록 실패: ${errorData.error || "알 수 없는 오류"}`);
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("서버와 통신하는 중 오류가 발생했습니다. 서버가 실행 중인지 확인해 주세요.");
    }
  };

  // 고객 삭제
  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`'${name}' 고객님 정보를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCustomers(prev => prev.filter(c => c.id !== id));
      } else {
        const errorData = await res.json();
        alert(`삭제 실패: ${errorData.error || "알 수 없는 오류"}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 알림 상태 업데이트 콜백
  const handleCustomerUpdate = useCallback(async (updated: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setActiveCustomer(updated);
    
    // Update DB
    await fetch(`/api/customers/${updated.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
  }, []);

  const filteredCustomers = customers.filter(
    (c) => c.name.includes(searchQuery) || c.region.includes(searchQuery) || c.jobType.includes(searchQuery)
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans sm:bg-gray-100 sm:items-center sm:py-10">
      <main className="flex flex-col w-full max-w-md bg-white min-h-screen sm:min-h-full sm:rounded-3xl sm:shadow-2xl relative overflow-hidden">

        {/* 헤더 */}
        <header className="flex items-center justify-between px-4 py-4 bg-blue-900 text-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-2 rounded-full hover:bg-blue-800 transition-colors text-blue-200">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center">
                <UserPlus size={13} className="text-blue-900" />
              </div>
              <h1 className="text-lg font-bold tracking-tight">고객 관리</h1>
            </div>
          </div>
          <button
            onClick={openRegisterModal}
            className="flex items-center gap-1.5 bg-yellow-400 text-blue-900 text-sm font-bold px-3 py-2 rounded-xl hover:bg-yellow-300 transition-colors shadow"
          >
            <Plus size={16} />
            고객 등록
          </button>
        </header>

        <div className="flex-1 overflow-y-auto pb-24">
          {/* 검색 & 필터 */}
          <div className="px-6 pt-5 pb-3 space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="고객명, 지역, 업종으로 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* 필터 탭 */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filterType === "all" ? "bg-white text-blue-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                전체 ({customers.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("direct")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filterType === "direct" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                👷 내 시공
              </button>
              <button
                type="button"
                onClick={() => setFilterType("dividend")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filterType === "dividend" ? "bg-white text-amber-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                💰 10% 배당 위탁
              </button>
            </div>
          </div>

          {/* 고객 목록 */}
          <div className="px-6 space-y-3">
            <p className="text-xs font-bold text-gray-400">
              고객 목록 ({
                filteredCustomers.filter(c => filterType === "all" || (c as any).registrationType === filterType || (! (c as any).registrationType && filterType === "direct")).length
              })
            </p>

            {filteredCustomers.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <UserPlus size={36} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-400">등록된 고객이 없습니다</p>
                <p className="text-xs text-gray-400 mt-1">상단 &apos;고객 등록&apos; 버튼을 눌러주세요</p>
              </div>
            ) : (
              filteredCustomers
                .filter(c => filterType === "all" || (c as any).registrationType === filterType || (! (c as any).registrationType && filterType === "direct"))
                .map((customer) => {
                const cfg = PHASE_CONFIG[customer.phase];
                const isDividend = (customer as any).registrationType === "dividend";

                return (
                  <div
                    key={customer.id}
                    onClick={() => setActiveCustomer(customer)}
                    className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4 group cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isDividend ? (
                          <span className="flex items-center gap-1 text-[11px] font-extrabold text-amber-800 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full">
                            💰 10% 배당 위탁
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            👷 내 직접시공
                          </span>
                        )}

                        {customer.isUrgent && (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={10} /> 긴급
                          </span>
                        )}
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{customer.jobType}</span>
                        <span className={`flex items-center gap-1 text-xs font-semibold ${cfg.text} ${cfg.bg} px-2 py-0.5 rounded-full border ${cfg.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => openEditModal(customer, e)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={(e) => handleDelete(customer.id, customer.name, e)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors ml-1" />
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900">{customer.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={11} /> {customer.region}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Phone size={11} /> {customer.phone}
                      </span>
                    </div>
                    {customer.assignedPartner && (
                      <p className="text-xs text-emerald-700 font-semibold mt-2 flex items-center gap-1">
                        <CheckCircle2 size={11} /> 담당 협력사: {customer.assignedPartner}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 고객 등록 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-3xl shadow-2xl overflow-y-auto flex flex-col">
              <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-10">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{isEditing ? "고객 정보 수정" : "고객 등록"}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{isEditing ? "고객의 상세 정보를 수정합니다" : "등록 즉시 지역 협력사에 알림이 발송됩니다"}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-sm text-gray-500 font-semibold bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors">
                  취소
                </button>
              </div>

              <form onSubmit={handleRegister} className="p-6 space-y-5 flex-1">
                {/* 1. 고객 등록 유형 선택 (내 직접 시공 vs 파트너 배당) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 ml-1">
                    등록 목적 선택 *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, registrationType: "direct" as any })}
                      className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                        formData.registrationType !== "dividend"
                          ? "bg-blue-50/90 border-blue-600 shadow-md ring-2 ring-blue-600/20"
                          : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1">
                          👷 내 직접 시공
                        </span>
                        {formData.registrationType !== "dividend" && (
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-tight">
                        본인 직접 탐지/시공 <br />
                        <strong className="text-blue-700">(시공비 100% 수령)</strong>
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, registrationType: "dividend" as any })}
                      className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                        formData.registrationType === "dividend"
                          ? "bg-amber-50/90 border-amber-500 shadow-md ring-2 ring-amber-500/20"
                          : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1">
                          💰 파트너 배당 위탁
                        </span>
                        {formData.registrationType === "dividend" && (
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-tight">
                        타 협력사 배정/위탁 <br />
                        <strong className="text-amber-700">(10% 배당금 자동 정산)</strong>
                      </p>
                    </button>
                  </div>

                  {formData.registrationType === "dividend" && (
                    <div className="mt-2.5 p-3 bg-amber-500/10 border border-amber-300 rounded-xl text-[11px] text-amber-900 leading-relaxed animate-in fade-in">
                      💡 <strong>10% 배당 혜택</strong>: 타 지역/스케줄로 다른 파트너에게 위탁하며, 해당 파트너가 시공을 완료하면 <strong>총 공사비의 10%</strong>가 등록자(나)에게 배당금으로 자동 정산됩니다.
                    </div>
                  )}
                </div>

                {/* 긴급 여부 */}
                <div className="flex gap-3">
                  <button type="button" onClick={() => setFormData({ ...formData, isUrgent: false })}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${!formData.isUrgent ? "bg-blue-50 text-blue-700 border-blue-400 shadow-sm" : "text-gray-400 border-gray-200 hover:bg-gray-50"}`}>
                    일반 방문
                  </button>
                  <button type="button" onClick={() => setFormData({ ...formData, isUrgent: true })}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${formData.isUrgent ? "bg-red-50 text-red-700 border-red-400 shadow-sm" : "text-gray-400 border-gray-200 hover:bg-gray-50"}`}>
                    🚨 당일 긴급
                  </button>
                </div>

                {/* 고객명 / 연락처 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">고객명 *</label>
                    <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="홍길동" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">연락처 *</label>
                    <input required type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="010-0000-0000" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm" />
                  </div>
                </div>

                {/* 주소/지역 */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">현장 주소 / 지역 *</label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input required type="text" value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      placeholder="예: 서울 강남구 역삼동" className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm" />
                  </div>
                  <p className="text-xs text-blue-600 mt-1.5 ml-1 flex items-center gap-1">
                    <Bell size={11} /> 입력 지역의 활성 협력사에게 1차 알림이 발송됩니다
                  </p>
                </div>

                {/* 업종 */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 ml-1">필요 업종 *</label>
                  <div className="flex flex-wrap gap-2">
                    {JOB_TYPES.map((type) => (
                      <button key={type} type="button" onClick={() => setFormData({ ...formData, jobType: type })}
                        className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all ${
                          formData.jobType === type ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                        }`}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 상세 내용 */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">상세 내용</label>
                  <textarea value={formData.detail} onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                    placeholder="누수 위치, 증상 등을 상세히 입력해주세요." rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm resize-none" />
                </div>

                {/* 등록/수정 버튼 */}
                <div className="pt-4 border-t border-gray-100">
                  <button type="submit"
                    className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-2xl py-4 shadow-lg transition-all flex items-center justify-center gap-2">
                    {isEditing ? <CheckCircle2 size={18} /> : <Send size={18} />}
                    {isEditing ? "정보 수정 완료" : "등록 및 알림 발송"}
                  </button>
                  {!isEditing && (
                    <p className="text-xs text-gray-400 text-center mt-2">
                      등록 즉시 지역 협력사 → 전체 순으로 자동 알림이 발송됩니다
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 알림 발송 현황 모달 */}
        {activeCustomer && activeCustomer.phase !== "unassigned" && (
          <NotificationModal
            key={activeCustomer.id + activeCustomer.phase}
            customer={activeCustomer}
            onClose={() => setActiveCustomer(null)}
            onUpdate={handleCustomerUpdate}
          />
        )}
      </main>
    </div>
  );
}
