"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconSparkles,
  IconTargetArrow,
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

const WORKHOME_SESSION_KEY = "tali_workhome_session_payload";

const sanitizePlanValue = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
};

export default function HomeworkViewPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  const [payload, setPayload] = useState<WorkHomePayload>({
    report: null,
    plan: null,
  });
  const [planDays, setPlanDays] = useState(7);
  const [planMinutes, setPlanMinutes] = useState(40);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<LearningPlan | null>(null);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(WORKHOME_SESSION_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as WorkHomePayload;
      setPayload(parsed);
      setGeneratedPlan(parsed.plan);
    } catch (readError) {
      console.error("Failed to load workhome payload:", readError);
    }
  }, []);

  const report = payload.report;
  const breadcrumbItems = [
    { title: t("nav.dashboard"), link: "/dashboard/overview" },
    { title: t("nav.homework"), link: "/dashboard/homework" },
  ];

  const weakAreas = useMemo(() => {
    return report?.weakAreas ?? generatedPlan?.weakAreas ?? [];
  }, [generatedPlan?.weakAreas, report?.weakAreas]);

  const handleGenerate = async (): Promise<void> => {
    if (!report) {
      setError("Open WorkHome from a report first.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const plan = await generateLearningPlan(
        report,
        planDays,
        planMinutes,
        locale,
      );
      setGeneratedPlan(plan);

      if (report.analysisId) {
        await saveLearningPlan(report.analysisId, plan);
      }

      window.sessionStorage.setItem(
        WORKHOME_SESSION_KEY,
        JSON.stringify({ report, plan }),
      );

      addNotification({
        id: `${report.studentName}-${Date.now()}`,
        title: `WorkHome generated for ${report.studentName || report.subject}`,
        body: `Revision tasks are ready for ${report.subject}.`,
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
    } catch (generationError) {
      console.error("Failed to generate WorkHome:", generationError);
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Failed to generate WorkHome",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-5">
        <Breadcrumbs items={breadcrumbItems} />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <Heading
            title={t("homework.pageTitle")}
            description={t("homework.pageSubtitle")}
          />
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/reports")}
          >
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
        </div>

        <Separator />

        {!report ? (
          <Card className="overflow-hidden border-border/70 bg-linear-to-br from-primary/10 via-background to-amber-50">
            <CardContent className="space-y-4 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <IconSparkles className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight">
                  Open a report to build WorkHome
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose a student report from the Reports tab and send it here
                  to generate a tailored practice plan.
                </p>
              </div>
              <Button onClick={() => router.push("/dashboard/reports")}>
                Go to Reports
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="overflow-hidden border-border/70 bg-linear-to-br from-primary/15 via-background to-secondary/25">
              <CardHeader className="space-y-3">
                <Badge variant="secondary" className="w-fit">
                  WorkHome
                </Badge>
                <CardTitle className="text-3xl font-black tracking-tight">
                  {report.studentName || report.subject}
                </CardTitle>
                <CardDescription>
                  {report.subject} •{" "}
                  {report.className || t("students.gradeLabel")}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Score
                  </p>
                  <p className="mt-1 text-3xl font-black text-foreground">
                    {report.score}/{report.totalMarks}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Weak Areas
                  </p>
                  <p className="mt-1 text-3xl font-black text-amber-600">
                    {weakAreas.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Questions
                  </p>
                  <p className="mt-1 text-3xl font-black text-emerald-600">
                    {report.corrections.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTargetArrow className="h-5 w-5 text-primary" />
                  Generate WorkHome
                </CardTitle>
                <CardDescription>
                  Create a student-specific revision plan from the report.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Days
                    </span>
                    <Input
                      type="number"
                      min={3}
                      max={30}
                      value={planDays}
                      onChange={(event) =>
                        setPlanDays(
                          sanitizePlanValue(Number(event.target.value), 3, 30),
                        )
                      }
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Minutes / day
                    </span>
                    <Input
                      type="number"
                      min={10}
                      max={240}
                      value={planMinutes}
                      onChange={(event) =>
                        setPlanMinutes(
                          sanitizePlanValue(
                            Number(event.target.value),
                            10,
                            240,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full"
                >
                  <IconSparkles className="mr-2 h-4 w-4" />
                  {isGenerating
                    ? "Generating WorkHome..."
                    : "Generate WorkHome"}
                </Button>
                {error ? (
                  <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}

        {generatedPlan ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>WorkHome Plan</CardTitle>
                <CardDescription>
                  Day-wise activities tailored from the student report.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Timeline
                  </p>
                  <p className="mt-1 font-bold text-foreground">
                    {generatedPlan.timeline}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Daily Time
                  </p>
                  <p className="mt-1 font-bold text-foreground">
                    {generatedPlan.dailyTime}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Teacher Help
                  </p>
                  <p className="mt-1 font-bold text-foreground">
                    {generatedPlan.needsTeacherAssistance ? "Yes" : "No"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              {generatedPlan.activities.map((activity) => (
                <Card key={`${activity.day}-${activity.title}`}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Day {activity.day}: {activity.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <span className="font-semibold text-foreground">
                        Need:
                      </span>{" "}
                      {activity.whatIsNeeded}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">
                        How:
                      </span>{" "}
                      {activity.howToDo}
                    </p>
                    <p>
                      <span className="font-semibold text-foreground">
                        Guidelines:
                      </span>{" "}
                      {activity.guidelines}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
