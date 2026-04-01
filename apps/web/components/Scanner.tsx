import React, { useState, useRef, useMemo, useEffect } from "react";
import { analyzeAnswerSheet } from "@tali/gemini/client";
import { GradingResult } from "@tali/types";
import { useLanguage } from "@/lib/LanguageContext";

interface ScannerProps {
  onGraded: (result: GradingResult) => void;
  onViewResults: (results: GradingResult[]) => void;
  embedded?: boolean;
}

interface FileItem {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "processing" | "done" | "error";
  progress: number;
  stage: string;
  errorMsg?: string;
  results?: GradingResult[];
  mimeType: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress Stat Card Component
// ─────────────────────────────────────────────────────────────────────────────
interface StatCardProps {
  type: "time" | "progress" | "completed";
  value: string | number;
  label: string;
  subValue?: string;
  percent?: number;
  isComplete?: boolean;
  total?: number;
  completed?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  type,
  value,
  label,
  percent = 0,
  isComplete = false,
  total = 0,
  completed = 0,
}) => {
  // Icon configurations
  const icons = {
    time: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    progress: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    completed: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const gradients = {
    time: "from-indigo-500 to-violet-600",
    progress: isComplete ? "from-emerald-500 to-teal-600" : "from-amber-500 to-orange-600",
    completed: "from-emerald-500 to-teal-600",
  };

  const bgColors = {
    time: "bg-indigo-50 dark:bg-indigo-950/40",
    progress: isComplete ? "bg-emerald-50 dark:bg-emerald-950/40" : "bg-amber-50 dark:bg-amber-950/40",
    completed: "bg-emerald-50 dark:bg-emerald-950/40",
  };

  return (
    <div className={`
      relative rounded-2xl p-4 
      bg-white dark:bg-slate-800
      border border-slate-200 dark:border-slate-700
      shadow-sm hover:shadow-md
      transition-all duration-300
    `}>
      {/* Header with icon and label */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`
          w-10 h-10 rounded-xl
          bg-gradient-to-br ${gradients[type]}
          flex items-center justify-center text-white
          shadow-md
          ${type === "time" ? "animate-pulse" : ""}
        `}>
          {icons[type]}
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
      </div>

      {/* Content area */}
      <div className={`rounded-xl p-3 ${bgColors[type]}`}>
        {type === "time" && (
          <p className="text-3xl font-black text-slate-800 dark:text-white font-mono tracking-tight">
            {value}
          </p>
        )}
        
        {type === "progress" && (
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <span className={`text-3xl font-black ${isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                {percent}%
              </span>
              {isComplete && (
                <span className="text-emerald-500 text-xl">✓</span>
              )}
            </div>
            {/* Progress bar */}
            <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${isComplete ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-amber-500 to-orange-500"}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}
        
        {type === "completed" && (
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {completed}
              </span>
              <span className="text-xl font-bold text-slate-400">/</span>
              <span className="text-xl font-bold text-slate-500 dark:text-slate-400">
                {total}
              </span>
            </div>
            {completed === total && total > 0 && (
              <span className="text-emerald-500 text-xl animate-bounce">✓</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Scanner: React.FC<ScannerProps> = ({
  onGraded,
  onViewResults,
  embedded,
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [timer, setTimer] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerIntervalRef = useRef<number | null>(null);

  const stages = [
    t("scanner.stage0"),
    t("scanner.stage1"),
    t("scanner.stage2"),
    t("scanner.stage3"),
    t("scanner.stage4"),
  ];

  useEffect(() => {
    if (loading) {
      setTimer(0);
      timerIntervalRef.current = window.setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [loading]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressStats = useMemo(() => {
    const total = selectedFiles.length;
    if (total === 0) return { total: 0, completed: 0, percent: 0 };
    const finished = selectedFiles.filter(
      (f) => f.status === "done" || f.status === "error",
    ).length;
    const processingFile = selectedFiles.find((f) => f.status === "processing");
    const currentProgressContribution = processingFile
      ? processingFile.progress / 100
      : 0;
    const visualTotal = finished + currentProgressContribution;
    let percent = Math.floor((visualTotal / total) * 100);
    if (finished === total && total > 0) percent = 100;
    return { total, completed: finished, percent };
  }, [selectedFiles]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from<File>(e.target.files || []);
    if (files.length > 0) {
      const newItems: FileItem[] = files.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : "",
        status: "pending",
        progress: 0,
        stage: t("scanner.stageWaiting"),
        mimeType: file.type,
      }));
      setSelectedFiles((prev) => [...prev, ...newItems]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => {
      const removed = prev.find((f) => f.id === id);
      if (removed && removed.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const processBatch = async () => {
    if (selectedFiles.length === 0 || loading) return;
    setLoading(true);

    for (let i = 0; i < selectedFiles.length; i++) {
      const currentFile = selectedFiles[i];
      if (currentFile.status === "done") continue;

      // Small pacing delay between files to respect RPM limits
      if (i > 0) await new Promise((r) => setTimeout(r, 1000));

      let currentProgress = 0;
      const progressInterval = window.setInterval(() => {
        if (currentProgress < 95) {
          currentProgress += Math.random() * 1.5;
          const stageIdx = Math.min(
            Math.floor(currentProgress / 20),
            stages.length - 1,
          );
          setSelectedFiles((prev) =>
            prev.map((f) =>
              f.id === currentFile.id
                ? {
                    ...f,
                    status: "processing",
                    progress: currentProgress,
                    stage: stages[stageIdx],
                  }
                : f,
            ),
          );
        }
      }, 600);

      try {
        const base64 = await fileToBase64(currentFile.file);
        const results = await analyzeAnswerSheet(base64);

        clearInterval(progressInterval);

        if (results && results.length > 0) {
          setSelectedFiles((prev) =>
            prev.map((f) =>
              f.id === currentFile.id
                ? {
                    ...f,
                    status: "done",
                    progress: 100,
                    stage: t("scanner.stageDone"),
                    results,
                  }
                : f,
            ),
          );
          results.forEach((r) => onGraded(r));
        } else {
          throw new Error(t("scanner.error.noResults"));
        }
      } catch (err: any) {
        clearInterval(progressInterval);
        const errorMsg =
          err.message?.includes("Quota") || JSON.stringify(err).includes("429")
            ? t("scanner.error.quota")
            : t("scanner.error.generic");

        setSelectedFiles((prev) =>
          prev.map((f) =>
            f.id === currentFile.id
              ? {
                  ...f,
                  status: "error",
                  progress: 0,
                  stage: t("scanner.error.generic"),
                  errorMsg,
                }
              : f,
          ),
        );
      }
    }
    setLoading(false);
  };

  return (
    <div
      className={`mx-auto animate-in fade-in duration-500 ${embedded ? "w-full space-y-4" : "max-w-4xl space-y-6"}`}
    >
      <div
        className={`${embedded ? "bg-transparent" : "bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800"}`}
      >
        <div
          className={`flex flex-col md:flex-row justify-between items-center gap-4 ${embedded ? "mb-2" : "p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"}`}
        >
          <div className="text-left">
            <h2
              className={`${embedded ? "text-lg font-bold text-slate-800 dark:text-white" : "text-2xl font-bold text-slate-800 dark:text-white tracking-tight"}`}
            >
              {t("scanner.title")}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {embedded
                ? "One file can contain multiple students"
                : t("scanner.subtitle")}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedFiles([])}
              disabled={loading}
              className="px-6 py-2.5 border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm disabled:opacity-50"
            >
              {t("scanner.clearAll")}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              {t("scanner.addFiles")}
            </button>
          </div>
          <input
            type="file"
            multiple
            accept="image/*,application/pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
        </div>

        {(loading || progressStats.percent > 0) && (
          <div className="px-6 py-6 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                type="time"
                value={formatTime(timer)}
                label={t("scanner.time")}
              />
              <StatCard
                type="progress"
                value={progressStats.percent}
                label={t("scanner.progress")}
                percent={progressStats.percent}
                isComplete={progressStats.percent === 100}
              />
              <StatCard
                type="completed"
                value={`${progressStats.completed}/${progressStats.total}`}
                label={t("scanner.completed")}
                total={progressStats.total}
                completed={progressStats.completed}
              />
            </div>
          </div>
        )}

        <div className="p-8">
          {selectedFiles.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-200 dark:border-indigo-800/60 rounded-3xl p-16 flex flex-col items-center gap-6 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all group"
            >
              <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-700 dark:text-slate-200 text-lg">
                  {t("scanner.upload")}
                </p>
                <p className="text-sm text-slate-400">
                  {t("scanner.uploadSub")}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedFiles.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 bg-white dark:bg-slate-800 group shadow-sm flex flex-col h-full ${item.status === "processing" ? "border-indigo-400 ring-4 ring-indigo-50 dark:ring-indigo-950 shadow-indigo-100" : item.status === "error" ? "border-red-200 dark:border-red-800/60" : "border-slate-100 dark:border-slate-700"}`}
                  >
                    <div className="aspect-[4/3] relative overflow-hidden bg-slate-50 dark:bg-slate-700">
                      {item.mimeType === "application/pdf" ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400">
                          <svg
                            className="w-12 h-12 mb-1"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z" />
                          </svg>
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            PDF फाईल
                          </span>
                        </div>
                      ) : (
                        <img
                          src={item.preview}
                          className={`w-full h-full object-cover transition-all duration-700 ${item.status === "processing" ? "scale-110 brightness-75 blur-[1px]" : ""}`}
                          alt="Preview"
                        />
                      )}
                      {item.status === "processing" && (
                        <>
                          <div className="animate-scan"></div>
                          <div className="absolute inset-0 bg-indigo-900/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-white p-4">
                            <div className="text-4xl font-black mb-2">
                              {Math.floor(item.progress)}%
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-center animate-pulse">
                              {item.stage}
                            </span>
                          </div>
                        </>
                      )}
                      {item.status === "error" && (
                        <div className="absolute inset-0 bg-red-600/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 text-center">
                          <span className="text-4xl mb-2">❌</span>
                          <span className="text-xs font-black">
                            {item.errorMsg}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-200 dark:bg-slate-700">
                        <div
                          className={`h-full transition-all duration-300 ${item.status === "done" ? "bg-green-500" : item.status === "processing" ? "bg-indigo-500" : item.status === "error" ? "bg-red-500" : "bg-slate-300"}`}
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 flex-1 flex flex-col justify-between">
                      <div className="mb-4">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {t("scanner.file")} #{idx + 1}
                          </p>
                          {item.status === "done" && (
                            <span className="text-green-500">✅</span>
                          )}
                        </div>
                        <h4 className="font-black text-slate-800 dark:text-white truncate text-sm">
                          {item.results && item.results.length > 0
                            ? `${item.results.length} ${t("scanner.studentsFound")}`
                            : item.status === "processing"
                              ? item.stage
                              : item.file.name}
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {item.status === "done" && item.results && (
                          <button
                            onClick={() => onViewResults(item.results!)}
                            className="w-full bg-indigo-600 text-white font-black py-2 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg text-sm"
                          >
                            {t("scanner.viewResults")}
                          </button>
                        )}
                        {(item.status === "pending" ||
                          item.status === "error") &&
                          !loading && (
                            <button
                              onClick={() => removeFile(item.id)}
                              className="w-full border-2 border-slate-100 dark:border-slate-700 text-red-500 dark:text-red-400 font-bold py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-xs"
                            >
                              {t("scanner.remove")}
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4">
                <button
                  onClick={processBatch}
                  disabled={
                    loading ||
                    selectedFiles.length === 0 ||
                    selectedFiles.every((f) => f.status === "done")
                  }
                  className={`w-full font-black py-5 rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-4 text-xl ${loading ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 shadow-none" : selectedFiles.every((f) => f.status === "done") ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 shadow-none cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"}`}
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t("scanner.scanning")}</span>
                    </div>
                  ) : (
                    <>
                      <span>
                        {t("scanner.scanAll")} (
                        {
                          selectedFiles.filter((f) => f.status !== "done")
                            .length
                        }
                        )
                      </span>
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scanner;
