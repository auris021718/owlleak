"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldAlert, ArrowRight, Loader2, Lock, Mail, Building2, Phone, CheckCircle2, UserCheck, Shield, HardHat, Crown, Wrench } from "lucide-react";
import Link from "next/link";
import { COOPERATING_SPECIALTIES } from "@/lib/partnerType";

import FindAccountModal from "@/components/auth/FindAccountModal";

const PARTNER_SPECIALTIES = ["누수탐지", "누수", "배관", "종합설비"];

function LoginForm() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [signupType, setSignupType] = useState<"partner" | "cooperating">("partner");
  const [isFindModalOpen, setIsFindModalOpen] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  // Registration form state
  const [regData, setRegData] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    email: "",
    password: "",
    specialty: "누수탐지",
    region: "서울 강남",
  });

  const handleSignupTypeChange = (type: "partner" | "cooperating") => {
    setSignupType(type);
    setRegData((prev) => ({
      ...prev,
      specialty: type === "partner" ? "누수탐지" : "방수",
    }));
  };

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    const targetEmail = customEmail !== undefined ? customEmail : email;
    const targetPassword = customPassword !== undefined ? customPassword : password;

    try {
      const payload: any = { password: targetPassword };
      if (targetEmail.trim()) {
        payload.email = targetEmail.trim();
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        if (redirectPath) {
          router.push(redirectPath);
        } else if (data.user?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      } else {
        setError(data.error || "로그인에 실패했습니다.");
        setIsLoading(false);
      }
    } catch (err) {
      setError("로그인 처리 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regData),
      });

      const data = await res.json();

      if (data.success) {
        const typeName = signupType === "partner" ? "👑 Master 파트너 (월 99,000원)" : "🤝 협력사 (월 55,000원)";
        setSuccessMsg(`${typeName} 회원가입이 완료되었습니다! 등록하신 정보로 로그인해 주세요.`);
        setActiveTab("login");
        setEmail(regData.email);
        setPassword(regData.password);
      } else {
        setError(data.error || "회원가입에 실패했습니다.");
      }
    } catch (err) {
      setError("회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 font-sans relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-6 sm:p-8 rounded-3xl shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
        
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-blue-600/25 border border-blue-500/40 rounded-2xl flex items-center justify-center mb-3 shadow-inner">
            <Lock size={28} className="text-blue-400" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">부엉이누수탐지랩</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">로그인 권한별 대시보드 맞춤 제공</p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl mb-5 border border-slate-700">
          <button
            type="button"
            onClick={() => { setActiveTab("login"); setError(""); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "login" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            직접 로그인
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("register"); setError(""); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "register" ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            신규 회원가입
          </button>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {activeTab === "login" ? (
          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5 ml-1">이메일 계정</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-3.5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 계정 입력"
                  className="w-full bg-slate-800/60 border border-slate-700 text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1.5 ml-1">비밀번호 *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 (기본: 1234!)"
                  className="w-full bg-slate-800/60 border border-slate-700 text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <span className="text-slate-400">비밀번호를 잊으셨나요?</span>
              <button
                type="button"
                onClick={() => setIsFindModalOpen(true)}
                className="text-blue-400 hover:text-blue-300 font-bold underline underline-offset-4 transition-colors"
              >
                아이디 / 비밀번호 찾기
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-600/25 active:scale-[0.98] text-sm mt-2"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  로그인 및 대시보드 이동 <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} className="space-y-3.5">
            {/* Signup Type Selection Cards */}
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1.5 ml-1">가입 업종 유형 선택 *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSignupTypeChange("partner")}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    signupType === "partner"
                      ? "bg-amber-500/20 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/40"
                      : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1 text-amber-400">
                      <Crown size={14} /> 👑 파트너
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-500/30 text-amber-300 rounded font-bold">월 9.9만</span>
                  </div>
                  <p className="text-[10px] leading-tight text-slate-300">
                    누수탐지 · 배관 · 종합설비 <br />
                    <strong className="text-amber-300">1순위 배정 & 10% 배당</strong>
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleSignupTypeChange("cooperating")}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    signupType === "cooperating"
                      ? "bg-blue-500/20 border-blue-500 text-white shadow-lg ring-1 ring-blue-500/40"
                      : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1 text-blue-400">
                      <Wrench size={14} /> 🤝 협력사
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-500/30 text-blue-300 rounded font-bold">월 5.5만</span>
                  </div>
                  <p className="text-[10px] leading-tight text-slate-300">
                    방수 · 타일 · 도배 · 목수 등 <br />
                    <strong className="text-blue-300">제시 금액 100% 수령</strong>
                  </p>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1 ml-1">업체명 *</label>
              <input
                type="text"
                required
                value={regData.companyName}
                onChange={(e) => setRegData({ ...regData, companyName: e.target.value })}
                placeholder={signupType === "partner" ? "예: 서울누수 마스터" : "예: 한성방수 타일"}
                className="w-full bg-slate-800/60 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1 ml-1">주업종 선택 *</label>
                <select
                  value={regData.specialty}
                  onChange={(e) => setRegData({ ...regData, specialty: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs outline-none"
                >
                  {(signupType === "partner" ? PARTNER_SPECIALTIES : COOPERATING_SPECIALTIES).map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1 ml-1">활동 지역 *</label>
                <input
                  type="text"
                  required
                  value={regData.region}
                  onChange={(e) => setRegData({ ...regData, region: e.target.value })}
                  placeholder="예: 서울 강남구"
                  className="w-full bg-slate-800/60 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1 ml-1">담당자명</label>
                <input
                  type="text"
                  value={regData.contactName}
                  onChange={(e) => setRegData({ ...regData, contactName: e.target.value })}
                  placeholder="홍길동"
                  className="w-full bg-slate-800/60 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1 ml-1">전화번호 *</label>
                <input
                  type="tel"
                  required
                  value={regData.phone}
                  onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
                  placeholder="010-0000-0000"
                  className="w-full bg-slate-800/60 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1 ml-1">로그인 이메일 *</label>
              <input
                type="email"
                required
                value={regData.email}
                onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                placeholder="partner@example.com"
                className="w-full bg-slate-800/60 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-medium mb-1 ml-1">로그인 비밀번호 *</label>
              <input
                type="password"
                required
                value={regData.password}
                onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                placeholder="비밀번호 설정"
                className="w-full bg-slate-800/60 border border-slate-700 text-white px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-blue-500 text-xs outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !regData.companyName || !regData.email || !regData.password}
              className={`w-full ${
                signupType === "partner"
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
                  : "bg-blue-600 hover:bg-blue-500 text-white font-bold"
              } disabled:bg-slate-700 disabled:text-slate-500 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg text-sm mt-2`}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : signupType === "partner" ? (
                "👑 Master 파트너 가입 완료 (월 99,000원)"
              ) : (
                "🤝 협력사 가입 완료 (월 55,000원)"
              )}
            </button>
          </form>
        )}

        <div className="mt-4 text-center">
          <Link href="/estimate" className="text-xs text-slate-400 hover:text-white transition-colors">
            &rarr; 현장 진단 및 견적 계산기로 이동
          </Link>
        </div>

        {/* Find ID / PW Modal */}
        <FindAccountModal
          isOpen={isFindModalOpen}
          onClose={() => setIsFindModalOpen(false)}
          onSelectFoundEmail={(selectedEmail) => {
            setEmail(selectedEmail);
            setActiveTab("login");
          }}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm">로딩 중...</div>}>
      <LoginForm />
    </Suspense>
  );
}
