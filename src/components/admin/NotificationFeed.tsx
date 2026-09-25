"use client";

import { useState } from "react";
import { Bell, Check, Clock, AlertTriangle, FileCheck, UserPlus, CheckCheck } from "lucide-react";

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date | string;
}

export default function NotificationFeed({ initialNotifications = [] }: { initialNotifications?: NotificationItem[] }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "estimate":
        return <FileCheck size={16} className="text-emerald-600" />;
      case "task":
        return <Clock size={16} className="text-blue-600" />;
      case "urgent":
        return <AlertTriangle size={16} className="text-rose-600" />;
      default:
        return <Bell size={16} className="text-indigo-600" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-rose-50 text-rose-600 rounded-xl relative">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </span>
          <h2 className="text-base font-bold text-slate-800">실시간 알림 및 활동</h2>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium"
          >
            <CheckCheck size={14} /> 모두 읽음
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-6 text-center text-slate-400 text-xs">
          새로운 알림이 없습니다.
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                item.isRead ? "bg-white border-slate-100 opacity-70" : "bg-slate-50/80 border-slate-200 shadow-xs"
              }`}
            >
              <div className="p-2 rounded-lg bg-white border border-slate-200/80 shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 truncate">{item.title}</h4>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(item.createdAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
