"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  Plus,
  GripVertical,
  Loader2,
  Trash2,
  Calendar,
  MapPin,
  FileText,
  Phone,
  Building2,
  Camera,
  Send,
  User,
  ExternalLink,
  DollarSign,
  AlertCircle,
  Eye,
  Check
} from "lucide-react";

type TaskStatus = "todo" | "in-progress" | "done";

interface TaskPhoto {
  id: number;
  url: string;
  title?: string | null;
  caption?: string | null;
  phase: string;
}

interface TaskLog {
  id: number;
  action: string;
  description?: string | null;
  createdAt: string;
  user?: {
    name: string;
    role: string;
  };
}

interface Task {
  id: number | string;
  title: string;
  status: string;
  scheduledDate?: string;
  time?: string;
  location?: string;
  type?: string;
  description?: string;
  partnerId?: number | null;
  partner?: { id: number; companyName: string; phone: string };
  customerId?: number | null;
  customer?: { id: number; name: string; phone: string; address?: string };
  estimateId?: number | null;
  estimate?: {
    detectionFee?: number;
    estimatedMinPrice?: number;
    estimatedMaxPrice?: number;
  };
  photos?: TaskPhoto[];
  logs?: TaskLog[];
  settlements?: any[];
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskLocation, setNewTaskLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Task Detail & Report Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const [taskPhotos, setTaskPhotos] = useState<TaskPhoto[]>([]);
  const [newLogAction, setNewLogAction] = useState("현장 도착 및 점검");
  const [newLogDesc, setNewLogDesc] = useState("");
  const [isAddingLog, setIsAddingLog] = useState(false);

  // New photo inside modal
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [newPhotoPhase, setNewPhotoPhase] = useState("during");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tasks");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setTasks(json.data);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleOpenTaskDetail = async (task: Task) => {
    setSelectedTask(task);
    // Fetch logs & photos for this task
    try {
      const [logsRes, taskDetailRes] = await Promise.all([
        fetch(`/api/tasks/${task.id}/logs`),
        fetch(`/api/tasks/${task.id}`),
      ]);
      const logsJson = await logsRes.json();
      const taskDetailJson = await taskDetailRes.json();

      if (logsJson.success && Array.isArray(logsJson.data)) {
        setTaskLogs(logsJson.data);
      }
      if (taskDetailJson.success && taskDetailJson.data) {
        setSelectedTask(taskDetailJson.data);
        if (Array.isArray(taskDetailJson.data.photos)) {
          setTaskPhotos(taskDetailJson.data.photos);
        }
      }
    } catch (e) {
      console.error("Failed to fetch task details:", e);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          location: newTaskLocation.trim() || undefined,
          status: "todo",
          scheduledDate: new Date().toISOString(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTasks([json.data, ...tasks]);
        setNewTaskTitle("");
        setNewTaskLocation("");
      }
    } catch (err) {
      console.error("Failed to add task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number | string, newStatus: TaskStatus) => {
    // Optimistic UI update
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    if (selectedTask?.id === id) {
      setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();

      // If status changed to 'done' and partner is assigned, trigger settlement check/creation
      const targetTask = tasks.find((t) => t.id === id);
      if (newStatus === "done" && targetTask?.partnerId) {
        const estFee = targetTask.estimate?.detectionFee || targetTask.estimate?.estimatedMinPrice || 350000;
        await fetch("/api/settlements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partnerId: targetTask.partnerId,
            taskId: targetTask.id,
            amount: estFee,
            status: "pending",
          }),
        });
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      fetchTasks(); // Revert on failure
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newLogAction.trim()) return;

