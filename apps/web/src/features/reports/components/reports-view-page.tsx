"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconArrowLeft,
  IconDownload,
  IconFileAnalytics,
  IconLoader2,
  IconRocket,
  IconSparkles,
  IconTargetArrow,
  IconUser,
} from "@tabler/icons-react";
import { GradingResult, LearningPlan } from "@tali/types";
import {
  generateLearningPlan,
  getAllGradingHistory,
  saveLearningPlan,
} from "@tali/gemini/client";
import { Breadcrumbs } from "@/components/breadcrumbs";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useLanguage, type Locale } from "@/lib/LanguageContext";
import { useNotificationStore } from "@/features/notifications/utils/store";

const REPORTS_SESSION_KEY = "tali_reports_session_results";
const WORKHOME_SESSION_KEY = "tali_workhome_session_payload";

const getApiBaseUrl = (): string => {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"
  ).replace(/\/$/, "");
};

const isGradingResult = (value: unknown): value is GradingResult => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<GradingResult>;
  return (
    typeof candidate.studentName === "string" &&
    typeof candidate.subject === "string" &&
    typeof candidate.score === "number" &&
    typeof candidate.totalMarks === "number" &&
    Array.isArray(candidate.corrections)
  );
};

const makeResultKey = (result: GradingResult): string => {
  return [
    result.studentName,
    result.subject,
    result.date,
    result.score,
    result.totalMarks,
    result.corrections.length,
  ].join("|");
};

const getPercent = (score: number, totalMarks: number): number => {
  return totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
};

const getScoreToneClass = (percent: number): string => {
  if (percent >= 70) {
    return "text-emerald-600 dark:text-emerald-400";
  }

  if (percent >= 50) {
    return "text-amber-600 dark:text-amber-400";
  }

  return "text-rose-600 dark:text-rose-400";
};

const formatDate = (value: string): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const sanitizePlanValue = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
};

const downloadBlobAsFile = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const getLocaleLabel = (value: Locale, t: (key: string) => string): string => {
  return value === "mr" ? t("lang.marathi") : t("lang.english");
};

const getCorrectionBucket = (
  marksObtained: number,
  maxMarks: number,
): "strong" | "weak" | "medium" => {
  if (maxMarks <= 0) {
    return "medium";
  }

  const percent = (marksObtained / maxMarks) * 100;
  if (percent >= 75) {
    return "strong";
  }

  if (percent < 45) {
    return "weak";
  }

  return "medium";
};

interface PdfLanguagePickerProps {
  value: Locale;
  onChange: (nextLocale: Locale) => void;
  t: (key: string) => string;
}

function PdfLanguagePicker({
  value,
  onChange,
  t,
}: PdfLanguagePickerProps): React.JSX.Element {
  return (
    <div className="inline-flex items-center rounded-lg border bg-muted/50 p-1">
      <span className="px-2 text-xs font-semibold text-muted-foreground">
        {t("reports.exportLanguage")}
      </span>
      <Button
        type="button"
        size="sm"
        variant={value === "en" ? "default" : "ghost"}
        onClick={() => onChange("en")}
      >
        {t("lang.english")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === "mr" ? "default" : "ghost"}
        onClick={() => onChange("mr")}
      >
        {t("lang.marathi")}
      </Button>
    </div>
  );
}

