"use client";

import { Award, Star, Briefcase, MapPin } from "lucide-react";
import Link from "next/link";

interface PartnerItem {
  id: number;
  companyName: string;
  specialty?: string | null;
  region?: string | null;
  rating: number;
  completedJobs: number;
  status: string;
}

export default function PartnerRanking({ partners = [] }: { partners?: PartnerItem[] }) {
  const sorted = [...partners].sort((a, b) => b.completedJobs - a.completedJobs).slice(0, 4);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Award size={18} />
            </span>
            <h2 className="text-base font-bold text-slate-800">우수 파트너 랭킹</h2>
          </div>
          <Link href="/admin/partners" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
            전체 보기 &rarr;
          </Link>
        </div>
        <p className="text-xs text-slate-400 mb-4">시공 완료 건수 및 고객 평점 기준 상위 파트너</p>

        {sorted.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            등록된 파트너 정보가 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      idx === 0
                        ? "bg-amber-400 text-slate-900 shadow-sm"
                        : idx === 1
                        ? "bg-slate-300 text-slate-800"
                        : idx === 2
                        ? "bg-amber-700/20 text-amber-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-800">{p.companyName}</span>
                      <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-medium">
                        {p.specialty || "종합"}
                      </span>
                    </div>
                    {p.region && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> {p.region}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-center justify-end gap-1 text-yellow-500 font-bold text-xs">
                    <Star size={12} fill="currentColor" />
                    <span>{p.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    완공 <strong>{p.completedJobs}</strong>건
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-right">
        <span className="text-xs text-slate-400">
          활성 파트너 총 <strong className="text-slate-700">{partners.filter((p) => p.status === "active").length}</strong>개 업체
        </span>
      </div>
    </div>
  );
}
