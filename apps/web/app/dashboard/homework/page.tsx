"use client";

import React from "react";
import HomeworkCreator from "@/components/HomeworkCreator";
import { useDashboard } from "@/app/dashboard/DashboardContext";

export default function HomeworkPage(): React.JSX.Element {
  const { knowledgeSources } = useDashboard();
  return <HomeworkCreator sources={knowledgeSources} />;
}
