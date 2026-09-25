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
  Crown
} from "lucide-react";
import KakaoAlimtalkModal from "@/components/kakao/KakaoAlimtalkModal";

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tasks" | "settlements" | "tools">("tasks");
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
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const partnerId = currentUser?.partnerId;
  const partnerInfo = currentUser?.partner;

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
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                    >
                      <Camera size={13} />
                      현장 일지/사진
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
            <h2 className="text-sm font-bold text-slate-300">내 정산 및 입금 내역</h2>
            <span className="text-xs text-emerald-400 font-semibold">
              총 {mySettlements.length}건
            </span>
          </div>

          {mySettlements.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl">
              <CreditCard size={36} className="mx-auto text-slate-600 mb-3" />
              <p className="text-slate-300 font-bold text-sm">정산 내역이 없습니다.</p>
              <p className="text-slate-500 text-xs mt-1">현장 공사 완료 시 자동으로 정산이 등록됩니다.</p>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">정산 ID</th>
                      <th className="px-5 py-3.5">구분</th>
                      <th className="px-5 py-3.5">공사 항목</th>
                      <th className="px-5 py-3.5">정산 금액</th>
                      <th className="px-5 py-3.5">상태</th>
                      <th className="px-5 py-3.5">발생일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {mySettlements.map((settlement: any) => {
                      const isDividend = settlement.type === "registration_dividend";
                      return (
                        <tr key={settlement.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-4 font-mono font-bold text-slate-400">
                            #SET-{settlement.id}
                          </td>
                          <td className="px-5 py-4">
                            {isDividend ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                💰 10% 배당금
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                👷 시공비 ({settlement.rate || 100}%)
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 font-medium text-white">
                            {settlement.task?.title || "누수 탐지 및 복구 시공"}
                          </td>
                          <td className="px-5 py-4 font-bold text-emerald-400 text-sm">
                            {settlement.amount.toLocaleString()}원
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                settlement.status === "paid"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              }`}
                            >
                              {settlement.status === "paid" ? "지급 완료" : "정산 대기"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-400">
                            {new Date(settlement.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Field Tools */}
      {activeTab === "tools" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/estimate"
            className="p-6 bg-slate-900/90 border border-slate-800 hover:border-yellow-500/50 rounded-2xl shadow-lg transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Flame size={24} />
            </div>
            <h3 className="font-bold text-white text-base mb-1 flex items-center justify-between">
              보일러 에러 진단 & 견적
              <ChevronRight size={16} className="text-slate-500 group-hover:text-yellow-400 transition-colors" />
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              경동나비엔, 귀뚜라미, 린나이 등 에러 코드를 입력해 누수 위험도와 고장 원인을 실시간 진단합니다.
            </p>
          </Link>

          <Link
            href="/ai-diagnosis"
            className="p-6 bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-2xl shadow-lg transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles size={24} />
            </div>
            <h3 className="font-bold text-white text-base mb-1 flex items-center justify-between">
              AI 사진 누수 판독기
              <ChevronRight size={16} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              천장 및 바닥 누수 흔적 사진을 AI로 분석하여 누수 원인과 심각도를 판별합니다.
            </p>
          </Link>

          <Link
            href="/tasks"
            className="p-6 bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl shadow-lg transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Camera size={24} />
            </div>
            <h3 className="font-bold text-white text-base mb-1 flex items-center justify-between">
              현장 사진 갤러리 & 일지
              <ChevronRight size={16} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              시공 전/중/후 사진을 단계별로 업로드하고 고객 및 보험사용 증빙 보고서를 생성합니다.
            </p>
          </Link>
        </div>
      )}

      {/* Kakao Alimtalk Simulator Modal */}
      {selectedTaskForKakao && (
        <KakaoAlimtalkModal
          isOpen={isKakaoModalOpen}
          onClose={() => {
            setIsKakaoModalOpen(false);
            setSelectedTaskForKakao(null);
          }}
          defaultTemplate="ESTIMATE_DISPATCH"
          defaultPhone={selectedTaskForKakao.customer?.phone || "010-0000-0000"}
          defaultParams={{
            customerName: selectedTaskForKakao.customer?.name || "고객님",
            leakLocation: selectedTaskForKakao.location || "서울시 현장",
            works: selectedTaskForKakao.title || "누수 탐지 및 시공",
            partnerName: partnerInfo?.companyName || "부엉이누수 파트너",
          }}
        />
      )}
    </div>
  );
}
