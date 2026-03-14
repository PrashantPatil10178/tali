import { Elysia, t } from "elysia";
import { GradingResult } from "@tali/types";
import {
  analyzeAnswerSheet,
  complexEducationalQuery,
  generateLearningPlan,
  searchGroundingQuery,
} from "@/modules/gemini/service";

type GeminiAction =
  | "analyzeAnswerSheet"
  | "generateLearningPlan"
  | "complexEducationalQuery"
  | "searchGroundingQuery";

export const geminiRoutes = new Elysia({ prefix: "/api/gemini" }).post(
  "/",
  async ({ body, set }) => {
    try {
      const action = body.action as GeminiAction;
      const payload = body.payload as Record<string, unknown>;

      switch (action) {
        case "analyzeAnswerSheet":
          return await analyzeAnswerSheet(String(payload.dataUrl || ""));
        case "generateLearningPlan":
          return await generateLearningPlan(
            payload.result as GradingResult,
            Number(payload.days || 0),
            Number(payload.dailyMinutes || 0),
          );
        case "complexEducationalQuery":
          return await complexEducationalQuery(
            String(payload.query || ""),
            Boolean(payload.useThinking),
          );
        case "searchGroundingQuery":
          return await searchGroundingQuery(String(payload.query || ""));
        default:
          set.status = 400;
          return { error: "Unsupported action" };
      }
    } catch (error) {
      set.status = 500;
      return {
        error:
          error instanceof Error ? error.message : "Unexpected server error",
      };
    }
  },
  {
    auth: true,
    body: t.Object({
      action: t.String(),
      payload: t.Record(t.String(), t.Unknown()),
    }),
  },
);
