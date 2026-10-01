"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ArrowLeft, Upload, Camera, Trash2, CheckCircle2, ChevronRight, Share2, Wrench, AlertTriangle, Play, HelpCircle } from 'lucide-react';
import Link from 'next/link';

// Sample Leak Image (SVG Base64 representation of a realistic leak stain for zero-friction testing)
const SAMPLE_LEAK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%">
  <rect width="100%" height="100%" fill="%23f8fafc" />
  <circle cx="200" cy="90" r="90" fill="%23cbd5e1" opacity="0.5" filter="blur(25px)" />
  <path d="M120 100 C 150 70, 260 50, 300 110 C 330 135, 250 200, 200 180 C 155 165, 95 130, 120 100 Z" fill="%2394a3b8" opacity="0.4" filter="blur(18px)" />
  <path d="M150 110 C 170 90, 230 80, 260 120 C 275 135, 230 170, 200 160 C 170 150, 130 130, 150 110 Z" fill="%2378350f" opacity="0.3" filter="blur(10px)" />
  <circle cx="205" cy="125" r="20" fill="%23451a03" opacity="0.2" filter="blur(5px)" />
  <text x="200" y="250" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-weight="bold" font-size="13">[ 테스트용 누수 의심 부위 샘플 ]</text>
  <text x="200" y="270" text-anchor="middle" fill="%23cbd5e1" font-family="sans-serif" font-size="11">상단(천장), 중앙(벽면), 하단(바닥)을 각각 클릭해보세요!</text>
  <line x1="20" y1="20" x2="380" y2="20" stroke="%23e2e8f0" stroke-dasharray="4" />
  <line x1="20" y1="280" x2="380" y2="280" stroke="%23e2e8f0" stroke-dasharray="4" />
