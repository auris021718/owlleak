import prisma from "@/lib/prisma";
import { Users, FileText, TrendingUp, AlertCircle, Building2, Plus, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import RevenueChart from "@/components/charts/RevenueChart";
import PartnerRanking from "@/components/charts/PartnerRanking";
import NotificationFeed from "@/components/admin/NotificationFeed";

export const dynamic = 'force-dynamic'; // Always fetch fresh data

export default async function AdminDashboard() {
  // Fetch stats concurrently from Prisma
  const [
    totalCustomers,
    totalEstimates,
    urgentEstimates,
    totalPartners,
    recentEstimates,
    partners,
    notifications,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.estimate.count(),
    prisma.estimate.count({ where: { urgency: '긴급' } }),
    prisma.partner.count({ where: { status: 'active' } }),
    prisma.estimate.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: true,
        task: {
          include: { partner: true },
        },
      },
    }),
    prisma.partner.findMany({
      orderBy: { completedJobs: 'desc' },
      take: 5,
    }),
    prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ]);

  // Aggregate stats
  const estimatesAgg = await prisma.estimate.aggregate({
    _sum: {
      estimatedMaxPrice: true,
    },
  });

  const totalRevenuePotential = estimatesAgg._sum.estimatedMaxPrice || 0;

  const statsCards = [
    { title: "총 고객 수", value: `${totalCustomers}명`, change: "+12% 이번 달", icon: Users, color: "text-blue-600", bg: "bg-blue-100/70" },
    { title: "누적 견적 건수", value: `${totalEstimates}건`, change: "실시간 접수중", icon: FileText, color: "text-emerald-600", bg: "bg-emerald-100/70" },
    { title: "잠재 매출액 (최대)", value: `${new Intl.NumberFormat('ko-KR').format(totalRevenuePotential)}원`, change: "평균 견적 92만원", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-100/70" },
    { title: "긴급 출동 요망", value: `${urgentEstimates}건`, change: urgentEstimates > 0 ? "우선 배정 필요" : "대기 없음", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-100/70" },
  ];

  return (
    <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full mb-3 border border-blue-500/30">
            <ShieldCheck size={14} /> 통합 관제 대시보드
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">부엉이누수탐지랩 관리 센터</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl leading-relaxed">
            실시간 고객 접수 현황, 파트너 배정 상태 및 누적 매출 실적을 한눈에 모니터링하세요.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 relative z-10">
          <Link
            href="/admin/estimates"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5"
          >
            <FileText size={15} /> 견적 관리 이동
          </Link>
          <Link
            href="/admin/partners"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center gap-1.5"
          >
            <Building2 size={15} /> 파트너 승인/관리
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statsCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <p className="text-xs font-semibold text-slate-400">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">{stat.change}</p>
              </div>
              <div className={`w-13 h-13 rounded-2xl flex items-center justify-center flex-shrink-0 ${stat.bg}`}>
                <Icon size={24} className={stat.color} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Charts & Partner Rankings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart totalPotential={totalRevenuePotential} />
        </div>
        <div className="lg:col-span-1">
          <PartnerRanking partners={partners} />
        </div>
      </div>

      {/* Two Column Section: Recent Estimates & Live Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Estimates Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">최근 접수된 견적</h2>
                <p className="text-xs text-slate-400 mt-0.5">실시간으로 인입되는 고객 견적 요청 목록</p>
              </div>
              <Link href="/admin/estimates" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                전체보기 <ArrowRight size={14} />
              </Link>
            </div>
            
            {recentEstimates.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                접수된 견적이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5">접수일시</th>
                      <th className="px-5 py-3.5">고객 연락처</th>
                      <th className="px-5 py-3.5">누수 위치</th>
                      <th className="px-5 py-3.5">예상 견적가</th>
                      <th className="px-5 py-3.5">배정 상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentEstimates.map((est) => (
                      <tr key={est.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 text-slate-600 font-medium">
                          {est.createdAt.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}{" "}
                          <span className="text-slate-400 text-[11px]">
                            {est.createdAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-800">
                          {est.customerPhone || est.customer?.phone || "미상"}
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 max-w-[180px] truncate">
                          {est.leakLocation || "미입력"}
                        </td>
                        <td className="px-5 py-3.5 font-extrabold text-slate-900">
                          {new Intl.NumberFormat('ko-KR').format(est.estimatedMinPrice || 0)}원 ~
                        </td>
                        <td className="px-5 py-3.5">
                          {est.task?.partner ? (
                            <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full text-[11px] font-bold">
                              {est.task.partner.companyName}
                            </span>
                          ) : est.task ? (
                            <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] font-bold">
                              작업 생성됨
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px] font-bold">
                              미배정 대기
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

          <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-right">
            <Link href="/admin/estimates" className="text-xs font-semibold text-blue-600 hover:underline">
              견적 상세 검토 및 파트너 배정 관리 이동 &rarr;
            </Link>
          </div>
        </div>

        {/* Live Notification Feed */}
        <div className="lg:col-span-1">
          <NotificationFeed initialNotifications={notifications} />
        </div>
      </div>
      
    </div>
  );
}

