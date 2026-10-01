"use client";

import { useState } from "react";
import { Search, KeyRound, Mail, Phone, User, CheckCircle2, AlertCircle, X, ArrowRight, Loader2, Building2 } from "lucide-react";

interface FoundAccountItem {
  email: string;
  name: string;
  createdAt?: string | Date;
}

interface FindAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFoundEmail?: (email: string) => void;
}

export default function FindAccountModal({
  isOpen,
  onClose,
  onSelectFoundEmail,
}: FindAccountModalProps) {
  const [subTab, setSubTab] = useState<"find_id" | "reset_password">("find_id");

  // Find ID state
  const [findIdName, setFindIdName] = useState("");
  const [findIdPhone, setFindIdPhone] = useState("");
  const [foundEmails, setFoundEmails] = useState<FoundAccountItem[]>([]);
  const [findIdError, setFindIdError] = useState("");
  const [isFindingId, setIsFindingId] = useState(false);

  // Reset Password state
  const [resetEmail, setResetEmail] = useState("");
  const [resetPhone, setResetPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetSuccessMsg, setResetSuccessMsg] = useState("");
  const [resetError, setResetError] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  if (!isOpen) return null;

  const handleFindId = async (e: React.FormEvent) => {
    e.preventDefault();
    setFindIdError("");
    setFoundEmails([]);
    setIsFindingId(true);

    try {
      const res = await fetch("/api/auth/find-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "find_id",
          nameOrCompany: findIdName,
          phone: findIdPhone,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.emails) && data.emails.length > 0) {
          setFoundEmails(data.emails);
        } else if (data.email) {
          setFoundEmails([{ email: data.email, name: data.name || "회원 계정" }]);
        }
      } else {
        setFindIdError(data.error || "입력하신 정보와 일치하는 계정을 찾을 수 없습니다.");
      }
    } catch (err) {
      setFindIdError("아이디 찾기 처리 중 오류가 발생했습니다.");
    } finally {
      setIsFindingId(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSuccessMsg("");

    if (newPassword !== confirmPassword) {
      setResetError("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    if (newPassword.length < 4) {
      setResetError("비밀번호는 최소 4자 이상 입력해 주세요.");
      return;
    }

    setIsResetting(true);

    try {
      const res = await fetch("/api/auth/find-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "reset_password",
          email: resetEmail,
          phone: resetPhone,
          newPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResetSuccessMsg(data.message || "비밀번호가 성공적으로 변경되었습니다.");
      } else {
        setResetError(data.error || "비밀번호 변경에 실패했습니다.");
      }
    } catch (err) {
      setResetError("비밀번호 변경 처리 중 오류가 발생했습니다.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleApplyEmailToLogin = (email: string) => {
    if (onSelectFoundEmail) {
      onSelectFoundEmail(email);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-100 my-8">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Search size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">아이디 / 비밀번호 찾기</h2>
              <p className="text-[11px] text-slate-400">가입 시 등록한 정보로 계정을 조회합니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="p-4 pb-0">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setSubTab("find_id");
                setFindIdError("");
                setFoundEmails([]);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                subTab === "find_id" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <Search size={14} />
              아이디(이메일) 찾기
            </button>
            <button
              onClick={() => {
                setSubTab("reset_password");
                setResetError("");
                setResetSuccessMsg("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                subTab === "reset_password" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
              }`}
            >
              <KeyRound size={14} />
              비밀번호 재설정
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {/* TAB 1: FIND ID */}
          {subTab === "find_id" && (
            <form onSubmit={handleFindId} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">이름 또는 업체명</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={findIdName}
                    onChange={(e) => setFindIdName(e.target.value)}
                    placeholder="예: 김재근 또는 한성방수"
                    className="w-full bg-slate-800/80 border border-slate-700 text-white pl-10 pr-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1.5">등록 휴대폰 번호</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="tel"
                    value={findIdPhone}
                    onChange={(e) => setFindIdPhone(e.target.value)}
                    placeholder="010-0000-0000 (또는 뒤 4자리)"
                    className="w-full bg-slate-800/80 border border-slate-700 text-white pl-10 pr-3.5 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                  />
                </div>
              </div>

              {findIdError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-400" />
                  <span>{findIdError}</span>
                </div>
              )}

              {foundEmails.length > 0 && (
                <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 size={16} />
                    <span>조회된 이메일 계정 ({foundEmails.length}건)</span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {foundEmails.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate font-mono">{item.email}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.name} {item.createdAt ? `(${new Date(item.createdAt).toLocaleDateString()})` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleApplyEmailToLogin(item.email)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow transition-all shrink-0 flex items-center gap-1"
                        >
                          선택 <ArrowRight size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {foundEmails.length === 0 && (
                <button
                  type="submit"
                  disabled={isFindingId || (!findIdName && !findIdPhone)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {isFindingId ? <Loader2 size={16} className="animate-spin" /> : "아이디(이메일) 조회"}
                </button>
              )}
            </form>
          )}

          {/* TAB 2: RESET PASSWORD */}
          {subTab === "reset_password" && (
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">가입 이메일 *</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="partner@example.com"
                    className="w-full bg-slate-800/80 border border-slate-700 text-white pl-10 pr-3.5 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">등록 휴대폰 번호 *</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-2.5 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={resetPhone}
                    onChange={(e) => setResetPhone(e.target.value)}
                    placeholder="010-0000-0000 (또는 뒤 4자리)"
                    className="w-full bg-slate-800/80 border border-slate-700 text-white pl-10 pr-3.5 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">변경할 새 비밀번호 *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호 입력 (4자 이상)"
                  className="w-full bg-slate-800/80 border border-slate-700 text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">새 비밀번호 확인 *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호 다시 입력"
                  className="w-full bg-slate-800/80 border border-slate-700 text-white px-3.5 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {resetError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-400" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccessMsg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                  <span>{resetSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isResetting || !resetEmail || !resetPhone || !newPassword}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isResetting ? <Loader2 size={16} className="animate-spin" /> : "비밀번호 변경 완료"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
