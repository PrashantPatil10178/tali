import { NextResponse } from "next/server";
import {
  analyzeAnswerSheet,
  complexEducationalQuery,
  generateLearningPlan,
  searchGroundingQuery,
} from "@tali/gemini/server";
import { GradingResult } from "@tali/types";

type RequestBody = {
  action:
    | "analyzeAnswerSheet"
    | "generateLearningPlan"
    | "complexEducationalQuery"
    | "searchGroundingQuery";
  payload: Record<string, unknown>;
};

export async function POST(request: Request) {
  try {
    const { action, payload } = (await request.json()) as RequestBody;

    switch (action) {
      case "analyzeAnswerSheet":
        return NextResponse.json(
          await analyzeAnswerSheet(String(payload.dataUrl || "")),
        );
      case "generateLearningPlan":
        return NextResponse.json(
          await generateLearningPlan(
            payload.result as GradingResult,
            Number(payload.days || 0),
            Number(payload.dailyMinutes || 0),
          ),
        );
      case "complexEducationalQuery":
        return NextResponse.json(
          await complexEducationalQuery(
            String(payload.query || ""),
            Boolean(payload.useThinking),
          ),
        );
      case "searchGroundingQuery":
        return NextResponse.json(
          await searchGroundingQuery(String(payload.query || "")),
        );
      default:
        return NextResponse.json(
          { error: "Unsupported action" },
          { status: 400 },
        );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