export default function ReportsViewPage(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useLanguage();

  const [sessionReports, setSessionReports] = useState<GradingResult[]>([]);
  const [savedReports, setSavedReports] = useState<GradingResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedReport, setSelectedReport] = useState<GradingResult | null>(
    null,
  );
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [bulkDownloadBusy, setBulkDownloadBusy] = useState(false);
  const [planBusy, setPlanBusy] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planDays, setPlanDays] = useState(7);
  const [planMinutes, setPlanMinutes] = useState(40);
  const [generatedPlan, setGeneratedPlan] = useState<LearningPlan | null>(null);
  const [pdfLocale, setPdfLocale] = useState<Locale>(locale);
  const [hasAppliedQuerySelection, setHasAppliedQuerySelection] =
    useState(false);
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  const requestedAnalysisId = searchParams.get("analysisId");
  const requestedStudentId = searchParams.get("studentId");

  useEffect(() => {
    setPdfLocale(locale);
  }, [locale]);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(REPORTS_SESSION_KEY);
      if (!raw) {
        setSessionReports([]);
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        setSessionReports([]);
        return;
      }

      const safeReports = parsed.filter(isGradingResult);
      setSessionReports(safeReports);
    } catch (error) {
      console.error("Failed to read report session payload:", error);
      setSessionReports([]);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSavedHistory = async (): Promise<void> => {
      setLoadingHistory(true);
      try {
        const response = await getAllGradingHistory();
        if (!isMounted) {
          return;
        }

        if (response.success && Array.isArray(response.history)) {
          setSavedReports(response.history.filter(isGradingResult));
        }
      } catch (error) {
        console.error("Failed to load saved report history:", error);
      } finally {
        if (isMounted) {
          setLoadingHistory(false);
        }
      }
    };

    void loadSavedHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setGeneratedPlan(selectedReport?.learningPlan ?? null);
    setPlanError(null);
  }, [selectedReport]);

  const allReports = useMemo(() => {
    const merged = new Map<string, GradingResult>();

    for (const report of [...sessionReports, ...savedReports]) {
      merged.set(makeResultKey(report), report);
    }

    return [...merged.values()].toSorted(
      (first, second) =>
        new Date(second.date).getTime() - new Date(first.date).getTime(),
    );
  }, [savedReports, sessionReports]);

  const reportStats = useMemo(() => {
    const totalReports = allReports.length;
    const averageScore =
      totalReports === 0
        ? 0
        : Math.round(
            allReports.reduce((sum, report) => {
              return sum + getPercent(report.score, report.totalMarks);
            }, 0) / totalReports,
          );

    const passRate =
      totalReports === 0
        ? 0
        : Math.round(
            (allReports.filter((report) => {
              return getPercent(report.score, report.totalMarks) >= 40;
            }).length /
              totalReports) *
              100,
          );

    return {
      totalReports,
      averageScore,
      passRate,
    };
  }, [allReports]);

  const reportInsights = useMemo(() => {
    if (allReports.length === 0) {
      return null;
    }

    const topPerformer = allReports.reduce((best, current) => {
      const bestScore = getPercent(best.score, best.totalMarks);
      const currentScore = getPercent(current.score, current.totalMarks);
      return currentScore > bestScore ? current : best;
    }, allReports[0]);

    const needsAttention = allReports.filter((report) => {
      return getPercent(report.score, report.totalMarks) < 40;
    }).length;

    const weakConceptCount = allReports.reduce((sum, report) => {
      return sum + report.weakAreas.length;
    }, 0);

    return {
      topPerformer,
      topScore: getPercent(topPerformer.score, topPerformer.totalMarks),
      needsAttention,
      weakConceptCount,
      latestAssessment: formatDate(allReports[0].date),
    };
  }, [allReports]);

  const selectedReportSummary = useMemo(() => {
    if (!selectedReport) {
      return null;
    }

    let strong = 0;
    let weak = 0;

    for (const correction of selectedReport.corrections) {
      const bucket = getCorrectionBucket(
        correction.marksObtained,
        correction.maxMarks,
      );

      if (bucket === "strong") {
        strong += 1;
      } else if (bucket === "weak") {
        weak += 1;
      }
    }

    return {
      questions: selectedReport.corrections.length,
      strong,
      weak,
    };
  }, [selectedReport]);

  const fromScan = searchParams.get("source") === "scan";

  useEffect(() => {
    setHasAppliedQuerySelection(false);
  }, [requestedAnalysisId, requestedStudentId]);

  useEffect(() => {
    if (hasAppliedQuerySelection) {
      return;
    }

    if (!requestedAnalysisId && !requestedStudentId) {
      setHasAppliedQuerySelection(true);
      return;
    }

    const matchedReport = allReports.find((report) => {
      if (requestedAnalysisId && report.analysisId === requestedAnalysisId) {
        return true;
      }

      if (requestedStudentId && report.studentId === requestedStudentId) {
        return true;
      }

      return false;
    });

    if (matchedReport) {
      setSelectedReport(matchedReport);
      setHasAppliedQuerySelection(true);
      return;
    }

    if (!loadingHistory) {
      setHasAppliedQuerySelection(true);
    }
  }, [
    allReports,
    hasAppliedQuerySelection,
    loadingHistory,
    requestedAnalysisId,
    requestedStudentId,
  ]);

  const openStudentDetails = (studentId?: string): void => {
    if (!studentId) {
      return;
    }

    router.push(`/dashboard/students/${studentId}`);
  };

  const handleDownloadReport = async (): Promise<void> => {
    if (!selectedReport) return;
    setDownloadBusy(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/reports/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result: selectedReport, locale: pdfLocale }),
      });
      if (!response.ok) throw new Error("Failed to generate PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${
        selectedReport.studentName?.trim().replace(/\s+/g, "_") ||
        selectedReport.subject?.trim().replace(/\s+/g, "_") ||
        "student_report"
      }_${pdfLocale}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Report download failed:", error);
      alert("Report download failed");
    } finally {
      setDownloadBusy(false);
    }
  };

  const handleBulkDownload = async (): Promise<void> => {
    if (allReports.length === 0) return;
    setBulkDownloadBusy(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/reports/bulk-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results: allReports, locale: pdfLocale }),
      });
      if (!response.ok) throw new Error("Failed to generate bulk PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bulk_report_${allReports.length}_students_${pdfLocale}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Bulk download failed:", error);
      alert("Bulk download failed");
    } finally {
      setBulkDownloadBusy(false);
    }
  };

  const handleGeneratePlan = async (): Promise<void> => {
    if (!selectedReport) {
      return;
    }

    setPlanBusy(true);
    setPlanError(null);

    try {
      const plan = await generateLearningPlan(
        selectedReport,
        planDays,
        planMinutes,
        locale,
      );
      setGeneratedPlan(plan);

      const selectedAnalysisId = selectedReport.analysisId;

      if (selectedAnalysisId) {
        await saveLearningPlan(selectedAnalysisId, plan);
      }

      addNotification({
        id: `${selectedReport.studentName}-${Date.now()}`,
        title: `WorkHome ready for ${selectedReport.studentName}`,
        body: `A revision plan was generated for ${selectedReport.subject}.`,
        createdAt: new Date().toISOString(),
        actions: [
          {
            id: "workhome",
            label: "Open WorkHome",
            type: "redirect",
            style: "primary",
          },
        ],
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("scanner.error.generic");
      setPlanError(message);
    } finally {
      setPlanBusy(false);
    }
  };

  const handleClearImported = (): void => {
    window.sessionStorage.removeItem(REPORTS_SESSION_KEY);
    setSessionReports([]);
  };

  const handleSendToWorkHome = (): void => {
    if (!selectedReport) {
      return;
    }

    const payload = {
      report: selectedReport,
      plan: generatedPlan,
    };

    window.sessionStorage.setItem(
      WORKHOME_SESSION_KEY,
      JSON.stringify(payload),
    );
    router.push("/dashboard/homework");
  };

  const localeLabel = getLocaleLabel(pdfLocale, t);
  const selectedPercent = selectedReport
    ? getPercent(selectedReport.score, selectedReport.totalMarks)
    : 0;

  return (
    <PageContainer>
      <div className="space-y-5">
        <Breadcrumbs
          items={[
            { title: t("nav.dashboard"), link: "/dashboard/overview" },
            { title: t("nav.history"), link: "/dashboard/reports" },
          ]}
        />
        <Heading
          title={t("reports.pageTitle")}
          description={t("reports.pageSubtitle")}
        />
        <Separator />

        {selectedReport ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" onClick={() => setSelectedReport(null)}>
                <IconArrowLeft className="mr-2 h-4 w-4" />
                {t("reports.detail.allReports")}
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <PdfLanguagePicker
                  value={pdfLocale}
                  onChange={setPdfLocale}
                  t={t}
                />
                {selectedReport.studentId ? (
                  <Button
                    variant="outline"
                    onClick={() => openStudentDetails(selectedReport.studentId)}
                  >
                    <IconUser className="mr-2 h-4 w-4" />
                    {t("reports.openStudentDetail")}
                  </Button>
                ) : null}
                <Button variant="outline" onClick={handleSendToWorkHome}>
                  <IconSparkles className="mr-2 h-4 w-4" />
                  Send to WorkHome
                </Button>
                <Button onClick={handleDownloadReport} disabled={downloadBusy}>
                  {downloadBusy ? (
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <IconDownload className="mr-2 h-4 w-4" />
                  )}
                  {downloadBusy
                    ? t("reports.detail.downloading")
                    : `${t("reports.detail.download")} - ${localeLabel}`}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <IconFileAnalytics className="h-6 w-6 text-primary" />
                    <span className="truncate">
                      {selectedReport.studentName}
                    </span>
                  </CardTitle>
                  <CardDescription>{t("reports.detail.title")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{selectedReport.subject}</Badge>
                    {selectedReport.className ? (
                      <Badge variant="outline">
                        {selectedReport.className}
                      </Badge>
                    ) : null}
                    <Badge variant="outline">
                      {formatDate(selectedReport.date)}
                    </Badge>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {selectedReport.feedback}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("reports.detail.overallScore")}</CardTitle>
                  <CardDescription>{t("reports.detail.marks")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={cn(
                      "text-4xl font-black",
                      getScoreToneClass(selectedPercent),
                    )}
                  >
                    {selectedPercent}%
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {selectedReport.score}/{selectedReport.totalMarks}{" "}
                    {t("reports.detail.marks")}
                  </p>
                </CardContent>
              </Card>
            </div>

            {selectedReportSummary ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="space-y-1 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("reports.detail.questions")}
                    </p>
                    <p className="text-2xl font-black text-foreground">
                      {selectedReportSummary.questions}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="space-y-1 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("reports.detail.strengths")}
                    </p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {selectedReportSummary.strong}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="space-y-1 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("reports.detail.weakAreas")}
                    </p>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                      {selectedReportSummary.weak}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle>{t("scanner.questionBreakdown")}</CardTitle>
                <CardDescription>
                  {t("reports.detail.aiFeedback")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedReport.corrections.map((correction, index) => (
                  <div
                    key={`${correction.questionNo}-${index}`}
                    className="rounded-xl border border-border/70 bg-muted/30 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-semibold text-foreground">
                        Q{correction.questionNo}: {correction.questionText}
                      </p>
                      <Badge variant="outline">
                        {correction.marksObtained}/{correction.maxMarks}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {correction.analysis}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTargetArrow className="h-5 w-5 text-primary" />
                  {t("profile.learningPlan")}
                </CardTitle>
                <CardDescription>{t("reports.plan.empty")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("profile.days")}
                    </span>
                    <Input
                      type="number"
                      min={3}
                      max={30}
                      value={planDays}
                      onChange={(event) => {
                        setPlanDays(
                          sanitizePlanValue(Number(event.target.value), 3, 30),
                        );
                      }}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("profile.minutes")}
                    </span>
                    <Input
                      type="number"
                      min={10}
                      max={240}
                      value={planMinutes}
                      onChange={(event) => {
                        setPlanMinutes(
                          sanitizePlanValue(
                            Number(event.target.value),
                            10,
                            240,
                          ),
                        );
                      }}
                    />
                  </label>
                  <div className="flex items-end">
                    <Button onClick={handleGeneratePlan} disabled={planBusy}>
                      {planBusy ? (
                        <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <IconSparkles className="mr-2 h-4 w-4" />
                      )}
                      {planBusy
                        ? t("profile.generating")
                        : t("profile.generatePlan")}
                    </Button>
                  </div>
                </div>

                {planError ? (
                  <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {planError}
                  </p>
                ) : null}

                {generatedPlan ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Card>
                        <CardContent className="space-y-1 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {t("reports.plan.timeline")}
                          </p>
                          <p className="text-sm font-bold text-foreground">
                            {generatedPlan.timeline}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="space-y-1 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {t("reports.plan.dailyTime")}
                          </p>
                          <p className="text-sm font-bold text-foreground">
                            {generatedPlan.dailyTime}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="space-y-1 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {t("reports.plan.assistLabel")}
                          </p>
                          <p className="text-sm font-bold text-foreground">
                            {generatedPlan.needsTeacherAssistance
                              ? t("reports.boolean.yes")
                              : t("reports.boolean.no")}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {generatedPlan.activities.map((activity) => (
                      <div
                        key={`${activity.day}-${activity.title}`}
                        className="rounded-xl border border-border/70 bg-muted/20 p-4"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                          {t("reports.plan.activityDay")} {activity.day}
                        </p>
                        <h3 className="mt-1 text-base font-bold text-foreground">
                          {activity.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {t("reports.plan.activityNeed")}:
                          </span>{" "}
                          {activity.whatIsNeeded}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {t("reports.plan.activityHow")}:
                          </span>{" "}
                          {activity.howToDo}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {t("reports.plan.activityGuidelines")}:
                          </span>{" "}
                          {activity.guidelines}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
                    {t("reports.plan.empty")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-5">
            <Card className="overflow-hidden border-border/70 bg-linear-to-r from-primary/15 via-background to-secondary/35">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-2xl space-y-3">
                    <Badge variant="secondary" className="w-fit">
                      {t("reports.badge")}
                    </Badge>
                    <h2 className="text-2xl font-black leading-tight tracking-tight md:text-3xl">
                      {t("reports.heading")}
                    </h2>
                    <p className="text-sm text-muted-foreground md:text-base">
                      {t("reports.subheading")}
                    </p>
                    {fromScan && sessionReports.length > 0 ? (
                      <Badge variant="outline" className="mt-1">
                        {t("reports.sourceImported")}
                      </Badge>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {t("reports.exportHint")} <strong>{localeLabel}</strong>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <PdfLanguagePicker
                      value={pdfLocale}
                      onChange={setPdfLocale}
                      t={t}
                    />
                    <Button onClick={() => router.push("/dashboard/scan")}>
                      <IconRocket className="mr-2 h-4 w-4" />
                      {t("reports.openScanWorkspace")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardContent className="space-y-1 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("reports.assessments")}
                  </p>
                  <p className="text-3xl font-black text-foreground">
                    {reportStats.totalReports}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-1 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("reports.avgScore")}
                  </p>
                  <p className="text-3xl font-black text-primary">
                    {reportStats.averageScore}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-1 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("reports.passRate")}
                  </p>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {reportStats.passRate}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-1 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("reports.topPerformer")}
                  </p>
                  <p className="truncate text-base font-bold text-foreground">
                    {reportInsights?.topPerformer.studentName ?? "--"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {reportInsights ? `${reportInsights.topScore}%` : "--"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {reportInsights ? (
              <Card className="border-dashed">
                <CardContent className="grid gap-4 p-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("reports.needsAttention")}
                    </p>
                    <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                      {reportInsights.needsAttention}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("reports.weakConceptCount")}
                    </p>
                    <p className="text-2xl font-black text-foreground">
                      {reportInsights.weakConceptCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("reports.latestAssessment")}
                    </p>
                    <p className="text-base font-bold text-foreground">
                      {reportInsights.latestAssessment}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <CardTitle>{t("reports.reportHistory")}</CardTitle>
                  <CardDescription>{t("reports.exportHint")}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={handleBulkDownload}
                    disabled={allReports.length === 0 || bulkDownloadBusy}
                  >
                    {bulkDownloadBusy ? (
                      <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <IconDownload className="mr-2 h-4 w-4" />
                    )}
                    {`${t("reports.downloadBulk")} - ${localeLabel}`}
                  </Button>
                  {sessionReports.length > 0 ? (
                    <Button variant="ghost" onClick={handleClearImported}>
                      {t("reports.clearImported")}
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("reports.loadingHistory")}
                  </div>
                ) : allReports.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
                    <p className="text-lg font-semibold text-foreground">
                      {t("reports.noDataTitle")}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("reports.noDataSubtitle")}
                    </p>
                    <Button
                      className="mt-5"
                      onClick={() => router.push("/dashboard/scan")}
                    >
                      <IconRocket className="mr-2 h-4 w-4" />
                      {t("reports.openScanWorkspace")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allReports.map((report, index) => {
                      const percent = getPercent(
                        report.score,
                        report.totalMarks,
                      );

                      return (
                        <div
                          key={`${makeResultKey(report)}-${index}`}
                          className="rounded-xl border border-border/70 bg-card/50 p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="min-w-0 flex-1 space-y-2">
                              <p className="truncate text-base font-bold text-foreground">
                                {report.studentName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {report.subject} - {formatDate(report.date)}
                              </p>
                              <Progress value={percent} className="h-2" />
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-bold">
                                {report.score}/{report.totalMarks} ({percent}%)
                              </Badge>
                              <Badge variant="secondary">
                                {t("reports.weakConceptCount")}:{" "}
                                {report.weakAreas.length}
                              </Badge>
                              {report.studentId ? (
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    openStudentDetails(report.studentId)
                                  }
                                >
                                  {t("reports.openStudentDetail")}
                                </Button>
                              ) : null}
                              <Button
                                variant="outline"
                                onClick={() => setSelectedReport(report)}
                              >
                                {t("reports.viewDetail")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
