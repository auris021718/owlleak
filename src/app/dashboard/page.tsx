"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  AlertTriangle, 
  MapPin, 
  Phone, 
  Calendar, 
  ChevronRight, 
  Sparkles, 
  Camera, 
  Send, 
  FileText, 
  Flame, 
  ShieldCheck,
  TrendingUp,
  Building,
  RefreshCw,
  Eye,
  Coins,
  Crown,
  UserPlus,
  Users,
  CheckSquare,
  Receipt
} from "lucide-react";
import KakaoAlimtalkModal from "@/components/kakao/KakaoAlimtalkModal";
import { getPartnerClassification } from "@/lib/partnerType";

interface TaskItem {
  id: number;
  title: string;
  status: string;
  scheduledDate: string | null;
  time: string | null;
  location: string | null;
  type: string;
  description: string | null;
  customer?: {
    id: number;
    name: string | null;
    phone: string;
    address: string | null;
  };
  photos?: any[];
  logs?: any[];
}

interface SettlementItem {
  id: number;
  amount: number;
  status: string;
  createdAt: string;
  type?: string;
  task?: {
    id: number;
    title: string;
    location: string | null;
  };
}

export default function UserDashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [settlements, setSettlements] = useState<SettlementItem[]>([]);
  const [customersCount, setCustomersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tasks" | "settlements" | "customers" | "tools">("tasks");
  const [selectedTaskForKakao, setSelectedTaskForKakao] = useState<TaskItem | null>(null);
  const [isKakaoModalOpen, setIsKakaoModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Get current user
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      if (authData.authenticated && authData.user) {
        setCurrentUser(authData.user);
      }

      // 2. Get tasks
      const tasksRes = await fetch("/api/tasks");
      const tasksData = await tasksRes.json();
      if (Array.isArray(tasksData)) {
        setTasks(tasksData);
      }

      // 3. Get settlements
      const settlementsRes = await fetch("/api/settlements");
      const settlementsData = await settlementsRes.json();
      if (Array.isArray(settlementsData)) {
        setSettlements(settlementsData);
      }

      // 4. Get customers count
      const custRes = await fetch("/api/customers");
      const custData = await custRes.json();
      if (Array.isArray(custData)) {
        setCustomersCount(custData.length);
      }
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const partnerId = currentUser?.partnerId;
  const partnerInfo = currentUser?.partner;
  const classification = getPartnerClassification(partnerInfo?.specialty);
  const isCooperating = classification.isCooperating;

  // Filter tasks for this partner (or show all if admin previewing)
  const myTasks = partnerId
    ? tasks.filter((t: any) => t.partnerId === partnerId || !t.partnerId)
    : tasks;

  // Filter settlements for this partner
  const mySettlements = partnerId
    ? settlements.filter((s: any) => s.partnerId === partnerId)
    : settlements;

  const inProgressCount = myTasks.filter((t) => t.status === "진행중" || t.status === "in-progress").length;
  const completedCount = myTasks.filter((t) => t.status === "완료" || t.status === "done").length;

  const pendingSettlementTotal = mySettlements
    .filter((s) => s.status === "pending")
    .reduce((sum, s) => sum + s.amount, 0);

  const paidSettlementTotal = mySettlements
    .filter((s) => s.status === "paid")
    .reduce((sum, s) => sum + s.amount, 0);

  const dividendTotal = mySettlements
    .filter((s: any) => s.type === "registration_dividend")
    .reduce((sum, s) => sum + s.amount, 0);

  const handleOpenKakao = (task: TaskItem) => {
    setSelectedTaskForKakao(task);
    setIsKakaoModalOpen(true);
  };

  // ─── 협력사 전용 대시보드 뷰 (고객등록, 현장작업관리, 정산) ───
  if (isCooperating) {
    return (
      <div className="space-y-6 pb-12">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold rounded-full flex items-center gap-1.5">
                  <Wrench size={14} className="text-blue-400" />
                  🤝 협력사 워크스페이스
                </span>
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-[11px] font-medium rounded-full border border-slate-700">
                  주업: {partnerInfo?.specialty || "방수/타일/도배"}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {partnerInfo?.companyName || currentUser?.name || "협력사"} 대시보드
              </h1>
              <p className="text-slate-400 text-xs md:text-sm mt-1.5">
                <span className="text-blue-300 font-bold">고객 등록</span>, <span className="text-emerald-300 font-bold">배정된 현장 작업 관리</span> 및 파트너가 제시한 금액 <span className="text-amber-300 font-bold">100% 정산 내역</span>을 관리합니다.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/customers"
                className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5"
              >
                <UserPlus size={15} />
                고객 등록 / 의뢰
              </Link>
              <Link
                href="/dashboard/billing"
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl border border-slate-700 transition-all flex items-center gap-1.5"
              >
                🤝 구독 관리 (월 5.5만)
              </Link>
            </div>
          </div>
        </div>

        {/* 3대 전용 KPI 카드: 고객등록 / 현장작업관리 / 정산 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* KPI 1: 고객등록 */}
          <Link href="/customers" className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all shadow-lg group">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                <UserPlus size={14} /> 1. 고객 등록 현황
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ChevronRight size={18} />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-black text-white">{customersCount} <span className="text-sm font-normal text-slate-400">건</span></p>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">신규 고객 등록 및 협력사 의뢰 관리 &rarr;</p>
          </Link>

          {/* KPI 2: 현장작업관리 */}
          <Link href="/tasks" className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-all shadow-lg group">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckSquare size={14} /> 2. 현장 작업 관리
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <ChevronRight size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <p className="text-2xl md:text-3xl font-black text-emerald-400">{inProgressCount} <span className="text-xs font-normal text-slate-400">진행중</span></p>
              <p className="text-xl font-bold text-slate-300">/ {completedCount} <span className="text-xs font-normal text-slate-400">완료</span></p>
            </div>
            <p className="text-[11px] text-emerald-400/80 mt-2 font-medium">배정 현장 출동, 사진 기록 및 완료 보고 &rarr;</p>
          </Link>

          {/* KPI 3: 정산 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Coins size={14} /> 3. 정산 내역 (100% 수령)
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Receipt size={18} />
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-black text-amber-300">
              {paidSettlementTotal.toLocaleString()} <span className="text-sm font-normal text-slate-400">원</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              대기 중: <strong className="text-amber-400">{pendingSettlementTotal.toLocaleString()}원</strong> (제시 금액 100%)
            </p>
          </div>
        </div>

        {/* 3대 전용 탭: 현장작업관리 / 정산내역 / 고객등록현황 */}
        <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 max-w-lg">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "tasks" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <CheckSquare size={14} />
            현장 작업 관리 ({myTasks.length})
          </button>

          <button
            onClick={() => setActiveTab("settlements")}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "settlements" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <CreditCard size={14} />
            정산 내역 ({mySettlements.length})
          </button>
        </div>

        {/* Tab 1: 현장 작업 관리 */}
        {activeTab === "tasks" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <CheckSquare size={16} className="text-blue-400" />
                배정된 현장 작업 목록
              </h2>
              <span className="text-xs text-slate-500">최신순</span>
            </div>

            {myTasks.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl">
                <Wrench size={36} className="mx-auto text-slate-600 mb-3" />
                <p className="text-slate-300 font-bold text-sm">현재 배정된 협력 현장이 없습니다.</p>
                <p className="text-slate-500 text-xs mt-1">파트너 배정이 진행되면 이곳에 실시간으로 표시됩니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold mb-1.5 ${
                              task.status === "진행중" || task.status === "in-progress"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : task.status === "완료" || task.status === "done"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {task.status === "in-progress" ? "진행중" : task.status === "done" ? "시공완료" : task.status}
                          </span>
                          <h3 className="font-bold text-white text-base leading-snug">{task.title}</h3>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-400 mb-3 line-clamp-2">{task.description}</p>
                      )}

                      <div className="space-y-1.5 text-xs text-slate-400 py-3 border-y border-slate-800/80 mb-4">
                        {task.location && (
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-slate-500 shrink-0" />
                            <span className="truncate">{task.location}</span>
                          </div>
                        )}
                        {task.customer?.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={14} className="text-slate-500 shrink-0" />
                            <span>고객: {task.customer.name ? `${task.customer.name} (` : ""}{task.customer.phone}{task.customer.name ? ")" : ""}</span>
                          </div>
                        )}
                        {task.scheduledDate && (
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-500 shrink-0" />
                            <span>예정일: {new Date(task.scheduledDate).toLocaleDateString()} {task.time || ""}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleOpenKakao(task)}
                        className="flex-1 py-2 px-3 bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/40 text-yellow-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <Send size={13} />
                        알림톡 발송
                      </button>
                      <Link
                        href={`/tasks`}
                        className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                      >
                        <Camera size={13} />
                        현장일지 / 사진
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: 정산 내역 */}
        {activeTab === "settlements" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <CreditCard size={16} className="text-amber-400" />
                협력사 정산 내역 (파트너 제시 금액 100% 수령)
              </h2>
              <span className="text-xs text-slate-500">최근 정산 순</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
              {mySettlements.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  아직 수령한 정산 내역이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                        <th className="py-3 px-4">정산 일시</th>
                        <th className="py-3 px-4">작업 / 현장명</th>
                        <th className="py-3 px-4">정산 금액 (제시액 100%)</th>
                        <th className="py-3 px-4">상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {mySettlements.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4">{new Date(s.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-bold text-white">{s.task?.title || "현장 공사 건"}</td>
                          <td className="py-3 px-4 font-black text-amber-300">{s.amount.toLocaleString()}원</td>
                          <td className="py-3 px-4">
                            {s.status === "paid" ? (
                              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded">
                                지급 완료
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded">
                                정산 대기
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal for Kakao */}
        {selectedTaskForKakao && (
          <KakaoAlimtalkModal
            isOpen={isKakaoModalOpen}
            onClose={() => setIsKakaoModalOpen(false)}
            defaultTemplate="EMERGENCY_DISPATCH"
            defaultPhone={selectedTaskForKakao.customer?.phone || ""}
            defaultParams={{
              customerName: selectedTaskForKakao.customer?.name || "",
              leakLocation: selectedTaskForKakao.location || "",
              taskTitle: selectedTaskForKakao.title || "",
            }}
          />
        )}
      </div>
    );
  }

  // ─── 파트너 전용 대시보드 뷰 (기존 Master 파트너 메인 뷰) ───
  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Role & Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/25 to-slate-900 border border-amber-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-full flex items-center gap-1.5">
                👑 Master 파트너 워크스페이스
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-[11px] font-bold rounded-full border border-emerald-500/40">
                💰 일 등록 10% 배당 활성화
              </span>
              {currentUser?.role === "admin" && (
                <span className="px-2.5 py-1 bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[11px] font-bold rounded-full">
                  👑 관리자 모드 열람 중
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {partnerInfo?.companyName || currentUser?.name || "파트너"} 현장 대시보드
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1.5">
              배정된 누수 시공, <span className="text-amber-300 font-bold">일 등록 10% 배당 수익</span>, 실시간 현장 사진/일지 보고를 관리합니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/billing"
              className="px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              👑 Master 구독 관리
            </Link>
            <Link
              href="/customers"
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-2xl border border-slate-700 transition-all flex items-center gap-1.5"
            >
              고객 등록 (내시공/배당)
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">진행 중 현장</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Wrench size={16} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-white">{inProgressCount} <span className="text-sm font-normal text-slate-400">건</span></p>
          <p className="text-[11px] text-blue-400 mt-2 flex items-center gap-1 font-medium">
            <Clock size={12} /> 현장 출동 및 탐지 진행 중
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">완료된 공사</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-emerald-400">{completedCount} <span className="text-sm font-normal text-slate-400">건</span></p>
          <p className="text-[11px] text-emerald-400/80 mt-2 font-medium">누적 완료 실적</p>
        </div>

        <div className="bg-slate-900/80 border border-amber-500/40 rounded-2xl p-5 hover:border-amber-500/60 transition-all shadow-lg bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900">
          <div className="flex items-center justify-between text-amber-300 mb-2">
            <span className="text-xs font-bold flex items-center gap-1">
              💰 내 일 등록 배당 수익 (10%)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Coins size={16} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-amber-400">
            {dividendTotal.toLocaleString()} <span className="text-sm font-normal text-slate-400">원</span>
          </p>
          <p className="text-[11px] text-amber-400/80 mt-2 font-medium">위탁 배당 자동 정산</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">정산 확정 / 대기</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-purple-300">
            {paidSettlementTotal.toLocaleString()} <span className="text-sm font-normal text-slate-400">원</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">대기 {pendingSettlementTotal.toLocaleString()}원</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 max-w-md">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "tasks" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"
          }`}
        >
          <Wrench size={14} />
          내 배정 현장 ({myTasks.length})
        </button>
        <button
          onClick={() => setActiveTab("settlements")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "settlements" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"
          }`}
        >
          <CreditCard size={14} />
          내 정산 내역 ({mySettlements.length})
        </button>
        <button
          onClick={() => setActiveTab("tools")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "tools" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"
          }`}
        >
          <Sparkles size={14} />
          현장 도구
        </button>
      </div>

      {/* Tab 1: Tasks */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-300">배정된 작업 목록</h2>
            <span className="text-xs text-slate-500">최신순 정렬</span>
          </div>

          {myTasks.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl">
              <Wrench size={36} className="mx-auto text-slate-600 mb-3" />
              <p className="text-slate-300 font-bold text-sm">현재 배정된 작업이 없습니다.</p>
              <p className="text-slate-500 text-xs mt-1">관리자 배정이 완료되면 이곳에 실시간으로 표시됩니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold mb-1.5 ${
                            task.status === "진행중" || task.status === "in-progress"
                              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              : task.status === "완료" || task.status === "done"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {task.status === "in-progress" ? "진행중" : task.status === "done" ? "시공완료" : task.status}
                        </span>
                        <h3 className="font-bold text-white text-base leading-snug">{task.title}</h3>
                      </div>

                      {task.type === "urgent" && (
                        <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-bold rounded-md border border-rose-500/40 animate-pulse">
                          긴급출동
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-400 mb-3 line-clamp-2">{task.description}</p>
                    )}

                    <div className="space-y-1.5 text-xs text-slate-400 py-3 border-y border-slate-800/80 mb-4">
                      {task.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-slate-500 shrink-0" />
                          <span className="truncate">{task.location}</span>
                        </div>
                      )}
                      {task.customer?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-slate-500 shrink-0" />
                          <span>고객: {task.customer.name ? `${task.customer.name} (` : ""}{task.customer.phone}{task.customer.name ? ")" : ""}</span>
                        </div>
                      )}
                      {task.scheduledDate && (
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-500 shrink-0" />
                          <span>예정일: {new Date(task.scheduledDate).toLocaleDateString()} {task.time || ""}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleOpenKakao(task)}
                      className="flex-1 py-2 px-3 bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/40 text-yellow-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <Send size={13} />
                      알림톡 발송
                    </button>
                    <Link
                      href={`/tasks`}
                      className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                    >
                      <Camera size={13} />
                      현장일지 / 사진
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Settlements */}
      {activeTab === "settlements" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-300">내 시공 및 배당 정산 내역</h2>
            <span className="text-xs text-slate-500">최근 정산 순</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
            {mySettlements.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                아직 정산 내역이 존재하지 않습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-3 px-4">정산 일시</th>
                      <th className="py-3 px-4">구분 / 유형</th>
                      <th className="py-3 px-4">작업 / 현장명</th>
                      <th className="py-3 px-4">정산 금액</th>
                      <th className="py-3 px-4">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {mySettlements.map((s: any) => (
                      <tr key={s.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4">{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          {s.type === "registration_dividend" ? (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded">
                              💰 10% 배당
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold rounded">
                              👷 90% 시공비
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">{s.task?.title || "현장 공사 건"}</td>
                        <td className="py-3 px-4 font-black text-amber-400">{s.amount.toLocaleString()}원</td>
                        <td className="py-3 px-4">
                          {s.status === "paid" ? (
                            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded">
                              지급 완료
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded">
                              정산 대기
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Tools */}
      {activeTab === "tools" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/estimate"
            className="p-6 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl transition-all shadow-lg group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
                <Sparkles size={24} />
              </div>
              <h3 className="font-bold text-white text-lg mb-1">보일러 진단 & 견적 체크리스트</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                5대 브랜드 보일러 에러코드 자동 조회, 누수 유형별 자동 견적 산출 및 고객 카카오톡 연동.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-amber-400 font-bold text-xs">
              진단 시작하기 <ChevronRight size={14} />
            </div>
          </Link>

          <Link
            href="/ai-diagnosis"
            className="p-6 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl transition-all shadow-lg group flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/40 rounded-2xl flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                <Camera size={24} />
              </div>
              <h3 className="font-bold text-white text-lg mb-1">AI 사진 누수 심층 판독</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                현장 누수 및 곰팡이 사진을 AI가 딥러닝 분석하여 원인과 추천 복구 방법을 자동 리포트로 작성.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-blue-400 font-bold text-xs">
              AI 판독 시작하기 <ChevronRight size={14} />
            </div>
          </Link>
        </div>
      )}

      {/* Modal for Kakao */}
      {selectedTaskForKakao && (
        <KakaoAlimtalkModal
          isOpen={isKakaoModalOpen}
          onClose={() => setIsKakaoModalOpen(false)}
          defaultTemplate="EMERGENCY_DISPATCH"
          defaultPhone={selectedTaskForKakao.customer?.phone || ""}
          defaultParams={{
            customerName: selectedTaskForKakao.customer?.name || "",
            leakLocation: selectedTaskForKakao.location || "",
            taskTitle: selectedTaskForKakao.title || "",
          }}
        />
      )}
    </div>
  );
}
