"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch, IconUsersGroup } from "@tabler/icons-react";
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
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/lib/LanguageContext";
import { useStudentsData } from "./use-students-data";

const formatLastAssessment = (value: string | null): string => {
  if (!value) {
    return "--";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

export default function StudentsViewPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { students, isLoading, error } = useStudentsData();
  const [searchTerm, setSearchTerm] = useState("");

  const breadcrumbItems = [
    { title: t("nav.dashboard"), link: "/dashboard/overview" },
    { title: t("nav.students"), link: "/dashboard/students" },
  ];

  const filteredStudents = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    if (!normalizedQuery) {
      return students;
    }

    return students.filter((student) => {
      return (
        student.name.toLowerCase().includes(normalizedQuery) ||
        student.rollNumber.toLowerCase().includes(normalizedQuery) ||
        student.className.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [searchTerm, students]);

  const summary = useMemo(() => {
    const totalStudents = students.length;
    const totalTests = students.reduce((sum, student) => {
      return sum + student.testCount;
    }, 0);
    const averageScore =
      totalStudents > 0
        ? Math.round(
            students.reduce((sum, student) => {
              return sum + student.averageScore;
            }, 0) / totalStudents,
          )
        : 0;
    const averageTests =
      totalStudents > 0 ? Number((totalTests / totalStudents).toFixed(1)) : 0;

    const latestAssessment = students
      .map((student) => student.lastTestDate)
      .filter((value): value is string => Boolean(value))
      .toSorted((left, right) => {
        return new Date(right).getTime() - new Date(left).getTime();
      })[0];

    return {
      totalStudents,
      totalTests,
      averageScore,
      averageTests,
      latestAssessment,
    };
  }, [students]);

  return (
    <PageContainer>
      <div className="space-y-5">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <Heading
            title={t("students.pageTitle")}
            description={t("students.pageSubtitle")}
          />
        </div>
        <Separator />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="space-y-1 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("students.totalStudents")}
              </p>
              <p className="text-3xl font-black text-foreground">
                {isLoading ? "..." : summary.totalStudents}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("students.totalTests")}
              </p>
              <p className="text-3xl font-black text-foreground">
                {isLoading ? "..." : summary.totalTests}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("students.classAverage")}
              </p>
              <p className="text-3xl font-black text-primary">
                {isLoading ? "..." : `${summary.averageScore}%`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("students.latestAssessment")}
              </p>
              <p className="text-base font-bold text-foreground">
                {isLoading
                  ? "..."
                  : summary.latestAssessment
                    ? formatLastAssessment(summary.latestAssessment)
                    : t("students.latestAssessmentNone")}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>{t("students.rosterTitle")}</CardTitle>
              <CardDescription>{t("students.rosterSubtitle")}</CardDescription>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9"
                placeholder={t("students.searchPlaceholder")}
              />
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {t("students.loadError")} {error}
              </div>
            ) : null}

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`student-loading-${index}`}
                    className="h-24 animate-pulse rounded-xl border border-border/70 bg-muted/30"
                  />
                ))}
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
                <p className="text-lg font-semibold text-foreground">
                  {t("students.noDataTitle")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("students.noDataSubtitle")}
                </p>
                <Button
                  className="mt-4"
                  onClick={() => router.push("/dashboard/scan")}
                >
                  {t("students.openScanWorkspace")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStudents.map((student) => {
                  return (
                    <div
                      key={student.id}
                      className="rounded-xl border border-border/70 bg-card/50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-base font-bold text-foreground">
                              {student.name}
                            </p>
                            <Badge variant="outline">{student.className}</Badge>
                          </div>

                          <p className="text-xs text-muted-foreground">
                            {t("students.rollNumber")}: {student.rollNumber}
                          </p>

                          <Progress
                            value={Math.max(
                              0,
                              Math.min(100, student.averageScore),
                            )}
                            className="h-2"
                          />

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                              {t("students.totalTests")}: {student.testCount}
                            </Badge>
                            <Badge variant="outline">
                              {t("students.classAverage")}:{" "}
                              {student.averageScore}%
                            </Badge>
                            <Badge variant="outline">
                              {t("students.lastAssessment")}:{" "}
                              {formatLastAssessment(student.lastTestDate)}
                            </Badge>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          onClick={() =>
                            router.push(`/dashboard/students/${student.id}`)
                          }
                        >
                          <IconUsersGroup className="mr-2 h-4 w-4" />
                          {t("students.viewDetails")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
