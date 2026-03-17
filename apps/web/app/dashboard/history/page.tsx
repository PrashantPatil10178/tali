"use client";

import React from "react";
import Reports from "@/components/Reports";
import { useDashboard } from "@/app/dashboard/DashboardContext";

export default function HistoryPage(): React.JSX.Element {
  const { history, handleGraded } = useDashboard();

  return (
    <Reports
      history={history}
      onGraded={handleGraded}
    />
  );
}
