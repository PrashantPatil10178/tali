"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import Layout from "@/components/Layout";
import { signOut, useSession } from "@/lib/auth-client";
import { AppSection } from "@tali/types";
import { DashboardProvider } from "@/app/dashboard/DashboardContext";
import { LanguageProvider } from "@/lib/LanguageContext";

const SLUG_TO_SECTION: Record<string, AppSection> = {
  dashboard: AppSection.DASHBOARD,
  students: AppSection.STUDENTS,
  scan: AppSection.SCAN,
  history: AppSection.HISTORY,
  chat: AppSection.CHAT,
  knowledge: AppSection.KNOWLEDGE,
  attendance: AppSection.ATTENDANCE,
  homework: AppSection.HOMEWORK,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!isSessionPending && !session) {
      router.replace("/sign-in");
    }
  }, [isSessionPending, session, router]);

  const slug = pathname.split("/")[2] ?? "dashboard";
  const activeSection = SLUG_TO_SECTION[slug] ?? AppSection.DASHBOARD;

  const handleNavigate = (section: AppSection) => {
    if (section === AppSection.DASHBOARD) {
      router.push("/dashboard");
    } else {
      router.push(`/dashboard/${section}`);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const { error } = await signOut();
    setIsSigningOut(false);
    if (!error) router.replace("/sign-in");
  };

  if (isSessionPending || !session) {
    return (
      <div className="auth-loading-screen">
        Loading your classroom workspace...
      </div>
    );
  }

  return (
    <LanguageProvider>
      <DashboardProvider>
        <Layout
          activeSection={activeSection}
          currentUserName={session.user.name ?? session.user.email ?? "Teacher"}
          currentUserRole={session.user.email ?? "Authenticated educator"}
          isSigningOut={isSigningOut}
          onNavigate={handleNavigate}
          onSignOut={handleSignOut}
        >
          {children}
        </Layout>
      </DashboardProvider>
    </LanguageProvider>
  );
}
