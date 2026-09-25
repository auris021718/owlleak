"use client";

import { useState } from "react";
import { TrendingUp, BarChart3, Calendar } from "lucide-react";

interface MonthlyData {
  month: string;
  estimates: number;
  revenue: number; // in ten-thousand KRW (만원)
  completed: number;
}

const SAMPLE_MONTHLY: MonthlyData[] = [
  { month: "11월", estimates: 14, revenue: 820, completed: 11 },
  { month: "12월", estimates: 19, revenue: 1150, completed: 16 },
  { month: "1월", estimates: 23, revenue: 1420, completed: 20 },
  { month: "2월", estimates: 18, revenue: 980, completed: 15 },
  { month: "3월", estimates: 28, revenue: 1850, completed: 25 },
  { month: "4월 (예상)", estimates: 32, revenue: 2100, completed: 27 },
];

export default function RevenueChart({ totalPotential }: { totalPotential?: number }) {
  const [activeMetric, setActiveMetric] = useState<"revenue" | "estimates">("revenue");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxVal = activeMetric === "revenue"
    ? Math.max(...SAMPLE_MONTHLY.map((d) => d.revenue)) * 1.15
    : Math.max(...SAMPLE_MONTHLY.map((d) => d.estimates)) * 1.2;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp size={18} />
            </span>
            <h2 className="text-base font-bold text-slate-800">월별 매출 및 견적 추이</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">최근 6개월간의 접수 건수 및 매출 실적</p>
        </div>

        {/* Toggle buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveMetric("revenue")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeMetric === "revenue" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            매출액 (만원)
          </button>
          <button
            onClick={() => setActiveMetric("estimates")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeMetric === "estimates" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            견적 건수
          </button>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="h-48 w-full relative flex items-end justify-between pt-6 px-2">
        {/* Background Grid Lines */}
        <div className="absolute inset-x-0 top-6 border-b border-dashed border-slate-100"></div>
        <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-100"></div>
        <div className="absolute inset-x-0 bottom-6 border-b border-slate-200"></div>

        {SAMPLE_MONTHLY.map((item, idx) => {
          const val = activeMetric === "revenue" ? item.revenue : item.estimates;
          const heightPercent = Math.max((val / maxVal) * 100, 10);
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={item.month}
              className="flex-1 flex flex-col items-center justify-end h-full z-10 group relative cursor-pointer px-1"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip on hover */}
              {isHovered && (
                <div className="absolute -top-10 bg-slate-900 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg shadow-xl whitespace-nowrap animate-in fade-in zoom-in duration-150">
                  {item.month}: {activeMetric === "revenue" ? `${item.revenue.toLocaleString()}만원` : `${item.estimates}건`}
                </div>
              )}

              {/* Bar */}
              <div
                className={`w-full max-w-[36px] rounded-t-xl transition-all duration-300 ${
                  activeMetric === "revenue"
                    ? isHovered
                      ? "bg-indigo-600 shadow-lg shadow-indigo-200"
                      : "bg-gradient-to-t from-indigo-500 to-indigo-400"
                    : isHovered
                    ? "bg-emerald-600 shadow-lg shadow-emerald-200"
                    : "bg-gradient-to-t from-emerald-500 to-emerald-400"
                }`}
                style={{ height: `${heightPercent}%` }}
              ></div>

              {/* X-axis Label */}
              <span className={`text-[11px] mt-2 font-medium truncate ${isHovered ? "text-indigo-600 font-bold" : "text-slate-400"}`}>
                {item.month}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer summary */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          이번 달 예상 성장률: <strong className="text-emerald-600">+18.5%</strong>
        </span>
        <span className="font-semibold text-slate-700">
          누적 잠재 총액: {totalPotential ? `${(totalPotential / 10000).toLocaleString()}만원` : "9,420만원"}
        </span>
      </div>
    </div>
  );
}
