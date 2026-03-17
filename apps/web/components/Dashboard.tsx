import React, { useMemo } from "react";
import { GradingResult } from "@tali/types";
import { useLanguage } from "@/lib/LanguageContext";

interface DashboardProps {
  readonly history: GradingResult[];
}

const FALLBACK_SUBJECTS = [
  { subject: "Math", average: 72 },
  { subject: "Sci", average: 84 },
  { subject: "Eng", average: 78 },
  { subject: "Mar", average: 91 },
  { subject: "Hist", average: 88 },
] as const;

const FALLBACK_ATTENTION_KEYS = [
  { name: "Arjun Sharma", detailKey: "dashboard.fallback.attention1", severityKey: "dashboard.fallback.severity.critical", tone: "critical" },
  { name: "Priya Patil",  detailKey: "dashboard.fallback.attention2", severityKey: "dashboard.fallback.severity.review",   tone: "review" },
  { name: "Rohan Deshmukh", detailKey: "dashboard.fallback.attention3", severityKey: "dashboard.fallback.severity.review", tone: "review" },
] as const;

const WEEKLY_ACTIVITY = [18, 36, 58, 46, 74] as const;

const SCORE_BUCKETS = [
  { label: "0-20", min: 0, max: 20, tone: "danger" },
  { label: "21-40", min: 21, max: 40, tone: "warning" },
  { label: "41-60", min: 41, max: 60, tone: "primary" },
  { label: "61-80", min: 61, max: 80, tone: "success-soft" },
  { label: "81-100", min: 81, max: 100, tone: "success" },
] as const;

const buildSubjectCurve = (values: readonly number[]): string => {
  if (values.length === 0) {
    return "M0 70 L400 70";
  }

  const width = 400;
  const height = 100;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => ({
    x: index * step,
    y: height - value,
  }));

  let path = `M${points[0]?.x ?? 0},${points[0]?.y ?? 0}`;

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    path += ` Q${controlX},${previous.y} ${point.x},${point.y}`;
  }

  return path;
};

