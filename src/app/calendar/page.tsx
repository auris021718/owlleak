"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, MapPin, Clock, CalendarDays, Loader2 } from "lucide-react";

interface Schedule {
  id: number | string;
  date: string; // YYYY-MM-DD
  time: string;
  title: string;
  location: string;
  type: "urgent" | "normal";
  status?: string;
  partner?: { companyName: string };
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Today string YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0];

  // 새 일정 폼 상태 관리
  const [formData, setFormData] = useState({
    title: "",
    date: todayStr,
    time: "10:00",
    location: "",
    type: "normal" as "urgent" | "normal",
  });

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const formatted: Schedule[] = json.data.map((item: any) => {
          let dateStr = todayStr;
          if (item.scheduledDate) {
            const d = new Date(item.scheduledDate);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            dateStr = `${y}-${m}-${day}`;
          }
          return {
            id: item.id,
            date: dateStr,
            time: item.time || "10:00",
            title: item.title,
            location: item.location || "",
            type: item.type === "urgent" ? "urgent" : "normal",
            status: item.status,
            partner: item.partner,
          };
        });
        setSchedules(formatted);
      }
    } catch (err) {
      console.error("Failed to load schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const scheduledDate = new Date(`${formData.date}T${formData.time || "10:00"}:00`).toISOString();
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          scheduledDate,
          time: formData.time,
          location: formData.location,
          type: formData.type,
          status: "todo",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        setFormData({ ...formData, title: "", location: "" });
        setSelectedDateFilter(formData.date);
        fetchSchedules();
      }
    } catch (err) {
      console.error("Failed to add schedule:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 달력 구조 생성
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 일요일(0) ~ 토요일(6)

  const calendarDays = [];
  // 빈 칸 추가 (첫 주, 월요일 시작 기준)
  for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++) {
    calendarDays.push(null);
  }
  // 실제 날짜 추가
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // 선택된 날짜의 일정 필터링
  const displaySchedules = selectedDateFilter
    ? schedules.filter((s) => s.date === selectedDateFilter)
    : schedules;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans sm:bg-gray-100 sm:items-center sm:py-10">
      <main className="flex flex-col w-full max-w-md bg-white min-h-screen sm:min-h-full sm:rounded-3xl sm:overflow-hidden sm:shadow-2xl relative">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Link href="/" className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-lg font-bold text-gray-800 tracking-tight">전체 일정 캘린더</h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <Plus size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto pb-24">
          {/* 달력 영역 */}
          <div className="bg-white p-6 border-b border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <button onClick={handlePrevMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-lg font-bold text-gray-800">
                {year}년 {month + 1}월
              </h2>
              <button onClick={handleNextMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
                <div key={day} className="text-xs font-semibold text-gray-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} className="h-10"></div>;

                const paddedMonth = String(month + 1).padStart(2, "0");
                const paddedDate = String(date).padStart(2, "0");
                const fullDateStr = `${year}-${paddedMonth}-${paddedDate}`;

                const daySchedules = schedules.filter((s) => s.date === fullDateStr);
                const hasSchedule = daySchedules.length > 0;
                const hasUrgent = daySchedules.some((s) => s.type === "urgent");
                const isSelected = selectedDateFilter === fullDateStr;

                return (
                  <button
                    key={`date-${fullDateStr}`}
                    onClick={() => setSelectedDateFilter(fullDateStr)}
                    className={`relative h-10 w-full rounded-lg flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md font-bold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-sm">{date}</span>
                    <div className="absolute bottom-1.5 flex gap-0.5">
                      {hasSchedule && !hasUrgent && (
                        <div className={`w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-blue-500"}`}></div>
                      )}
                      {hasUrgent && (
                        <div className={`w-1 h-1 rounded-full ${isSelected ? "bg-red-200" : "bg-red-500"}`}></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedDateFilter && (
              <button
                onClick={() => setSelectedDateFilter(null)}
                className="mt-4 text-xs font-medium text-blue-600 hover:text-blue-800 w-full text-right underline"
              >
                전체 일정 보기
              </button>
            )}
          </div>

          {/* 일정 리스트 영역 */}
          <div className="p-6 space-y-4 bg-gray-50/50 min-h-full">
            <h3 className="text-sm font-bold text-gray-500 flex items-center gap-2 mb-2">
              <CalendarDays size={16} />
              {selectedDateFilter ? `${selectedDateFilter} 일정` : "모든 일정"} ({displaySchedules.length})
            </h3>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
                <Loader2 size={24} className="animate-spin text-blue-600" />
                <p className="text-xs">일정을 불러오는 중...</p>
              </div>
            ) : displaySchedules.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-400 font-medium">등록된 일정이 없습니다.</p>
              </div>
            ) : (
              displaySchedules
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((schedule) => (
                  <div
                    key={schedule.id}
                    className="relative bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group"
                  >
                    <div
                      className={`absolute top-0 left-0 w-1.5 h-full rounded-l-2xl ${
                        schedule.type === "urgent" ? "bg-red-500" : "bg-blue-500"
                      }`}
                    ></div>

                    <div className="flex justify-between items-start mb-2 pl-2">
                      <div
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                          schedule.type === "urgent"
                            ? "bg-red-50 text-red-600"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {schedule.time}
                      </div>
                      <span className="text-xs text-gray-400 font-medium">{schedule.date}</span>
                    </div>

                    <h4 className="font-bold text-gray-800 text-base mb-2 pl-2">{schedule.title}</h4>

                    {schedule.location && (
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-3 bg-gray-50 rounded-lg p-2 pl-2 border border-gray-100">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="truncate">{schedule.location}</span>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>

        {/* 새 일정 등록 모달 */}
        {isModalOpen && (
          <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
            <div className="bg-white w-full h-[85vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto animate-in slide-in-from-bottom-10 sm:zoom-in flex flex-col">
              <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur z-10">
                <h2 className="text-lg font-bold text-gray-800">새 일정 등록</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-sm text-gray-500 font-semibold hover:text-gray-800 bg-gray-100 px-3 py-1.5 rounded-full"
                >
                  취소
                </button>
              </div>
              <form onSubmit={handleAddSchedule} className="p-6 space-y-5 flex-1">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">작업/방문명 *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="예: 강남 빌라 옥상 방수"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">예정일 *</label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium text-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">방문 시간 *</label>
                      <input
                        type="time"
                        required
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium text-gray-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">현장 주소</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="예: 서울 서초구 반포동"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">우선순위 (종류)</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: "normal" })}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
                          formData.type === "normal"
                            ? "border-blue-500 bg-blue-50 text-blue-600"
                            : "border-gray-200 text-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        일반 일정
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: "urgent" })}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border ${
                          formData.type === "urgent"
                            ? "border-red-500 bg-red-50 text-red-600"
                            : "border-gray-200 text-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        긴급 처리
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.title}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl py-4 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                    일정 대시보드에 등록하기
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

