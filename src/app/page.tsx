import { Wrench, PhoneCall, CalendarClock, Briefcase, FileText, ChevronRight, Settings, Users, ArrowRight, UserPlus, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export default async function Home() {
  // Check auth session
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  let userRole: string | null = null;
  let userName: string | null = null;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret");
      const { payload } = await jwtVerify(token, secret);
      userRole = (payload.role as string) || "partner";
      userName = (payload.name as string) || (userRole === "admin" ? "관리자" : "파트너");
    } catch {
      // invalid token
    }
  }

  // Fetch real data
  // Fetch real data
  const inProgressTasksCount = await prisma.task.count({
    where: { status: "진행중" },
  });

  const urgentEstimatesCount = await prisma.estimate.count({
    where: { urgency: { contains: "당일" } },
  });

  // Date calculations for the weekly calendar
  const now = new Date();
  const currentDay = now.getDay(); // 0 (Sun) to 6 (Sat)
  
  // Calculate Monday of the current week
  const monday = new Date(now);
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  // Calculate week number of the month
  const getWeekOfMonth = (date: Date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfWeek = startOfMonth.getDay() || 7; // 1 (Mon) to 7 (Sun)
    return Math.ceil((date.getDate() + (dayOfWeek - 1)) / 7);
  };
  
  const weekLabel = `${now.getMonth() + 1}월 ${getWeekOfMonth(now)}주차`;
  const todayLabel = `오늘: ${now.getMonth() + 1}월 ${now.getDate()}일 (${['일', '월', '화', '수', '목', '금', '토'][now.getDay()]})`;

  // Fetch tasks for the entire current week to show dots
  const startOfWeek = new Date(monday);
  const endOfWeek = new Date(monday);
  endOfWeek.setDate(monday.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const weeklyTasks = await prisma.task.findMany({
    where: {
      scheduledDate: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
    },
  });

  // Calendar days generation
  const weekDayLabels = ['월', '화', '수', '목', '금', '토', '일'];
  const calendarDays = weekDayLabels.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const isToday = date.toDateString() === new Date().toDateString();
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const hasSchedule = weeklyTasks.some(t => t.scheduledDate && t.scheduledDate.toDateString() === date.toDateString());
    
    return {
      day: label,
      date: date.getDate().toString(),
      hasSchedule,
      isToday,
      isWeekend
    };
  });

  // Fetch upcoming tasks for the list below the calendar (3 most recent from now)
  const upcomingTasks = await prisma.task.findMany({
    where: { 
      scheduledDate: { gte: new Date() } 
    },
    orderBy: { scheduledDate: 'asc' },
    take: 3,
    include: { customer: true }
  });
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans sm:bg-gray-100 sm:items-center sm:py-10">
      <main className="flex flex-col w-full max-w-md bg-white min-h-screen sm:min-h-full sm:rounded-3xl sm:overflow-hidden sm:shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5 bg-blue-900 text-white shadow-md">
           <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white overflow-hidden shadow-inner">
              <Image
                src="/owl-logo.png"
                alt="부엉이누수탐지랩 로고"
                width={36}
                height={36}
                className="object-contain"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight">부엉이누수탐지랩</h1>
          </div>
          <div className="flex items-center gap-2">
            {userRole === "admin" ? (
              <>
                <Link
                  href="/admin"
                  className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-blue-950 text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1"
                >
                  👑 관리자
                </Link>
                <Link
                  href="/dashboard"
                  className="px-2.5 py-1.5 bg-blue-800 hover:bg-blue-700 text-emerald-300 text-xs font-bold rounded-xl transition-all border border-blue-700"
                  title="파트너 대시보드 전환"
                >
                  👷 파트너
                </Link>
              </>
            ) : userRole === "partner" ? (
              <Link
                href="/dashboard"
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                👷 {userName || "파트너"} 대시보드
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 bg-blue-800 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all border border-blue-700 flex items-center gap-1"
              >
                <Settings size={14} />
                로그인
              </Link>
            )}
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-8">
          
          {/* Summary Cards */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-3 px-1">업무 요약</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                  <Wrench size={18} />
                </div>
                <h3 className="text-sm font-medium text-gray-600">진행 중 공사</h3>
                <p className="text-2xl font-bold text-blue-900 mt-1">{inProgressTasksCount}건</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
                  <PhoneCall size={18} />
                </div>
                <h3 className="text-sm font-medium text-gray-600">긴급 출동 대기</h3>
                <p className="text-2xl font-bold text-red-600 mt-1">{urgentEstimatesCount}건</p>
              </div>
            </div>
          </section>

          {/* Weekly Schedule Calendar */}
          <section>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-semibold text-gray-500">이번 주 일정</h2>
              <Link href="/calendar" className="text-xs text-blue-600 font-medium hover:underline">전체보기</Link>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-800">{weekLabel}</span>
                <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded-md">{todayLabel}</span>
              </div>
              <div className="flex justify-between">
                {calendarDays.map((item, idx) => (
                  <div key={idx} className={`flex flex-col items-center py-2 rounded-xl w-10 transition-colors ${item.isToday ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 cursor-pointer'}`}>
                    <span className={`text-xs mb-1 ${item.isWeekend && !item.isToday ? 'text-red-400' : ''}`}>{item.day}</span>
                    <span className={`font-semibold text-sm ${item.isToday ? 'text-white' : 'text-gray-800'}`}>{item.date}</span>
                    <div className="h-1.5 mt-1">
                      {item.hasSchedule && <div className={`w-1.5 h-1.5 rounded-full ${item.isToday ? 'bg-white' : 'bg-blue-500'}`}></div>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                {upcomingTasks.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">예정된 일정이 없습니다.</p>
                ) : (
                  upcomingTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3 text-sm">
                        <div className={`w-2 h-2 rounded-full ${task.status === "진행중" ? "bg-red-500 animate-pulse" : "bg-blue-500"}`}></div>
                        <span className="text-gray-800">
                          {task.scheduledDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {task.title}
                        </span>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-3 px-1">빠른 메뉴</h2>
            <div className="space-y-3">
              <Link href="/ai-diagnosis" className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm hover:border-indigo-500 hover:shadow-md transition-all group relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center group-hover:bg-indigo-600 transition-colors shadow-sm">
                    <Sparkles size={20} className="animate-pulse" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">AI 누수 진단</h3>
                      <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full animate-bounce">NEW</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">사진 촬영 및 문제 부위 AI 정밀 분석</p>
                  </div>
                </div>
                <ChevronRight className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
              </Link>

              <Link href="/estimate" className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <FileText size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">새 견적 산출</h3>
                    <p className="text-xs text-gray-500 mt-1">누수 유형별 견적 계산 및 고객 발송</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-blue-500 transition-colors" />
              </Link>
              
              <Link href="/tasks" className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <CalendarClock size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">작업 관리 및 사진</h3>
                    <p className="text-xs text-gray-500 mt-1">진행 현장 기록, 체크리스트, 사진 마크업</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-blue-500 transition-colors" />
              </Link>

              <Link href="/customers" className="w-full flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <UserPlus size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">고객 등록 / 배정</h3>
                    <p className="text-xs text-gray-500 mt-1">고객 등록 시 지역 협력사 자동 알림 발송</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-400 group-hover:text-blue-500 transition-colors" />
              </Link>
            </div>
          </section>

          {/* Partner Action */}
          <section>
            <div className="p-5 rounded-2xl bg-slate-900 relative overflow-hidden">
              <div className="relative z-10 flex flex-col gap-1 text-white text-left max-w-[80%]">
                <h3 className="font-bold flex items-center gap-2">
                  <Users size={16} className="text-yellow-400" />
                  협력사(파트너) 포털
                </h3>
                <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                  방수, 인테리어 복구 파트너라면 전용 관리 화면으로 로그인 해주세요.
                </p>
                <Link href="/dashboard" className="max-w-fit flex items-center gap-1 text-sm font-semibold text-yellow-400 hover:text-yellow-300 transition-colors mt-1">
                  협력사 대시보드 바로가기
                  <ArrowRight size={14} />
                </Link>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-slate-800 rounded-full opacity-50"></div>
              <div className="absolute top-4 right-4 text-slate-700 opacity-20">
                <Briefcase size={80} />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
