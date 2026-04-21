"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLanguage, type Locale } from "@/lib/LanguageContext";
import { EN, MR } from "@/lib/i18n";
import { analyzeAnswerSheet, saveGradingResult } from "@tali/gemini/client";
import { GradingResult } from "@tali/types";
import { useNotificationStore } from "../../notifications/utils/store";
import {
  IconCloudUpload,
  IconCircleX,
  IconCircleCheck,
  IconDownload,
  IconFileText,
  IconLoader2,
  IconSparkles,
  IconUser,
  IconSchool,
  IconChartBar,
  IconFileTypePdf,
  IconClock,
  IconCheckbox,
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface ProgressStats {
  total: number;
  completed: number;
  percent: number;
}

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

type CorrectionPerformance = "strong" | "partial" | "weak";

const getDictionaryByLocale = (locale: Locale): Record<string, string> => {
  return locale === "mr" ? MR : EN;
};

const translateByLocale = (locale: Locale, key: string): string => {
  const dictionary = getDictionaryByLocale(locale);
  return dictionary[key] ?? EN[key] ?? key;
};

const getCorrectionPerformance = (
  marksObtained: number,
  maxMarks: number,
): CorrectionPerformance => {
  if (maxMarks <= 0) {
    return "partial";
  }

  const ratio = marksObtained / maxMarks;

  if (ratio >= 0.8) {
    return "strong";
  }

  if (ratio > 0) {
    return "partial";
  }

  return "weak";
};

const getCorrectionStatusStyles = (status: CorrectionPerformance): string => {
  if (status === "strong") {
    return "pdf-chip pdf-chip-strong";
  }

  if (status === "partial") {
    return "pdf-chip pdf-chip-partial";
  }

  return "pdf-chip pdf-chip-weak";
};

const getScoreBand = (
  scoreRate: number,
): "excellent" | "good" | "developing" | "support" => {
  if (scoreRate >= 85) {
    return "excellent";
  }

  if (scoreRate >= 65) {
    return "good";
  }

  if (scoreRate >= 40) {
    return "developing";
  }

  return "support";
};

const PDF_EXPORT_SAFE_STYLE_ID = "tali-pdf-export-safe-style";
const PDF_EXPORT_SAFE_ROOT_CLASS = "tali-pdf-export-root";
const PDF_EXPORT_SAFE_STYLE = `
.${PDF_EXPORT_SAFE_ROOT_CLASS},
.${PDF_EXPORT_SAFE_ROOT_CLASS} * {
  color: #0f172a !important;
  border-color: #dbe4f0 !important;
  box-shadow: none !important;
  text-shadow: none !important;
  background-image: none !important;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} {
  width: 820px !important;
  max-width: 820px !important;
  background: #ffffff !important;
  font-family: "Poppins", "Noto Sans Devanagari", "Segoe UI", sans-serif !important;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-hero {
  background: linear-gradient(130deg, #1d4ed8 0%, #3730a3 52%, #0f766e 100%) !important;
  border-color: #1e3a8a !important;
  border-radius: 18px;
  padding: 20px;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-hero,
.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-hero * {
  color: #eff6ff !important;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-meta-muted {
  color: #64748b !important;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-hero .pdf-meta-muted,
.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-hero .pdf-kicker {
  color: #c7d2fe !important;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-score {
  color: #1d4ed8 !important;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-hero .pdf-score {
  color: #ffffff !important;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-score-total {
  color: #c7d2fe !important;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-kicker {
  color: #475569 !important;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-stat-card {
  background: #f8fafc !important;
  border: 1px solid #dbe4f0 !important;
  border-radius: 14px;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-stat-card--score {
  background: #e0e7ff !important;
  border-color: #c7d2fe !important;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-stat-card--mastered {
  background: #dcfce7 !important;
  border-color: #86efac !important;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-stat-card--support {
  background: #ffe4e6 !important;
  border-color: #fda4af !important;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-summary {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 14px;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-question-card {
  background: #ffffff !important;
  border: 1px solid #dbe4f0 !important;
  border-radius: 14px;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-answer-student {
  background: #fff1f2 !important;
  border: 1px solid #fecdd3 !important;
  border-radius: 10px;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-answer-ideal {
  background: #ecfdf5 !important;
  border: 1px solid #a7f3d0 !important;
  border-radius: 10px;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-analysis {
  border-top: 1px dashed #cbd5e1 !important;
  margin-top: 12px;
  padding-top: 12px;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-chip {
  border-radius: 999px;
  border: 1px solid transparent !important;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-chip-strong {
  background: #dcfce7 !important;
  color: #166534 !important;
  border-color: #86efac !important;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-chip-partial {
  background: #fef3c7 !important;
  color: #92400e !important;
  border-color: #fcd34d !important;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-chip-weak {
  background: #ffe4e6 !important;
  color: #9f1239 !important;
  border-color: #fda4af !important;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-mark-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  background: #e2e8f0 !important;
  color: #0f172a !important;
  border: 1px solid #cbd5e1 !important;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-weak-tag {
  background: #fff1f2 !important;
  color: #be123c !important;
  border: 1px solid #fecdd3 !important;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-batch-card {
  background: #ffffff !important;
  border: 1px solid #dbe4f0 !important;
  border-radius: 16px;
}

.${PDF_EXPORT_SAFE_ROOT_CLASS} .pdf-footer {
  color: #64748b !important;
}
`;

const _injectPdfExportSafeStyles = (clonedDocument: Document): void => {
  if (clonedDocument.getElementById(PDF_EXPORT_SAFE_STYLE_ID)) {
    return;
  }

  const styleTag = clonedDocument.createElement("style");
  styleTag.id = PDF_EXPORT_SAFE_STYLE_ID;
  styleTag.textContent = PDF_EXPORT_SAFE_STYLE;
  clonedDocument.head.appendChild(styleTag);
};

const SCAN_REPORTS_SESSION_KEY = "tali_reports_session_results";

const getApiBaseUrl = (): string => {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"
  ).replace(/\/$/, "");
};

