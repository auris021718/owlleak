"use client";

import { useState, useEffect } from "react";
import {
  Bell,
  BellRing,
  Download,
  CheckCircle2,
  X,
  Smartphone,
  Sparkles,
  Volume2
} from "lucide-react";

export default function PwaNotificationBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [showBanner, setShowBanner] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check Notification API support
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
      if (Notification.permission === "default") {
        setShowBanner(true);
      }
    }

    // PWA Install prompt listener
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("이 브라우저는 웹 알림을 지원하지 않습니다.");
      return;
    }

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === "granted") {
        triggerSampleNotification("부엉이누수 알림 활성화", "긴급 누수 요청 및 정산 알림을 실시간으로 수신합니다.");
      }
    } catch (e) {
      console.error("Permission request failed:", e);
    }
  };

  const handleInstallPwa = async () => {
    if (!deferredPrompt) {
      alert("홈 화면 추가는 브라우저 메뉴의 '앱 설치' 또는 '홈 화면에 추가'를 이용해주세요.");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const triggerSampleNotification = (title: string, body: string) => {
    // 1. Browser Native Notification
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(`🦉 ${title}`, {
          body,
          icon: "/owl-logo.png",
          badge: "/owl-logo.png",
        });
      } catch (e) {
        console.warn("Native notification display fallback:", e);
      }
    }

    // 2. In-App Toast
    setToastMessage(`${title}: ${body}`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <>
      {/* Floating Push & Install Helper (Bottom Right) */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-2 items-end">
        {/* Toast Popup */}
        {toastMessage && (
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs flex items-center gap-2.5 animate-in slide-in-from-bottom-5 max-w-xs">
            <BellRing size={16} className="text-yellow-400 shrink-0 animate-bounce" />
            <div>
              <p className="font-bold text-yellow-400">실시간 알림 도착</p>
              <p className="text-slate-200 mt-0.5">{toastMessage}</p>
            </div>
          </div>
        )}

        {/* PWA & Notification Banner Bar */}
        {showBanner && (
          <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200 text-xs flex items-center gap-3 animate-in fade-in zoom-in-95 max-w-sm">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold">
              🦉
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-800">앱 설치 & 실시간 알림 받기</p>
              <p className="text-[11px] text-slate-500">긴급 배정 알림을 바로 수신하세요</p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {permission !== "granted" ? (
                <button
                  onClick={requestNotificationPermission}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[11px] transition-colors"
                >
                  알림 허용
                </button>
              ) : isInstallable ? (
                <button
                  onClick={handleInstallPwa}
                  className="px-2.5 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-xl font-bold text-[11px] transition-colors flex items-center gap-1"
                >
                  <Download size={11} /> 앱 설치
                </button>
              ) : null}

              <button
                onClick={() => setShowBanner(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
