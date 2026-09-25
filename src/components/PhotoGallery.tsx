"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, X, Search, Image as ImageIcon, Loader2, Plus, Tag, Camera, RefreshCw } from "lucide-react";

interface Photo {
  id: number | string;
  url: string;
  title?: string;
  caption?: string;
  phase?: string;
  uploadedAt?: string;
  task?: { title: string };
}

const PRESET_PHOTOS = [
  { url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800", title: "욕실 배관 연결부 누수", phase: "before" },
  { url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=800", title: "보일러 배관 점검", phase: "during" },
  { url: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=800", title: "천장 물얼룩 피해 현장", phase: "before" },
  { url: "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=800", title: "옥상 우레탄 방수 시공 완료", phase: "after" },
];

const compressAndGetBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function PhotoGallery() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newPhase, setNewPhase] = useState("during");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks/photos");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPhotos(json.data);
      }
    } catch (err) {
      console.error("Failed to load photos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await compressAndGetBase64(file);
      setNewUrl(dataUrl);
      if (!newTitle) {
        setNewTitle("현장 촬영 사진");
      }
      setIsUploadModalOpen(true);
    } catch (err) {
      alert("이미지 처리 중 오류가 발생했습니다.");
    } finally {
      e.target.value = "";
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/tasks/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newUrl.trim(),
          title: newTitle.trim() || "현장 사진",
          phase: newPhase,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPhotos([json.data, ...photos]);
        setIsUploadModalOpen(false);
        setNewTitle("");
        setNewUrl("");
      }
    } catch (err) {
      console.error("Failed to upload photo:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPhotos = photos.filter((p) => {
    const matchesSearch = (p.title || "").includes(searchQuery) || (p.caption || "").includes(searchQuery);
    const matchesPhase = phaseFilter === "all" || p.phase === phaseFilter;
    return matchesSearch && matchesPhase;
  });

  const phaseLabel: Record<string, { label: string; color: string }> = {
    before: { label: "시공 전", color: "bg-red-50 text-red-600 border-red-200" },
    during: { label: "시공 중", color: "bg-blue-50 text-blue-600 border-blue-200" },
    after: { label: "시공 후", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  };

  return (
    <div className="space-y-5">
      {/* Hidden File Inputs */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        ref={galleryInputRef}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="사진 제목 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm"
          />
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
        </div>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-md shrink-0 text-xs font-bold cursor-pointer"
        >
          <Camera size={15} />
          <span>촬영</span>
        </button>
        <button
          type="button"
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-md shrink-0 text-xs font-bold cursor-pointer"
        >
          <Plus size={15} />
          <span>추가</span>
        </button>
      </div>

      {/* Phase Filter Tabs */}
      <div className="flex gap-2 pb-1 overflow-x-auto">
        {[
          { id: "all", label: "전체 사진" },
          { id: "before", label: "시공 전" },
          { id: "during", label: "시공 중" },
          { id: "after", label: "시공 후" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setPhaseFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shrink-0 cursor-pointer ${
              phaseFilter === tab.id
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <Loader2 size={28} className="animate-spin text-blue-600" />
          <p className="text-xs">사진을 불러오는 중...</p>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <ImageIcon className="mx-auto h-10 w-10 mb-2 text-gray-300" />
          <p className="text-sm font-medium">등록된 사진이 없습니다.</p>
          <p className="text-xs text-gray-400 mt-1">상단의 &apos;촬영&apos; 또는 &apos;추가&apos; 버튼으로 현장 사진을 등록해 보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredPhotos.map((photo) => {
            const phaseInfo = photo.phase ? phaseLabel[photo.phase] : null;
            const dateStr = photo.uploadedAt
              ? new Date(photo.uploadedAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })
              : "";

            return (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group shadow-sm bg-gray-100 border border-gray-100"
              >
                <img
                  src={photo.url}
                  alt={photo.title || "현장 사진"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {phaseInfo && (
                  <div className="absolute top-2 left-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm ${phaseInfo.color} bg-white/95 backdrop-blur-xs`}>
                      {phaseInfo.label}
                    </span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 pt-6">
                  <p className="text-white text-xs font-semibold truncate">{photo.title || "현장 사진"}</p>
                  <p className="text-gray-300 text-[10px] mt-0.5">{dateStr}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Photo Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom-6">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900">새 현장 사진 등록</h3>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Image Preview / Direct Capture Bar */}
              {newUrl ? (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-gray-200">
                  <img src={newUrl} alt="업로드 이미지" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={12} /> 재촬영
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-4 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-700 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Camera size={24} />
                    <span className="text-xs font-bold">카메라로 직접 촬영</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="p-4 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ImageIcon size={24} />
                    <span className="text-xs font-bold">앨범에서 선택</span>
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">사진 제목</label>
                <input
                  type="text"
                  required
                  placeholder="예: 욕실 배관 누수 부위"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">시공 단계</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "before", label: "시공 전" },
                    { id: "during", label: "시공 중" },
                    { id: "after", label: "시공 후" },
                  ].map((phase) => (
                    <button
                      key={phase.id}
                      type="button"
                      onClick={() => setNewPhase(phase.id)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        newPhase === phase.id
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {phase.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="flex-1 py-3 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!newUrl.trim() || isSubmitting}
                  className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  <span>등록 완료</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl space-y-4">
            <div className="relative aspect-video bg-black">
              <img src={selectedPhoto.url} alt={selectedPhoto.title || "현장 사진"} className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-gray-900">{selectedPhoto.title || "현장 사진"}</h3>
                {selectedPhoto.phase && phaseLabel[selectedPhoto.phase] && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${phaseLabel[selectedPhoto.phase].color}`}>
                    {phaseLabel[selectedPhoto.phase].label}
                  </span>
                )}
              </div>

              {selectedPhoto.caption && <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl">{selectedPhoto.caption}</p>}

              <div className="flex justify-between items-center text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                <span>등록일: {selectedPhoto.uploadedAt ? new Date(selectedPhoto.uploadedAt).toLocaleDateString("ko-KR") : "-"}</span>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="px-4 py-1.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition-colors cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
