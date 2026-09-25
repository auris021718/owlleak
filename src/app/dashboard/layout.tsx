"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  CheckSquare, 
  CreditCard, 
  Sparkles, 
  LogOut, 
  Shield, 
  HardHat, 
  Home, 
  User, 
  Bell, 
  ChevronRight,
  Phone,
  MapPin,
  Star,
  Crown
} from "lucide-react";

interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: string;
  partnerId: number | null;
  partner: {
    id: number;
    companyName: string;
    contactName: string | null;
    phone: string;
    email: string | null;
    specialty: string | null;
    region: string | null;
    partnerCode: string | null;
    status: string;
    rating: number;
    completedJobs: number;
  } | null;
}

export default function UserDashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to fetch user session", err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-72 bg-slate-950/80 border-r border-slate-800/80 flex-col flex-shrink-0 backdrop-blur-xl">
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <HardHat size={18} />
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-tight block">부엉이 파트너랩</span>
              <span className="text-[10px] text-emerald-400 font-medium">일반사용자/협력사 포털</span>
            </div>
          </Link>
        </div>

        {/* User Card */}
        <div className="p-4 m-3 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
              {user?.partner?.companyName?.[0] || user?.name?.[0] || "P"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white truncate">
                  {user?.partner?.companyName || user?.name || "파트너"}
                </p>
                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded">
                  {user?.role === "admin" ? "관리자" : "협력사"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.partner?.contactName ? `${user.partner.contactName} 실장` : user?.email}
              </p>
            </div>
          </div>

          {user?.partner && (
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-yellow-400">
                <Star size={12} className="fill-yellow-400" />
                {user.partner.rating.toFixed(1)}
              </span>
              <span>시공 {user.partner.completedJobs}회</span>
              <span className="text-emerald-400 font-medium">{user.partner.specialty || "누수탐지"}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="p-3 flex-1 overflow-y-auto space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">파트너 메뉴</p>
          
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              pathname === "/dashboard"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <LayoutDashboard size={16} />
            파트너 대시보드 홈
          </Link>

          <Link
            href="/dashboard/billing"
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              pathname === "/dashboard/billing"
                ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                : "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
            }`}
          >
            <span className="flex items-center gap-3">
              <Crown size={16} />
              Master 구독 & 10% 배당
            </span>
            <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
              9.9만
            </span>
          </Link>

          <Link
            href="/customers"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
          >
            <User size={16} />
            고객 등록 (내 시공 / 10% 배당)
          </Link>

          <Link
            href="/tasks"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
          >
            <CheckSquare size={16} />
            현장 작업 관리 및 사진 등록
          </Link>

          <Link
            href="/partners"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
          >
            <CreditCard size={16} />
            파트너 목록 및 정산
          </Link>

          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 pt-4 mb-2">현장 스마트 도구</p>

          <Link
            href="/estimate"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
          >
            <Sparkles size={16} className="text-yellow-400" />
            보일러 진단 & 견적 체크리스트
          </Link>

          <Link
            href="/ai-diagnosis"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
          >
            <Sparkles size={16} className="text-blue-400" />
            AI 사진 누수 판독
          </Link>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 space-y-1.5">
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center justify-between px-3.5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 rounded-xl text-blue-300 text-xs font-bold transition-all"
            >
              <span className="flex items-center gap-2">
                <Shield size={14} className="text-blue-400" />
                관리자 대시보드 전환
              </span>
              <ChevronRight size={14} />
            </Link>
          )}

          <Link
            href="/"
            className="flex items-center gap-2 px-3.5 py-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <Home size={14} />
            일반 모바일 앱 홈으로 이동
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-left font-medium"
          >
            <LogOut size={14} />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
              <HardHat size={16} />
            </div>
            <div>
              <span className="font-bold text-white text-xs">부엉이 파트너랩</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="px-2 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-md"
              >
                관리자모드
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
              title="로그아웃"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
