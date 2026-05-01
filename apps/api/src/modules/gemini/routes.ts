import { Elysia, t } from "elysia";
import { GradingResult } from "@tali/types";
import {
  analyzeAnswerSheet,
  complexEducationalQuery,
  generateLearningPlan,
  searchGroundingQuery,
  translateGradingResultToEnglish,
} from "@/modules/gemini/service";

type GeminiAction =
  | "analyzeAnswerSheet"
  | "generateLearningPlan"
  | "complexEducationalQuery"
  | "searchGroundingQuery"
  | "translateToEnglish";

const summarizeGeminiResult = (action: GeminiAction, result: unknown) => {
  switch (action) {
    case "analyzeAnswerSheet": {
      if (!Array.isArray(result)) {
        return { kind: "invalid_result" };
      }

      return {
        kind: "grading_results",
        studentCount: result.length,
      };
    }
    case "generateLearningPlan": {
      if (!result || typeof result !== "object") {
        return { kind: "invalid_result" };
      }

      const plan = result as {
        activities?: unknown[];
        weakAreas?: unknown[];
      };

      return {
        kind: "learning_plan",
        activities: Array.isArray(plan.activities) ? plan.activities.length : 0,
        weakAreas: Array.isArray(plan.weakAreas) ? plan.weakAreas.length : 0,
      };
    }
    case "complexEducationalQuery": {
      return {
        kind: "text_response",
        textLength: typeof result === "string" ? result.length : 0,
      };
    }
    case "searchGroundingQuery": {
      if (!result || typeof result !== "object") {
        return { kind: "invalid_result" };
      }

      const search = result as { text?: string; sources?: unknown[] };

      return {
        kind: "grounded_response",
        textLength: typeof search.text === "string" ? search.text.length : 0,
        sourceCount: Array.isArray(search.sources) ? search.sources.length : 0,
      };
    }
    case "translateToEnglish": {
      if (!result || typeof result !== "object") {
        return { kind: "invalid_result" };
      }

      const translated = result as {
        corrections?: unknown[];
        weakAreas?: unknown[];
      };

      return {
        kind: "translated_result",
        corrections: Array.isArray(translated.corrections)
          ? translated.corrections.length
          : 0,
        weakAreas: Array.isArray(translated.weakAreas)
          ? translated.weakAreas.length
          : 0,
      };
    }
    default:
      return { kind: "unknown" };
  }
};

export const geminiRoutes = new Elysia({ prefix: "/api/gemini" }).post(
  "/",
  async ({ body, set }) => {
    const startedAt = Date.now();

    try {
      const action = body.action as GeminiAction;
      const payload = body.payload as Record<string, unknown>;
      const safePayloadKeys = Object.keys(payload);

      let result: unknown;

      switch (action) {
        case "analyzeAnswerSheet":
          result = await analyzeAnswerSheet(String(payload.dataUrl || ""));
          break;
        case "generateLearningPlan":
          result = await generateLearningPlan(
            payload.result as GradingResult,
            Number(payload.days || 0),
            Number(payload.dailyMinutes || 0),
            typeof payload.language === "string" ? payload.language : undefined,
            typeof payload.teacherPrompt === "string" ? payload.teacherPrompt : undefined,
          );
          break;
        case "complexEducationalQuery":
          result = await complexEducationalQuery(
            String(payload.query || ""),
            Boolean(payload.useThinking),
          );
          break;
        case "searchGroundingQuery":
          result = await searchGroundingQuery(String(payload.query || ""));
          break;
        case "translateToEnglish":
          result = await translateGradingResultToEnglish(
            payload.result as GradingResult,
          );
          break;
        default:
          set.status = 400;
          return { error: "Unsupported action" };
      }

      console.info("[api/gemini] request succeeded", {
        action,
        payloadKeys: safePayloadKeys,
        durationMs: Date.now() - startedAt,
        summary: summarizeGeminiResult(action, result),
      });

      return result;
    } catch (error) {
      const action = body.action as string | undefined;
      const safePayloadKeys =
        body.payload && typeof body.payload === "object"
          ? Object.keys(body.payload as Record<string, unknown>)
          : [];

      console.error("[api/gemini] request failed", {
        action,
        payloadKeys: safePayloadKeys,
        durationMs: Date.now() - startedAt,
        errorMessage: error instanceof Error ? error.message : String(error),
        error,
      });

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