    setIsAddingLog(true);
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: newLogAction,
          description: newLogDesc,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTaskLogs([json.data, ...taskLogs]);
        setNewLogDesc("");
      }
    } catch (e) {
      alert("일지 등록에 실패했습니다.");
    } finally {
      setIsAddingLog(false);
    }
  };

  const handleAddPhoto = async () => {
    if (!selectedTask) return;
    const samplePhotos = [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
    ];
    const randomUrl = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];

    try {
      const res = await fetch("/api/tasks/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTask.id,
          url: randomUrl,
          phase: newPhotoPhase,
          caption: newPhotoCaption || `${newPhotoPhase === "before" ? "시공전" : newPhotoPhase === "after" ? "시공후" : "시공중"} 현장 사진`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTaskPhotos([json.data, ...taskPhotos]);
        setIsAddingPhoto(false);
        setNewPhotoCaption("");
      }
    } catch (e) {
      alert("사진 업로드 실패");
    }
  };

  const handleDeleteTask = async (id: number | string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("이 작업을 삭제하시겠습니까?")) return;
    setTasks(tasks.filter((t) => t.id !== id));
    try {
      await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (selectedTask?.id === id) {
        setSelectedTask(null);
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
      fetchTasks();
    }
  };

  const statusMap: Record<TaskStatus, { label: string; color: string; icon: any }> = {
    todo: { label: "대기 중", color: "bg-gray-100 text-gray-700 border-gray-200", icon: Clock },
    "in-progress": { label: "진행 중", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
    done: { label: "완료", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  };

  return (
    <div className="space-y-6">
      {/* Add Task Form */}
      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 shadow-sm space-y-3">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="새로운 누수 탐지/공사 작업 입력..."
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-inner"
          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
        />
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={newTaskLocation}
              onChange={(e) => setNewTaskLocation(e.target.value)}
              placeholder="현장 주소 (선택)"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
            />
          </div>
          <button
            onClick={handleAddTask}
            disabled={isSubmitting || !newTaskTitle.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 shrink-0"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={16} />}
            작업 추가
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <Loader2 size={28} className="animate-spin text-blue-600" />
          <p className="text-xs">작업 목록을 불러오는 중...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-sm font-medium">등록된 작업이 없습니다.</p>
          <p className="text-xs text-gray-400 mt-1">위 입력창에서 새로운 작업을 등록해 보세요.</p>
        </div>
      ) : (
        /* Task Sections */
        <div className="space-y-5">
          {(["todo", "in-progress", "done"] as TaskStatus[]).map((status) => {
            const statusTasks = tasks.filter((t) => t.status === status);
            if (statusTasks.length === 0) return null;

            return (
              <div key={status} className="space-y-3">
                <h3 className="text-xs font-bold text-gray-500 px-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        status === "todo"
                          ? "bg-amber-400"
                          : status === "in-progress"
                          ? "bg-blue-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    {statusMap[status].label}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
                    {statusTasks.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {statusTasks.map((task) => {
                    const dateStr = task.scheduledDate
                      ? new Date(task.scheduledDate).toLocaleDateString("ko-KR", {
                          month: "numeric",
                          day: "numeric",
                        })
                      : "";

                    return (
                      <div
                        key={task.id}
                        onClick={() => handleOpenTaskDetail(task)}
                        className="bg-white border text-sm border-gray-200/80 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-gray-300 mt-0.5 cursor-grab">
                            <GripVertical size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-semibold truncate text-sm group-hover:text-blue-600 transition-colors ${
                                  task.status === "done" ? "text-gray-400 line-through" : "text-gray-900"
                                }`}
                              >
                                {task.title}
                              </span>
                              {task.type === "urgent" && (
                                <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  긴급
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-400">
                              {dateStr && (
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  {dateStr} {task.time || ""}
                                </span>
                              )}
                              {task.location && (
                                <span className="flex items-center gap-1 truncate max-w-[180px]">
                                  <MapPin size={12} />
                                  {task.location}
                                </span>
                              )}
                              {task.partner?.companyName && (
                                <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-semibold text-[11px] flex items-center gap-1">
                                  <Building2 size={10} />
                                  {task.partner.companyName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action controls */}
                          <div className="shrink-0 flex items-center gap-1.5 ml-2" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={task.status}
                              onChange={(e) =>
                                handleStatusChange(task.id, e.target.value as TaskStatus)
                              }
                              className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium cursor-pointer outline-none transition-colors ${
                                statusMap[task.status as TaskStatus]?.color || "bg-gray-50 text-gray-700"
                              }`}
                            >
                              <option value="todo">대기</option>
                              <option value="in-progress">진행</option>
                              <option value="done">완료</option>
                            </select>
                            <button
                              onClick={(e) => handleDeleteTask(task.id, e)}
                              className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors"
                              title="작업 삭제"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Task Detail & Field Work Log Report */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            {/* Header */}
            <div className="px-6 py-5 bg-blue-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs text-blue-200 font-mono">작업 ID #{selectedTask.id}</span>
                <h3 className="font-bold text-lg">{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-blue-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-sm">
              {/* Partner & Customer Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100">
                  <span className="text-xs text-blue-600 font-semibold block mb-1">배정 협력사</span>
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-blue-700" />
                    <span className="font-bold text-gray-900">
                      {selectedTask.partner?.companyName || "미배정"}
                    </span>
                  </div>
                  {selectedTask.partner?.phone && (
                    <span className="text-xs text-gray-500 font-mono mt-0.5 block">
                      {selectedTask.partner.phone}
                    </span>
                  )}
                </div>

                <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                  <span className="text-xs text-emerald-600 font-semibold block mb-1">고객 정보</span>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-emerald-700" />
                    <span className="font-bold text-gray-900">
                      {selectedTask.customer?.name || "미등록 고객"}
                    </span>
                  </div>
                  {selectedTask.customer?.phone && (
                    <span className="text-xs text-gray-500 font-mono mt-0.5 block">
                      {selectedTask.customer.phone}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Switcher Bar */}
              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <span className="text-xs font-bold text-gray-600">진행 상태 변경:</span>
                <div className="flex gap-2">
                  {(["todo", "in-progress", "done"] as TaskStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(selectedTask.id, st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedTask.status === st
                          ? st === "done"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : st === "in-progress"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-amber-500 text-white shadow-sm"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {statusMap[st].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Work Log Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                    <FileText size={16} className="text-blue-600" />
                    현장 작업 일지 ({taskLogs.length}건)
                  </h4>
                </div>

                {/* Add Log Form */}
                <form onSubmit={handleAddLog} className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2.5 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={newLogAction}
                      onChange={(e) => setNewLogAction(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold bg-white text-gray-800"
                    >
                      <option value="현장 도착 및 점검">현장 도착 및 점검</option>
                      <option value="청음/가스식 정밀 탐지">청음/가스식 정밀 탐지</option>
                      <option value="누수 지점 굴착 및 확인">누수 지점 굴착 및 확인</option>
                      <option value="배관 보수 및 용접 교체">배관 보수 및 용접 교체</option>
                      <option value="공기압/수압 테스트 완료">공기압/수압 테스트 완료</option>
                      <option value="미장 및 마감 복구">미장 및 마감 복구</option>
                      <option value="시공 완료 고객 확인">시공 완료 고객 확인</option>
                    </select>

                    <input
                      type="text"
                      placeholder="상세 설명 / 특이사항..."
                      value={newLogDesc}
                      onChange={(e) => setNewLogDesc(e.target.value)}
                      className="sm:col-span-2 px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isAddingLog}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Send size={13} />
                    일지 등록
                  </button>
                </form>

                {/* Timeline */}
                {taskLogs.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    등록된 작업 일지가 없습니다.
                  </p>
                ) : (
                  <div className="space-y-2.5 border-l-2 border-blue-200 pl-4 ml-2">
                    {taskLogs.map((log) => (
                      <div key={log.id} className="relative space-y-1">
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white"></div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-800 text-xs">{log.action}</span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {new Date(log.createdAt).toLocaleTimeString("ko-KR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {log.description && (
                          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-xl">
                            {log.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Task Photos Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                    <Camera size={16} className="text-indigo-600" />
                    현장 시공 사진 ({taskPhotos.length}장)
                  </h4>
                  <button
                    onClick={() => setIsAddingPhoto(!isAddingPhoto)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                  >
                    <Plus size={13} />
                    사진 추가
                  </button>
                </div>

                {/* Photo Add Form */}
                {isAddingPhoto && (
                  <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2 mb-3">
                    <div className="flex gap-2">
                      <select
                        value={newPhotoPhase}
                        onChange={(e) => setNewPhotoPhase(e.target.value)}
                        className="px-2.5 py-1.5 border border-gray-200 rounded-xl text-xs bg-white"
                      >
                        <option value="before">시공 전</option>
                        <option value="during">시공 중</option>
                        <option value="after">시공 후</option>
                      </select>
                      <input
                        type="text"
                        placeholder="사진 설명 (예: 배관 크랙 확인)"
                        value={newPhotoCaption}
                        onChange={(e) => setNewPhotoCaption(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white"
                      />
                      <button
                        onClick={handleAddPhoto}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                      >
                        업로드
                      </button>
                    </div>
                  </div>
                )}

                {taskPhotos.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    등록된 현장 사진이 없습니다.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {taskPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="rounded-2xl overflow-hidden border border-gray-200 aspect-video relative group bg-black"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || "현장사진"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                          {photo.phase === "before" ? "시공전" : photo.phase === "after" ? "시공후" : "시공중"}
                        </span>
                        {photo.caption && (
                          <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded truncate max-w-[85%]">
                            {photo.caption}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                작업 완료 시 정산 건이 자동으로 생성됩니다.
              </span>
              <button
                onClick={() => setSelectedTask(null)}
                className="px-5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
