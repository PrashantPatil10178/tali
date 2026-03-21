"use client";

import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GradingResult } from "@tali/types";
import Scanner from "@/components/Scanner";
import { useLanguage } from "@/lib/LanguageContext";

interface ReportsProps {
  history: GradingResult[];
  onGraded?: (result: GradingResult) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const formatDate = (iso: string): string => {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const pct = (score: number, total: number) =>
  total > 0 ? Math.round((score / total) * 100) : 0;

const scoreLabel = (p: number) => {
  if (p >= 85)
    return {
      label: "Excellent",
      cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    };
  if (p >= 70)
    return {
      label: "Good",
      cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    };
  if (p >= 50)
    return {
      label: "Average",
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    };
  return {
    label: "Needs Help",
    cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };
};

const barColor = (p: number) =>
  p >= 70 ? "bg-emerald-500" : p >= 50 ? "bg-amber-400" : "bg-red-500";

const fu = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, delay, ease: "easeOut" as const },
  },
});

const si = (delay = 0) => ({
  initial: { opacity: 0, x: -16 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.38, delay, ease: "easeOut" as const },
  },
});

const BAR_MONTHS = [
  { month: "Jan", you: 40, avg: 30 },
  { month: "Feb", you: 55, avg: 35 },
  { month: "Mar", you: 70, avg: 45 },
  { month: "Apr", you: 65, avg: 50 },
  { month: "May", you: 85, avg: 55 },
  { month: "Jun", you: 90, avg: 60 },
];

// ── Download helpers ───────────────────────────────────────────────────────

async function downloadReportPdf(
  result: GradingResult,
  locale: "en" | "mr" = "en",
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/reports/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ result, locale }),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => "Unknown error"));
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${result.studentName.replace(/\s+/g, "_")}_report.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function downloadBulkReportPdf(
  results: GradingResult[],
  locale: "en" | "mr" = "en",
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/reports/bulk-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ results, locale }),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => "Unknown error"));
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bulk_report_${results.length}_students.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE PICKER MODAL
// ─────────────────────────────────────────────────────────────────────────────

