"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckSquare, Image as ImageIcon } from "lucide-react";
import TaskBoard from "@/components/TaskBoard";
import PhotoGallery from "@/components/PhotoGallery";

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<"tasks" | "photos">("tasks");

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans sm:bg-gray-100 sm:items-center sm:py-10">
      <main className="flex flex-col w-full max-w-md bg-white min-h-screen sm:min-h-full sm:rounded-3xl sm:overflow-hidden sm:shadow-2xl">
        {/* Header */}
        <header className="flex items-center px-4 py-4 bg-white border-b border-gray-100 sticky top-0 z-10">
          <Link href="/dashboard" className="p-2 rounded-full hover:bg-gray-100 transition-colors mr-2 text-gray-600" title="대시보드로 돌아가기">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-gray-800 tracking-tight">작업 관리 및 사진</h1>
        </header>

        {/* Tabs */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "tasks" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <CheckSquare size={16} />
              작업 목록
            </button>
            <button
              onClick={() => setActiveTab("photos")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "photos" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <ImageIcon size={16} />
              현장 사진
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
          {activeTab === "tasks" ? <TaskBoard /> : <PhotoGallery />}
        </div>
      </main>
    </div>
  );
}
