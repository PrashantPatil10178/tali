"use client";

import React, { useState } from "react";
import Scanner from "@/components/Scanner";
import ResultView from "@/components/ResultView";
import { useDashboard } from "@/app/dashboard/DashboardContext";
import { GradingResult } from "@tali/types";

export default function ScanPage(): React.JSX.Element {
  const { handleGraded } = useDashboard();
  const [currentResults, setCurrentResults] = useState<GradingResult[] | null>(
    null,
  );

  if (currentResults) {
    return (
      <ResultView
        results={currentResults}
        onClose={() => setCurrentResults(null)}
        onScanAnother={() => setCurrentResults(null)}
      />
    );
  }

  return (
    <Scanner
      onGraded={handleGraded}
      onViewResults={(results) => setCurrentResults(results)}
    />
  );
}
