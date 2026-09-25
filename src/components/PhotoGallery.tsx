"use client";

import { useState, useEffect } from "react";
import { Upload, X, Search, Image as ImageIcon, Loader2, Plus, Tag } from "lucide-react";

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
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors shadow-md shrink-0 text-xs font-bold"
        >
          <Plus size={16} />
          <span>사진 추가</span>
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
            onClick={() => setPhaseFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border shrink-0 ${
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
          <p className="text-xs text-gray-400 mt-1">상단의 &apos;사진 추가&apos; 버튼으로 현장 사진을 등록해 보세요.</p>
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
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
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
                <label className="block text-xs font-bold text-gray-500 mb-1">사진 이미지 URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Sample Presets */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1.5">샘플 프리셋 선택</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_PHOTOS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewUrl(preset.url);
                        setNewTitle(preset.title);
                        setNewPhase(preset.phase);
                      }}
                      className="text-left text-xs p-2 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="font-semibold text-gray-700 truncate">{preset.title}</div>
                      <div className="text-[10px] text-gray-400">{preset.phase}</div>
                    </button>
                  ))}
                </div>
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
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        newPhase === phase.id
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {phase.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !newUrl}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  현장 사진 업로드
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expanded Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition bg-black/40 hover:bg-black/80 rounded-full"
            >
              <X size={24} />
            </button>
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.title || "현장 사진"}
              className="rounded-2xl shadow-2xl object-contain max-h-[80vh] w-auto border border-white/10"
            />
            <div className="mt-3 bg-black/70 backdrop-blur text-white px-5 py-2.5 rounded-full text-xs font-medium shadow-xl flex items-center gap-2">
              <span className="font-bold">{selectedPhoto.title || "현장 사진"}</span>
              {selectedPhoto.phase && (
                <span className="text-yellow-400 font-semibold">
                  [{phaseLabel[selectedPhoto.phase]?.label || selectedPhoto.phase}]
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