const getInitials = (value: string): string =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export default function Dashboard({
  history,
}: DashboardProps): React.JSX.Element {
  const { t } = useLanguage();
  const computed = useMemo(() => {
    const normalizedScores = history.map((result) =>
      Math.round((result.score / result.totalMarks) * 100),
    );

    const averageScore = normalizedScores.length
      ? Math.round(
          normalizedScores.reduce((sum, value) => sum + value, 0) /
            normalizedScores.length,
        )
      : 78;

    const highPerformers = normalizedScores.filter(
      (score) => score >= 81,
    ).length;
    const moderatePerformers = normalizedScores.filter(
      (score) => score >= 41 && score <= 80,
    ).length;
    const needsHelp = normalizedScores.filter((score) => score <= 40).length;

    const scoreDistribution = SCORE_BUCKETS.map((bucket) => {
      const count = normalizedScores.filter(
        (score) => score >= bucket.min && score <= bucket.max,
      ).length;

      return {
        ...bucket,
        count,
        height:
          normalizedScores.length > 0
            ? Math.max(16, Math.round((count / normalizedScores.length) * 100))
            : bucket.label === "61-80"
              ? 90
              : bucket.label === "41-60"
                ? 65
                : bucket.label === "81-100"
                  ? 50
                  : bucket.label === "21-40"
                    ? 35
                    : 15,
      };
    });

    const subjectMap = new Map<string, { total: number; count: number }>();

    history.forEach((result) => {
      const current = subjectMap.get(result.subject) || { total: 0, count: 0 };
      subjectMap.set(result.subject, {
        total: current.total + (result.score / result.totalMarks) * 100,
        count: current.count + 1,
      });
    });

    const derivedSubjects = Array.from(subjectMap.entries())
      .map(([subject, value]) => ({
        subject: subject.slice(0, 4),
        average: Math.round(value.total / value.count),
      }))
      .slice(0, 5);

    const subjectComparison =
      derivedSubjects.length > 0 ? derivedSubjects : [...FALLBACK_SUBJECTS];

    const attentionItems = history
      .slice()
      .sort(
        (left, right) =>
          left.score / left.totalMarks - right.score / right.totalMarks,
      )
      .slice(0, 3)
      .map((result) => {
        const percentage = Math.round((result.score / result.totalMarks) * 100);
        const tone = percentage <= 40 ? "critical" : "review";

        return {
          name: result.studentName,
          detail:
            result.weakAreas.length > 0
              ? `${result.subject}: focus on ${result.weakAreas[0]}`
              : `${result.subject}: scored ${percentage}% in the latest evaluation`,
          severity: tone === "critical" ? "Critical" : "Review",
          tone,
        };
      });

    return {
      averageScore,
      highPerformers,
      moderatePerformers,
      needsHelp,
      totalAssessed: history.length,
      scoreDistribution,
      subjectComparison,
      attentionItems:
        attentionItems.length > 0 ? attentionItems : FALLBACK_ATTENTION_KEYS.map((item) => ({
          name: item.name,
          detail: t(item.detailKey),
          severity: t(item.severityKey),
          tone: item.tone,
        })),
      subjectCurve: buildSubjectCurve(
        subjectComparison.map((subject) => subject.average),
      ),
    };
  }, [history, t]);

  return (
    <div className="space-y-8 pb-8 animate-in fade-in duration-500">
      <section className="dashboard-hero-panel">
        <div className="relative z-10 flex flex-1 flex-col justify-center">
          <span className="dashboard-hero-badge">{t("dashboard.badge")}</span>
          <h1 className="mt-6 max-w-2xl font-display text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl xl:text-6xl dark:text-white">
            {t("dashboard.hero.heading")}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
            {t("dashboard.hero.subheading")}
          </p>

          <div className="mt-8 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="dashboard-hero-metric">
              <span className="dashboard-hero-metric-value">24/7</span>
              <span className="dashboard-hero-metric-label">
                {t("dashboard.hero.insightSupport")}
              </span>
            </div>
            <div className="dashboard-hero-metric">
              <span className="dashboard-hero-metric-value">
                {computed.totalAssessed || 34}
              </span>
              <span className="dashboard-hero-metric-label">
                {t("dashboard.hero.assessmentsTracked")}
              </span>
            </div>
            <div className="dashboard-hero-metric">
              <span className="dashboard-hero-metric-value">
                {computed.averageScore}%
              </span>
              <span className="dashboard-hero-metric-label">{t("dashboard.hero.classAverage")}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-hero-sidecard">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-200/90">
                {t("dashboard.hero.weeklyMomentum")}
              </p>
              <p className="mt-2 font-display text-3xl font-extrabold text-white">
                +12%
              </p>
            </div>
            <div className="rounded-2xl bg-white/12 p-3 text-white backdrop-blur-sm">
              <svg
                aria-hidden="true"
                className="size-7"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 16 9 11l4 4 7-8"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>

          <div className="mt-8 flex h-36 items-end gap-2">
            {WEEKLY_ACTIVITY.map((value, index) => (
              <div
                className="flex flex-1 flex-col items-center gap-2"
                key={`${value}-${index}`}
              >
                <div
                  className="w-full rounded-t-2xl bg-white/10"
                  style={{ height: `${Math.max(value, 12)}%` }}
                />
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
            <div className="mb-3 flex gap-1 text-amber-300">
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
            </div>
            <p className="text-sm leading-7 text-indigo-50/90">
              {t("dashboard.hero.testimonial")}
            </p>
            <p className="mt-4 text-sm font-semibold text-white">
              {t("dashboard.hero.testimonialAuthor")}
            </p>
          </div>
        </div>

        <div className="dashboard-hero-glow-left" />
        <div className="dashboard-hero-glow-right" />
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="dashboard-summary-card border-emerald-400/60 bg-emerald-500/8">
          <div className="flex items-start justify-between gap-4">
            <div className="dashboard-summary-icon bg-emerald-500/15 text-emerald-600">
              <svg
                aria-hidden="true"
                className="size-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 12.5 9 16l10-10"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                />
              </svg>
            </div>
            <span className="dashboard-summary-pill bg-emerald-500/14 text-emerald-700">
              +12%
            </span>
          </div>
          <h3 className="mt-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t("dashboard.highPerformance")}
          </h3>
          <p className="mt-2 font-display text-4xl font-extrabold text-slate-950 dark:text-white">
            {computed.highPerformers > 0 ? computed.highPerformers : 34}
          </p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            {t("dashboard.studentsExcelling")}
          </p>
        </div>

        <div className="dashboard-summary-card border-amber-400/60 bg-amber-500/8">
          <div className="flex items-start justify-between gap-4">
            <div className="dashboard-summary-icon bg-amber-500/15 text-amber-600">
              <svg
                aria-hidden="true"
                className="size-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 4v16m8-8H4"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  opacity="0.25"
                />
                <circle cx="12" cy="12" fill="currentColor" r="3" />
              </svg>
            </div>
            <span className="dashboard-summary-pill bg-amber-500/14 text-amber-700">
              -2%
            </span>
          </div>
          <h3 className="mt-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t("dashboard.moderateProgress")}
          </h3>
          <p className="mt-2 font-display text-4xl font-extrabold text-slate-950 dark:text-white">
            {computed.moderatePerformers > 0 ? computed.moderatePerformers : 12}
          </p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            {t("dashboard.studentsHolding")}
          </p>
        </div>

        <div className="dashboard-summary-card border-rose-400/60 bg-rose-500/8">
          <div className="flex items-start justify-between gap-4">
            <div className="dashboard-summary-icon bg-rose-500/15 text-rose-600">
              <svg
                aria-hidden="true"
                className="size-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 8v5m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <span className="dashboard-summary-pill bg-rose-500/14 text-rose-700">
              +5%
            </span>
          </div>
          <h3 className="mt-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
            {t("dashboard.needsHelp")}
          </h3>
          <p className="mt-2 font-display text-4xl font-extrabold text-slate-950 dark:text-white">
            {computed.needsHelp > 0 ? computed.needsHelp : 4}
          </p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            {t("dashboard.studentsNeedingAttention")}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <div className="dashboard-surface-card p-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
                {t("dashboard.scoreDistribution")}
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t("dashboard.classPerformanceAvg")}
              </p>
            </div>
            <div className="text-right">
              <span className="font-display text-3xl font-extrabold text-(--color-primary)">
                {computed.averageScore}%
              </span>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                {t("dashboard.avgScore")}
              </p>
            </div>
          </div>

          <div className="flex h-56 items-end justify-between gap-4 px-2">
            {computed.scoreDistribution.map((bucket) => (
              <div
                className="group flex flex-1 flex-col items-center gap-3"
                key={bucket.label}
              >
                <div className="relative flex h-full w-full items-end overflow-hidden rounded-t-[18px] bg-slate-100 dark:bg-slate-800/80">
                  <div
                    className={`dashboard-bar-fill dashboard-bar-${bucket.tone}`}
                    style={{ height: `${bucket.height}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {bucket.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-surface-card p-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
                {t("dashboard.subjectComparison")}
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t("dashboard.weeklyTrend")}
              </p>
            </div>
            <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {t("dashboard.term1")}
            </div>
          </div>

          <div className="relative h-56 w-full">
            <svg
              className="h-full w-full"
              preserveAspectRatio="none"
              viewBox="0 0 400 100"
            >
              <defs>
                <linearGradient
                  id="dashboardChartGradient"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`${computed.subjectCurve} L400,100 L0,100 Z`}
                fill="url(#dashboardChartGradient)"
              />
              <path
                d={computed.subjectCurve}
                fill="none"
                stroke="#4F46E5"
                strokeWidth="3"
              />
              {computed.subjectComparison.map((subject, index) => {
                const step =
                  computed.subjectComparison.length > 1
                    ? 400 / (computed.subjectComparison.length - 1)
                    : 400;
                const x = index * step;
                const y = 100 - subject.average;

                return (
                  <circle
                    cx={x}
                    cy={y}
                    fill="#4F46E5"
                    key={subject.subject}
                    r="4"
                  />
                );
              })}
            </svg>

            <div className="mt-4 flex justify-between gap-3">
              {computed.subjectComparison.map((subject) => (
                <div className="min-w-0 text-center" key={subject.subject}>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {subject.subject}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                    {subject.average}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-surface-card overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
              {t("dashboard.attentionRequired")}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("dashboard.attentionSubtitle")}
            </p>
          </div>
          <button
            className="text-sm font-bold text-(--color-primary)"
            type="button"
          >
            {t("dashboard.viewAllStudents")}
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {computed.attentionItems.map((item) => (
            <div
              className="flex flex-col gap-4 px-6 py-4 transition-colors hover:bg-slate-50/80 md:flex-row md:items-center md:justify-between dark:hover:bg-slate-900/50"
              key={`${item.name}-${item.detail}`}
            >
              <div className="flex items-center gap-4">
                <div className="dashboard-student-avatar">
                  {getInitials(item.name)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.detail}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`dashboard-alert-pill ${item.tone === "critical" ? "dashboard-alert-pill-critical" : "dashboard-alert-pill-review"}`}
                >
                  {item.severity}
                </span>
                <button
                  aria-label={`Contact ${item.name}`}
                  className="dashboard-icon-button"
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    className="size-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M4 6h16v12H4V6Zm2 2 6 4 6-4"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
