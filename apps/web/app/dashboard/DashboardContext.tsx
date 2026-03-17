"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  AttendanceRecord,
  GradingResult,
  StudentNote,
  StudentProfileData,
  TextbookSource,
} from "@tali/types";

// ── Initial data ────────────────────────────────────────────────────────────

const INITIAL_KNOWLEDGE: TextbookSource[] = [
  {
    id: "1",
    name: "Std 1 and 2",
    grade: "१ ली व २ री",
    uploadDate: "२०२४-०१-०१",
    isSystem: true,
  },
  {
    id: "2",
    name: "Std 3",
    grade: "३ री",
    uploadDate: "२०२४-०१-०१",
    isSystem: true,
  },
  {
    id: "3",
    name: "Std 4",
    grade: "४ थी",
    uploadDate: "२०२४-०१-०१",
    isSystem: true,
  },
  {
    id: "4",
    name: "Std 5 and 6",
    grade: "५ वी व ६ वी",
    uploadDate: "२०२४-०१-०१",
    isSystem: true,
  },
  {
    id: "5",
    name: "Std 7 and 8",
    grade: "७ वी व ८ वी",
    uploadDate: "२०२४-०१-०१",
    isSystem: true,
  },
];

const MOCK_HISTORY: GradingResult[] = [
  {
    studentName: "अभिषेक पाटील",
    subject: "गणित",
    score: 42,
    totalMarks: 50,
    feedback: "उत्तम प्रयत्न! फक्त भूमितीवर अधिक लक्ष द्या.",
    date: new Date().toISOString(),
    corrections: [],
    weakAreas: ["भूमिती", "त्रिकोणमिती"],
  },
  {
    studentName: "प्रिया कुलकर्णी",
    subject: "विज्ञान",
    score: 48,
    totalMarks: 50,
    feedback: "शाबास! संकल्पना स्पष्ट आहेत.",
    date: new Date().toISOString(),
    corrections: [],
    weakAreas: [],
  },
];

// ── Context shape ────────────────────────────────────────────────────────────

interface DashboardContextValue {
  history: GradingResult[];
  knowledgeSources: TextbookSource[];
  studentNotes: Record<string, StudentNote[]>;
  studentAttendance: Record<string, AttendanceRecord[]>;
  handleGraded: (result: GradingResult) => void;
  addNote: (studentName: string, text: string) => void;
  deleteNote: (studentName: string, noteId: string) => void;
  saveAttendance: (
    records: { name: string; status: "present" | "absent" }[],
  ) => void;
  getStudentProfiles: () => StudentProfileData[];
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────────────────────

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [history, setHistory] = useState<GradingResult[]>(MOCK_HISTORY);
  const [studentNotes, setStudentNotes] = useState<
    Record<string, StudentNote[]>
  >({});
  const [studentAttendance, setStudentAttendance] = useState<
    Record<string, AttendanceRecord[]>
  >({});
  const [knowledgeSources] = useState<TextbookSource[]>(INITIAL_KNOWLEDGE);

  const handleGraded = useCallback((result: GradingResult) => {
    setHistory((prev) => {
      const exists = prev.find(
        (e) => e.studentName === result.studentName && e.date === result.date,
      );
      return exists ? prev : [result, ...prev];
    });
  }, []);

  const addNote = useCallback((studentName: string, text: string) => {
    const newNote: StudentNote = {
      id: Math.random().toString(36).substring(2, 11),
      text,
      date: new Date().toISOString(),
    };
    setStudentNotes((prev) => ({
      ...prev,
      [studentName]: [newNote, ...(prev[studentName] ?? [])],
    }));
  }, []);

  const deleteNote = useCallback((studentName: string, noteId: string) => {
    setStudentNotes((prev) => ({
      ...prev,
      [studentName]: (prev[studentName] ?? []).filter((n) => n.id !== noteId),
    }));
  }, []);

  const saveAttendance = useCallback(
    (records: { name: string; status: "present" | "absent" }[]) => {
      const today = new Date().toISOString().split("T")[0]!;
      setStudentAttendance((prev) => {
        const next = { ...prev };
        records.forEach(({ name, status }) => {
          const existing = next[name] ?? [];
          next[name] = [
            ...existing.filter((e) => e.date !== today),
            { date: today, status },
          ];
        });
        return next;
      });
    },
    [],
  );

  const getStudentProfiles = useCallback((): StudentProfileData[] => {
    const studentMap = new Map<string, GradingResult[]>();
    history.forEach((result) => {
      if (!studentMap.has(result.studentName)) {
        studentMap.set(result.studentName, []);
      }
      studentMap.get(result.studentName)!.push(result);
    });
    Object.keys(studentAttendance).forEach((name) => {
      if (!studentMap.has(name)) studentMap.set(name, []);
    });
    return Array.from(studentMap.entries()).map(([name, results]) => {
      const averageScore =
        results.length > 0
          ? (results.reduce((acc, r) => acc + r.score / r.totalMarks, 0) /
              results.length) *
            100
          : 0;
      return {
        name,
        averageScore,
        testCount: results.length,
        results: results.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
        notes: studentNotes[name] ?? [],
        attendance: studentAttendance[name] ?? [],
      };
    });
  }, [history, studentNotes, studentAttendance]);

  const value = useMemo<DashboardContextValue>(
    () => ({
      history,
      knowledgeSources,
      studentNotes,
      studentAttendance,
      handleGraded,
      addNote,
      deleteNote,
      saveAttendance,
      getStudentProfiles,
    }),
    [
      history,
      knowledgeSources,
      studentNotes,
      studentAttendance,
      handleGraded,
      addNote,
      deleteNote,
      saveAttendance,
      getStudentProfiles,
    ],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useDashboard = (): DashboardContextValue => {
  const ctx = useContext(DashboardContext);
  if (!ctx)
    throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
};
