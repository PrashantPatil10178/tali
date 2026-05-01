"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconSparkles,
  IconTargetArrow,
  IconEdit,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
  IconBulb,
  IconCalendar,
  IconClock,
  IconBook2,
  IconTrophy,
  IconLoader2,
  IconAlertCircle,
} from "@tabler/icons-react";
import { generateLearningPlan, saveLearningPlan } from "@tali/gemini/client";
import type { GradingResult, LearningPlan } from "@tali/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import PageContainer from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/lib/LanguageContext";
import { useNotificationStore } from "@/features/notifications/utils/store";

interface WorkHomePayload {
  report: (GradingResult & { analysisId?: string }) | null;
  plan: LearningPlan | null;
}

interface ActivityEdit {
  whatIsNeeded: string;
  howToDo: string;
  guidelines: string;
}

const WORKHOME_SESSION_KEY = "tali_workhome_session_payload";

const sanitizePlanValue = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
};

const getScorePercent = (score: number, total: number) =>
  total > 0 ? Math.round((score / total) * 100) : 0;

const getScoreColor = (pct: number) => {
  if (pct >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
};

const getScoreRingColor = (pct: number) => {
  if (pct >= 75) return "stroke-emerald-500";
  if (pct >= 50) return "stroke-amber-500";
  return "stroke-rose-500";
};

// Circular progress ring component
function ScoreRing({ score, total }: { score: number; total: number }) {
  const pct = getScorePercent(score, total);
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center w-24 h-24">
      <svg className="absolute inset-0 -rotate-90 w-24 h-24">
        <circle cx="48" cy="48" r={r} fill="none" stroke="currentColor"
          className="text-border" strokeWidth="6" />
        <circle cx="48" cy="48" r={r} fill="none" strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${getScoreRingColor(pct)}`} />
      </svg>
      <div className="flex flex-col items-center leading-none">
        <span className={`text-xl font-black ${getScoreColor(pct)}`}>{pct}%</span>
        <span className="text-[10px] text-muted-foreground font-semibold">{score}/{total}</span>
      </div>
    </div>
  );
}

export default function HomeworkViewPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [payload, setPayload] = useState<WorkHomePayload>({ report: null, plan: null });
  const [planDays, setPlanDays] = useState(7);
  const [planMinutes, setPlanMinutes] = useState(40);
  const [teacherPrompt, setTeacherPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<LearningPlan | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set([0]));
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [edits, setEdits] = useState<ActivityEdit>({ whatIsNeeded: "", howToDo: "", guidelines: "" });
  const [localActivities, setLocalActivities] = useState<LearningPlan["activities"]>([]);
  const planRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(WORKHOME_SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as WorkHomePayload;
      setPayload(parsed);
      if (parsed.plan) {
        setGeneratedPlan(parsed.plan);
        setLocalActivities(parsed.plan.activities);
      }
    } catch (e) {
      console.error("Failed to load workhome payload:", e);
    }
  }, []);

  const report = payload.report;
  const weakAreas = useMemo(() =>
    report?.weakAreas ?? generatedPlan?.weakAreas ?? [], [generatedPlan?.weakAreas, report?.weakAreas]);

  const breadcrumbItems = [
    { title: t("nav.dashboard"), link: "/dashboard/overview" },
    { title: t("nav.homework"), link: "/dashboard/homework" },
  ];

  const handleGenerate = async (isRegen = false): Promise<void> => {
    if (!report) { setError(t("workhome.errorNoReport")); return; }
    setIsGenerating(true);
    setError(null);
    try {
      const plan = await generateLearningPlan(report, planDays, planMinutes, locale, teacherPrompt || undefined);
      setGeneratedPlan(plan);
      setLocalActivities(plan.activities);
      setExpandedCards(new Set([0]));

      if (report.analysisId) await saveLearningPlan(report.analysisId, plan);

      window.sessionStorage.setItem(WORKHOME_SESSION_KEY, JSON.stringify({ report, plan }));

      addNotification({
        id: `${report.studentName}-${Date.now()}`,
        title: `WorkHome ${isRegen ? "regenerated" : "generated"} for ${report.studentName || report.subject}`,
        body: `Revision tasks are ready for ${report.subject}.`,
        createdAt: new Date().toISOString(),
        actions: [{ id: "workhome", label: "Open WorkHome", type: "redirect", style: "primary" }],
      });

      // Scroll to plan
      setTimeout(() => planRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    } catch (err) {
      console.error("Failed to generate WorkHome:", err);
      setError(err instanceof Error ? err.message : "Failed to generate WorkHome");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleCard = (day: number) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      next.has(day) ? next.delete(day) : next.add(day);
      return next;
    });
  };

  const startEdit = (day: number, activity: LearningPlan["activities"][0]) => {
    setEditingDay(day);
    setEdits({ whatIsNeeded: activity.whatIsNeeded, howToDo: activity.howToDo, guidelines: activity.guidelines });
  };

  const saveEdit = (day: number) => {
    setLocalActivities((prev) => prev.map((a) => a.day === day ? { ...a, ...edits } : a));
    setEditingDay(null);
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <Heading title={t("homework.pageTitle")} description={t("homework.pageSubtitle")} />
          <Button variant="outline" onClick={() => router.push("/dashboard/reports")}>
            <IconArrowLeft className="mr-2 h-4 w-4" />
            {t("workhome.backToReports")}
          </Button>
        </div>

        <Separator />

        {/* Empty state */}
        {!report ? (
          <Card className="overflow-hidden border-dashed border-2 border-primary/20">
            <CardContent className="flex flex-col items-center space-y-5 p-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-4 ring-primary/10">
                <IconBulb className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h2 className="text-2xl font-black tracking-tight">{t("workhome.openReport")}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{t("workhome.openReportSub")}</p>
              </div>
              <Button onClick={() => router.push("/dashboard/reports")} className="rounded-full px-6">
                {t("workhome.goToReports")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ── Student Profile Hero ── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-primary to-teal-600 text-white p-6 sm:p-8 shadow-lg">
              <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: "radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
              <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                <div className="flex items-center gap-5">
                  <ScoreRing score={report.score} total={report.totalMarks} />
                  <div>
                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">WorkHome Plan</p>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow">
                      {report.studentName || report.subject}
                    </h1>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {report.subject && (
                        <span className="flex items-center gap-1 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                          <IconBook2 className="h-3 w-3" />{report.subject}
                        </span>
                      )}
                      {report.className && (
                        <span className="flex items-center gap-1 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                          <IconTrophy className="h-3 w-3" />{report.className}
                        </span>
                      )}
                      {report.rollNumber && (
                        <span className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                          #{report.rollNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 sm:flex-col sm:gap-2 sm:items-end text-right">
                  <div className="bg-black/15 rounded-xl px-4 py-2.5 text-center min-w-[80px]">
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Weak Areas</p>
                    <p className="text-2xl font-black text-amber-300">{weakAreas.length}</p>
                  </div>
                  <div className="bg-black/15 rounded-xl px-4 py-2.5 text-center min-w-[80px]">
                    <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Questions</p>
                    <p className="text-2xl font-black">{report.corrections.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Weak Areas pills ── */}
            {weakAreas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {weakAreas.map((area, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 shadow-sm">
                    {area}
                  </span>
                ))}
              </div>
            )}

            {/* ── Generate / Configure Card ── */}
            <Card className="border-border/70 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 via-background to-background px-6 py-5 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-xl p-2 text-primary">
                    <IconTargetArrow className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground tracking-tight">
                      {generatedPlan ? t("workhome.regenerate") : t("workhome.generateTitle")}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("workhome.generateSub")}</p>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-5">
                {/* Duration + Time row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <IconCalendar className="h-3.5 w-3.5" />
                      {t("workhome.days")}
                    </span>
                    <Input
                      type="number" min={3} max={30} value={planDays}
                      onChange={(e) => setPlanDays(sanitizePlanValue(Number(e.target.value), 3, 30))}
                      className="font-semibold h-10"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <IconClock className="h-3.5 w-3.5" />
                      {t("workhome.minutesPerDay")}
                    </span>
                    <Input
                      type="number" min={10} max={240} value={planMinutes}
                      onChange={(e) => setPlanMinutes(sanitizePlanValue(Number(e.target.value), 10, 240))}
                      className="font-semibold h-10"
                    />
                  </label>
                </div>

                {/* Teacher prompt box */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <IconBulb className="h-3.5 w-3.5 text-amber-500" />
                    {t("workhome.teacherPromptLabel")}
                  </label>
                  <textarea
                    value={teacherPrompt}
                    onChange={(e) => setTeacherPrompt(e.target.value)}
                    placeholder={t("workhome.teacherPromptPlaceholder")}
                    rows={3}
                    className="w-full resize-none rounded-xl border border-border bg-background/70 px-4 py-3 text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all shadow-sm"
                  />
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <IconSparkles className="h-3 w-3 text-primary/50" />
                    {t("workhome.teacherPromptHint")}
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                    <IconAlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Generate button */}
                <Button
                  onClick={() => handleGenerate(!!generatedPlan)}
                  disabled={isGenerating}
                  className="w-full h-11 font-bold text-sm rounded-xl shadow-md"
                >
                  {isGenerating ? (
                    <>
                      <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                      {generatedPlan ? t("workhome.regenerating") : t("workhome.generating")}
                    </>
                  ) : generatedPlan ? (
                    <>
                      <IconRefresh className="mr-2 h-4 w-4" />
                      {t("workhome.regenerate")}
                    </>
                  ) : (
                    <>
                      <IconSparkles className="mr-2 h-4 w-4" />
                      {t("workhome.generate")}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* ── Generated Plan Section ── */}
            {generatedPlan && (
              <div ref={planRef} className="space-y-5">
                {/* Plan header */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                        <IconCheck className="h-4 w-4" />
                      </span>
                      {t("workhome.planReady")}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{t("workhome.planReadySub")}</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline" className="rounded-full gap-1.5 font-semibold">
                      <IconCalendar className="h-3 w-3" />
                      {generatedPlan.timeline}
                    </Badge>
                    <Badge variant="outline" className="rounded-full gap-1.5 font-semibold">
                      <IconClock className="h-3 w-3" />
                      {generatedPlan.dailyTime}
                    </Badge>
                    {generatedPlan.needsTeacherAssistance && (
                      <Badge className="rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700/40 font-semibold">
                        👩‍🏫 {t("workhome.needsHelp.yes")}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Activity cards */}
                <div className="space-y-3">
                  {localActivities.map((activity, idx) => {
                    const isExpanded = expandedCards.has(activity.day);
                    const isEditing = editingDay === activity.day;
                    const totalDays = localActivities.length;
                    const progress = Math.round((activity.day / totalDays) * 100);

                    return (
                      <Card
                        key={activity.day}
                        className={`overflow-hidden border transition-all duration-200 ${isExpanded ? "border-primary/30 shadow-md" : "border-border hover:border-primary/20 hover:shadow-sm"}`}
                      >
                        {/* Card header — always visible, clickable */}
                        <button
                          className="w-full text-left px-5 py-4 flex items-center gap-4 group cursor-pointer"
                          onClick={() => !isEditing && toggleCard(activity.day)}
                          aria-expanded={isExpanded}
                        >
                          {/* Day badge */}
                          <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-sm font-black shadow-sm transition-colors ${isExpanded ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary/20"}`}>
                            {activity.day}
                          </div>

                          {/* Title + progress */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground text-sm truncate">{activity.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary/40 transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground font-semibold shrink-0">
                                Day {activity.day}/{totalDays}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {!isEditing && (
                              <button
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                onClick={(e) => { e.stopPropagation(); startEdit(activity.day, activity); }}
                                aria-label={t("workhome.editActivity")}
                              >
                                <IconEdit className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {isExpanded
                              ? <IconChevronUp className="h-4 w-4 text-muted-foreground" />
                              : <IconChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />}
                          </div>
                        </button>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="px-5 pb-5 space-y-4 border-t border-border/50">
                            {isEditing ? (
                              /* Edit mode */
                              <div className="pt-4 space-y-3">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("workhome.needLabel")}</label>
                                  <textarea
                                    className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    rows={2}
                                    value={edits.whatIsNeeded}
                                    onChange={(e) => setEdits((p) => ({ ...p, whatIsNeeded: e.target.value }))}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("workhome.howLabel")}</label>
                                  <textarea
                                    className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    rows={3}
                                    value={edits.howToDo}
                                    onChange={(e) => setEdits((p) => ({ ...p, howToDo: e.target.value }))}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("workhome.guidelinesLabel")}</label>
                                  <textarea
                                    className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    rows={2}
                                    value={edits.guidelines}
                                    onChange={(e) => setEdits((p) => ({ ...p, guidelines: e.target.value }))}
                                  />
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <Button size="sm" onClick={() => saveEdit(activity.day)} className="rounded-lg gap-1.5">
                                    <IconCheck className="h-3.5 w-3.5" />{t("workhome.saveEdit")}
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingDay(null)} className="rounded-lg gap-1.5">
                                    <IconX className="h-3.5 w-3.5" />{t("workhome.cancelEdit")}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              /* View mode */
                              <div className="pt-4 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-3.5">
                                  <p className="text-[10px] font-black uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80 mb-1.5">{t("workhome.needLabel")}</p>
                                  <p className="text-sm text-blue-900 dark:text-blue-100 font-medium leading-relaxed">{activity.whatIsNeeded}</p>
                                </div>
                                <div className="rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 p-3.5">
                                  <p className="text-[10px] font-black uppercase tracking-wider text-violet-600/80 dark:text-violet-400/80 mb-1.5">{t("workhome.howLabel")}</p>
                                  <p className="text-sm text-violet-900 dark:text-violet-100 font-medium leading-relaxed">{activity.howToDo}</p>
                                </div>
                                <div className="rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-3.5">
                                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-600/80 dark:text-amber-400/80 mb-1.5">{t("workhome.guidelinesLabel")}</p>
                                  <p className="text-sm text-amber-900 dark:text-amber-100 font-medium leading-relaxed">{activity.guidelines}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}