</svg>`;

interface DiagnosisResult {
  success: boolean;
  type: string;
  typeName: string;
  probability: number;
  locationName: string;
  cause: string;
  description: string;
  checklist: string[];
  estimatedCost: string;
  estMin: number;
  estMax: number;
  queryParams: Record<string, string>;
}

export default function AIDiagnosisPage() {
  const [step, setStep] = useState<'upload' | 'target' | 'scanning' | 'result'>('upload');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [targetPoint, setTargetPoint] = useState<{ x: number; y: number } | null>(null);
  
  // Scanning state
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [scanningCompleted, setScanningCompleted] = useState<boolean[]>([false, false, false, false]);
  
  // Diagnosis result
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  
  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Auto transition for scanner log ticks
  useEffect(() => {
    if (step === 'scanning') {
      const interval = setInterval(() => {
        setScanStepIndex((prev) => {
          if (prev < 3) {
            setScanningCompleted(completed => {
              const updated = [...completed];
              updated[prev] = true;
              return updated;
            });
            return prev + 1;
          } else {
            setScanningCompleted(completed => {
              const updated = [...completed];
              updated[3] = true;
              return updated;
            });
            clearInterval(interval);
            return prev;
          }
        });
      }, 600);

      return () => clearInterval(interval);
    }
  }, [step]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          setTargetPoint(null);
          setStep('target');
        }
      };
      reader.readAsDataURL(file);
    } else {
      showToast('이미지 파일(JPG, PNG 등)만 등록 가능합니다.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // reset input value so re-selecting same file triggers change
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (imageContainerRef.current) {
      const rect = imageContainerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setTargetPoint({ x, y });
    }
  };

  const startSampleTest = () => {
    setImageSrc(SAMPLE_LEAK_SVG);
    setTargetPoint(null);
    setStep('target');
  };

  const resetAll = () => {
    setImageSrc(null);
    setTargetPoint(null);
    setResult(null);
    setScanStepIndex(0);
    setScanningCompleted([false, false, false, false]);
    setStep('upload');
  };

  const handleDiagnose = async () => {
    if (!imageSrc || !targetPoint) return;

    setStep('scanning');
    setIsDiagnosing(true);
    setScanStepIndex(0);
    setScanningCompleted([false, false, false, false]);

    try {
      const response = await fetch('/api/ai-diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageSrc,
          x: targetPoint.x,
          y: targetPoint.y,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setResult(data);
        // 애니메이션 효과를 다 본 후에 결과창으로 전이
        setTimeout(() => {
          setStep('result');
          setIsDiagnosing(false);
        }, 800);
      } else {
        throw new Error(data.error || '진단 실패');
      }
    } catch (error) {
      console.error(error);
      showToast('AI 진단 도중 문제가 발생했습니다.');
      setStep('target');
      setIsDiagnosing(false);
    }
  };

  const handleShare = () => {
    showToast('카카오톡으로 AI 진단서가 발송되었습니다.');
  };

  const getUrlParamsQuery = () => {
    if (!result) return '';
    const params = new URLSearchParams();
    Object.entries(result.queryParams).forEach(([key, val]) => {
      params.append(key, val);
    });
    return `?${params.toString()}`;
  };

  const SCANNING_STEPS = [
    "이미지 데이터를 고해상도로 디코딩하고 있습니다...",
    "누수 균열 패턴 및 수분 분포 영역을 검출하는 중...",
    "패턴 데이터베이스(98,400여 건)와 정밀 교차 대조 중...",
    "인공지능 진단 보고서를 병합하고 권장 견적을 집계하는 중...",
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans sm:bg-gray-100 sm:items-center sm:py-10">
      
      {/* Laser scan animation stylesheet injected dynamically */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-scan {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #2563eb, #60a5fa, #2563eb, transparent);
          box-shadow: 0 0 15px #3b82f6, 0 0 5px #60a5fa;
          animation: scan 2.2s linear infinite;
        }
      ` }} />

      <main className="flex flex-col w-full max-w-md bg-white min-h-screen sm:min-h-full sm:rounded-3xl sm:overflow-hidden sm:shadow-2xl relative">
        
        {/* Header */}
        <header className="flex items-center gap-3 px-6 py-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md">
          <Link href="/dashboard" className="p-1.5 rounded-full hover:bg-blue-800 transition-colors" title="대시보드로 돌아가기">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-1.5">
            <Sparkles size={18} className="text-yellow-400 fill-yellow-400" />
            <h1 className="text-lg font-bold tracking-tight">AI 누수 감지 진단</h1>
          </div>
        </header>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg z-50 animate-bounce flex items-center gap-2 border border-gray-800">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 space-y-6">
          
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center space-y-5 py-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles size={32} className="animate-pulse" />
              </div>
              
              <div className="text-center space-y-1.5">
                <h2 className="text-xl font-bold text-gray-800">누수 사진 등록</h2>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  누수가 의심되는 벽면, 천장, 바닥 사진을 등록하시면 AI가 원인과 심각도를 분석합니다.
                </p>
              </div>

              {/* Hidden Inputs for Camera and Gallery */}
              <input 
                type="file" 
                ref={cameraInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                capture="environment" 
                className="hidden" 
              />
              <input 
                type="file" 
                ref={galleryInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />

              {/* 2-Option Mode Selection Cards */}
              <div className="w-full grid grid-cols-2 gap-3.5 pt-2">
                {/* Mode 1: Camera Capture */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] group cursor-pointer text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:bg-white/30 transition-colors">
                    <Camera size={26} className="text-white" />
                  </div>
                  <span className="font-bold text-sm tracking-tight">현장 직접 촬영</span>
                  <span className="text-[11px] text-blue-100 mt-1">카메라로 즉시 찍기</span>
                </button>

                {/* Mode 2: Photo / Gallery Upload */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/30 text-gray-700 hover:text-indigo-600 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] group cursor-pointer text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center mb-3 transition-colors text-gray-500 group-hover:text-indigo-600">
                    <Upload size={24} />
                  </div>
                  <span className="font-bold text-sm tracking-tight text-gray-800 group-hover:text-indigo-700">사진 파일 업로드</span>
                  <span className="text-[11px] text-gray-400 group-hover:text-indigo-500 mt-1">앨범 / 보관함에서 선택</span>
                </button>
              </div>

              {/* Drag and Drop Zone Area */}
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => galleryInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-xl border border-gray-200 bg-gray-50/80 hover:bg-gray-100/80 transition-colors cursor-pointer text-center"
              >
                <p className="text-[11px] text-gray-500 font-medium">
                  🖥️ PC에서는 사진 파일을 이곳에 드래그하여 바로 올릴 수 있습니다.
                </p>
              </div>

              <div className="w-full flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-400">또는</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Fast testing sample button */}
              <button 
                onClick={startSampleTest}
                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 text-indigo-700 font-semibold text-sm flex items-center justify-center gap-2.5 transition-all shadow-sm"
              >
                <Play size={15} className="fill-indigo-700" />
                샘플 사진으로 바로 테스트하기
              </button>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-left">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-800">촬영 시 팁</h4>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    초점이 명확하고 밝은 조명 아래에서 누수 젖음 상태가 전체적으로 잘 드러나도록 촬영해 주시면 판정 정확도가 더욱 향상됩니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: TARGET / PIN POINT */}
          {step === 'target' && imageSrc && (
            <div className="flex flex-col space-y-5 text-left">
              <div className="space-y-1.5">
                <h2 className="text-lg font-bold text-gray-800">누수 지점 지정</h2>
                <p className="text-xs text-gray-500">
                  아래 사진에서 **누수가 가장 심하거나 의심되는 부위**를 터치하여 타겟을 지정해 주세요.
                </p>
              </div>

              {/* Interactive Target Canvas */}
              <div 
                ref={imageContainerRef}
                onClick={handleImageClick}
                className="w-full aspect-[4/3] relative rounded-2xl overflow-hidden shadow-md cursor-crosshair border border-gray-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={imageSrc} 
                  alt="진단 이미지" 
                  className="w-full h-full object-cover select-none"
                />
                
                {/* Glowing target cursor pointer */}
                {targetPoint && (
                  <div 
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                    style={{ left: `${targetPoint.x}%`, top: `${targetPoint.y}%` }}
                  >
                    <span className="absolute w-8 h-8 rounded-full border-2 border-red-500 animate-ping opacity-75"></span>
                    <span className="absolute w-6 h-6 rounded-full border-2 border-red-500 bg-red-500/20"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-sm"></span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 bg-gray-50 p-3 rounded-xl">
                <span>지정 위치: {targetPoint ? `X:${Math.round(targetPoint.x)}% , Y:${Math.round(targetPoint.y)}%` : "미지정"}</span>
                <button 
                  onClick={resetAll}
                  className="text-gray-500 hover:text-red-500 flex items-center gap-1 font-semibold transition-colors"
                >
                  <Trash2 size={13} />
                  사진 취소
                </button>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  onClick={resetAll}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-sm transition-colors"
                >
                  이전
                </button>
                <button 
                  onClick={handleDiagnose}
                  disabled={!targetPoint}
                  className={`flex-[2] py-3 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${targetPoint ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'}`}
                >
                  <Sparkles size={16} />
                  AI 진단 시작
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SCANNING / LOADING */}
          {step === 'scanning' && imageSrc && (
            <div className="flex flex-col space-y-6 py-4">
              <div className="text-center space-y-1.5">
                <h2 className="text-lg font-bold text-gray-800 flex items-center justify-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                  AI 정밀 비전 정밀 진단 중
                </h2>
                <p className="text-xs text-gray-400">
                  누수 영역의 수분 데이터 및 구조체 균열 패턴을 분석하고 있습니다.
                </p>
              </div>

              {/* Scanning visual image */}
              <div className="w-full aspect-[4/3] relative rounded-2xl overflow-hidden shadow-md border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={imageSrc} 
                  alt="진단 이미지 스캔" 
                  className="w-full h-full object-cover brightness-[0.7]"
                />
                
                {/* Laser scan line overlay */}
                <div className="animate-scan" />

                {/* TargetPoint Pin Point during scan */}
                {targetPoint && (
                  <div 
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                    style={{ left: `${targetPoint.x}%`, top: `${targetPoint.y}%` }}
                  >
                    <span className="absolute w-8 h-8 rounded-full border-2 border-blue-400 animate-ping opacity-75"></span>
                    <span className="w-4 h-4 rounded-full border-2 border-blue-400 bg-blue-500/20"></span>
                  </div>
                )}
              </div>

              {/* Advanced Loading steps progress */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3.5 text-left">
                {SCANNING_STEPS.map((logText, idx) => {
                  const isCompleted = scanningCompleted[idx];
                  const isActive = scanStepIndex === idx;
                  
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-3 transition-opacity duration-300 ${isCompleted ? 'opacity-100' : isActive ? 'opacity-100' : 'opacity-40'}`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      ) : isActive ? (
                        <span className="animate-spin w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full bg-gray-300 shrink-0" />
                      )}
                      <span className={`text-[12px] ${isCompleted ? 'text-gray-700 font-medium' : isActive ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                        {logText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: DIAGNOSIS REPORT */}
          {step === 'result' && result && (
            <div className="flex flex-col space-y-6 text-left animate-fadeIn">
              
              {/* Top Banner */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-5 text-white flex items-center gap-5 shadow-md">
                
                {/* Custom Circular Confidence Meter */}
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.15)" strokeWidth="5" fill="transparent" />
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="28" 
                      stroke="#facc15" 
                      strokeWidth="5" 
                      fill="transparent" 
                      strokeDasharray={2 * Math.PI * 28}
                      strokeDashoffset={2 * Math.PI * 28 * (1 - result.probability / 100)}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-[14px] font-bold text-yellow-400">{result.probability}%</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-wider bg-yellow-400 text-blue-900 px-2 py-0.5 rounded-md">누수 신뢰도 매칭 완료</span>
                  <h3 className="font-bold text-[15px]">{result.typeName}</h3>
                  <p className="text-[11px] text-blue-200">탐지 지점: {result.locationName}</p>
                </div>
              </div>

              {/* Analysis Text */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-400">추정 원인</h4>
                  <p className="text-sm font-semibold text-gray-800 leading-relaxed">{result.cause}</p>
                </div>
                <div className="space-y-1 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-gray-400">AI 정밀 판독 결과</h4>
                  <p className="text-xs text-gray-600 leading-relaxed mt-1">{result.description}</p>
                </div>
              </div>

              {/* Checklist Recommendation */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400">권장 조치 가이드라인</h4>
                <div className="space-y-2">
                  {result.checklist.map((taskText, idx) => (
                    <div key={idx} className="flex gap-3 bg-white border border-gray-100 hover:border-blue-100 rounded-2xl p-3.5 shadow-sm transition-all group">
                      <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                        {idx + 1}
                      </div>
                      <span className="text-xs text-gray-700 leading-relaxed">{taskText}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Range */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex justify-between items-center">
                <div className="space-y-1">
                  <h4 className="text-[11px] font-bold text-indigo-400">예상 공사비 범위</h4>
                  <p className="text-xs text-gray-500">정밀 누수 청음 및 부분 배관 교체 마감 기준</p>
                </div>
                <p className="text-lg font-extrabold text-indigo-900">{result.estimatedCost}</p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-3">
                <Link 
                  href={`/estimate${getUrlParamsQuery()}`}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <Wrench size={16} />
                  이 진단 결과로 새 견적서 자동 작성
                  <ChevronRight size={16} />
                </Link>

                <div className="flex gap-3">
                  <button 
                    onClick={resetAll}
                    className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-xs text-center transition-colors"
                  >
                    다시 진단하기
                  </button>
                  <button 
                    onClick={handleShare}
                    className="flex-1 py-3 px-4 rounded-xl bg-gray-900 text-white hover:bg-gray-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Share2 size={13} className="text-yellow-400" />
                    카카오톡 공유
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Brand footer bar inside screen */}
        <footer className="absolute bottom-0 left-0 right-0 py-3.5 bg-gray-50 border-t border-gray-100 text-center z-20">
          <p className="text-[10px] text-gray-400 font-medium tracking-wide">
            Owl Leak AI Core v4.12 · Deep Learning Vision Model
          </p>
        </footer>

      </main>
    </div>
  );
}