const downloadBlobAsFile = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function ScanViewPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const batchPdfRef = useRef<HTMLDivElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [activeResults, setActiveResults] = useState<GradingResult[] | null>(
    null,
  );
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [isBatchPdfLoading, setIsBatchPdfLoading] = useState(false);
  const [clientTodayLabel, setClientTodayLabel] = useState("");
  const [singlePdfLanguagePickerOpen, setSinglePdfLanguagePickerOpen] =
    useState(false);
  const [batchPdfLanguagePickerOpen, setBatchPdfLanguagePickerOpen] =
    useState(false);
  const [pdfLanguageForSingle, setPdfLanguageForSingle] =
    useState<Locale>(locale);
  const [pdfLanguageForBatch, setPdfLanguageForBatch] =
    useState<Locale>(locale);
  const [pdfExportResult, setPdfExportResult] = useState<GradingResult | null>(
    null,
  );
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  const timerIntervalRef = useRef<number | null>(null);

  const stages = [
    t("scanner.stage0"),
    t("scanner.stage1"),
    t("scanner.stage2"),
    t("scanner.stage3"),
    t("scanner.stage4"),
  ];

  const pdfStages = [
    t("scanner.pdfStage0"),
    t("scanner.pdfStage1"),
    t("scanner.pdfStage2"),
    t("scanner.pdfStage3"),
    t("scanner.pdfStage4"),
  ];

  const getStagesByMimeType = (mimeType: string): string[] => {
    return mimeType === "application/pdf" ? pdfStages : stages;
  };

  useEffect(() => {
    setPdfLanguageForSingle(locale);
    setPdfLanguageForBatch(locale);
  }, [locale]);

  useEffect(() => {
    setClientTodayLabel(new Date().toLocaleDateString());
  }, []);

  useEffect(() => {
    if (loading) {
      setTimer(0);
      timerIntervalRef.current = window.setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [loading]);

  useEffect(() => {
    return () => {
      selectedFiles.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [selectedFiles]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressStats = useMemo<ProgressStats>(() => {
    const total = selectedFiles.length;
    if (total === 0) return { total: 0, completed: 0, percent: 0 };

    const completed = selectedFiles.filter(
      (file) => file.status === "done" || file.status === "error",
    ).length;

    const processingFile = selectedFiles.find(
      (file) => file.status === "processing",
    );
    const currentProgressContribution = processingFile
      ? processingFile.progress / 100
      : 0;

    const visualCompleted = completed + currentProgressContribution;
    const rawPercent = Math.floor((visualCompleted / total) * 100);
    const percent = completed === total ? 100 : rawPercent;

    return { total, completed, percent };
  }, [selectedFiles]);

  const allResults = useMemo(() => {
    return selectedFiles.flatMap((file) => file.results ?? []);
  }, [selectedFiles]);

  const queueStats = useMemo<QueueStats>(() => {
    return selectedFiles.reduce<QueueStats>(
      (acc, file) => {
        if (file.status === "pending") {
          acc.pending += 1;
        } else if (file.status === "processing") {
          acc.processing += 1;
        } else if (file.status === "done") {
          acc.completed += 1;
        } else {
          acc.failed += 1;
        }

        return acc;
      },
      {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      },
    );
  }, [selectedFiles]);

  const classroomSummary = useMemo(() => {
    const totalStudents = allResults.length;
    const averagePercent =
      totalStudents === 0
        ? 0
        : Math.round(
            allResults.reduce((acc, result) => {
              if (result.totalMarks <= 0) {
                return acc;
              }

              return acc + (result.score / result.totalMarks) * 100;
            }, 0) / totalStudents,
          );

    const needsReview = allResults.reduce((acc, result) => {
      const weakQuestions = result.corrections.filter(
        (correction) =>
          getCorrectionPerformance(
            correction.marksObtained,
            correction.maxMarks,
          ) === "weak",
      ).length;

      return acc + weakQuestions;
    }, 0);

    return {
      totalSheets: selectedFiles.length,
      totalStudents,
      averagePercent,
      needsReview,
    };
  }, [allResults, selectedFiles.length]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const newItems: FileItem[] = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      status: "pending",
      progress: 0,
      stage: t("scanner.stageWaiting"),
      mimeType: file.type,
    }));

    setSelectedFiles((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => {
      const removed = prev.find((file) => file.id === id);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((file) => file.id !== id);
    });
  };

  const clearAllFiles = () => {
    selectedFiles.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setSelectedFiles([]);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.addEventListener("load", () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error("Invalid file payload"));
      });

      reader.addEventListener("error", () => {
        reject(reader.error ?? new Error("Unable to read the selected file"));
      });

      reader.readAsDataURL(file);
    });
  };

  const processBatch = async () => {
    if (selectedFiles.length === 0 || loading) return;
    setLoading(true);

    for (let i = 0; i < selectedFiles.length; i++) {
      const currentFile = selectedFiles[i];
      if (currentFile.status === "done") continue;

      const currentStages = getStagesByMimeType(currentFile.mimeType);

      if (i > 0) await new Promise((resolve) => setTimeout(resolve, 1000));

      let currentProgress = 0;
      const progressInterval = window.setInterval(() => {
        if (currentProgress < 95) {
          currentProgress += Math.random() * 1.8;
          const stageIndex = Math.min(
            Math.floor(currentProgress / 20),
            currentStages.length - 1,
          );
          setSelectedFiles((prev) =>
            prev.map((f) =>
              f.id === currentFile.id
                ? {
                    ...f,
                    status: "processing",
                    progress: Math.min(currentProgress, 95),
                    stage: currentStages[stageIndex],
                  }
                : f,
            ),
          );
        }
      }, 500);

      try {
        const base64 = await fileToBase64(currentFile.file);
        const results = await analyzeAnswerSheet(base64);
        clearInterval(progressInterval);

        if (results && results.length > 0) {
          const savedResults = [] as GradingResult[];

          for (const result of results) {
            try {
              const saveResponse = await saveGradingResult(result);
              const enrichedResult = {
                ...result,
                analysisId: saveResponse.analysisId,
                studentId: saveResponse.studentId,
              };
              savedResults.push(enrichedResult);

              addNotification({
                id: `${saveResponse.analysisId || Math.random().toString(36).slice(2)}-${Date.now()}`,
                title: `${result.studentName || result.subject} report saved`,
                body: `Student profile created for ${result.studentName || result.subject}. Open WorkHome to generate practice tasks.`,
                createdAt: new Date().toISOString(),
                actions: [
                  {
                    id: "workhome",
                    label: "Generate WorkHome",
                    type: "redirect",
                    style: "primary",
                  },
                ],
              });
            } catch (saveError) {
              console.error("Failed to save scan result to DB:", saveError);
              savedResults.push(result);
            }
          }

          setSelectedFiles((prev) =>
            prev.map((f) =>
              f.id === currentFile.id
                ? {
                    ...f,
                    status: "done",
                    progress: 100,
                    stage: t("scanner.stageDone"),
                    results: savedResults,
                  }
                : f,
            ),
          );
        } else {
          throw new Error(t("scanner.error.noResults"));
        }
      } catch (error: unknown) {
        clearInterval(progressInterval);

        const normalizedError =
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error;

        const message =
          typeof error === "string"
            ? error
            : error instanceof Error
              ? error.message
              : JSON.stringify(error);

        const normalizedMessage = message.toLowerCase();

        console.error("[scan-report] Failed to process answer sheet", {
          fileName: currentFile.file.name,
          mimeType: currentFile.mimeType,
          errorMessage: message,
          error: normalizedError,
        });

        const errorMsg =
          message.includes("Quota") || message.includes("429")
            ? t("scanner.error.quota")
            : normalizedMessage.includes("timed out") ||
                normalizedMessage.includes("timeout") ||
                normalizedMessage.includes("econnreset") ||
                normalizedMessage.includes(
                  "socket connection was closed unexpectedly",
                )
              ? t("scanner.error.timeout")
              : t("scanner.error.generic");

        setSelectedFiles((prev) =>
          prev.map((f) =>
            f.id === currentFile.id
              ? {
                  ...f,
                  status: "error",
                  progress: 0,
                  stage: errorMsg,
                  errorMsg,
                }
              : f,
          ),
        );
      }
    }
    setLoading(false);
  };

  const openResults = (results: GradingResult[]) => {
    if (results.length === 0) {
      return;
    }

    try {
      window.sessionStorage.setItem(
        SCAN_REPORTS_SESSION_KEY,
        JSON.stringify(results),
      );
    } catch (error) {
      console.error("Unable to store scan results for reports page:", error);
    }

    router.push("/dashboard/reports?source=scan");
  };

  const closeResultDialog = () => {
    setActiveResults(null);
    setActiveResultIndex(0);
    setPdfExportResult(null);
    setSinglePdfLanguagePickerOpen(false);
  };

  const activeResult = activeResults?.[activeResultIndex] ?? null;
  const displaySingleResult = pdfExportResult ?? activeResult;
  const displayBatchResults = allResults;

  const reportQuickStats = useMemo(() => {
    if (!displaySingleResult) {
      return null;
    }

    const questions = displaySingleResult.corrections.length;
    const mastered = displaySingleResult.corrections.filter(
      (correction) =>
        getCorrectionPerformance(
          correction.marksObtained,
          correction.maxMarks,
        ) === "strong",
    ).length;
    const needsSupport = displaySingleResult.corrections.filter(
      (correction) =>
        getCorrectionPerformance(
          correction.marksObtained,
          correction.maxMarks,
        ) === "weak",
    ).length;
    const scoreRate =
      displaySingleResult.totalMarks > 0
        ? Math.round(
            (displaySingleResult.score / displaySingleResult.totalMarks) * 100,
          )
        : 0;

    return {
      questions,
      mastered,
      needsSupport,
      scoreRate,
      scoreBand: getScoreBand(scoreRate),
    };
  }, [displaySingleResult]);

  const todayLabel = clientTodayLabel || "-";

  const singlePdfT = (key: string): string => {
    return translateByLocale(pdfLanguageForSingle, key);
  };

  const batchPdfT = (key: string): string => {
    return translateByLocale(pdfLanguageForBatch, key);
  };

  const prepareResultsForPdfLanguage = async (
    results: GradingResult[],
    _language: Locale,
  ): Promise<GradingResult[]> => {
    return results;
  };

  const downloadSingleReportPdf = async (
    result: GradingResult,
    language: Locale,
  ): Promise<void> => {
    const response = await fetch(`${getApiBaseUrl()}/reports/pdf`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        result,
        locale: language,
      }),
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: "PDF generation failed" }));
      throw new Error(errorBody.error || "PDF generation failed");
    }

    const blob = await response.blob();
    const safeName =
      result.studentName?.trim().replace(/\s+/g, "_") ||
      result.subject?.trim().replace(/\s+/g, "_") ||
      "student_report";
    downloadBlobAsFile(
      blob,
      `${safeName}_${language}_${new Date().getTime()}.pdf`,
    );
  };

  const downloadBulkReportPdf = async (
    results: GradingResult[],
    language: Locale,
  ): Promise<void> => {
    const response = await fetch(`${getApiBaseUrl()}/reports/bulk-pdf`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        results,
        locale: language,
      }),
    });

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: "Bulk PDF generation failed" }));
      throw new Error(errorBody.error || "Bulk PDF generation failed");
    }

    const blob = await response.blob();
    downloadBlobAsFile(
      blob,
      `batch_report_${language}_${new Date().getTime()}.pdf`,
    );
  };

  const generatePDF = async (language: Locale) => {
    if (!activeResult) return;

    setSinglePdfLanguagePickerOpen(false);
    setIsPdfLoading(true);

    try {
      const [preparedResult] = await prepareResultsForPdfLanguage(
        [activeResult],
        language,
      );

      setPdfLanguageForSingle(language);
      await downloadSingleReportPdf(preparedResult, language);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const generateBatchPDF = async (language: Locale) => {
    if (allResults.length === 0) return;

    setBatchPdfLanguagePickerOpen(false);
    setIsBatchPdfLoading(true);

    try {
      const preparedResults = await prepareResultsForPdfLanguage(
        allResults,
        language,
      );

      setPdfLanguageForBatch(language);
      await downloadBulkReportPdf(preparedResults, language);
    } catch (err) {
      console.error("Batch PDF generation failed:", err);
    } finally {
      setIsBatchPdfLoading(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <Heading
            title={t("scanner.pageTitle")}
            description={t("scanner.pageSubtitle")}
          />
          <div className="hidden gap-2 md:flex">
            {selectedFiles.length > 0 && (
              <Button
                variant="outline"
                onClick={clearAllFiles}
                disabled={loading}
                className="transition-all hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              >
                {t("scanner.clearAll")}
              </Button>
            )}
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="shadow-sm transition-all hover:shadow-md"
            >
              <IconCloudUpload className="mr-2 h-4 w-4" />
              {t("scanner.addFiles")}
            </Button>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept="image/*,application/pdf"
          className="hidden"
        />

        {selectedFiles.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Card className="bg-card shadow-sm border-border overflow-hidden">
              <CardContent className="p-4 relative">
                <div className="absolute right-0 top-0 opacity-5 -mt-2 -mr-2">
                  <IconFileText className="h-16 w-16" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground relative z-10">
                  {t("scanner.totalSheets")}
                </p>
                <p className="mt-1 text-2xl font-black text-foreground relative z-10">
                  {classroomSummary.totalSheets}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card shadow-sm border-border overflow-hidden">
              <CardContent className="p-4 relative">
                <div className="absolute right-0 top-0 opacity-5 -mt-2 -mr-2">
                  <IconUser className="h-16 w-16" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground relative z-10">
                  {t("scanner.totalStudents")}
                </p>
                <p className="mt-1 text-2xl font-black text-foreground relative z-10">
                  {classroomSummary.totalStudents}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 shadow-sm border-primary/20 overflow-hidden">
              <CardContent className="p-4 relative">
                <div className="absolute right-0 top-0 opacity-10 text-primary -mt-2 -mr-2">
                  <IconSchool className="h-16 w-16" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary/80 relative z-10">
                  {t("scanner.avgClassScore")}
                </p>
                <p className="mt-1 text-2xl font-black text-primary relative z-10">
                  {classroomSummary.averagePercent}%
                </p>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 shadow-sm border-destructive/20 overflow-hidden">
              <CardContent className="p-4 relative">
                <div className="absolute right-0 top-0 opacity-10 text-destructive -mt-2 -mr-2">
                  <IconChartBar className="h-16 w-16" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-destructive/80 relative z-10">
                  {t("scanner.needsReview")}
                </p>
                <p className="mt-1 text-2xl font-black text-destructive relative z-10">
                  {classroomSummary.needsReview}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_360px] items-start">
          <div className="flex flex-col gap-6">
            {selectedFiles.length === 0 ? (
              <Card
                className="border-dashed border-2 bg-muted/20 hover:bg-muted/40 transition-colors shadow-sm cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <CardContent className="flex flex-col items-center justify-center py-20 px-8 text-center sm:py-24">
                  <div className="rounded-2xl bg-primary/10 p-5 mb-5 group-hover:scale-110 group-hover:bg-primary/15 transition-all duration-300">
                    <IconCloudUpload className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 tracking-tight text-foreground">
                    {t("scanner.uploadTitle")}
                  </h3>
                  <p className="text-muted-foreground mb-8 max-w-md text-sm leading-relaxed">
                    {t("scanner.uploadSub")}
                  </p>
                  <Button
                    size="lg"
                    disabled={loading}
                    className="shadow-sm rounded-full px-8 pointer-events-none group-active:scale-95 transition-transform"
                  >
                    {t("scanner.selectFiles")}
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {(loading || progressStats.percent > 0) && (
              <div className="grid gap-4 sm:grid-cols-3 animate-in fade-in duration-300">
                <Card className="bg-card shadow-sm border-border">
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                      <span>{t("scanner.time")}</span>
                      <IconClock className="h-4 w-4" />
                    </div>
                    <p className="text-xl font-black text-foreground">
                      {formatTime(timer)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card shadow-sm border-border">
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                      <span>{t("scanner.progress")}</span>
                      <span className="text-primary">
                        {progressStats.percent}%
                      </span>
                    </div>
                    <Progress
                      value={progressStats.percent}
                      className="mt-2 h-2.5 rounded-full"
                    />
                  </CardContent>
                </Card>
                <Card className="bg-card shadow-sm border-border">
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                      <span>{t("scanner.completed")}</span>
                      <IconCheckbox className="h-4 w-4" />
                    </div>
                    <p className="text-xl font-black text-foreground">
                      {progressStats.completed}{" "}
                      <span className="text-muted-foreground text-sm font-medium">
                        / {progressStats.total}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-foreground tracking-tight">
                    {t("scanner.processingQueue")}
                  </h3>
                  <Badge
                    variant="secondary"
                    className="rounded-full px-3 shadow-sm border-border"
                  >
                    {selectedFiles.length} {t("scanner.files")}
                  </Badge>
                </div>
                <div className="grid gap-4 xl:grid-cols-2">
                  {selectedFiles.map((file) => (
                    <Card
                      key={file.id}
                      className="relative overflow-hidden transition-all hover:border-primary/30 shadow-sm border-border group bg-card"
                    >
                      <div className="flex p-4 gap-4 items-center">
                        <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-border shadow-sm flex-none bg-muted/30">
                          {file.mimeType === "application/pdf" ? (
                            <div className="h-full w-full flex items-center justify-center bg-destructive/5 text-destructive">
                              <IconFileTypePdf className="h-8 w-8" />
                            </div>
                          ) : (
                            <Image
                              src={file.preview}
                              alt="preview"
                              width={64}
                              height={64}
                              unoptimized
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex justify-between items-start gap-2">
                            <p
                              className="font-semibold text-sm truncate text-foreground"
                              title={file.file.name}
                            >
                              {file.file.name}
                            </p>
                            {file.status === "pending" ||
                            file.status === "error" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFile(file.id);
                                }}
                                className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1 -m-1 rounded-md hover:bg-destructive/10"
                                aria-label="Remove element"
                              >
                                <IconCircleX className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>

                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <Badge
                              variant="outline"
                              className={`rounded-full px-2 py-0 text-[10px] uppercase font-bold tracking-wide border-transparent shadow-none ${
                                file.status === "done"
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                  : file.status === "processing"
                                    ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400"
                                    : file.status === "error"
                                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
                                      : "bg-slate-500/15 text-slate-700 dark:text-slate-400"
                              }`}
                            >
                              {file.status === "pending"
                                ? t("scanner.status.pending")
                                : file.status === "processing"
                                  ? t("scanner.status.processing")
                                  : file.status === "done"
                                    ? t("scanner.status.done")
                                    : t("scanner.status.error")}
                            </Badge>
                            {file.status === "done" && (
                              <IconCircleCheck className="h-4 w-4 text-emerald-500" />
                            )}
                          </div>

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <Progress
                              value={file.progress}
                              className={`h-1.5 flex-1 ${file.status === "error" ? "[&>div]:bg-rose-500" : file.status === "done" ? "[&>div]:bg-emerald-500" : ""}`}
                            />
                          </div>

                          {file.status === "error" && (
                            <p className="mt-2 text-[11px] font-medium text-rose-600 line-clamp-1 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-1 rounded-md border border-rose-100 dark:border-rose-900/50">
                              {file.errorMsg}
                            </p>
                          )}
                          {(file.status === "pending" ||
                            file.status === "processing") && (
                            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1 font-medium">
                              {file.stage}
                            </p>
                          )}

                          {file.status === "done" && file.results && (
                            <Button
                              onClick={() => openResults(file.results!)}
                              variant="secondary"
                              size="sm"
                              className="mt-3 w-full h-8 text-xs font-semibold shadow-sm hover:shadow active:scale-[0.98] transition-all bg-primary/5 hover:bg-primary/10 text-primary border border-primary/10"
                            >
                              <IconSparkles className="mr-2 h-3.5 w-3.5" />
                              {t("scanner.viewResults")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="sticky top-6 flex flex-col gap-6">
            <Card className="shadow-md border-border bg-card overflow-hidden">
              <div className="bg-muted/40 px-6 py-4 border-b border-border/50">
                <h3 className="font-bold tracking-tight text-foreground">
                  {t("scanner.batchControls")}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
                  {t("scanner.batchControlsSub")}
                </p>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center text-sm p-2 rounded-lg bg-muted/30 border border-border/40">
                  <span className="text-muted-foreground font-medium">
                    {t("scanner.ready")}
                  </span>
                  <span className="font-bold text-foreground bg-background px-2.5 py-0.5 rounded shadow-sm border border-border">
                    {queueStats.pending}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30">
                  <span className="text-muted-foreground font-medium">
                    {t("scanner.processingLabel")}
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-background px-2.5 py-0.5 rounded shadow-sm border border-border">
                    {queueStats.processing}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30">
                  <span className="text-muted-foreground font-medium">
                    {t("scanner.completed")}
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-background px-2.5 py-0.5 rounded shadow-sm border border-border">
                    {queueStats.completed}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm p-2 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30">
                  <span className="text-muted-foreground font-medium">
                    {t("scanner.failed")}
                  </span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 bg-background px-2.5 py-0.5 rounded shadow-sm border border-border">
                    {queueStats.failed}
                  </span>
                </div>

                <div className="pt-4">
                  <Button
                    className="w-full shadow-md active:scale-95 transition-all text-sm font-bold"
                    size="lg"
                    onClick={processBatch}
                    disabled={
                      loading ||
                      selectedFiles.length === 0 ||
                      (queueStats.pending === 0 && queueStats.failed === 0)
                    }
                  >
                    {loading ? (
                      <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <IconSparkles className="mr-2 h-5 w-5" />
                    )}
                    {loading
                      ? t("scanner.scanning")
                      : t("scanner.analyzeBatch")}
                  </Button>
                </div>
              </CardContent>
              <div className="px-6 pb-5 text-xs text-muted-foreground text-center font-medium bg-muted/10">
                {selectedFiles.length === 0
                  ? t("scanner.awaitUploadHint")
                  : queueStats.pending > 0 || queueStats.failed > 0
                    ? t("scanner.primaryActionHint")
                    : t("scanner.secondaryActionHint")}
              </div>
              {allResults.length > 0 && (
                <div className="px-6 pb-6 pt-2 space-y-3 bg-muted/20 border-t border-border/50">
                  <Button
                    variant="outline"
                    className="w-full text-xs font-semibold shadow-sm hover:shadow transition-shadow bg-background"
                    onClick={() => setBatchPdfLanguagePickerOpen(true)}
                    disabled={isBatchPdfLoading}
                  >
                    {isBatchPdfLoading ? (
                      <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <IconDownload className="mr-2 h-4 w-4" />
                    )}
                    {isBatchPdfLoading
                      ? t("reports.detail.downloading")
                      : `${t("scan.bulk.report")} (${allResults.length})`}
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full text-xs font-semibold shadow-sm hover:shadow transition-shadow"
                    onClick={() => openResults(allResults)}
                    disabled={loading}
                  >
                    <IconFileText className="mr-2 h-4 w-4" />
                    {t("scanner.viewResults")} ({allResults.length})
                  </Button>
                </div>
              )}
            </Card>

            <Card className="bg-card shadow-sm border-border overflow-hidden">
              <div className="bg-primary/5 border-b border-primary/10 px-5 py-3 flex items-center gap-3">
                <div className="bg-primary/20 p-1.5 rounded-md text-primary">
                  <IconFileText className="h-4 w-4" />
                </div>
                <h4 className="font-bold text-sm text-foreground tracking-tight">
                  {t("scanner.tipsTitle")}
                </h4>
              </div>
              <CardContent className="p-5 flex flex-col gap-5">
                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-2 marker:text-primary/40 font-medium">
                  <li>{t("scanner.tip.1")}</li>
                  <li>{t("scanner.tip.2")}</li>
                  <li>{t("scanner.tip.3")}</li>
                </ul>

                <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    {t("scanner.legendTitle")}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                      {t("scanner.questionStatus.strong")}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 shadow-sm">
                      {t("scanner.questionStatus.partial")}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/20 shadow-sm">
                      {t("scanner.questionStatus.weak")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog
        open={!!activeResult}
        onOpenChange={(open) => !open && closeResultDialog()}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl border-border shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card relative z-10 shadow-sm">
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                {t("scanner.evaluationReport")}
              </DialogTitle>
              <DialogDescription className="font-medium text-xs mt-1">
                {t("scanner.aiDeepAnalysis")}
              </DialogDescription>
            </div>
            <Button
              onClick={() => setSinglePdfLanguagePickerOpen(true)}
              disabled={isPdfLoading}
              size="sm"
              className="font-semibold shadow-sm rounded-full px-4"
            >
              {isPdfLoading ? (
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <IconDownload className="mr-2 h-4 w-4" />
              )}
              {isPdfLoading ? t("scanner.packingPdf") : t("scanner.exportPdf")}
            </Button>
          </div>

          {activeResults && activeResults.length > 1 && (
            <div className="px-6 py-3 border-b border-border bg-muted/30">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">
                {t("scanner.selectStudent")}
              </p>
              <ScrollArea className="w-full pb-2 -mb-2">
                <div className="flex gap-2 w-max pr-6">
                  {activeResults.map((result, index) => (
                    <Button
                      key={`${result.studentName}-${index}`}
                      variant={
                        index === activeResultIndex ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setActiveResultIndex(index)}
                      className={`text-xs font-semibold rounded-full shadow-sm transition-all ${
                        index === activeResultIndex
                          ? "bg-primary text-primary-foreground"
                          : "bg-background hover:bg-muted"
                      }`}
                    >
                      {result.studentName ||
                        result.subject ||
                        `${t("result.student")} ${index + 1}`}
                      {index === activeResultIndex && (
                        <div className="ml-2 w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                      )}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <ScrollArea className="flex-1 p-6 bg-muted/10 relative">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

            {displaySingleResult && (
              <div
                ref={pdfRef}
                className={`${PDF_EXPORT_SAFE_ROOT_CLASS} p-8 sm:p-10 rounded-2xl border border-border/50 shadow-md space-y-10 max-w-[820px] mx-auto bg-card relative z-10`}
              >
                <div className="pdf-hero flex flex-col sm:flex-row sm:items-start justify-between border border-border shadow-sm bg-gradient-to-br from-indigo-600 via-primary to-teal-600 text-white rounded-2xl p-6 sm:p-8 overflow-hidden relative">
                  <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
                    <IconChartBar className="w-64 h-64" />
                  </div>

                  <div className="relative z-10 flex-1">
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight drop-shadow-md">
                      {displaySingleResult.studentName ||
                        displaySingleResult.subject ||
                        t("result.student")}
                    </h1>
                    <div className="pdf-meta-muted mt-4 flex flex-wrap gap-4 text-sm font-semibold text-white/80">
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 shadow-sm">
                        <IconSchool className="h-4 w-4 opacity-80" />{" "}
                        {displaySingleResult.className || "-"}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 shadow-sm">
                        <IconFileText className="h-4 w-4 opacity-80" />{" "}
                        {displaySingleResult.subject || "-"}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 shadow-sm">
                        <IconUser className="h-4 w-4 opacity-80" />{" "}
                        {displaySingleResult.date || todayLabel}
                      </span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right mt-6 sm:mt-0 relative z-10 bg-black/10 sm:bg-transparent p-4 sm:p-0 rounded-xl sm:rounded-none backdrop-blur-sm sm:backdrop-blur-none border sm:border-none border-white/10">
                    <div className="pdf-score text-5xl sm:text-6xl font-black tracking-tighter drop-shadow-lg text-white mb-1">
                      {displaySingleResult.score}
                      <span className="pdf-score-total text-2xl sm:text-3xl opacity-70 font-bold ml-1">
                        /{displaySingleResult.totalMarks}
                      </span>
                    </div>
                    <p className="pdf-kicker text-xs font-bold uppercase tracking-widest text-indigo-100 drop-shadow-sm">
                      {singlePdfT("scanner.finalScore")}
                    </p>
                    {reportQuickStats && (
                      <div className="mt-3 inline-flex items-center">
                        <span className="bg-white/20 text-white border border-white/30 px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm">
                          {singlePdfT(
                            `scanner.scoreBand.${reportQuickStats.scoreBand}`,
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {reportQuickStats && (
                  <div className="space-y-3">
                    <p className="pdf-meta-muted text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                      <span className="w-8 border-t border-border"></span>
                      {singlePdfT("scanner.report.quickView")}
                    </p>
                    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                      <div className="pdf-stat-card pdf-stat-card--score p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                        <p className="pdf-meta-muted text-[11px] font-bold tracking-wider text-indigo-600/70 dark:text-indigo-400/70 uppercase">
                          {singlePdfT("scanner.report.scoreRate")}
                        </p>
                        <p className="mt-1 text-3xl font-black text-indigo-700 dark:text-indigo-400 tracking-tight">
                          {reportQuickStats.scoreRate}%
                        </p>
                      </div>
                      <div className="pdf-stat-card p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-sm transition-transform hover:-translate-y-1 duration-300">
                        <p className="pdf-meta-muted text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                          {singlePdfT("scanner.report.questions")}
                        </p>
                        <p className="mt-1 text-3xl font-black text-foreground tracking-tight">
                          {reportQuickStats.questions}
                        </p>
                      </div>
                      <div className="pdf-stat-card pdf-stat-card--mastered p-4 sm:p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                        <p className="text-[11px] font-bold tracking-wider text-emerald-600/70 dark:text-emerald-400/70 uppercase">
                          {singlePdfT("scanner.report.mastered")}
                        </p>
                        <p className="mt-1 text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                          {reportQuickStats.mastered}
                        </p>
                      </div>
                      <div className="pdf-stat-card pdf-stat-card--support p-4 sm:p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 shadow-sm transition-transform hover:-translate-y-1 duration-300">
                        <p className="text-[11px] font-bold tracking-wider text-rose-600/70 dark:text-rose-400/70 uppercase">
                          {singlePdfT("scanner.report.needsSupport")}
                        </p>
                        <p className="mt-1 text-3xl font-black text-rose-700 dark:text-rose-400 tracking-tight">
                          {reportQuickStats.needsSupport}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-foreground">
                    <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
                      <IconSparkles className="h-4 w-4" />
                    </div>
                    {singlePdfT("scanner.executiveSummary")}
                  </h3>
                  <div className="pdf-summary p-5 sm:p-6 text-sm leading-relaxed rounded-2xl bg-muted/30 border border-border shadow-sm font-medium">
                    {displaySingleResult.feedback}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-black tracking-tight text-foreground mb-1">
                    <div className="bg-muted p-1.5 rounded-lg text-muted-foreground border border-border">
                      <IconFileText className="h-4 w-4" />
                    </div>
                    {singlePdfT("scanner.questionBreakdown")}
                  </h3>
                  <div className="space-y-4">
                    {displaySingleResult.corrections.map((q, idx) => (
                      <div
                        key={idx}
                        className="pdf-question-card p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-sm relative overflow-hidden group"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 transition-colors group-hover:bg-primary/40" />
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <h4 className="font-bold text-foreground text-sm sm:text-base leading-snug max-w-xl">
                            <span className="text-primary mr-1 bg-primary/10 px-2 py-0.5 rounded-md font-black">
                              Q{q.questionNo}
                            </span>{" "}
                            {q.questionText}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 sm:justify-end shrink-0">
                            <span
                              className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-full shadow-sm ${getCorrectionStatusStyles(
                                getCorrectionPerformance(
                                  q.marksObtained,
                                  q.maxMarks,
                                ),
                              )}`}
                            >
                              {singlePdfT(
                                `scanner.questionStatus.${getCorrectionPerformance(
                                  q.marksObtained,
                                  q.maxMarks,
                                )}`,
                              )}
                            </span>
                            <span className="pdf-mark-pill bg-muted border-border font-black shadow-sm">
                              {q.marksObtained} / {q.maxMarks}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="pdf-meta-muted text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-400/60" />
                              {singlePdfT("scanner.studentAnswer")}
                            </div>
                            <div className="pdf-answer-student p-3 sm:p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-950 dark:text-rose-100 font-medium whitespace-pre-wrap shadow-inner leading-relaxed">
                              {q.studentAnswer || "-"}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="pdf-meta-muted text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                              {singlePdfT("scanner.idealAnswer")}
                            </div>
                            <div className="pdf-answer-ideal p-3 sm:p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-950 dark:text-emerald-100 font-medium whitespace-pre-wrap shadow-inner leading-relaxed">
                              {q.correctAnswer || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="pdf-analysis text-sm mt-5 pt-4 border-t border-border/60">
                          <div className="pdf-score mb-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <IconChartBar className="h-3.5 w-3.5" />
                            {singlePdfT("scanner.aiTeacherLogic")}
                          </div>
                          <div className="pdf-meta-muted text-muted-foreground font-medium leading-relaxed pl-5 border-l-2 border-indigo-100 dark:border-indigo-900/50">
                            {q.analysis}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {displaySingleResult.weakAreas &&
                  displaySingleResult.weakAreas.length > 0 && (
                    <div className="mt-10 border border-border rounded-2xl p-6 bg-rose-50/30 dark:bg-rose-950/10 shadow-sm">
                      <h3 className="pdf-meta-muted mb-4 text-xs font-black uppercase tracking-[0.15em] text-rose-700 dark:text-rose-400 flex items-center gap-2">
                        <IconChartBar className="h-4 w-4" />
                        {singlePdfT("scanner.identifiedVulnerabilities")}
                      </h3>
                      <div className="flex flex-wrap gap-2.5">
                        {displaySingleResult.weakAreas.map((area, i) => (
                          <span
                            key={i}
                            className="pdf-weak-tag rounded-lg px-3.5 py-1.5 text-xs font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-sm transition-transform hover:scale-105"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="pdf-footer mt-12 text-center text-xs font-bold text-muted-foreground opacity-70 uppercase tracking-widest pt-8 border-t border-border flex items-center justify-center gap-2">
                  <IconSparkles className="w-3.5 h-3.5" />
                  {singlePdfT("scanner.generatedWithTali")} • {todayLabel}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog
        open={singlePdfLanguagePickerOpen}
        onOpenChange={setSinglePdfLanguagePickerOpen}
      >
        <DialogContent className="max-w-xs sm:rounded-2xl shadow-xl">
          <DialogTitle className="text-center font-bold text-xl mb-1">
            {t("langPicker.title")}
          </DialogTitle>
          <DialogDescription className="text-center mb-4">
            {t("langPicker.subtitle")}
          </DialogDescription>

          <div className="grid gap-3 pt-2">
            <Button
              onClick={() => generatePDF("en")}
              disabled={isPdfLoading}
              variant="outline"
              className="h-12 font-bold shadow-sm"
            >
              {t("langPicker.english")}
            </Button>
            <Button
              onClick={() => generatePDF("mr")}
              disabled={isPdfLoading}
              variant="outline"
              className="h-12 font-bold shadow-sm"
            >
              {t("langPicker.marathi")}
            </Button>
          </div>

          <div className="flex justify-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              onClick={() => setSinglePdfLanguagePickerOpen(false)}
            >
              {t("langPicker.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={batchPdfLanguagePickerOpen}
        onOpenChange={setBatchPdfLanguagePickerOpen}
      >
        <DialogContent className="max-w-xs sm:rounded-2xl shadow-xl">
          <DialogTitle className="text-center font-bold text-xl mb-1">
            {t("langPicker.title")}
          </DialogTitle>
          <DialogDescription className="text-center mb-4">
            {t("langPicker.subtitle")}
          </DialogDescription>

          <div className="grid gap-3 pt-2">
            <Button
              onClick={() => generateBatchPDF("en")}
              disabled={isBatchPdfLoading}
              variant="outline"
              className="h-12 font-bold shadow-sm"
            >
              {t("langPicker.english")}
            </Button>
            <Button
              onClick={() => generateBatchPDF("mr")}
              disabled={isBatchPdfLoading}
              variant="outline"
              className="h-12 font-bold shadow-sm"
            >
              {t("langPicker.marathi")}
            </Button>
          </div>

          <div className="flex justify-center mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              onClick={() => setBatchPdfLanguagePickerOpen(false)}
            >
              {t("langPicker.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="hidden" aria-hidden>
        <div
          ref={batchPdfRef}
          className={`${PDF_EXPORT_SAFE_ROOT_CLASS} p-10 space-y-12 bg-white`}
          style={{ width: "820px" }}
        >
          <div className="border-b-4 border-slate-900 pb-6 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4 text-slate-500 font-bold uppercase tracking-widest text-xs">
                <IconSchool className="h-4 w-4" />
                {batchPdfT("scanner.generatedWithTali")}
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900">
                {batchPdfT("scan.bulk.report")}
              </h1>
              <p className="pdf-meta-muted mt-2 text-sm font-semibold flex items-center gap-2">
                <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                  {todayLabel}
                </span>
                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">
                  {displayBatchResults.length}{" "}
                  {batchPdfT("scan.bulk.reportCount")}
                </span>
              </p>
            </div>
            <div className="text-right">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <IconChartBar className="h-8 w-8 text-indigo-500" />
              </div>
            </div>
          </div>

          <div className="space-y-10">
            {displayBatchResults.map((result, idx) => (
              <div
                key={`${result.studentName}-${idx}`}
                className="pdf-batch-card p-8 rounded-2xl bg-white border-2 border-slate-100 shadow-sm space-y-6"
                style={{ breakInside: "avoid" }}
              >
                <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h2 className="text-3xl font-black text-slate-900">
                        {result.studentName}
                      </h2>
                      {result.className && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                          {result.className}
                        </span>
                      )}
                    </div>
                    <p className="pdf-meta-muted text-sm font-bold flex items-center gap-1.5 text-slate-500">
                      <IconFileText className="h-4 w-4" />
                      {result.subject}
                    </p>
                  </div>
                  <div className="text-right bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <p className="pdf-score text-4xl font-black text-indigo-700 leading-none">
                      {result.score}
                      <span className="text-xl text-indigo-400 opacity-80">
                        /{result.totalMarks}
                      </span>
                    </p>
                    <p className="pdf-kicker mt-1 text-[10px] font-extrabold uppercase tracking-widest text-indigo-500">
                      {batchPdfT("scanner.finalScore")}
                    </p>
                  </div>
                </div>

                <div className="pdf-summary p-5 text-sm font-medium leading-relaxed bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
                  {result.feedback}
                </div>

                <div className="space-y-3">
                  {result.corrections.map((correction, correctionIndex) => {
                    const perf = getCorrectionPerformance(
                      correction.marksObtained,
                      correction.maxMarks,
                    );
                    const isStrong = perf === "strong";
                    const isPartial = perf === "partial";
                    const isWeak = perf === "weak";

                    return (
                      <div
                        key={correctionIndex}
                        className="pdf-question-card p-4 rounded-xl bg-white border border-slate-200 flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm flex items-center gap-2 text-slate-800">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded shadow-sm text-xs font-black">
                              Q{correction.questionNo}
                            </span>
                            <span className="line-clamp-1">
                              {correction.questionText || "Question"}
                            </span>
                          </p>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                isStrong
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : isPartial
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {batchPdfT(`scanner.questionStatus.${perf}`)}
                            </span>
                            <p className="text-sm font-black bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                              {correction.marksObtained}/{correction.maxMarks}
                            </p>
                          </div>
                        </div>
                        <div className="pdf-meta-muted text-xs font-medium leading-relaxed text-slate-600 pl-4 border-l-2 border-indigo-100 py-1">
                          <span className="font-bold text-[10px] uppercase text-indigo-500 block mb-1">
                            Analysis
                          </span>
                          {correction.analysis}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
