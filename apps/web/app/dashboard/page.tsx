"use client";

import React from "react";
import Dashboard from "@/components/Dashboard";
import { useDashboard } from "@/app/dashboard/DashboardContext";

export default function DashboardPage(): React.JSX.Element {
  const { history, isLoading } = useDashboard();
  return <Dashboard history={history} isLoading={isLoading} />;
}