const LanguagePickerModal: React.FC<{
  open: boolean;
  isBulk?: boolean;
  count?: number;
  onConfirm: (lang: "en" | "mr") => void;
  onClose: () => void;
}> = ({ open, isBulk, count, onConfirm, onClose }) => {
  const { t } = useLanguage();
  const [selected, setSelected] = useState<"en" | "mr">("en");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 12 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          transition: { duration: 0.22, ease: "easeOut" },
        }}
        exit={{ opacity: 0, scale: 0.93 }}
        className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6"
      >
        {/* icon */}
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
          <svg
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
            />
          </svg>
        </div>
        <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          {t("langPicker.title")}
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t("langPicker.subtitle")}
        </p>

        {/* language options */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {(["en", "mr"] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setSelected(lang)}
              className={`rounded-xl border-2 py-4 text-center font-bold transition-all ${
                selected === lang
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              <span className="text-base">{lang === "en" ? "🇬🇧" : "🇮🇳"}</span>
              <p className="mt-1 text-sm">
                {lang === "en"
                  ? t("langPicker.english")
                  : t("langPicker.marathi")}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {t("langPicker.cancel")}
          </button>
          <button
            onClick={() => onConfirm(selected)}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20"
          >
            {isBulk
              ? `${t("langPicker.generateBulk")} (${count})`
              : t("langPicker.generate")}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION PAPER SECTION (Optional tab)
// ─────────────────────────────────────────────────────────────────────────────

const QuestionPaperSection: React.FC<{
  file: File | null;
  onChange: (f: File | null) => void;
}> = ({ file, onChange }) => {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mx-auto w-full py-4 md:py-6">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
          <svg
            className="size-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>
        <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          {t("scan.paper.title")}
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {t("scan.paper.desc")}
        </p>
      </div>

      {file ? (
        <div className="flex items-center gap-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/20 p-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            <svg
              className="size-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {file.name}
            </p>
            <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
              {t("scan.paper.uploaded")}
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <button
              onClick={() => inputRef.current?.click()}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {t("scan.paper.change")}
            </button>
            <button
              onClick={() => onChange(null)}
              className="text-xs font-bold text-red-500 hover:underline"
            >
              {t("scan.paper.remove")}
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="group cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 text-center transition-all hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10"
        >
          <div className="mx-auto mb-3 inline-flex size-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 transition-colors group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-500">
            <svg
              className="size-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t("scan.paper.drop")}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {t("scan.paper.dropSub")}
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f);
          e.target.value = "";
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BULK DOWNLOAD BUTTON
// ─────────────────────────────────────────────────────────────────────────────

const BulkDownloadButton: React.FC<{ results: GradingResult[] }> = ({
  results,
}) => {
  const { t } = useLanguage();
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );

  const handleConfirm = async (lang: "en" | "mr") => {
    setLangPickerOpen(false);
    setState("loading");
    try {
      await downloadBulkReportPdf(results, lang);
      setState("done");
      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  return (
    <>
      <button
        onClick={() => setLangPickerOpen(true)}
        disabled={state === "loading"}
        className={`flex w-full items-center justify-center gap-2.5 rounded-2xl px-5 py-4 text-sm font-bold transition-all ${
          state === "done"
            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
            : state === "error"
              ? "bg-red-500 text-white"
              : state === "loading"
                ? "cursor-not-allowed bg-indigo-400 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/25"
        }`}
      >
        {state === "loading" ? (
          <svg
            className="size-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        ) : state === "done" ? (
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        )}
        {state === "idle" || state === "loading" ? (
          <>
            {t("scan.bulk.report")} · {results.length}{" "}
            {t("scan.bulk.reportCount")}
          </>
        ) : state === "done" ? (
          "Downloaded successfully!"
        ) : (
          "Download failed — try again"
        )}
      </button>
      <LanguagePickerModal
        open={langPickerOpen}
        isBulk
        count={results.length}
        onConfirm={handleConfirm}
        onClose={() => setLangPickerOpen(false)}
      />
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL VIEW
// ─────────────────────────────────────────────────────────────────────────────

interface DetailViewProps {
  result: GradingResult;
  onBack: () => void;
}

const DetailView: React.FC<DetailViewProps> = ({ result, onBack }) => {
  const score = pct(result.score, result.totalMarks);
  const { label: sl, cls: sc } = scoreLabel(score);
  const corrections = result.corrections ?? [];
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState<string | null>(null);
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const { t } = useLanguage();

  const handleDownloadConfirm = async (lang: "en" | "mr") => {
    setLangPickerOpen(false);
    setDownloading(true);
    setDlError(null);
    try {
      await downloadReportPdf(result, lang);
    } catch (err) {
      setDlError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.38, ease: "easeOut" },
      }}
      exit={{ opacity: 0, y: -12, transition: { duration: 0.22 } }}
      className="mx-auto max-w-5xl space-y-8"
    >
      {/* hero header */}
      <motion.div
        {...fu(0)}
        className="flex flex-wrap items-end justify-between gap-6"
      >
        <div className="flex flex-col gap-2">
          <button
            onClick={onBack}
            className="flex w-fit items-center gap-1.5 text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-800 dark:text-indigo-400"
          >
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {t("reports.detail.allReports")}
          </button>
          <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {formatDate(result.date)}
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            {t("reports.detail.title")}
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400">
            {t("reports.detail.for")}{" "}
            <span className="font-semibold text-slate-900 dark:text-white">
              {result.studentName}
            </span>{" "}
            · {result.subject}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-3">
            <button className="flex h-11 items-center gap-2 rounded-xl bg-slate-100 px-5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              <svg
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              {t("reports.detail.share")}
            </button>
            <button
              onClick={() => setLangPickerOpen(true)}
              disabled={downloading}
              className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:opacity-90 disabled:opacity-60"
            >
              {downloading ? (
                <svg
                  className="size-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              ) : (
                <svg
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              )}
              {downloading
                ? t("reports.detail.downloading")
                : t("reports.detail.download")}
            </button>
          </div>
          {dlError && (
            <p className="max-w-xs text-right text-xs font-medium text-red-500">
              {dlError}
            </p>
          )}
        </div>
      </motion.div>

      {/* key metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: t("reports.detail.overallScore"),
            value: `${score}%`,
            badge: sl,
            badgeCls: sc,
          },
          {
            label: t("reports.detail.accuracy"),
            value: `${Math.max(0, score - 6)}%`,
            badge: "Good",
            badgeCls:
              "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
          },
          {
            label: t("reports.detail.marks"),
            value: `${result.score}/${result.totalMarks}`,
            badge: sl,
            badgeCls: sc,
          },
          {
            label: t("reports.detail.questions"),
            value: `${corrections.length || "-"}`,
            badge: t("reports.detail.reviewed"),
            badgeCls:
              "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
          },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            {...fu(i * 0.07)}
            className="dashboard-surface-card flex flex-col gap-2 p-5"
          >
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                {m.label}
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${m.badgeCls}`}
              >
                {m.badge}
              </span>
            </div>
            <p className="font-display mt-1 text-3xl font-bold text-slate-900 dark:text-white">
              {m.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* 2-col analysis */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* strengths */}
        <motion.div
          {...si(0.05)}
          className="dashboard-surface-card overflow-hidden"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 bg-emerald-50/50 p-5 dark:border-slate-800 dark:bg-emerald-900/10">
            <svg
              className="size-5 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t("reports.detail.strengths")}
            </h3>
          </div>
          <div className="space-y-3 p-5">
            {(corrections
              .filter((c) => pct(c.marksObtained, c.maxMarks) >= 60)
              .slice(0, 3).length > 0
              ? corrections
                  .filter((c) => pct(c.marksObtained, c.maxMarks) >= 60)
                  .slice(0, 3)
                  .map((c) => ({
                    label: `Q${c.questionNo}`,
                    sub: c.questionText,
                    p: pct(c.marksObtained, c.maxMarks),
                  }))
              : [
                  {
                    label: t("reports.detail.clarityLabel"),
                    sub: t("reports.detail.claritySub"),
                    p: 88,
                  },
                  {
                    label: t("reports.detail.knowledgeLabel"),
                    sub: `Strong in ${result.subject}`,
                    p: score,
                  },
                  {
                    label: t("reports.detail.attemptLabel"),
                    sub: t("reports.detail.attemptSub"),
                    p: 100,
                  },
                ]
            ).map((s, i) => (
              <motion.div
                key={i}
                {...si(0.1 + i * 0.06)}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {s.label}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                    {s.sub}
                  </p>
                </div>
                <span
                  className={`ml-3 flex-shrink-0 rounded-lg px-3 py-1 text-sm font-bold ${s.p >= 80 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"}`}
                >
                  {s.p}%
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* weak areas */}
        <motion.div
          {...si(0.1)}
          className="dashboard-surface-card overflow-hidden"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 bg-red-50/50 p-5 dark:border-slate-800 dark:bg-red-900/10">
            <svg
              className="size-5 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
              />
            </svg>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t("reports.detail.weakAreas")}
            </h3>
          </div>
          <div className="space-y-4 p-5">
            {result.weakAreas.length > 0 ? (
              result.weakAreas.slice(0, 4).map((area, i) => {
                const fakePct = Math.max(20, score - (i + 1) * 12);
                return (
                  <motion.div
                    key={area}
                    {...fu(0.1 + i * 0.07)}
                    className="space-y-1.5"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {area}
                      </span>
                      <span
                        className={`font-bold ${fakePct < 50 ? "text-red-600" : "text-amber-500"}`}
                      >
                        {fakePct}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <motion.div
                        className={`h-full rounded-full ${barColor(fakePct)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${fakePct}%` }}
                        transition={{
                          duration: 0.8,
                          delay: 0.2 + i * 0.1,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <svg
                    className="size-6 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="mt-3 font-semibold text-slate-900 dark:text-white">
                  {t("reports.detail.noWeakAreas")}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {t("reports.detail.noWeakAreasSub")}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* AI feedback */}
        <motion.div
          {...si(0.15)}
          className="dashboard-surface-card overflow-hidden"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 bg-amber-50/50 p-5 dark:border-slate-800 dark:bg-amber-900/10">
            <svg
              className="size-5 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t("reports.detail.aiFeedback")}
            </h3>
          </div>
          <div className="p-5">
            <p className="mb-5 rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-sm leading-relaxed text-slate-600 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-slate-300">
              {result.feedback}
            </p>
            {corrections.length > 0 && (
              <ul className="space-y-4">
                {corrections.slice(0, 3).map((c, i) => {
                  const cp = pct(c.marksObtained, c.maxMarks);
                  return (
                    <motion.li
                      key={i}
                      {...si(0.2 + i * 0.06)}
                      className="flex gap-3"
                    >
                      <div
                        className={`flex size-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${cp >= 60 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"}`}
                      >
                        Q{c.questionNo}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {c.marksObtained}/{c.maxMarks} marks
                        </p>
                        <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {c.analysis}
                        </p>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </div>
        </motion.div>

        {/* conceptual gaps */}
        <motion.div
          {...si(0.2)}
          className="dashboard-surface-card overflow-hidden"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 bg-violet-50/50 p-5 dark:border-slate-800 dark:bg-violet-900/10">
            <svg
              className="size-5 text-violet-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t("reports.detail.conceptualGaps")}
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
            {(result.weakAreas.length > 0
              ? result.weakAreas.slice(0, 4).map((area, i) => ({
                  subject: result.subject,
                  topic: area,
                  note: `Review core concepts in ${area}.`,
                  border:
                    i % 2 === 0
                      ? "border-violet-500 bg-violet-50/30 dark:bg-slate-800"
                      : "border-indigo-400 bg-slate-50 dark:bg-slate-800",
                  lc:
                    i % 2 === 0
                      ? "text-violet-700 dark:text-violet-400"
                      : "text-indigo-600 dark:text-indigo-400",
                  cta: t("reports.detail.reviewMaterial"),
                }))
              : [
                  {
                    subject: result.subject,
                    topic: t("reports.detail.timePractice"),
                    note: t("reports.detail.timePracticeNote"),
                    border:
                      "border-violet-500 bg-violet-50/30 dark:bg-slate-800",
                    lc: "text-violet-700 dark:text-violet-400",
                    cta: t("reports.detail.startPractice"),
                  },
                  {
                    subject: "General",
                    topic: t("reports.detail.timeManagement"),
                    note: t("reports.detail.timeManagementNote"),
                    border: "border-indigo-400 bg-slate-50 dark:bg-slate-800",
                    lc: "text-indigo-600 dark:text-indigo-400",
                    cta: "Try Timed Quiz →",
                  },
                ]
            ).map((g, i) => (
              <motion.div
                key={i}
                {...fu(0.15 + i * 0.06)}
                className={`rounded-xl border-l-4 p-4 ${g.border}`}
              >
                <span
                  className={`text-[10px] font-extrabold uppercase ${g.lc}`}
                >
                  {g.subject}
                </span>
                <h4 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                  {g.topic}
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  {g.note}
                </p>
                <button className="mt-2 text-[11px] font-bold text-indigo-600 hover:underline dark:text-indigo-400">
                  {g.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* bar chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{
          opacity: 1,
          scale: 1,
          transition: { duration: 0.4, delay: 0.25 },
        }}
        className="dashboard-surface-card p-6"
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {t("reports.detail.trend")}
            </h3>
            <p className="text-sm text-slate-500">
              {t("reports.detail.trendSub")}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-full bg-indigo-600" />
              {t("reports.detail.you")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-full bg-slate-300 dark:bg-slate-600" />
              {t("reports.detail.classAvg")}
            </span>
          </div>
        </div>
        <div className="flex h-44 items-end gap-2 overflow-hidden rounded-xl bg-slate-50 px-4 pb-4 dark:bg-slate-800/50">
          {BAR_MONTHS.map(({ month, you, avg }, i) => (
            <div
              key={month}
              className="flex flex-1 flex-col items-center justify-end gap-1"
            >
              <motion.div
                className="w-full rounded-t-sm bg-indigo-500/70"
                initial={{ height: 0 }}
                animate={{ height: `${you}%` }}
                transition={{
                  duration: 0.65,
                  delay: 0.1 + i * 0.08,
                  ease: "easeOut",
                }}
              />
              <motion.div
                className="w-full rounded-t-sm bg-slate-200 dark:bg-slate-700"
                initial={{ height: 0 }}
                animate={{ height: `${avg}%` }}
                transition={{
                  duration: 0.65,
                  delay: 0.15 + i * 0.08,
                  ease: "easeOut",
                }}
              />
              <span className="mt-1 text-[10px] font-bold text-slate-400">
                {month}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA banner */}
      <motion.div
        {...fu(0.3)}
        className="relative overflow-hidden rounded-2xl bg-indigo-600 p-6 text-white shadow-xl shadow-indigo-500/20 md:flex md:items-center md:justify-between md:gap-6"
      >
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 size-32 rounded-full bg-white/5 blur-2xl" />
        <div className="relative z-10">
          <h3 className="font-display text-xl font-bold">
            {t("reports.detail.ready")}
          </h3>
          <p className="mt-1 text-sm opacity-90">
            {t("reports.detail.readySub")}
          </p>
        </div>
        <button className="relative z-10 mt-4 whitespace-nowrap rounded-xl bg-white px-7 py-3 text-sm font-extrabold text-indigo-700 transition-colors hover:bg-slate-50 md:mt-0">
          {t("reports.detail.startPlan")}
        </button>
      </motion.div>

      {/* Language picker */}
      <LanguagePickerModal
        open={langPickerOpen}
        onConfirm={handleDownloadConfirm}
        onClose={() => setLangPickerOpen(false)}
      />
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN LIST VIEW
// ─────────────────────────────────────────────────────────────────────────────

const Reports: React.FC<ReportsProps> = ({ history, onGraded }) => {
  const [selectedResult, setSelectedResult] = useState<GradingResult | null>(
    null,
  );
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [questionPaperFile, setQuestionPaperFile] = useState<File | null>(null);
  const [sessionResults, setSessionResults] = useState<GradingResult[]>([]);
  const { t } = useLanguage();

  const handleScanGraded = (result: GradingResult) => {
    onGraded?.(result);
    setSessionResults((prev) => [...prev, result]);
  };

  return (
    <AnimatePresence mode="wait">
      {selectedResult ? (
        <DetailView
          key="detail"
          result={selectedResult}
          onBack={() => setSelectedResult(null)}
        />
      ) : (
        <motion.div
          key="list"
          initial={{ opacity: 0, y: 16 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.38, ease: "easeOut" },
          }}
          exit={{ opacity: 0, y: -12, transition: { duration: 0.22 } }}
          className="mx-auto max-w-5xl space-y-8"
        >
          {/* ── PAGE HEADER ─────────────────────────────────────── */}
          <motion.div
            {...fu(0)}
            className="flex flex-wrap items-end justify-between gap-4"
          >
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                <svg
                  className="size-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                  />
                </svg>
                {t("reports.badge")}
              </span>
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
                {t("reports.heading")}
              </h1>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {t("reports.subheading")}
              </p>
            </div>
            <button
              onClick={() => {
                setScanModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm shadow-indigo-300/40 transition-all hover:bg-indigo-700"
            >
              <svg
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {t("reports.openScanner")}
            </button>
          </motion.div>

          {/* ── EMPTY STATE ──────────────────────────────────────── */}
          {history.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{
                opacity: 1,
                scale: 1,
                transition: { duration: 0.4, delay: 0.15 },
              }}
              className="reports-dashed-upload rounded-[2rem] bg-white p-10 text-center transition-shadow duration-300 hover:shadow-2xl hover:shadow-indigo-500/5 dark:bg-slate-900 md:p-16"
            >
              <div className="relative mx-auto mb-8 size-44">
                <div className="absolute inset-0 scale-110 rounded-full bg-indigo-600/5" />
                <div className="absolute inset-0 scale-75 animate-pulse rounded-full bg-violet-600/5" />
                <div className="relative z-10 flex size-full items-center justify-center">
                  <div className="-rotate-6 translate-x-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                    <svg
                      className="size-9 text-violet-500 opacity-60"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                      />
                    </svg>
                  </div>
                  <div className="absolute -translate-x-4 rotate-12 rounded-2xl border border-slate-100 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                    <svg
                      className="size-9 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                  </div>
                  <div className="absolute -bottom-2 -right-2 flex size-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                    <svg
                      className="size-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                {t("reports.noReports")}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                {t("reports.noReportsSub")}
              </p>
              <button
                onClick={() => setScanModalOpen(true)}
                className="mt-8 dashboard-primary-button"
                type="button"
              >
                <svg
                  className="size-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {t("reports.openScannerBtn")}
              </button>
            </motion.div>
          )}

          {/* ── REPORT HISTORY LIST ────────────────────────────── */}
          {history.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                  {t("reports.recentReports")}
                  <span className="ml-2 rounded-full bg-indigo-100 px-2.5 py-0.5 text-sm font-extrabold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    {history.length}
                  </span>
                </h2>
              </div>
              {history.map((result, index) => {
                const p = pct(result.score, result.totalMarks);
                const { cls: sc } = scoreLabel(p);
                const bc = barColor(p);
                return (
                  <motion.div
                    key={`${result.studentName}-${index}`}
                    {...fu(index * 0.05)}
                    className="dashboard-surface-card group relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <button
                      onClick={() => setSelectedResult(result)}
                      className="flex min-w-0 flex-1 items-center gap-4 text-left"
                    >
                      <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100 font-display text-sm font-extrabold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        {result.studentName
                          .split(" ")
                          .slice(0, 2)
                          .map((w) => w[0]?.toUpperCase() ?? "")
                          .join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {result.studentName}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {result.subject} · {formatDate(result.date)}
                        </p>
                        {result.weakAreas.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {result.weakAreas.slice(0, 3).map((area) => (
                              <span
                                key={area}
                                className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>

                    <div className="flex flex-shrink-0 items-center gap-3">
                      <div className="w-28">
                        <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                          <span>{t("reports.score")}</span>
                          <span>
                            {result.score}/{result.totalMarks}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <motion.div
                            className={`h-full rounded-full ${bc}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${p}%` }}
                            transition={{
                              duration: 0.6,
                              delay: 0.1 + index * 0.05,
                            }}
                          />
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${sc}`}
                      >
                        {p}%
                      </span>
                      <DownloadButton result={result} />
                      <button
                        onClick={() => setSelectedResult(result)}
                        className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                      >
                        <svg
                          className="size-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* ── FEATURE CARDS ──────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                bg: "bg-orange-100 dark:bg-orange-900/30",
                ic: "text-orange-600 dark:text-orange-400",
                icon: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
                title: t("reports.feat0.title"),
                body: t("reports.feat0.body"),
              },
              {
                bg: "bg-blue-100 dark:bg-blue-900/30",
                ic: "text-blue-600 dark:text-blue-400",
                icon: "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222",
                title: t("reports.feat1.title"),
                body: t("reports.feat1.body"),
              },
              {
                bg: "bg-violet-100 dark:bg-violet-900/30",
                ic: "text-violet-600 dark:text-violet-400",
                icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
                title: t("reports.feat2.title"),
                body: t("reports.feat2.body"),
              },
            ].map((c, i) => (
              <motion.div
                key={c.title}
                {...fu(i * 0.08)}
                className="dashboard-surface-card p-6"
              >
                <div
                  className={`mb-5 flex size-12 items-center justify-center rounded-xl ${c.bg}`}
                >
                  <svg
                    className={`size-6 ${c.ic}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={c.icon}
                    />
                  </svg>
                </div>
                <h4 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  {c.title}
                </h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {c.body}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── SCAN MODAL ──────────────────────────────────────────── */}
      <AnimatePresence>
        {scanModalOpen && (
          <motion.div
            key="scan-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setScanModalOpen(false)}
            />

            {/* modal panel */}
            <motion.div
              key="scan-modal-panel"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                transition: { duration: 0.28, ease: "easeOut" },
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 20,
                transition: { duration: 0.2 },
              }}
              className="relative z-10 flex max-h-[90vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Modal header */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 lg:border-none px-6 py-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                    <svg
                      className="size-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                      {t("scan.modal.title")}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("scan.modal.subtitle")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setScanModalOpen(false)}
                  className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                >
                  <svg
                    className="size-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content body */}
              <div className="flex flex-1 flex-col lg:flex-row overflow-hidden bg-slate-50/50 dark:bg-slate-900/20">
                {/* Left: Question Paper (Optional) */}
                <div className="w-full lg:w-[360px] xl:w-[420px] flex-shrink-0 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 overflow-y-auto px-4 py-2">
                  <QuestionPaperSection
                    file={questionPaperFile}
                    onChange={setQuestionPaperFile}
                  />
                </div>

                {/* Right: Answer Sheets Scanner */}
                <div className="flex-1 overflow-y-auto p-5 md:p-8">
                  <div className="space-y-4">
                    <Scanner
                      embedded={true}
                      onGraded={handleScanGraded}
                      onViewResults={(results) => {
                        if (results.length > 0) {
                          setSelectedResult(results[0]!);
                          setScanModalOpen(false);
                        }
                      }}
                    />
                    {sessionResults.length > 0 && (
                      <div className="pt-2">
                        <BulkDownloadButton results={sessionResults} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

// ── small reusable download button (with language picker) ──────────────────

const DownloadButton: React.FC<{ result: GradingResult }> = ({ result }) => {
  const { t } = useLanguage();
  const [langPickerOpen, setLangPickerOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );

  const handleConfirm = async (lang: "en" | "mr") => {
    setLangPickerOpen(false);
    setState("loading");
    try {
      await downloadReportPdf(result, lang);
      setState("done");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setLangPickerOpen(true);
        }}
        disabled={state === "loading"}
        title={
          state === "done"
            ? "Downloaded!"
            : state === "error"
              ? "Download failed"
              : "Download PDF"
        }
        className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
          state === "done"
            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
            : state === "error"
              ? "bg-red-100 text-red-500 dark:bg-red-900/30"
              : state === "loading"
                ? "text-slate-400"
                : "text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900/30"
        }`}
      >
        {state === "loading" ? (
          <svg
            className="size-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h0m0 0l.582-.002M19.418 9A8.001 8.001 0 004.582 9m14.836 0H15m-11 5.5v5h.582m14.418 0A8.003 8.003 0 014.641 14.5M19 14.5H15"
            />
          </svg>
        ) : state === "done" ? (
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : state === "error" ? (
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        )}
      </button>
      <LanguagePickerModal
        open={langPickerOpen}
        onConfirm={handleConfirm}
        onClose={() => setLangPickerOpen(false)}
      />
    </>
  );
};

export default Reports;
