"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, FileText, ArrowLeft, Settings, Bell, LogOut, Building2, CreditCard } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { name: "대시보드 홈", href: "/admin", icon: LayoutDashboard },
    { name: "견적 관리", href: "/admin/estimates", icon: FileText },
    { name: "고객 관리", href: "/admin/customers", icon: Users },
    { name: "파트너 관리", href: "/admin/partners", icon: Building2 },
    { name: "정산 관리", href: "/admin/settlements", icon: CreditCard },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 transition-all duration-300">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 text-white font-bold">
            O
          </div>
          <span className="text-white font-bold text-lg tracking-tight">부엉이 관리자</span>
        </div>
        
        <div className="p-4 flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">메뉴</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? "bg-blue-600/10 text-blue-400 font-medium" 
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-blue-500" : "text-slate-400"} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-all text-xs font-semibold">
            <span>👷 파트너 대시보드 보기</span>
          </Link>
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-xs">
            <ArrowLeft size={16} />
            <span>앱으로 돌아가기</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all text-left text-xs">
            <LogOut size={16} />
            <span>로그아웃</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0 z-10 shadow-sm/50">
          <h1 className="text-lg font-bold text-slate-800">
            {navItems.find((item) => item.href === pathname)?.name || "관리자 페이지"}
          </h1>
          <div className="flex items-center gap-4 text-slate-500">
            <button className="p-2 rounded-full hover:bg-slate-100 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold ml-2 border border-slate-300">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 relative">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-white to-transparent -z-10 pointer-events-none"></div>
          {children}
        </main>
      </div>
    </div>
  );
}
