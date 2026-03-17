"use client";

import React from "react";
import AttendanceTracker from "@/components/AttendanceTracker";
import { useDashboard } from "@/app/dashboard/DashboardContext";

export default function AttendancePage(): React.JSX.Element {
  const { getStudentProfiles, saveAttendance } = useDashboard();
  return (
    <AttendanceTracker
      students={getStudentProfiles()}
      onSave={saveAttendance}
    />
  );
}
