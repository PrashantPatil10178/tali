import { GradingResult, LearningPlan } from "@tali/types";

type GeminiAction =
  | "analyzeAnswerSheet"
  | "generateLearningPlan"
  | "complexEducationalQuery"
  | "searchGroundingQuery";

const getApiBaseUrl = () =>
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001").replace(
    /\/$/,
    "",
  );

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
): Promise<LearningPlan> => {
  return callGeminiApi<LearningPlan>("generateLearningPlan", {
    result,
    days,
    dailyMinutes,
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
