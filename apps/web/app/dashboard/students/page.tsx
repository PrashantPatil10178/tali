"use client";

import React, { useState } from "react";
import StudentsList from "@/components/StudentsList";
import StudentProfile from "@/components/StudentProfile";
import { useDashboard } from "@/app/dashboard/DashboardContext";
import { StudentProfileData } from "@tali/types";

export default function StudentsPage(): React.JSX.Element {
  const { getStudentProfiles, addNote, deleteNote } = useDashboard();
  const [selectedStudent, setSelectedStudent] =
    useState<StudentProfileData | null>(null);

  if (selectedStudent) {
    return (
      <StudentProfile
        student={selectedStudent}
        onBack={() => setSelectedStudent(null)}
        onAddNote={addNote}
        onDeleteNote={deleteNote}
      />
    );
  }

  return (
    <StudentsList
      students={getStudentProfiles()}
      onSelectStudent={setSelectedStudent}
    />
  );
}
