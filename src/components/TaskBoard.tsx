"use client";

import { useState, useEffect, useRef } from "react";
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
  AlertCircle,
  Pencil,
  Check,
  X,
  Edit3,
  RotateCcw,
  Mic,
  MicOff,
  AlertTriangle,
  ImageIcon,
  RefreshCw,
  Video
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

interface DeleteTargetState {
  type: "log" | "task" | "photo";
  id: number | string;
  title?: string;
}

const ACTION_PRESETS = [
  "현장 도착 및 점검",
  "청음/가스식 정밀 탐지",
  "열화상 및 내시경 검사",
  "누수 지점 굴착 및 확인",
  "배관 보수 및 용접 교체",
  "공기압/수압 테스트 완료",
  "방수층 시공 및 양생",
  "미장 및 마감 복구",
  "시공 완료 고객 확인"
];

// Helper to compress image and get Base64 Data URL
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

  // Task edit state inside modal
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskLocation, setEditTaskLocation] = useState("");
  const [editTaskDate, setEditTaskDate] = useState("");
  const [editTaskTime, setEditTaskTime] = useState("");
  const [editTaskDesc, setEditTaskDesc] = useState("");
  const [isSavingTask, setIsSavingTask] = useState(false);

  // Custom Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<DeleteTargetState | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Log state
  const [newLogAction, setNewLogAction] = useState(ACTION_PRESETS[0]);
  const [newLogCustomAction, setNewLogCustomAction] = useState("");
  const [newLogDesc, setNewLogDesc] = useState("");
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [isCustomAction, setIsCustomAction] = useState(false);

  // Edit Log state
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editLogAction, setEditLogAction] = useState("");
  const [editLogDesc, setEditLogDesc] = useState("");
  const [isSavingLog, setIsSavingLog] = useState(false);

  // Voice Recognition (STT) state
  const [listeningTarget, setListeningTarget] = useState<"newLogDesc" | "newLogCustomAction" | "editLogDesc" | null>(null);
  const recognitionRef = useRef<any>(null);

  // Photo Capture & Upload State
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [newPhotoPhase, setNewPhotoPhase] = useState("during");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Direct Camera / Webcam Stream State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  /* ==================== VOICE RECOGNITION (STT) ==================== */
  const toggleSpeechRecognition = (target: "newLogDesc" | "newLogCustomAction" | "editLogDesc") => {
    if (listeningTarget === target) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setListeningTarget(null);
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      alert("현재 사용 중인 브라우저에서는 음성 인식을 지원하지 않습니다. Chrome 또는 Edge 브라우저를 권장합니다.");
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = "ko-KR";
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      let baseText = "";
      if (target === "newLogDesc") baseText = newLogDesc;
      else if (target === "newLogCustomAction") baseText = newLogCustomAction;
      else if (target === "editLogDesc") baseText = editLogDesc;

      recognition.onstart = () => {
        setListeningTarget(target);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        const combinedText = baseText ? `${baseText} ${transcript}` : transcript;

        if (target === "newLogDesc") {
          setNewLogDesc(combinedText);
        } else if (target === "newLogCustomAction") {
          setNewLogCustomAction(combinedText);
        } else if (target === "editLogDesc") {
          setEditLogDesc(combinedText);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          alert("마이크 사용 권한이 차단되어 있습니다. 브라우저 주소창 왼쪽의 설정에서 마이크 권한을 허용해주세요.");
        }
        setListeningTarget(null);
      };

      recognition.onend = () => {
        setListeningTarget(null);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      alert("음성 인식을 시작하지 못했습니다.");
      setListeningTarget(null);
    }
  };

  const handleOpenTaskDetail = async (task: Task) => {
    setSelectedTask(task);
    setIsEditingTask(false);
    setEditingLogId(null);
    setIsAddingPhoto(false);
    setSelectedImagePreview(null);
    setEditTaskTitle(task.title || "");
    setEditTaskLocation(task.location || "");
    setEditTaskDate(task.scheduledDate ? task.scheduledDate.split("T")[0] : "");
    setEditTaskTime(task.time || "");
    setEditTaskDesc(task.description || "");

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

  const handleSaveTaskInfo = async () => {
    if (!selectedTask || !editTaskTitle.trim() || isSavingTask) return;
    try {
      setIsSavingTask(true);
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTaskTitle.trim(),
          location: editTaskLocation.trim() || null,
          scheduledDate: editTaskDate ? new Date(editTaskDate).toISOString() : null,
          time: editTaskTime.trim() || null,
          description: editTaskDesc.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const updated = json.data;
        setSelectedTask(updated);
        setTasks(tasks.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
        setIsEditingTask(false);
      } else {
        alert(json.error || "작업 정보 수정에 실패했습니다.");
      }
    } catch (err) {
      console.error("Failed to update task info:", err);
      alert("작업 정보 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleStatusChange = async (id: number | string, newStatus: TaskStatus) => {
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
      fetchTasks();
    }
  };

  /* ==================== WORK LOG (현장작업일지) CRUD ==================== */

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || isAddingLog) return;

    const actionText = isCustomAction ? newLogCustomAction.trim() : newLogAction.trim();
    if (!actionText) {
      alert("작업 구분을 입력하거나 선택해주세요.");
      return;
    }

    setIsAddingLog(true);
    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionText,
          description: newLogDesc.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTaskLogs([json.data, ...taskLogs]);
        setNewLogDesc("");
        setNewLogCustomAction("");
        setIsCustomAction(false);
      } else {
        alert(json.error || "일지 등록에 실패했습니다.");
      }
    } catch (e) {
      console.error("Failed to add task log:", e);
      alert("일지 등록 중 오류가 발생했습니다.");
    } finally {
      setIsAddingLog(false);
    }
  };

  const handleStartEditLog = (log: TaskLog) => {
    setEditingLogId(log.id);
    setEditLogAction(log.action);
    setEditLogDesc(log.description || "");
  };

  const handleCancelEditLog = () => {
    setEditingLogId(null);
    setEditLogAction("");
    setEditLogDesc("");
  };

  const handleSaveEditLog = async (logId: number | string) => {
    if (!selectedTask || !editLogAction.trim() || isSavingLog) return;

    setIsSavingLog(true);
    const idStr = String(logId);
    try {
      let res = await fetch(`/api/tasks/${selectedTask.id}/logs/${idStr}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editLogAction.trim(),
          description: editLogDesc.trim() || null,
        }),
      });

      if (!res.ok) {
        res = await fetch(`/api/tasks/${selectedTask.id}/logs?logId=${idStr}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            logId: idStr,
            action: editLogAction.trim(),
            description: editLogDesc.trim() || null,
          }),
        });
      }

      if (!res.ok) {
        res = await fetch(`/api/tasks/logs/${idStr}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: editLogAction.trim(),
            description: editLogDesc.trim() || null,
          }),
        });
      }

      const json = await res.json().catch(() => null);
      if (json && json.success) {
        setTaskLogs(taskLogs.map((l) => (String(l.id) === idStr ? json.data : l)));
        setEditingLogId(null);
      } else if (res.ok) {
        setTaskLogs(
          taskLogs.map((l) =>
            String(l.id) === idStr
              ? { ...l, action: editLogAction.trim(), description: editLogDesc.trim() || null }
              : l
          )
        );
        setEditingLogId(null);
      } else {
        alert((json && json.error) || "일지 수정에 실패했습니다.");
      }
    } catch (err) {
      console.error("Failed to update log:", err);
      alert("일지 수정 중 오류가 발생했습니다.");
    } finally {
      setIsSavingLog(false);
    }
  };

  /* ==================== SAFE CUSTOM MODAL DELETION ==================== */

  const triggerDeleteLog = (log: TaskLog, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDeleteTarget({
      type: "log",
      id: log.id,
      title: log.action,
    });
  };

  const triggerDeleteTask = (task: { id: number | string; title: string }, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDeleteTarget({
      type: "task",
      id: task.id,
      title: task.title,
    });
  };

  const triggerDeletePhoto = (photo: TaskPhoto, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDeleteTarget({
      type: "photo",
      id: photo.id,
      title: photo.caption || "현장 사진",
    });
  };

  const executeConfirmedDelete = async () => {
    if (!deleteTarget || isDeleting) return;

    setIsDeleting(true);
    const { type, id } = deleteTarget;
    const idStr = String(id);

    try {
      if (type === "log") {
        if (!selectedTask) return;

        const prevLogs = [...taskLogs];
        const newLogs = taskLogs.filter((l) => String(l.id) !== idStr);
        setTaskLogs(newLogs);

        if (selectedTask.logs) {
          setSelectedTask({
            ...selectedTask,
            logs: selectedTask.logs.filter((l) => String(l.id) !== idStr),
          });
        }

        let res = await fetch(`/api/tasks/${selectedTask.id}/logs/${idStr}`, { method: "DELETE" });
        if (!res.ok) {
          res = await fetch(`/api/tasks/${selectedTask.id}/logs?logId=${idStr}`, { method: "DELETE" });
        }
        if (!res.ok) {
          res = await fetch(`/api/tasks/logs/${idStr}`, { method: "DELETE" });
        }

        const json = await res.json().catch(() => null);
        if (!res.ok && (!json || !json.success)) {
          setTaskLogs(prevLogs);
          alert((json && json.error) || "일지 삭제에 실패했습니다.");
        }
      } else if (type === "task") {
        const prevTasks = [...tasks];
        setTasks(tasks.filter((t) => String(t.id) !== idStr));
        if (selectedTask && String(selectedTask.id) === idStr) {
          setSelectedTask(null);
        }

        const res = await fetch(`/api/tasks/${idStr}`, { method: "DELETE" });
        const json = await res.json().catch(() => null);
        if (!res.ok && (!json || !json.success)) {
          setTasks(prevTasks);
          alert((json && json.error) || "작업 삭제에 실패했습니다.");
        }
      } else if (type === "photo") {
        const prevPhotos = [...taskPhotos];
        const newPhotos = taskPhotos.filter((p) => String(p.id) !== idStr);
        setTaskPhotos(newPhotos);

        if (selectedTask && selectedTask.photos) {
          setSelectedTask({
            ...selectedTask,
            photos: selectedTask.photos.filter((p) => String(p.id) !== idStr),
          });
        }
      }
    } catch (err) {
      console.error("Failed to execute delete:", err);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  /* ==================== CAMERA CAPTURE & PHOTO UPLOAD ==================== */

  // 1. 파일 인풋(갤러리 또는 모바일 카메라 캡처) 핸들러
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await compressAndGetBase64(file);
      setSelectedImagePreview(dataUrl);
      setIsAddingPhoto(true);
    } catch (err) {
      console.error("Image processing error:", err);
      alert("이미지 처리 중 오류가 발생했습니다.");
    } finally {
      e.target.value = "";
    }
  };

  // 2. 실시간 웹캠 / 카메라 스트림 시작 (PC 및 지원 브라우저)
  const startCameraStream = async () => {
    try {
      setIsCameraModalOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Webcam stream access failed, falling back to camera file input:", err);
      setIsCameraModalOpen(false);
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    }
  };

  // 3. 카메라 스트림 종료
  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraModalOpen(false);
  };

  // 4. 비디오 스트림에서 현재 프레임 캡처(찰칵)
  const captureFrameFromCamera = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    setSelectedImagePreview(dataUrl);
    stopCameraStream();
    setIsAddingPhoto(true);
  };

  // 5. 사진 서버 업로드 등록
  const handleSavePhoto = async () => {
    if (!selectedTask || !selectedImagePreview || isUploadingPhoto) return;

    setIsUploadingPhoto(true);
    try {
      const res = await fetch("/api/tasks/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTask.id,
          url: selectedImagePreview,
          phase: newPhotoPhase,
          caption:
            newPhotoCaption.trim() ||
            `${newPhotoPhase === "before" ? "시공전" : newPhotoPhase === "after" ? "시공후" : "시공중"} 현장 사진`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTaskPhotos([json.data, ...taskPhotos]);
        setIsAddingPhoto(false);
        setSelectedImagePreview(null);
        setNewPhotoCaption("");
      } else {
        alert(json.error || "사진 등록에 실패했습니다.");
      }
    } catch (e) {
      console.error("Failed to upload photo:", e);
      alert("사진 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const statusMap: Record<TaskStatus, { label: string; color: string; icon: any }> = {
    todo: { label: "대기 중", color: "bg-gray-100 text-gray-700 border-gray-200", icon: Clock },
    "in-progress": { label: "진행 중", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
    done: { label: "완료", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Inputs for Direct Camera and Album Upload */}
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
            type="button"
            onClick={handleAddTask}
            disabled={isSubmitting || !newTaskTitle.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
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
                              type="button"
                              onClick={(e) => triggerDeleteTask({ id: task.id, title: task.title }, e)}
                              className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
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
              <div className="flex-1 mr-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-200 font-mono">작업 ID #{selectedTask.id}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingTask(!isEditingTask)}
                    className="text-xs bg-blue-800 hover:bg-blue-700 text-blue-100 px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Pencil size={11} />
                    {isEditingTask ? "수정 취소" : "작업 정보 수정"}
                  </button>
                </div>
                {!isEditingTask ? (
                  <h3 className="font-bold text-lg leading-tight mt-0.5">{selectedTask.title}</h3>
                ) : (
                  <div className="mt-1">
                    <input
                      type="text"
                      value={editTaskTitle}
                      onChange={(e) => setEditTaskTitle(e.target.value)}
                      className="w-full px-2.5 py-1 text-sm bg-blue-800/90 border border-blue-600 rounded-lg text-white font-bold placeholder-blue-300 focus:outline-none focus:ring-1 focus:ring-white"
                      placeholder="작업 제목"
                    />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-sm">
              {/* Task Edit Form Panel (if toggled) */}
              {isEditingTask && (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Edit3 size={14} /> 현장 작업 기본정보 수정
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-600 mb-1 block">현장 주소</label>
                      <input
                        type="text"
                        value={editTaskLocation}
                        onChange={(e) => setEditTaskLocation(e.target.value)}
                        placeholder="예: 서울 강남구 역삼동 123-45"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="text-[11px] font-semibold text-gray-600 mb-1 block">예정 일자</label>
                        <input
                          type="date"
                          value={editTaskDate}
                          onChange={(e) => setEditTaskDate(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-gray-600 mb-1 block">시간</label>
                        <input
                          type="text"
                          value={editTaskTime}
                          onChange={(e) => setEditTaskTime(e.target.value)}
                          placeholder="예: 14:00"
                          className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 mb-1 block">현장 특이사항 / 메모</label>
                    <textarea
                      value={editTaskDesc}
                      onChange={(e) => setEditTaskDesc(e.target.value)}
                      placeholder="고객 요청사항 또는 사전 탐지 정보..."
                      rows={2}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingTask(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTaskInfo}
                      disabled={isSavingTask || !editTaskTitle.trim()}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      {isSavingTask ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      저장 완료
                    </button>
                  </div>
                </div>
              )}

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
                      type="button"
                      onClick={() => handleStatusChange(selectedTask.id, st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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

              {/* Work Log Section (현장 작업 일지) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                      <FileText size={16} className="text-blue-600" />
                      현장작업일지 ({taskLogs.length}건)
                    </h4>
                    <span className="text-[11px] text-gray-400">
                      마이크(🎤) 음성 입력 및 각 일지별 수정·삭제 가능
                    </span>
                  </div>
                </div>

                {/* Add Log Form */}
                <form onSubmit={handleAddLog} className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2.5 mb-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">새 일지 작성</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomAction(!isCustomAction)}
                      className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
                    >
                      {isCustomAction ? "기본 프리셋 목록 선택" : "+ 직접 입력하기"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {!isCustomAction ? (
                      <select
                        value={newLogAction}
                        onChange={(e) => setNewLogAction(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        {ACTION_PRESETS.map((preset) => (
                          <option key={preset} value={preset}>
                            {preset}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="작업 구분 직접 입력..."
                          value={newLogCustomAction}
                          onChange={(e) => setNewLogCustomAction(e.target.value)}
                          className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-xs font-semibold bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => toggleSpeechRecognition("newLogCustomAction")}
                          className={`absolute right-1.5 top-1.5 p-1 rounded-lg transition-all cursor-pointer ${
                            listeningTarget === "newLogCustomAction"
                              ? "bg-red-500 text-white animate-pulse shadow-md"
                              : "text-gray-400 hover:text-blue-600 hover:bg-gray-100"
                          }`}
                          title={listeningTarget === "newLogCustomAction" ? "음성 인식 중지" : "음성으로 입력"}
                        >
                          <Mic size={13} />
                        </button>
                      </div>
                    )}

                    {/* Description input with Voice Recognition (STT) Button */}
                    <div className="sm:col-span-2 relative">
                      <input
                        type="text"
                        placeholder={
                          listeningTarget === "newLogDesc"
                            ? "🎙️ 듣고 있습니다... 말씀해 주세요"
                            : "상세 설명 / 특이사항 (마이크 버튼으로 음성 입력 가능)..."
                        }
                        value={newLogDesc}
                        onChange={(e) => setNewLogDesc(e.target.value)}
                        className={`w-full pl-3 pr-9 py-2 border rounded-xl text-xs bg-white focus:outline-none focus:ring-2 transition-all ${
                          listeningTarget === "newLogDesc"
                            ? "border-red-400 ring-2 ring-red-300 placeholder-red-400"
                            : "border-gray-200 focus:ring-blue-500"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => toggleSpeechRecognition("newLogDesc")}
                        className={`absolute right-1.5 top-1.5 p-1 rounded-lg transition-all cursor-pointer ${
                          listeningTarget === "newLogDesc"
                            ? "bg-red-500 text-white animate-pulse shadow-md"
                            : "text-gray-400 hover:text-blue-600 hover:bg-gray-100"
                        }`}
                        title={listeningTarget === "newLogDesc" ? "음성 인식 중지" : "음성으로 입력"}
                      >
                        {listeningTarget === "newLogDesc" ? <MicOff size={13} /> : <Mic size={13} />}
                      </button>
                    </div>
                  </div>

                  {listeningTarget && (
                    <div className="flex items-center gap-1.5 text-[11px] text-red-600 font-medium bg-red-50 py-1 px-2.5 rounded-lg">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                      <span>음성 인식 중입니다... 한국어로 말씀하시면 텍스트로 변환됩니다.</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isAddingLog || (!isCustomAction && !newLogAction) || (isCustomAction && !newLogCustomAction.trim())}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isAddingLog ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    일지 등록
                  </button>
                </form>

                {/* Timeline */}
                {taskLogs.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    등록된 작업 일지가 없습니다. 위 폼에서 새로운 일지를 등록해보세요.
                  </p>
                ) : (
                  <div className="space-y-3 border-l-2 border-blue-200 pl-4 ml-2">
                    {taskLogs.map((log) => {
                      const isEditing = editingLogId === log.id;

                      return (
                        <div key={log.id} className="relative group/log space-y-1.5 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all">
                          <div className="absolute -left-[23px] top-4 w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-sm"></div>

                          {isEditing ? (
                            /* Inline Edit Form */
                            <div className="space-y-2 p-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                                  <Edit3 size={13} /> 일지 수정
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(log.createdAt).toLocaleString("ko-KR", {
                                    month: "numeric",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">작업 구분</label>
                                  <input
                                    type="text"
                                    value={editLogAction}
                                    onChange={(e) => setEditLogAction(e.target.value)}
                                    placeholder="작업 구분"
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-xl text-xs bg-gray-50 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>

                                <div className="relative">
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[11px] font-semibold text-gray-600 block">상세 내용</label>
                                    <button
                                      type="button"
                                      onClick={() => toggleSpeechRecognition("editLogDesc")}
                                      className={`text-[11px] flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                                        listeningTarget === "editLogDesc"
                                          ? "bg-red-500 text-white font-bold animate-pulse"
                                          : "text-blue-600 hover:bg-blue-50"
                                      }`}
                                    >
                                      <Mic size={11} />
                                      {listeningTarget === "editLogDesc" ? "인식 중지" : "음성 입력"}
                                    </button>
                                  </div>
                                  <textarea
                                    value={editLogDesc}
                                    onChange={(e) => setEditLogDesc(e.target.value)}
                                    placeholder={
                                      listeningTarget === "editLogDesc"
                                        ? "🎙️ 듣고 있습니다... 말씀해 주세요"
                                        : "상세 설명 / 특이사항..."
                                    }
                                    rows={2}
                                    className={`w-full px-3 py-1.5 border rounded-xl text-xs bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                                      listeningTarget === "editLogDesc"
                                        ? "border-red-400 ring-2 ring-red-300 placeholder-red-400"
                                        : "border-gray-300 focus:ring-blue-500"
                                    }`}
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={handleCancelEditLog}
                                  className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <X size={12} /> 취소
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditLog(log.id)}
                                  disabled={isSavingLog || !editLogAction.trim()}
                                  className="px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                                >
                                  {isSavingLog ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                  수정 완료
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Normal View */
                            <div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900 text-xs">{log.action}</span>
                                  {log.user?.name && (
                                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                      {log.user.name}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-gray-400 font-mono">
                                    {new Date(log.createdAt).toLocaleTimeString("ko-KR", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>

                                  {/* Action buttons (Edit & Delete) */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleStartEditLog(log);
                                      }}
                                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                      title="일지 수정"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => triggerDeleteLog(log, e)}
                                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                      title="일지 삭제"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {log.description && (
                                <p className="text-xs text-gray-600 bg-gray-50/80 p-2 rounded-xl mt-1.5 whitespace-pre-wrap">
                                  {log.description}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Task Photos Section (현장 시공 사진 직접 촬영 및 업로드) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                      <Camera size={16} className="text-indigo-600" />
                      현장 시공 사진 ({taskPhotos.length}장)
                    </h4>
                    <span className="text-[11px] text-gray-400">
                      카메라로 직접 촬영하거나 갤러리에서 선택하여 등록할 수 있습니다.
                    </span>
                  </div>

                  {/* Top Photo Upload Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={startCameraStream}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                      title="카메라로 직접 촬영"
                    >
                      <Camera size={13} />
                      직접 촬영
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      title="앨범에서 선택"
                    >
                      <ImageIcon size={13} />
                      앨범 선택
                    </button>
                  </div>
                </div>

                {/* Photo Upload & Preview Form */}
                {isAddingPhoto && selectedImagePreview && (
                  <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-3 mb-4 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                        <Camera size={14} /> 촬영/선택한 사진 확인 및 등록
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingPhoto(false);
                          setSelectedImagePreview(null);
                        }}
                        className="text-gray-400 hover:text-gray-600 text-xs p-1"
                      >
                        ✕ 취소
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Image Preview Thumbnail */}
                      <div className="relative w-full sm:w-36 h-28 rounded-xl overflow-hidden bg-black shrink-0 border border-gray-300 shadow-inner">
                        <img
                          src={selectedImagePreview}
                          alt="사진 미리보기"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (cameraInputRef.current) cameraInputRef.current.click();
                          }}
                          className="absolute bottom-1 right-1 bg-black/70 hover:bg-black text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"
                        >
                          <RefreshCw size={10} /> 재촬영
                        </button>
                      </div>

                      {/* Photo Phase & Caption Inputs */}
                      <div className="flex-1 space-y-2">
                        <div>
                          <label className="text-[11px] font-semibold text-gray-600 block mb-1">시공 단계 구분</label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: "before", label: "시공 전" },
                              { id: "during", label: "시공 중" },
                              { id: "after", label: "시공 후" },
                            ].map((phase) => (
                              <button
                                key={phase.id}
                                type="button"
                                onClick={() => setNewPhotoPhase(phase.id)}
                                className={`py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                  newPhotoPhase === phase.id
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                }`}
                              >
                                {phase.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-gray-600 block mb-1">사진 설명 / 메모 (선택)</label>
                          <input
                            type="text"
                            placeholder="예: 욕실 온수 배관 엘보 크랙 확인"
                            value={newPhotoCaption}
                            onChange={(e) => setNewPhotoCaption(e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1 border-t border-indigo-100">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingPhoto(false);
                          setSelectedImagePreview(null);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePhoto}
                        disabled={isUploadingPhoto}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        {isUploadingPhoto ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                        사진 등록 완료
                      </button>
                    </div>
                  </div>
                )}

                {/* Photo Grid */}
                {taskPhotos.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                    <Camera size={28} className="mx-auto text-gray-300" />
                    <p className="text-xs text-gray-400 font-medium">등록된 현장 시공 사진이 없습니다.</p>
                    <div className="flex justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={startCameraStream}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Camera size={13} /> 직접 촬영하기
                      </button>
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <ImageIcon size={13} /> 앨범에서 선택
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {taskPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="rounded-2xl overflow-hidden border border-gray-200 aspect-video relative group bg-black shadow-sm"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || "현장사진"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span
                          className={`absolute bottom-1 right-1 text-white text-[10px] px-1.5 py-0.5 rounded font-bold ${
                            photo.phase === "before"
                              ? "bg-red-600/90"
                              : photo.phase === "after"
                              ? "bg-emerald-600/90"
                              : "bg-blue-600/90"
                          }`}
                        >
                          {photo.phase === "before" ? "시공전" : photo.phase === "after" ? "시공후" : "시공중"}
                        </span>
                        {photo.caption && (
                          <span className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded truncate max-w-[70%]">
                            {photo.caption}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => triggerDeletePhoto(photo, e)}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="사진 삭제"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={(e) => triggerDeleteTask({ id: selectedTask.id, title: selectedTask.title }, e)}
                className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                작업 삭제
              </button>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="px-5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Live Camera / Webcam Viewfinder Modal ==================== */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-gray-900 rounded-3xl shadow-2xl border border-gray-800 p-4 max-w-md w-full space-y-4 text-white">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-indigo-400" />
                <h4 className="font-bold text-sm">현장 사진 촬영</h4>
              </div>
              <button
                type="button"
                onClick={stopCameraStream}
                className="text-gray-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Viewfinder Video Stream */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center border border-gray-800 shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-4 border-2 border-white/30 rounded-xl pointer-events-none"></div>
            </div>

            {/* Shutter Button Bar */}
            <div className="flex items-center justify-between px-4 pt-1">
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  if (galleryInputRef.current) galleryInputRef.current.click();
                }}
                className="text-xs text-gray-300 hover:text-white flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 transition cursor-pointer"
              >
                <ImageIcon size={14} /> 앨범 선택
              </button>

              {/* Big Shutter Button */}
              <button
                type="button"
                onClick={captureFrameFromCamera}
                className="w-14 h-14 rounded-full border-4 border-white bg-red-600 hover:bg-red-500 active:scale-95 transition-all shadow-lg flex items-center justify-center cursor-pointer"
                title="사진 찰칵"
              >
                <div className="w-10 h-10 rounded-full bg-white/20"></div>
              </button>

              <button
                type="button"
                onClick={stopCameraStream}
                className="text-xs text-gray-400 hover:text-white px-3 py-2 rounded-xl cursor-pointer"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Custom Delete Confirmation Modal ==================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">
                  {deleteTarget.type === "log"
                    ? "현장작업일지 삭제"
                    : deleteTarget.type === "photo"
                    ? "현장 사진 삭제"
                    : "작업 완전 삭제"}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {deleteTarget.type === "log"
                    ? "해당 일지 기록을 영구적으로 삭제하시겠습니까?"
                    : deleteTarget.type === "photo"
                    ? "해당 시공 사진을 삭제하시겠습니까?"
                    : "해당 작업과 연관된 일지, 사진, 정산 데이터가 모두 영구 삭제됩니다."}
                </p>
              </div>
            </div>

            {deleteTarget.title && (
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs font-semibold text-gray-700 truncate">
                {deleteTarget.title}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={executeConfirmedDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
