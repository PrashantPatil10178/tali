"use client";

import { useRouter } from "nextjs-toploader/app";
import React, { useEffect, useState } from "react";
import AttendanceTracker from "@/components/AttendanceTracker";
import ChatInterface from "@/components/ChatInterface";
import Dashboard from "@/components/Dashboard";
import HomeworkCreator from "@/components/HomeworkCreator";
import KnowledgeBase from "@/components/KnowledgeBase";
import Layout from "@/components/Layout";
import ResultView from "@/components/ResultView";
import Scanner from "@/components/Scanner";
import StudentProfile from "@/components/StudentProfile";
import StudentsList from "@/components/StudentsList";
import { signOut, useSession } from "@/lib/auth-client";
import {
  AppSection,
  AttendanceRecord,
  GradingResult,
  StudentNote,
  StudentProfileData,
  TextbookSource,
} from "@tali/types";

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

export default function Page() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();
  const [activeSection, setActiveSection] = useState<AppSection>(
    AppSection.DASHBOARD,
  );
  const [history, setHistory] = useState<GradingResult[]>(MOCK_HISTORY);
  const [currentResults, setCurrentResults] = useState<GradingResult[] | null>(
    null,
  );
  const [selectedStudent, setSelectedStudent] =
    useState<StudentProfileData | null>(null);
  const [studentNotes, setStudentNotes] = useState<
    Record<string, StudentNote[]>
  >({});
  const [studentAttendance, setStudentAttendance] = useState<
    Record<string, AttendanceRecord[]>
  >({});
  const [knowledgeSources] = useState<TextbookSource[]>(INITIAL_KNOWLEDGE);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!isSessionPending && !session) {
      router.replace("/sign-in");
    }
  }, [isSessionPending, router, session]);

  const handleGraded = (result: GradingResult) => {
    setHistory((prev) => {
      const exists = prev.find(
        (entry) =>
          entry.studentName === result.studentName &&
          entry.date === result.date,
      );

      if (exists) {
        return prev;
      }

      return [result, ...prev];
    });
  };

  const handleViewResults = (results: GradingResult[]) => {
    setCurrentResults(results);
  };

  const handleScanAnother = () => {
    setCurrentResults(null);
    setActiveSection(AppSection.SCAN);
  };

  const addNote = (studentName: string, text: string) => {
    const newNote: StudentNote = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      date: new Date().toISOString(),
    };

    setStudentNotes((prev) => ({
      ...prev,
      [studentName]: [newNote, ...(prev[studentName] || [])],
    }));
  };

  const deleteNote = (studentName: string, noteId: string) => {
    setStudentNotes((prev) => ({
      ...prev,
      [studentName]: (prev[studentName] || []).filter(
        (note) => note.id !== noteId,
      ),
    }));
  };

  const saveAttendance = (
    records: { name: string; status: "present" | "absent" }[],
  ) => {
    const today = new Date().toISOString().split("T")[0];

    setStudentAttendance((prev) => {
      const nextState = { ...prev };

      records.forEach((record) => {
        const existing = nextState[record.name] || [];
        const filtered = existing.filter((entry) => entry.date !== today);
        nextState[record.name] = [
          ...filtered,
          { date: today, status: record.status },
        ];
      });

      return nextState;
    });
  };

  const getStudentProfiles = (): StudentProfileData[] => {
    const studentMap = new Map<string, GradingResult[]>();

    history.forEach((result) => {
      if (!studentMap.has(result.studentName)) {
        studentMap.set(result.studentName, []);
      }

      studentMap.get(result.studentName)!.push(result);
    });

    Object.keys(studentAttendance).forEach((name) => {
      if (!studentMap.has(name)) {
        studentMap.set(name, []);
      }
    });

    return Array.from(studentMap.entries()).map(([name, results]) => {
      const averageScore =
        results.length > 0
          ? (results.reduce(
              (acc, curr) => acc + curr.score / curr.totalMarks,
              0,
            ) /
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
        notes: studentNotes[name] || [],
        attendance: studentAttendance[name] || [],
      };
    });
  };

  useEffect(() => {
    if (selectedStudent) {
      const updatedProfile = getStudentProfiles().find(
        (profile) => profile.name === selectedStudent.name,
      );

      if (updatedProfile) {
        setSelectedStudent(updatedProfile);
      }
    }
  }, [history, selectedStudent, studentAttendance, studentNotes]);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    const { error } = await signOut();

    setIsSigningOut(false);

    if (!error) {
      router.replace("/sign-in");
    }
  };

  const renderContent = () => {
    if (currentResults) {
      return (
        <ResultView
          results={currentResults}
          onClose={() => {
            setCurrentResults(null);
            setActiveSection(AppSection.SCAN);
          }}
          onScanAnother={handleScanAnother}
        />
      );
    }

    if (activeSection === AppSection.STUDENTS) {
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

    switch (activeSection) {
      case AppSection.DASHBOARD:
        return <Dashboard history={history} />;
      case AppSection.KNOWLEDGE:
        return <KnowledgeBase />;
      case AppSection.ATTENDANCE:
        return (
          <AttendanceTracker
            students={getStudentProfiles()}
            onSave={saveAttendance}
          />
        );
      case AppSection.HOMEWORK:
        return <HomeworkCreator sources={knowledgeSources} />;
      case AppSection.SCAN:
        return (
          <Scanner onGraded={handleGraded} onViewResults={handleViewResults} />
        );
      case AppSection.CHAT:
        return <ChatInterface />;
      case AppSection.HISTORY:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">
              तपासणीचा इतिहास
            </h2>
            <Dashboard history={history} />
          </div>
        );
      default:
        return <Dashboard history={history} />;
    }
  };

  if (isSessionPending || !session) {
    return (
      <div className="auth-loading-screen">
        Loading your classroom workspace...
      </div>
    );
  }

  return (
    <Layout
      activeSection={activeSection}
      currentUserName={session.user.name || session.user.email || "Teacher"}
      currentUserRole={session.user.email || "Authenticated educator"}
      isSigningOut={isSigningOut}
      onNavigate={(section) => {
        setActiveSection(section);
        setCurrentResults(null);
        setSelectedStudent(null);
      }}
      onSignOut={handleSignOut}
    >
      {renderContent()}
    </Layout>
  );
}
