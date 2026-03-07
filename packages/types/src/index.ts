export interface LearningActivity {
  day: number;
  title: string;
  whatIsNeeded: string;
  howToDo: string;
  guidelines: string;
}

export interface LearningPlan {
  weakAreas: string[];
  needsTeacherAssistance: boolean;
  assistanceReason: string;
  activities: LearningActivity[];
  timeline: string;
  dailyTime: string;
}

export interface GradingResult {
  studentName: string;
  subject: string;
  score: number;
  totalMarks: number;
  feedback: string;
  corrections: Array<{
    questionNo: string;
    questionText: string;
    studentAnswer: string;
    correctAnswer: string;
    marksObtained: number;
    maxMarks: number;
    analysis: string;
  }>;
  date: string;
  learningPlan?: LearningPlan;
  weakAreas: string[];
}

export interface StudentNote {
  id: string;
  text: string;
  date: string;
}

export interface AttendanceRecord {
  date: string;
  status: "present" | "absent";
}

export interface StudentProfileData {
  name: string;
  averageScore: number;
  testCount: number;
  results: GradingResult[];
  notes: StudentNote[];
  attendance: AttendanceRecord[];
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
  timestamp: number;
  sources?: any[];
}

export enum AppSection {
  DASHBOARD = "dashboard",
  SCAN = "scan",
  HISTORY = "history",
  CHAT = "chat",
  STUDENTS = "students",
  KNOWLEDGE = "knowledge",
  ATTENDANCE = "attendance",
  HOMEWORK = "homework",
}

export interface TextbookSource {
  id: string;
  name: string;
  grade: string;
  uploadDate: string;
  isSystem: boolean;
}
