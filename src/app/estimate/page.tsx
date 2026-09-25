"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Calculator, Send, CheckCircle2, CheckSquare, Square,
  ChevronDown, ChevronUp, Settings, MessageSquare, Sparkles,
  Flame, AlertOctagon, HelpCircle, CheckCheck, Lightbulb, AlertTriangle, Wrench
} from "lucide-react";
import KakaoAlimtalkModal from "@/components/kakao/KakaoAlimtalkModal";
import { lookupBoilerError, BOILER_BRANDS, BOILER_ERROR_DATABASE } from "@/lib/boilerErrorCodes";

type CheckBoxProp = {
  label: string;
  checked: boolean;
  onChange: () => void;
};

function Checkbox({ label, checked, onChange }: CheckBoxProp) {
  return (
    <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition-colors">
      <input 
        type="checkbox" 
        className="hidden" 
        checked={checked} 
        onChange={onChange}
      />
      <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors ${checked ? 'bg-blue-600 border-blue-600' : 'border-2 border-gray-300'}`}>
        {checked && <CheckCircle2 size={14} className="text-white" />}
      </div>
      <span className={`text-sm select-none ${checked ? 'text-blue-900 font-medium' : 'text-gray-600'}`}>{label}</span>
    </label>
  );
}

// 🦉 기본 단가 초기값 상수 정의
const INITIAL_DEFAULT_COSTS: Record<string, number> = {
  "상수도 배관": 200000,
  "하수도 배관": 250000,
  "부분 철거": 150000,
  "미장/방통": 200000,
  "타일 마감": 300000,
  "마루/바닥 복구": 400000,
  "특수 방수": 500000
};

export default function EstimateChecklistPage() {
  // 1. 기본 정보
  const [basicInfo, setBasicInfo] = useState({
    parking: false,
    elevator: false,
    heatingTarget: "개별난방",
    boilerBrand: "",
    boilerError: "",
    boilerPipeSize: "",
    waterBill: "",
    managerCheck: false,
    downstairsCheck: false,
    floorLevel: "",
    leakLocation: "",
    leakAmount: "",
    urgency: "",
  });

  // 2. 피해 증상
  const [damageAreas, setDamageAreas] = useState<string[]>([]);
  const [customDamageArea, setCustomDamageArea] = useState<string>("");
  const [timing, setTiming] = useState<string>("");

  // 3. 탐지 수칙
  const [detectChecks, setDetectChecks] = useState<string[]>([]);
  const detectOptions = [
    "1) 계량기 별침 확인", "2) 변기,정수기 밸브 잠금", "3) 계량기 별침 체크", 
    "4) 보일러 직수 off", "6) 보일러 온수배관 탐지", "7) 보일러 난방배관 탐지",
    "9) 보일러 직수배관 탐지", "10) 유가, 바닥 줄눈 확인", "11) 방수 확인",
    "12) 하수도 역류 확인", "13) 샷시 실리콘 확인", "14) 건물 크랙 확인", 
    "15) 옥상 방수 확인", "16) 아랫층 천장 확인"
  ];
  const [isDetectOpen, setIsDetectOpen] = useState(false);
  const [customDetectItem, setCustomDetectItem] = useState<string>("");

  // 🦉 단가 설정용 상태 관리 레이어 정의
  const [currentCosts, setCurrentCosts] = useState<Record<string, number>>(INITIAL_DEFAULT_COSTS);
  const [settingsCosts, setSettingsCosts] = useState<Record<string, number>>(INITIAL_DEFAULT_COSTS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 4. 필요 작업 내용 (이 부분으로 견적 계산 - 최신 수정 단가가 동적으로 풀링됨)
  const [requiredWorks, setRequiredWorks] = useState<string[]>([]);
  const workOptions = [
    { name: "상수도 배관", cost: currentCosts["상수도 배관"] ?? 200000 },
    { name: "하수도 배관", cost: currentCosts["하수도 배관"] ?? 250000 },
    { name: "부분 철거", cost: currentCosts["부분 철거"] ?? 150000 },
    { name: "미장/방통", cost: currentCosts["미장/방통"] ?? 200000 },
    { name: "타일 마감", cost: currentCosts["타일 마감"] ?? 300000 },
    { name: "마루/바닥 복구", cost: currentCosts["마루/바닥 복구"] ?? 400000 },
    { name: "특수 방수", cost: currentCosts["특수 방수"] ?? 500000 }
  ];

  const [estimatedPrice, setEstimatedPrice] = useState<string | null>(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [detectionFee, setDetectionFee] = useState<string>("300000");
  const [detectionDetails, setDetectionDetails] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [isKakaoModalOpen, setIsKakaoModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 🦉 로컬 스토리지에 기설정된 사용자 정의 기본 단가가 있다면 로드하여 연동
      const storedDefaults = localStorage.getItem("owl_default_costs");
      let activeDefaults = INITIAL_DEFAULT_COSTS;
      if (storedDefaults) {
        try {
          const parsed = JSON.parse(storedDefaults);
          if (parsed && typeof parsed === "object") {
            activeDefaults = { ...INITIAL_DEFAULT_COSTS, ...parsed };
          }
        } catch (e) {
          console.error("Failed to parse stored defaults:", e);
        }
      }
      setCurrentCosts(activeDefaults);
      setSettingsCosts(activeDefaults);

      const params = new URLSearchParams(window.location.search);
      const leakLocation = params.get("leakLocation");
      const urgency = params.get("urgency");
      const boilerBrand = params.get("boilerBrand");
      const boilerError = params.get("boilerError");
      const boilerPipeSize = params.get("boilerPipeSize");
      const elevator = params.get("elevator") === "true";
      const parking = params.get("parking") === "true";
      const heatingTarget = params.get("heatingTarget");
      const detectChecksParam = params.get("detectChecks");
      
      const newBasicInfo = { ...basicInfo };
      if (leakLocation) newBasicInfo.leakLocation = leakLocation === "ceiling" ? "천장 부위 누수 (AI 진단)" : leakLocation === "floor" ? "바닥 배관 누수 (AI 진단)" : leakLocation === "wall" ? "벽면 균열 누수 (AI 진단)" : leakLocation;
      if (urgency) newBasicInfo.urgency = urgency === "today" ? "당일 요망 (긴급)" : urgency === "scheduled" ? "일정 조율" : urgency;
      if (boilerBrand) newBasicInfo.boilerBrand = boilerBrand;
      if (boilerError) newBasicInfo.boilerError = boilerError;
      if (boilerPipeSize) newBasicInfo.boilerPipeSize = boilerPipeSize;
      if (elevator) newBasicInfo.elevator = true;
      if (parking) newBasicInfo.parking = true;
      if (heatingTarget) newBasicInfo.heatingTarget = heatingTarget;
      
      // Auto downstairs check if it is a ceiling leak
      if (leakLocation === "ceiling") {
        newBasicInfo.downstairsCheck = true;
        newBasicInfo.leakAmount = "지속적으로 뚝뚝 떨어짐";
      }

      setBasicInfo(newBasicInfo);

      // Pre-fill detect checklist
      if (detectChecksParam) {
        try {
          const parsed = JSON.parse(detectChecksParam);
          if (Array.isArray(parsed)) {
            const newChecks: string[] = [];
            if (parsed.includes("waterBill")) newChecks.push("1) 계량기 별침 확인");
            if (parsed.includes("downstairsCheck")) newChecks.push("16) 아랫층 천장 확인");
            if (parsed.includes("boilerCheck")) {
              newChecks.push("4) 보일러 직수 off");
              newChecks.push("6) 보일러 온수배관 탐지");
            }
            if (parsed.includes("detectFee")) {
              setDetectionFee("350000"); // AI Premium detection fee
            }
            setDetectChecks(newChecks);
            setIsDetectOpen(true);
          }
        } catch (e) {
          console.error("Failed to parse detectChecks query:", e);
        }
      }

      // Pre-select some typical required works based on leak type
      if (leakLocation === "ceiling") {
        setRequiredWorks(["특수 방수", "타일 마감"]);
        setDetectionDetails("AI 진단 분석 결과: 위층 욕실 배수구 및 바닥 방수층 하자가 강력히 의심됩니다. 1차 아랫층 피해 지점 청음 점검 권장.");
      } else if (leakLocation === "floor") {
        setRequiredWorks(["상수도 배관", "부분 철거", "미장/방통"]);
        setDetectionDetails("AI 진단 분석 결과: 바닥 난방/온수 배관 노후화로 인한 크랙 파열이 강력히 의심됩니다. 청음 및 가스 탐지 후 굴착 복구 공사 권장.");
      } else if (leakLocation === "wall") {
        setRequiredWorks(["특수 방수"]);
        setDetectionDetails("AI 진단 분석 결과: 건물 외벽 크랙 혹은 창틀 주변 코킹 마모 빗물 누입이 의심됩니다. 외부 코킹 재시공 및 보강 권장.");
      }
    }
  }, []);

  // Phone number formatting helper
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setCustomerPhone(formatted);
  };

  const isValidPhone = customerPhone.replace(/[^0-9]/g, "").length >= 10;

  const toggleArray = (arr: string[], val: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (arr.includes(val)) setter(arr.filter(item => item !== val));
    else setter([...arr, val]);
  };

  const calculateEstimate = () => {
    let minCost = parseInt(detectionFee) || 0; // 기본 출장 및 탐지 비용
    let addedCost = 0;

    requiredWorks.forEach(workName => {
      const option = workOptions.find(o => o.name === workName);
      if (option) addedCost += option.cost;
    });

    const totalMin = minCost + addedCost;
    const totalMax = totalMin + (totalMin * 0.2); // +20% for max range
    
    setEstimatedPrice(
      `${new Intl.NumberFormat('ko-KR').format(totalMin)}원 ~ ${new Intl.NumberFormat('ko-KR').format(totalMax)}원`
    );
    
    // Auto scroll to bottom
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const sendAlimtalk = async () => {
    if (!isValidPhone || !estimatedPrice) return;
    setIsSending(true);
    try {
      // 1. DB에 먼저 견적 데이터 저장
      const dbRes = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basicInfo,
          damageAreas,
          customDamageArea,
          timing,
          detectChecks,
          customDetectItem,
          detectionDetails,
          detectionFee,
          requiredWorks,
          estimatedPrice,
          customerPhone: customerPhone.replace(/[^0-9]/g, "") // 하이픈 제거하고 저장
        })
      });
      const dbData = await dbRes.json();
      if (!dbData.success) {
        console.error("견적 DB 저장 실패:", dbData.error);
      }

      // 2. 알림톡 발송
      const res = await fetch("/api/kakao/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: customerPhone,
          templateId: "TPL_ESTIMATE_002",
          templateParams: {
            estimate: estimatedPrice,
            works: requiredWorks.join(", ") || "세부 점검 필요",
            damage: [...damageAreas, ...(customDamageArea ? [customDamageArea] : [])].join(", ") || "미지정",
            leakLocation: basicInfo.leakLocation || "현장 확인"
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setSendSuccess(true);
      }
    } catch (e) {
      alert("전송 에러가 발생했습니다.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans sm:bg-gray-100 sm:items-center sm:py-10">
      <main className="flex flex-col w-full max-w-md bg-white min-h-screen sm:min-h-full sm:rounded-3xl sm:shadow-2xl">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">현장 체크리스트 & 견적</h1>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6 pb-24 space-y-8">
          
          {/* Section 1: Basic Info */}
          <section className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
            <h2 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
              <span className="bg-blue-200 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
              기본 정보 체크
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Checkbox label="주차 가능 여부" checked={basicInfo.parking} onChange={() => setBasicInfo({...basicInfo, parking: !basicInfo.parking})} />
              <Checkbox label="엘리베이터 유무" checked={basicInfo.elevator} onChange={() => setBasicInfo({...basicInfo, elevator: !basicInfo.elevator})} />
              <Checkbox label="건물 관리실 체크" checked={basicInfo.managerCheck} onChange={() => setBasicInfo({...basicInfo, managerCheck: !basicInfo.managerCheck})} />
              <Checkbox label="아랫집 확인 여부" checked={basicInfo.downstairsCheck} onChange={() => setBasicInfo({...basicInfo, downstairsCheck: !basicInfo.downstairsCheck})} />
            </div>
            <div className="flex bg-white rounded-xl border border-gray-200 overflow-hidden text-sm">
              <button 
                onClick={() => setBasicInfo({...basicInfo, heatingTarget: "개별난방"})}
                className={`flex-1 py-3 font-medium transition-colors ${basicInfo.heatingTarget === "개별난방" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >개별 난방</button>
              <button 
                onClick={() => setBasicInfo({...basicInfo, heatingTarget: "지역난방"})}
                className={`flex-1 py-3 font-medium border-l border-gray-200 transition-colors ${basicInfo.heatingTarget === "지역난방" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
              >지역 / 통합 난방</button>
            </div>
            
            {/* 추가된 디테일 기본 정보 */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 px-1">층수</label>
                <input type="text" placeholder="예: 5층" value={basicInfo.floorLevel} onChange={(e) => setBasicInfo({...basicInfo, floorLevel: e.target.value})} className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 px-1">누수 위치 상세</label>
                <input type="text" placeholder="예: 안방 화장실 천장" value={basicInfo.leakLocation} onChange={(e) => setBasicInfo({...basicInfo, leakLocation: e.target.value})} className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 px-1">누수량</label>
                <input type="text" placeholder="예: 뚝뚝 떨어짐" value={basicInfo.leakAmount} onChange={(e) => setBasicInfo({...basicInfo, leakAmount: e.target.value})} className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 px-1">긴급도</label>
                <input type="text" placeholder="예: 당일 요망" value={basicInfo.urgency} onChange={(e) => setBasicInfo({...basicInfo, urgency: e.target.value})} className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all" />
              </div>
              {/* 보일러 브랜드 & 에러코드 지능형 진단 영역 */}
              <div className="col-span-2 bg-gradient-to-br from-slate-50 to-blue-50/40 p-4 rounded-2xl border border-blue-100/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Flame size={15} className="text-orange-500" />
                    보일러 브랜드 & 에러코드 증상 자동 분석
                  </label>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full">
                    실시간 누수 진단 연동
                  </span>
                </div>

                {/* 브랜드 퀵 선택 칩 */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-500 font-semibold">브랜드 선택:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {BOILER_BRANDS.map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => setBasicInfo({ ...basicInfo, boilerBrand: brand })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          basicInfo.boilerBrand === brand
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 인풋 입력 행 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-600">브랜드 직접입력</label>
                    <input
                      type="text"
                      placeholder="예: 경동나비엔, 귀뚜라미"
                      value={basicInfo.boilerBrand}
                      onChange={(e) => setBasicInfo({ ...basicInfo, boilerBrand: e.target.value })}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-slate-600">에러코드 입력/선택</label>
                    <input
                      type="text"
                      placeholder="예: 02, 28, 95, 17, A, 16"
                      value={basicInfo.boilerError}
                      onChange={(e) => setBasicInfo({ ...basicInfo, boilerError: e.target.value })}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-bold font-mono text-orange-600"
                    />
                  </div>
                </div>

                {/* 해당 브랜드의 주요 에러코드 빠른 선택 버튼 */}
                {basicInfo.boilerBrand && BOILER_ERROR_DATABASE[basicInfo.boilerBrand] && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] text-slate-500 font-semibold">{basicInfo.boilerBrand} 주요 에러:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.keys(BOILER_ERROR_DATABASE[basicInfo.boilerBrand]).map((code) => {
                        const info = BOILER_ERROR_DATABASE[basicInfo.boilerBrand][code];
                        const isHigh = info.leakRisk === "HIGH";
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => setBasicInfo({ ...basicInfo, boilerError: code })}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all border ${
                              basicInfo.boilerError === code
                                ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                                : isHigh
                                ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {code} {isHigh ? "🚨누수" : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 실시간 보일러 에러 진단 & 증상 카드 */}
                {(() => {
                  const errorDiag = lookupBoilerError(basicInfo.boilerBrand, basicInfo.boilerError);
                  if (!errorDiag) return null;

                  const isHigh = errorDiag.leakRisk === "HIGH";
                  const isMedium = errorDiag.leakRisk === "MEDIUM";

                  return (
                    <div
                      className={`p-4 rounded-2xl border text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-200 shadow-sm ${
                        isHigh
                          ? "bg-red-50/90 border-red-200 text-red-950"
                          : isMedium
                          ? "bg-amber-50/90 border-amber-200 text-amber-950"
                          : "bg-blue-50/90 border-blue-200 text-blue-950"
                      }`}
                    >
                      {/* Badge & Title */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                            isHigh
                              ? "bg-red-600 text-white"
                              : isMedium
                              ? "bg-amber-500 text-white"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {isHigh ? <AlertOctagon size={12} /> : <AlertTriangle size={12} />}
                          {isHigh
                            ? "🚨 누수 위험도: 높음 (배관 파열 의심)"
                            : isMedium
                            ? "⚠️ 과열/순환 이상 점검"
                            : "ℹ️ 기계/점화 상태 점검"}
                        </span>
                        <span className="font-mono font-bold text-[11px] text-slate-500">
                          {errorDiag.brand} [{errorDiag.code}]
                        </span>
                      </div>

                      {/* Header */}
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{errorDiag.title}</h4>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">{errorDiag.symptom}</p>
                      </div>

                      {/* Leak Explanation */}
                      <div className="p-2.5 bg-white/80 rounded-xl border border-black/5 space-y-1">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Lightbulb size={13} className="text-amber-500 shrink-0" />
                          누수 탐지 관점 원인 분석
                        </span>
                        <p className="text-slate-700 leading-relaxed text-[11px]">
                          {errorDiag.leakExplanation}
                        </p>
                      </div>

                      {/* Recommended Action */}
                      <div className="p-2.5 bg-white/80 rounded-xl border border-black/5 space-y-1">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Wrench size={13} className="text-blue-600 shrink-0" />
                          현장 권장 조치 및 탐지 수칙
                        </span>
                        <p className="text-slate-700 leading-relaxed text-[11px]">
                          {errorDiag.recommendedAction}
                        </p>
                      </div>

                      {/* One Click Apply to Detection Details */}
                      <button
                        type="button"
                        onClick={() => {
                          const autoText = `[보일러 에러 진단 - ${errorDiag.brand} 코드 ${errorDiag.code}]\n• 증상: ${errorDiag.title}\n• 누수 분석: ${errorDiag.leakExplanation}\n• 권장 탐지: ${errorDiag.recommendedAction}`;
                          setDetectionDetails(autoText);
                          if (isHigh) {
                            if (!detectChecks.includes("4) 보일러 직수 off")) {
                              setDetectChecks((prev) => [...prev, "4) 보일러 직수 off", "6) 보일러 온수배관 탐지"]);
                              setIsDetectOpen(true);
                            }
                            if (!requiredWorks.includes("상수도 배관") && !requiredWorks.includes("특수 방수")) {
                              setRequiredWorks((prev) => [...prev, "상수도 배관", "부분 철거"]);
                            }
                          }
                          alert("보일러 에러 분석 내용이 [탐지 내용 요약] 및 체크리스트에 자동 반영되었습니다!");
                        }}
                        className="w-full py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm mt-1"
                      >
                        <CheckCheck size={14} className="text-yellow-400" />
                        이 진단 결과를 탐지 내용 요약에 자동 반영
                      </button>
                    </div>
                  );
                })()}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 px-1">직수 사이즈</label>
                <input type="text" placeholder="예: 15A" value={basicInfo.boilerPipeSize} onChange={(e) => setBasicInfo({...basicInfo, boilerPipeSize: e.target.value})} className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 px-1">수도 요금</label>
                <input type="text" placeholder="예: 10만원 (평형대비 과다)" value={basicInfo.waterBill} onChange={(e) => setBasicInfo({...basicInfo, waterBill: e.target.value})} className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all" />
              </div>
            </div>
          </section>

          {/* Section 2: Symptoms */}
          <section>
            <h2 className="text-sm font-bold text-gray-800 mb-3 block">누수 피해 장소 (다중 선택)</h2>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {["화장실", "주방", "바닥", "거실", "아래층", "그 외"].map((area) => (
                <Checkbox 
                  key={area} 
                  label={area} 
                  checked={damageAreas.includes(area)} 
                  onChange={() => toggleArray(damageAreas, area, setDamageAreas)} 
                />
              ))}
            </div>
            <div className="mb-6">
              <input 
                type="text" 
                placeholder="현장 상황 직접 입력 (예: 발코니 배관 쪽, 안방 장롱 뒤)" 
                value={customDamageArea} 
                onChange={(e) => setCustomDamageArea(e.target.value)} 
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all text-gray-700"
              />
            </div>

            <h2 className="text-sm font-bold text-gray-800 mb-3 block">누수 발생 시점</h2>
            <div className="grid grid-cols-1 gap-2">
              {["계속 물이 떨어진다", "비오거나 눈올 때만", "특정 물 사용할 때만"].map((time) => (
                <button
                  key={time}
                  onClick={() => setTiming(time)}
                  className={`p-3 text-left text-sm rounded-xl border transition-all ${
                    timing === time 
                      ? "bg-indigo-50 border-indigo-400 text-indigo-700 font-bold" 
                      : "bg-white border-gray-200 text-gray-600 hover:border-indigo-200"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </section>

          {/* Section 3: Detailed Checklist */}
          <section className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
            <button 
              onClick={() => setIsDetectOpen(!isDetectOpen)}
              className="w-full flex items-center justify-between p-4 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <h2 className="text-sm font-bold text-slate-800">탐지 절차 체크리스트 ({detectChecks.length}/{detectOptions.length})</h2>
              {isDetectOpen ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
            </button>
            
            {isDetectOpen && (
              <div className="p-4 grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {detectOptions.map((opt) => (
                   <Checkbox 
                   key={opt} label={opt} 
                   checked={detectChecks.includes(opt)} 
                   onChange={() => toggleArray(detectChecks, opt, setDetectChecks)} 
                 />
                ))}
                
                <div className="pt-2 mt-1 border-t border-slate-200">
                  <input 
                    type="text" 
                    placeholder="기타 탐지 항목이나 특이사항 직접 입력" 
                    value={customDetectItem} 
                    onChange={(e) => setCustomDetectItem(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all text-slate-700"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Section 4: Required Works (Cost impact) */}
          <section>
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-800 mb-2 block">탐지 내용 요약</h2>
              <textarea 
                placeholder="예: 안방 화장실 천장 배관 미세 누수 확인 (원인 상세)" 
                value={detectionDetails}
                onChange={(e) => setDetectionDetails(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all text-gray-700 resize-none"
                rows={3}
              />
            </div>

            <div className="mb-8">
              <h2 className="text-sm font-bold text-gray-800 mb-2 block">기본 탐지비 입력</h2>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={detectionFee === "" ? "" : new Intl.NumberFormat('ko-KR').format(parseInt(detectionFee))}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setDetectionFee(val);
                  }} 
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-bold text-right text-blue-900"
                />
                <span className="text-gray-600 font-bold">원</span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-1.5">
              <h2 className="text-sm font-bold text-gray-800">필요 작업 내용 판정</h2>
              <button 
                type="button"
                onClick={() => {
                  const storedDefaults = localStorage.getItem("owl_default_costs");
                  let activeDefaults = INITIAL_DEFAULT_COSTS;
                  if (storedDefaults) {
                    try {
                      const parsed = JSON.parse(storedDefaults);
                      if (parsed && typeof parsed === "object") {
                        activeDefaults = { ...INITIAL_DEFAULT_COSTS, ...parsed };
                      }
                    } catch (e) {}
                  }
                  setSettingsCosts(activeDefaults);
                  setIsSettingsOpen(true);
                }}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors px-2.5 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg shadow-sm"
              >
                <Settings size={12} className="animate-spin-slow" />
                기본 단가 설정
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">* 선택된 항목을 바탕으로 예상 견적이 합산됩니다. 단가 입력 필드에서 즉시 수정 가능합니다.</p>
            <div className="flex flex-col gap-2">
              {workOptions.map((work) => (
                <label key={work.name} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${requiredWorks.includes(work.name) ? 'bg-blue-600 border-blue-600' : 'border-2 border-gray-300'}`}>
                      {requiredWorks.includes(work.name) && <div className="w-2 h-2 rounded-full bg-white"></div>}
                    </div>
                    <span className={`text-sm font-medium ${requiredWorks.includes(work.name) ? 'text-gray-900' : 'text-gray-600'}`}>{work.name}</span>
                  </div>

                  {/* 🦉 실시간 직접 인풋 수정 폼 (이벤트 전파 방지 버블링 차단 완벽 적용) */}
                  <div 
                    className="flex items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input 
                      type="text" 
                      value={currentCosts[work.name] === undefined ? "" : new Intl.NumberFormat('ko-KR').format(currentCosts[work.name])}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                        setCurrentCosts(prev => ({ ...prev, [work.name]: val }));
                      }}
                      className="w-24 px-2 py-1 text-right text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg text-blue-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                      placeholder="0"
                    />
                    <span className="text-xs font-semibold text-gray-400">원</span>
                  </div>

                  <input type="checkbox" className="hidden" checked={requiredWorks.includes(work.name)} onChange={() => toggleArray(requiredWorks, work.name, setRequiredWorks)} />
                </label>
              ))}
            </div>
          </section>

          <button
            onClick={calculateEstimate}
            className="w-full py-4 mt-6 bg-blue-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:bg-blue-950 transition-colors shadow-lg hover:shadow-xl"
          >
            <Calculator size={20} />
            상세 견적 계산하기
          </button>

          {/* Estimate Result */}
          {estimatedPrice && (
            <section className="pt-6 border-t border-gray-200 animate-in fade-in slide-in-from-bottom-6 duration-500">
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-6 border border-yellow-200 text-center shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Calculator size={80} />
                </div>
                <h3 className="text-sm font-bold text-yellow-800 mb-2">총 예상 누수공사 견적</h3>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{estimatedPrice}</p>
                <div className="bg-white/60 p-3 rounded-xl mt-4 text-left">
                  <p className="text-xs text-yellow-800 font-medium leading-relaxed">
                    * 기본 탐지비 {new Intl.NumberFormat('ko-KR').format(parseInt(detectionFee) || 0)}원에 필요 작업({requiredWorks.length}건) 비용이 합산된 대략적인 금액입니다.<br/>
                    * 현장의 실제 상황이나 마감재 종류에 따라 비용이 추가될 수 있습니다.
                  </p>
                </div>
              </div>

              {/* Send Alimtalk */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-800">결과 알림톡 고객 발송</h2>
                  {isValidPhone && !sendSuccess && (
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">발송 가능</span>
                  )}
                </div>

                {/* Message Preview */}
                {!sendSuccess && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm text-xs text-gray-600 space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                    <p className="font-bold text-gray-800">[부엉이누수탐지랩] 견적 결과 안내</p>
                    <p>안녕하세요, 고객님. 요청하신 현장의 누수 점검 및 견적 결과입니다.</p>
                    <div className="space-y-1 py-1">
                      <p>• 누수 위치: <span className="text-blue-600 font-medium">{basicInfo.leakLocation || "현장 확인"}</span></p>
                      <p>• 필요 작업: <span className="font-medium text-gray-800">{requiredWorks.join(", ") || "상세 점검 필요"}</span></p>
                      <p>• 예상 견적: <span className="font-bold text-gray-900">{estimatedPrice}</span></p>
                    </div>
                    <p>문의사항은 본 번호로 연락 부탁드립니다.</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <input 
                    type="tel"
                    placeholder="고객 연락처 (010-0000-0000)"
                    value={customerPhone}
                    onChange={handlePhoneChange}
                    maxLength={13}
                    className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                  />
                  <button
                    onClick={sendAlimtalk}
                    disabled={!isValidPhone || isSending || sendSuccess}
                    className="bg-[#FFE812] hover:bg-[#F4DC00] disabled:bg-gray-100 disabled:text-gray-400 text-slate-800 px-5 rounded-xl font-bold flex items-center justify-center transition-all min-w-[80px] shadow-sm active:scale-95"
                  >
                    {isSending ? (
                      <span className="w-5 h-5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin"></span>
                    ) : sendSuccess ? (
                      <CheckCircle2 size={24} className="text-green-600" />
                    ) : (
                      <span className="flex items-center gap-1">발송</span>
                    )}
                  </button>
                </div>
                {sendSuccess && (
                  <p className="text-sm text-green-700 font-bold flex items-center gap-2 mt-3 bg-green-50 p-3 rounded-xl border border-green-200">
                    <CheckCircle2 size={18} /> 고객님께 알림톡이 발송되었습니다.
                  </p>
                )}

                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setIsKakaoModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-yellow-800 bg-yellow-100/80 hover:bg-yellow-200 px-3.5 py-2 rounded-xl font-bold transition-all shadow-sm"
                  >
                    <MessageSquare size={13} />
                    알림톡 서식 미리보기 & 테스트 발송
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Kakao Alimtalk Modal */}
          <KakaoAlimtalkModal
            isOpen={isKakaoModalOpen}
            onClose={() => setIsKakaoModalOpen(false)}
            defaultTemplate="ESTIMATE_DISPATCH"
            defaultPhone={customerPhone || "010-0000-0000"}
            defaultParams={{
              customerName: "고객",
              leakLocation: basicInfo.leakLocation || "현장",
              works: requiredWorks.join(", ") || "누수 탐지 및 보수",
              detectionFee: parseInt(detectionFee) || 300000,
              estimatedPrice: estimatedPrice || "300,000 ~ 500,000",
            }}
          />
        </div>

        {/* 🦉 기본 단가 설정 편집용 유리 블러(Glassmorphism) 오버레이 모달 */}
        {isSettingsOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes spin-slow {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .animate-spin-slow {
                animation: spin-slow 8s linear infinite;
              }
            ` }} />
            <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="px-6 py-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings size={18} className="text-yellow-400 animate-spin-slow" />
                  <h3 className="font-bold text-sm">기본 설정 단가 편집</h3>
                </div>
                <span className="text-[10px] font-bold bg-blue-800 text-blue-200 px-2 py-0.5 rounded-full">영구 저장</span>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-left">
                <p className="text-xs text-gray-500 leading-relaxed mb-1">
                  * 이곳에서 수정한 금액은 브라우저에 **기본값**으로 영구 보존되어, 향후 새 견적을 작성할 때 항상 기본값으로 나타납니다.
                </p>
                {Object.keys(INITIAL_DEFAULT_COSTS).map((workName) => (
                  <div key={workName} className="flex flex-col gap-1.5 bg-gray-50 p-3 rounded-2xl border border-gray-100 hover:border-blue-100 transition-all">
                    <label className="text-[11px] font-bold text-gray-600 px-1">{workName}</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={settingsCosts[workName] === undefined ? "" : new Intl.NumberFormat('ko-KR').format(settingsCosts[workName])}
                        onChange={(e) => {
                          const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                          setSettingsCosts(prev => ({ ...prev, [workName]: val }));
                        }}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-right text-indigo-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                      />
                      <span className="text-xs font-bold text-gray-500">원</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-500 hover:bg-gray-100 rounded-xl text-xs font-bold text-center transition-colors"
                >
                  취소
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    localStorage.setItem("owl_default_costs", JSON.stringify(settingsCosts));
                    setCurrentCosts(settingsCosts);
                    setIsSettingsOpen(false);
                    if (typeof window !== "undefined") {
                      alert("기본 단가 설정이 안전하게 영구 저장되었습니다.");
                    }
                  }}
                  className="flex-1 py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold text-center transition-colors shadow-md shadow-blue-900/20"
                >
                  저장 및 동기화
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
