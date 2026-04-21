"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconLoader2 } from "@tabler/icons-react";
import { getStudentProfile } from "@tali/gemini/client";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/LanguageContext";

type StudentProfileResponse = Awaited<ReturnType<typeof getStudentProfile>>;
type StudentProfile = NonNullable<StudentProfileResponse["profile"]>;

const formatDate = (value: string): string => {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

const toPercent = (score: number, totalMarks: number): number => {
  if (totalMarks <= 0) {
    return 0;
  }

  return Math.round((score / totalMarks) * 100);
};

interface StudentDetailViewPageProps {
  readonly studentId: string;
}

export default function StudentDetailViewPage({
  studentId,
}: StudentDetailViewPageProps): React.JSX.Element {
  const { t } = useLanguage();
  const router = useRouter();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async (): Promise<void> => {
      setIsLoading(true);

      try {
        const response = await getStudentProfile(studentId);
        if (!isMounted) {
          return;
        }

        if (!response.success || !response.profile) {
          setProfile(null);
          setError(response.error || t("students.detail.notFound"));
          return;
        }

        setProfile(response.profile);
        setError(null);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setProfile(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : t("students.detail.loadError"),
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [studentId, t]);

  const summary = useMemo(() => {
    if (!profile) {
      return {
        averageScore: 0,
        totalTests: 0,
        passRate: 0,
      };
    }

    const totalTests = profile.results.length;
    const averageScore =
      totalTests > 0
        ? Math.round(
            profile.results.reduce((sum, result) => {
              return sum + toPercent(result.score, result.totalMarks);
            }, 0) / totalTests,
          )
        : 0;

    const passRate =
      totalTests > 0
        ? Math.round(
            (profile.results.filter((result) => {
              return toPercent(result.score, result.totalMarks) >= 40;
            }).length /
              totalTests) *
              100,
          )
        : 0;

    return {
      averageScore,
      totalTests,
      passRate,
    };
  }, [profile]);

  const breadcrumbItems = [
    { title: t("nav.dashboard"), link: "/dashboard/overview" },
    { title: t("nav.students"), link: "/dashboard/students" },
    {
      title: profile?.name ?? t("students.detail.title"),
      link: `/dashboard/students/${studentId}`,
    },
  ];

  return (
    <PageContainer>
      <div className="space-y-5">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Heading
            title={profile?.name ?? t("students.detail.title")}
            description={
              profile
                ? `${profile.className} • ${t("students.rollNumber")}: ${profile.rollNumber}`
                : t("students.detail.subtitle")
            }
          />
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/students")}
          >
            <IconArrowLeft className="mr-2 h-4 w-4" />
            {t("students.detail.backToStudents")}
          </Button>
        </div>
        <Separator />

        {isLoading ? (
          <div className="flex items-center justify-center rounded-xl border border-border/70 bg-card/60 p-8 text-sm text-muted-foreground">
            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("students.detail.loading")}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {profile ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardContent className="space-y-1 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("students.classAverage")}
                  </p>
                  <p className="text-3xl font-black text-primary">
                    {summary.averageScore}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-1 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("students.totalTests")}
                  </p>
                  <p className="text-3xl font-black text-foreground">
                    {summary.totalTests}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-1 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("students.detail.passRate")}
                  </p>
                  <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {summary.passRate}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="space-y-1 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("students.detail.learningPlans")}
                  </p>
                  <p className="text-3xl font-black text-foreground">
                    {profile.learningPlans.length}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t("students.detail.recentReports")}</CardTitle>
                <CardDescription>
                  {t("students.detail.recentReportsSubtitle")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.results.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                    <p className="text-base font-semibold text-foreground">
                      {t("students.detail.noReportsTitle")}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("students.detail.noReportsSubtitle")}
                    </p>
                  </div>
                ) : (
                  profile.results.map((result, index) => {
                    const percent = toPercent(result.score, result.totalMarks);

                    return (
                      <div
                        key={`${result.analysisId ?? "report"}-${index}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/50 p-4"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-base font-bold text-foreground">
                            {result.subject}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(result.date)}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              {result.score}/{result.totalMarks}
                            </Badge>
                            <Badge variant="secondary">{percent}%</Badge>
                            <Badge variant="outline">
                              {t("reports.weakConceptCount")}:{" "}
                              {result.weakAreas.length}
                            </Badge>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => {
                            const params = new URLSearchParams({
                              studentId: profile.id,
                            });

                            if (result.analysisId) {
                              params.set("analysisId", result.analysisId);
                            }

                            router.push(
                              `/dashboard/reports?${params.toString()}`,
                            );
                          }}
                        >
                          {t("students.detail.openReport")}
                        </Button>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
