"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useLanguage } from "@/lib/LanguageContext";
import { useStudentsData } from "@/features/students/components/use-students-data";

type AttendanceStatus = "present" | "absent";

const getTodayDate = (): string => {
  return new Date().toISOString().split("T")[0] ?? "";
};

const toStorageKey = (date: string): string => {
  return `tali_attendance_${date}`;
};

const toDisplayDate = (value: string): string => {
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

export default function AttendanceViewPage() {
  const { t } = useLanguage();
  const { students, isLoading, error } = useStudentsData();
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const breadcrumbItems = [
    { title: t("nav.dashboard"), link: "/dashboard/overview" },
    { title: t("nav.attendance"), link: "/dashboard/attendance" },
  ];

  useEffect(() => {
    if (students.length === 0) {
      setAttendanceMap({});
      return;
    }

    const storageKey = toStorageKey(selectedDate);
    const savedValue = window.localStorage.getItem(storageKey);
    let parsedSaved: Record<string, AttendanceStatus> = {};

    if (savedValue) {
      try {
        const rawValue = JSON.parse(savedValue) as unknown;
        if (rawValue && typeof rawValue === "object") {
          parsedSaved = rawValue as Record<string, AttendanceStatus>;
        }
      } catch (parseError) {
        console.error("Failed to parse attendance payload:", parseError);
      }
    }

    const nextMap: Record<string, AttendanceStatus> = {};
    for (const student of students) {
      const savedStatus = parsedSaved[student.id];
      nextMap[student.id] = savedStatus === "absent" ? "absent" : "present";
    }

    setAttendanceMap(nextMap);
    setLastSavedAt(null);
  }, [selectedDate, students]);

  const stats = useMemo(() => {
    const total = students.length;
    const present = Object.values(attendanceMap).filter((status) => {
      return status === "present";
    }).length;
    const absent = Math.max(0, total - present);
    const presentRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      total,
      present,
      absent,
      presentRate,
    };
  }, [attendanceMap, students.length]);

  const toggleAttendance = (studentId: string): void => {
    setAttendanceMap((currentValue) => {
      const nextValue =
        currentValue[studentId] === "present" ? "absent" : "present";
      return {
        ...currentValue,
        [studentId]: nextValue,
      };
    });
  };

  const saveAttendance = (): void => {
    window.localStorage.setItem(
      toStorageKey(selectedDate),
      JSON.stringify(attendanceMap),
    );
    setLastSavedAt(new Date().toISOString());
  };

  return (
    <PageContainer>
      <div className="space-y-5">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <Heading
            title={t("attendance.pageTitle")}
            description={t("attendance.pageSubtitle")}
          />
        </div>
        <Separator />

        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <CardTitle>{t("attendance.title")}</CardTitle>
              <CardDescription>{t("attendance.subtitle")}</CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="w-[180px]"
              />
              <Button onClick={saveAttendance} disabled={students.length === 0}>
                {t("attendance.save")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {lastSavedAt ? (
              <p className="text-sm text-muted-foreground">
                {t("attendance.saved")} {toDisplayDate(lastSavedAt)}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="space-y-1 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("attendance.total")}
              </p>
              <p className="text-3xl font-black text-foreground">
                {isLoading ? "..." : stats.total}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("attendance.present")}
              </p>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {isLoading ? "..." : stats.present}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("attendance.absent")}
              </p>
              <p className="text-3xl font-black text-rose-600 dark:text-rose-400">
                {isLoading ? "..." : stats.absent}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("attendance.presentRate")}
              </p>
              <p className="text-3xl font-black text-primary">
                {isLoading ? "..." : `${stats.presentRate}%`}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("attendance.studentList")}</CardTitle>
            <CardDescription>
              {t("attendance.dateLabel")}: {toDisplayDate(selectedDate)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {error ? (
              <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {t("attendance.loadError")} {error}
              </div>
            ) : null}

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`attendance-loading-${index}`}
                    className="h-20 animate-pulse rounded-xl border border-border/70 bg-muted/30"
                  />
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
                <p className="text-lg font-semibold text-foreground">
                  {t("attendance.noDataTitle")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("attendance.noDataSubtitle")}
                </p>
              </div>
            ) : (
              students.map((student) => {
                const status = attendanceMap[student.id] ?? "present";

                return (
                  <div
                    key={student.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/50 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold text-foreground">
                        {student.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("attendance.class")}: {student.className} •{" "}
                        {t("students.rollNumber")}: {student.rollNumber}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={status === "present" ? "secondary" : "outline"}
                      >
                        {status === "present"
                          ? t("attendance.present")
                          : t("attendance.absent")}
                      </Badge>
                      <Button
                        variant="outline"
                        onClick={() => toggleAttendance(student.id)}
                      >
                        {t("attendance.toggleStatus")}
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
