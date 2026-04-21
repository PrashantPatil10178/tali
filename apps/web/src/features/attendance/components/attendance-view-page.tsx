"use client";
import { Breadcrumbs } from "@/components/breadcrumbs";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/lib/LanguageContext";

export default function AttendanceViewPage() {
  const { t } = useLanguage();
  const breadcrumbItems = [
    { title: t("nav.dashboard"), link: "/dashboard/overview" },
    { title: t("nav.attendance"), link: "/dashboard/attendance" },
  ];

  return (
    <PageContainer>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <Heading
            title={t("attendance.pageTitle")}
            description={t("attendance.pageSubtitle")}
          />
        </div>
        <Separator />

        <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">{t("attendance.placeholder")}</p>
        </div>
      </div>
    </PageContainer>
  );
}
