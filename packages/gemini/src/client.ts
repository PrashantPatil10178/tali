import { GradingResult, LearningPlan, StudentProfileData } from "@tali/types";

type GeminiAction =
  | "analyzeAnswerSheet"
  | "generateLearningPlan"
  | "complexEducationalQuery"
  | "searchGroundingQuery"
  | "translateToEnglish";

const getApiBaseUrl = () =>
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001").replace(
    /\/$/,
    "",
  );

// ── Student API Types ────────────────────────────────────────────────────────

interface StudentListItem {
  id: string;
  name: string;
  rollNumber: string;
  className: string;
  testCount: number;
  averageScore: number;
  lastTestDate: string | null;
}

interface DashboardStats {
  totalStudents: number;
  totalTests: number;
  averageScore: number;
  recentResults: GradingResult[];
  subjectStats: Array<{ subject: string; averageScore: number; count: number }>;
  studentsNeedingAttention: Array<{
    name: string;
    subject: string;
    score: number;
    weakAreas: string[];
  }>;
}

async function callGeminiApi<T>(
  action: GeminiAction,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}/api/gemini`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || "Request failed");
  }

  return response.json();
}

export const analyzeAnswerSheet = async (
  dataUrl: string,
): Promise<GradingResult[]> => {
  return callGeminiApi<GradingResult[]>("analyzeAnswerSheet", { dataUrl });
};

export const generateLearningPlan = async (
  result: GradingResult,
  days: number,
  dailyMinutes: number,
  language?: string,
): Promise<LearningPlan> => {
  return callGeminiApi<LearningPlan>("generateLearningPlan", {
    result,
    days,
    dailyMinutes,
    language,
  });
};

export const complexEducationalQuery = async (
  query: string,
  useThinking = true,
): Promise<string> => {
  return callGeminiApi<string>("complexEducationalQuery", {
    query,
    useThinking,
  });
};

export const searchGroundingQuery = async (
  query: string,
): Promise<{ text: string; sources: any[] }> => {
  return callGeminiApi<{ text: string; sources: any[] }>(
    "searchGroundingQuery",
    { query },
  );
};

/**
 * Translate a grading result from Marathi to English
 */
export const translateToEnglish = async (
  result: GradingResult,
): Promise<GradingResult> => {
  return callGeminiApi<GradingResult>("translateToEnglish", { result });
};

// ── Student API Functions ────────────────────────────────────────────────────

/**
 * Save a grading result to the database (auto-creates student if needed)
 */
export const saveGradingResult = async (
  result: GradingResult,
): Promise<{
  success: boolean;
  studentId?: string;
  analysisId?: string;
  error?: string;
}> => {
  const response = await fetch(`${getApiBaseUrl()}/api/students/results`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result }),
  });

  return response.json();
};

/**
 * Save a learning plan for an analysis
 */
export const saveLearningPlan = async (
  analysisId: string,
  plan: LearningPlan,
): Promise<{ success: boolean; planId?: string; error?: string }> => {
  const response = await fetch(
    `${getApiBaseUrl()}/api/students/learning-plans`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysisId, plan }),
    },
  );

  return response.json();
};

/**
 * Get all students with their stats
 */
export const getAllStudents = async (): Promise<{
  success: boolean;
  students: StudentListItem[];
  error?: string;
}> => {
  const response = await fetch(`${getApiBaseUrl()}/api/students`, {
    method: "GET",
    credentials: "include",
  });

  return response.json();
};

/**
 * Get a student's full profile with history
 */
export const getStudentProfile = async (
  studentId: string,
): Promise<{
  success: boolean;
  profile?: {
    id: string;
    name: string;
    rollNumber: string;
    className: string;
    results: GradingResult[];
    learningPlans: LearningPlan[];
  };
  error?: string;
}> => {
  const response = await fetch(`${getApiBaseUrl()}/api/students/${studentId}`, {
    method: "GET",
    credentials: "include",
  });

  return response.json();
};

/**
 * Get all grading history
 */
export const getAllGradingHistory = async (): Promise<{
  success: boolean;
  history: GradingResult[];
  error?: string;
}> => {
  const response = await fetch(`${getApiBaseUrl()}/api/students/history/all`, {
    method: "GET",
    credentials: "include",
  });

  return response.json();
};

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (): Promise<
  {
    success: boolean;
    error?: string;
  } & Partial<DashboardStats>
> => {
  const response = await fetch(
    `${getApiBaseUrl()}/api/students/dashboard/stats`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  return response.json();
};
