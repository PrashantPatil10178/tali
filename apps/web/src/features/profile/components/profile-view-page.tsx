"use client";

import { Breadcrumbs } from "@/components/breadcrumbs";
import PageContainer from "@/components/layout/page-container";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/LanguageContext";

export default function ProfileViewPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user;
  const breadcrumbItems = [
    { title: t("nav.dashboard"), link: "/dashboard/overview" },
    { title: t("profile.pageTitle"), link: "/dashboard/profile" },
  ];

  return (
    <PageContainer>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <Heading
            title={t("profile.pageTitle")}
            description={t("profile.pageSubtitle")}
          />
        </div>
        <Separator />

        {user ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.personalInfo")}</CardTitle>
                <CardDescription>{t("profile.publicDetails")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={user?.image || ""}
                      alt={user?.name || ""}
                    />
                    <AvatarFallback>
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="font-medium text-lg leading-none">
                      {user.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {t("profile.activeTeacher")}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 mt-6">
                  <div className="grid gap-1">
                    <Label className="text-muted-foreground">
                      {t("profile.accountCreated")}
                    </Label>
                    <div className="font-medium">
                      {user.createdAt
                        ? format(new Date(user.createdAt), "MMMM dd, yyyy")
                        : t("profile.recently")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">{t("profile.loading")}</p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
