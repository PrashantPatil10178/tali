"use client";
import { Breadcrumbs } from "@/components/breadcrumbs";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/lib/LanguageContext";

export default function StudentsViewPage() {
  const { t } = useLanguage();
  const breadcrumbItems = [
    { title: t("nav.dashboard"), link: "/dashboard/overview" },
    { title: t("nav.students"), link: "/dashboard/students" },
  ];

  return (
    <PageContainer>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <Heading
            title={t("students.pageTitle")}
            description={t("students.pageSubtitle")}
          />
        </div>
        <Separator />

        {/* Simplified functional replica from old web app */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Arjun Singh</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t("students.gradeLabel")}: 10th</p>
              <p>{t("students.performanceLabel")}: 85%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Priya Desai</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{t("students.gradeLabel")}: 10th</p>
              <p>{t("students.performanceLabel")}: 92%</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
