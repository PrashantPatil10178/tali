import { GradingResult, LearningPlan } from "@tali/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const getNumericEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_GEMINI_MODEL =
  process.env.GEMINI_MODEL?.trim() || "gemini-3-flash-preview";
const GEMINI_REQUEST_TIMEOUT_MS = getNumericEnv(
  process.env.GEMINI_REQUEST_TIMEOUT_MS,
  120000,
);
const GEMINI_ANALYZE_MAX_RETRIES = getNumericEnv(
  process.env.GEMINI_ANALYZE_MAX_RETRIES,
  2,
);
const GEMINI_ANALYZE_THINKING_BUDGET = getNumericEnv(
  process.env.GEMINI_ANALYZE_THINKING_BUDGET,
  0,
);

const SchemaType = {
  ARRAY: "ARRAY",
  OBJECT: "OBJECT",
  STRING: "STRING",
  NUMBER: "NUMBER",
  INTEGER: "INTEGER",
} as const;

type GeminiPart =
  | { text: string }
  | {
      inlineData: {
        data: string;
        mimeType: string;
      };
    };

type GeminiContent = {
  role?: "user" | "model";
  parts: GeminiPart[];
};

type GeminiSchema = {
  type: (typeof SchemaType)[keyof typeof SchemaType];
  properties?: Record<string, GeminiSchema>;
  items?: GeminiSchema;
  required?: string[];
};

type GenerateContentOptions = {
  model: string;
  contents: string | GeminiContent | GeminiContent[];
  config?: {
    systemInstruction?: string;
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
    responseSchema?: GeminiSchema;
    thinkingConfig?: {
      thinkingBudget: number;
    };
    tools?: Array<Record<string, unknown>>;
  };
};

type GenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    groundingMetadata?: {
      groundingChunks?: unknown[];
    };
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
  error?: {
    message?: string;
  };
};

const getApiKey = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing Gemini API key. Set GEMINI_API_KEY in apps/api/.env.",
    );
  }

  return apiKey;
};

const normalizeContents = (
  contents: GenerateContentOptions["contents"],
): GeminiContent[] => {
  if (typeof contents === "string") {
    return [{ role: "user", parts: [{ text: contents }] }];
  }

  return Array.isArray(contents) ? contents : [{ role: "user", ...contents }];
};

const cleanJsonText = (text: string) => {
  const trimmed = text.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed
    .replace(/^```json\n?/, "")
    .replace(/\n?```$/, "")
    .trim();
};

const extractResponseText = (response: GenerateContentResponse) => {
  return (
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter((text): text is string => Boolean(text))
      .join("") ?? ""
  );
};

async function generateContent({
  model,
  contents,
  config,
}: GenerateContentOptions): Promise<GenerateContentResponse> {
  const apiKey = getApiKey();
  const response = await fetch(
    `${GEMINI_API_BASE_URL}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(GEMINI_REQUEST_TIMEOUT_MS),
      body: JSON.stringify({
        contents: normalizeContents(contents),
        systemInstruction: config?.systemInstruction
          ? {
              parts: [{ text: config.systemInstruction }],
            }
          : undefined,
        generationConfig: {
          temperature: config?.temperature,
          maxOutputTokens: config?.maxOutputTokens,
          responseMimeType: config?.responseMimeType,
          responseSchema: config?.responseSchema,
          thinkingConfig: config?.thinkingConfig,
        },
        tools: config?.tools,
      }),
    },
  );

  const json = (await response
    .json()
    .catch(() => null)) as GenerateContentResponse | null;

  if (!response.ok) {
    throw new Error(
      json?.error?.message ||
        `Gemini request failed with status ${response.status}.`,
    );
  }

  if (json?.promptFeedback?.blockReason) {
    throw new Error(
      `Gemini blocked the request: ${json.promptFeedback.blockReason}.`,
    );
  }

  if (!json) {
    throw new Error("Gemini returned an empty response.");
  }

  return json;
}

async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorString = JSON.stringify(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorName =
        error && typeof error === "object" && "name" in error
          ? String((error as { name?: unknown }).name ?? "")
          : "";

      const isRateLimited =
        errorString.includes("429") ||
        errorString.includes("RESOURCE_EXHAUSTED") ||
        errorMessage.includes("429") ||
        errorMessage.includes("RESOURCE_EXHAUSTED");

      const isTimeout =
        errorName === "TimeoutError" ||
        errorMessage.toLowerCase().includes("timed out") ||
        errorString.toLowerCase().includes("timed out");

      const isConnectionReset =
        errorString.includes("ECONNRESET") ||
        errorMessage.includes("ECONNRESET") ||
        errorMessage
          .toLowerCase()
          .includes("socket connection was closed unexpectedly");

      if (isRateLimited || isTimeout || isConnectionReset) {
        const waitTime =
          Math.min(12000, Math.pow(2, attempt + 1) * 1200) +
          Math.random() * 600;

        console.warn("[gemini] transient failure, retrying", {
          attempt: attempt + 1,
          maxRetries,
          waitTimeMs: Math.round(waitTime),
          reason: isRateLimited
            ? "rate_limit"
            : isTimeout
              ? "timeout"
              : "connection_reset",
          errorMessage,
          errorName,
        });

        await delay(waitTime);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

export async function analyzeAnswerSheet(
  dataUrl: string,
): Promise<GradingResult[]> {
  const [header, base64Data] = dataUrl.split(",");
  const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";
  const approximatePayloadBytes = Math.floor(base64Data.length * 0.75);

  console.info("[gemini] analyze request started", {
    model: DEFAULT_GEMINI_MODEL,
    mimeType,
    payloadBytes: approximatePayloadBytes,
    timeoutMs: GEMINI_REQUEST_TIMEOUT_MS,
    maxRetries: GEMINI_ANALYZE_MAX_RETRIES,
    thinkingBudget: GEMINI_ANALYZE_THINKING_BUDGET,
  });

  const systemInstruction = `Identity: Guruji AI (गुरुजी AI - The Expert Maharashtra School Examiner).
Role: You are a meticulous examiner specializing in Maharashtra State Board primary education (Std 1-8).

DOCUMENT TYPES YOU WILL ENCOUNTER:
1. FORMAL EXAM PAPERS (संकलित मूल्यमापन / Summative Assessment)
   - Header contains: School name (शाळेचे नाव), Student name (विद्यार्थ्याचे नाव), Class (इयत्ता), Subject (विषय), Date (दिनांक), Total marks (एकूण गुण)
   - Questions are numbered (प्रश्न १, प्रश्न २ अ, प्रश्न ३ अ, etc.)
   - May have sub-questions (अ, ब, क OR 1), 2), 3))
   - Marks per question shown in margin (गुण X)

2. MATHEMATICS PAPERS (गणित)
   - Addition (बेरीज): 43+23=66
   - Subtraction (वजाबाकी): 142356-98469=43887
   - Multiplication (गुणाकार): 48326×874=42220924
   - Division (भागाकार): 149832÷27=5549 (भाजक, भाज्य, भागफल, बाकी)
   - Word problems showing calculation steps
   - Student may show work vertically with carry-overs

3. NOTEBOOK/HOMEWORK PAGES (वही)
   - Lined paper with handwritten problems
   - Multiple problems on one page
   - May not have student name - use "Unknown Student" if not visible
   - Treat each numbered problem as a separate question

4. ENVIRONMENTAL STUDIES (परिसर अभ्यास)
   - Fill-in-the-blanks (रिकाम्या जागी योग्य शब्द लिहा)
   - Match the following (जोड्या जुळवा)
   - Short answers (थोडक्यात उत्तरे)

MANDATORY EXTRACTION RULES:
1. STUDENT NAME: Extract from "विद्यार्थ्याचे नाव" or "तुझे नाव" field. If multiple students, create separate results.
2. SUBJECT: Extract from "विषय" field. Common: गणित, मराठी, परिसर अभ्यास (लेखी/तोंडी), इंग्रजी
3. CLASS: Extract from "इयत्ता" field (e.g., "इयत्ता- तिसरी" = Class 3)
4. TOTAL MARKS: Extract from "एकूण गुण" or visible mark allocation
5. DATE: Extract from "दिनांक" field if visible

GRADING STANDARDS:
1. MATHEMATICS: Check calculation accuracy step-by-step. Award full marks only if final answer AND working are correct.
2. FILL-IN-BLANKS: Exact match required. Accept minor spelling variations in Marathi.
3. SHORT ANSWERS: Check key concepts. Partial marks for incomplete but correct concepts.
4. Give 0 marks for: blank answers, completely wrong answers, conceptual errors.

FEEDBACK STYLE (VERY IMPORTANT - MAKE IT DETAILED AND COMPREHENSIVE):
- Write a DETAILED feedback paragraph (minimum 150-200 words) in warm, encouraging Marathi (मराठी)
- Structure the feedback as follows:
  1. Start with 2-3 sentences praising what the student did exceptionally well
  2. Provide specific observations about their problem-solving approach
  3. Identify 2-3 specific areas needing improvement with clear explanations
  4. Give concrete, actionable next steps for improvement
  5. End with an encouraging motivational message
- The feedback should feel like a caring teacher's personalized assessment

ANALYSIS STYLE (FOR EACH QUESTION):
- Provide DETAILED analysis for each question (minimum 50-80 words per question)
- Include:
  1. What concept the question tests
  2. How the student approached it
  3. Where exactly they went wrong (if applicable)
  4. The correct method/approach explained step-by-step
  5. Tips for avoiding similar mistakes
- Make the analysis educational and helpful for understanding

OUTPUT FORMAT: JSON array. One GradingResult per student. Every question must have its own correction entry.
NEVER skip questions. NEVER combine questions. NEVER guess names - use "Unknown Student" if unclear.
IMPORTANT: Generate COMPREHENSIVE, DETAILED content - avoid short or brief responses.`;

  return callWithRetry(async () => {
    const response = await generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          {
            text: `कृपया हा दस्तऐवज काळजीपूर्वक वाचा आणि विश्लेषण करा:

1. विद्यार्थ्याचे नाव, विषय, इयत्ता आणि दिनांक ओळखा
2. प्रत्येक प्रश्नाचे स्वतंत्रपणे विश्लेषण करा - एकही प्रश्न गाळू नका
3. गणिताच्या प्रश्नांसाठी, विद्यार्थ्याच्या गणनाची प्रत्येक पायरी तपासा
4. योग्य उत्तर आणि विद्यार्थ्याने लिहिलेले उत्तर दोन्ही नमूद करा
5. प्रत्येक प्रश्नासाठी मिळालेले गुण आणि एकूण गुण नोंदवा
6. शेवटी उपयुक्त आणि प्रोत्साहक अभिप्राय द्या (मराठीत)

जर एकापेक्षा जास्त विद्यार्थ्यांची उत्तरपत्रिका असेल, तर प्रत्येकासाठी स्वतंत्र अहवाल तयार करा.`,
          },
        ],
      },
      config: {
        systemInstruction,
        temperature: 0.1,
        maxOutputTokens: 24576,
        thinkingConfig: {
          thinkingBudget: GEMINI_ANALYZE_THINKING_BUDGET,
        },
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              studentName: { type: SchemaType.STRING },
              subject: { type: SchemaType.STRING },
              score: { type: SchemaType.NUMBER },
              totalMarks: { type: SchemaType.NUMBER },
              feedback: { type: SchemaType.STRING },
              className: { type: SchemaType.STRING },
              schoolName: { type: SchemaType.STRING },
              examType: { type: SchemaType.STRING },
              rollNumber: { type: SchemaType.STRING },
              corrections: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    questionNo: { type: SchemaType.STRING },
                    questionText: { type: SchemaType.STRING },
                    studentAnswer: { type: SchemaType.STRING },
                    correctAnswer: { type: SchemaType.STRING },
                    marksObtained: { type: SchemaType.NUMBER },
                    maxMarks: { type: SchemaType.NUMBER },
                    analysis: { type: SchemaType.STRING },
                  },
                  required: [
                    "questionNo",
                    "questionText",
                    "studentAnswer",
                    "correctAnswer",
                    "marksObtained",
                    "maxMarks",
                    "analysis",
                  ],
                },
              },
              weakAreas: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
            },
            required: [
              "studentName",
              "subject",
              "score",
              "totalMarks",
              "feedback",
              "corrections",
              "weakAreas",
              "className",
              "rollNumber",
              "examType",
            ],
          },
        },
      },
    });

    const results = JSON.parse(cleanJsonText(extractResponseText(response)));
    return results.map((result: GradingResult) => ({
      ...result,
      date: result.date || new Date().toISOString(),
    }));
  }, GEMINI_ANALYZE_MAX_RETRIES);
}

export async function generateLearningPlan(
  result: GradingResult,
  days: number,
  dailyMinutes: number,
  language = "mr",
  teacherPrompt?: string,
): Promise<LearningPlan> {
  const languageLabel = language === "en" ? "English" : "Marathi";
  const languageNote =
    language === "en"
      ? "Write the plan in simple English that any parent can understand."
      : "Write the plan in simple Marathi that any parent can understand.";

  const teacherNote = teacherPrompt?.trim()
    ? `\n\nTEACHER INSTRUCTIONS (follow these exactly):\n${teacherPrompt.trim()}`
    : "";

  const systemInstruction = `You are an expert primary-school learning designer and student remediation specialist.

Create a parent-friendly home revision plan for ${result.studentName}.

Rules:
- Focus strongly on the weak areas.
- Keep language simple, clear, fun, and practical.
- Use only household items.
- Make each day slightly more advanced than the previous day.
- Prefer real-life practice with counting, grouping, money, time, measuring, reading, writing, and movement when relevant.
- No punishment language.
- Build confidence.
- Output only valid JSON matching the response schema.

For each day, make the content feel like a child-friendly mission.
Each activity should implicitly cover:
- Day Title
- Learning Goal
- Materials Needed
- Fun Activity
- Practice Questions
- Parent Checkpoint
- Reward / Motivation
- Difficulty Progression

${languageNote}${teacherNote}`;

  const prompt = `Subject: ${result.subject}
Grade/Class: ${result.className || "Not provided"}
Board/Curriculum: ${result.schoolName || "Not provided"}
Total Score: ${result.score}
Max Score: ${result.totalMarks}
Weak Areas: ${result.weakAreas.join(", ") || "General revision"}
Number of Questions: ${result.corrections.length}
Duration: ${days} days
Daily Study Time: ${dailyMinutes} minutes
Language: ${languageLabel}

Create a ${days}-day home learning plan. Keep every day engaging, measurable, and parent-friendly.
Each day should begin from basics if the score is low, mix revision and challenge if the score is medium, and add enrichment if the score is high.
Make sure each day's activity title is creative and motivating, and that the practice questions are short and age-appropriate.`;

  return callWithRetry(async () => {
    const response = await generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            weakAreas: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
            timeline: { type: SchemaType.STRING },
            dailyTime: { type: SchemaType.STRING },
            activities: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  day: { type: SchemaType.INTEGER },
                  title: { type: SchemaType.STRING },
                  whatIsNeeded: { type: SchemaType.STRING },
                  howToDo: { type: SchemaType.STRING },
                  guidelines: { type: SchemaType.STRING },
                },
                required: [
                  "day",
                  "title",
                  "whatIsNeeded",
                  "howToDo",
                  "guidelines",
                ],
              },
            },
          },
          required: ["weakAreas", "activities", "timeline", "dailyTime"],
        },
      },
    });

    return JSON.parse(cleanJsonText(extractResponseText(response)));
  });
}

export async function complexEducationalQuery(
  query: string,
  useThinking = true,
): Promise<string> {
  return callWithRetry(async () => {
    const response = await generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: query,
      config: {
        systemInstruction:
          "तुम्ही 'गुरुजी AI' आहात. सखोल आणि कल्पक मराठी मार्गदर्शन करा.",
        thinkingConfig: { thinkingBudget: useThinking ? 32768 : 0 },
      },
    });

    return extractResponseText(response);
  });
}

export async function searchGroundingQuery(
  query: string,
): Promise<{ text: string; sources: any[] }> {
  return callWithRetry(async () => {
    const response = await generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return {
      text: extractResponseText(response),
      sources:
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
    };
  });
}

export async function translateGradingResultToEnglish(
  result: GradingResult,
): Promise<GradingResult> {
  const systemInstruction = `You are a professional translator specializing in educational content.
Your task is to translate a student grading report from Marathi to English.

RULES:
1. Translate ALL Marathi text to clear, natural English
2. Keep the student's name as-is (do not transliterate names)
3. Translate subject names to English (गणित → Mathematics, मराठी → Marathi Language, परिसर अभ्यास → Environmental Studies, इंग्रजी → English)
4. Maintain the warm, encouraging tone in translations
5. Preserve all numbers, scores, and marks exactly as they are
6. Translate questionText, studentAnswer, correctAnswer, analysis, and feedback fields
7. Translate weakAreas array items
8. Keep the same detailed, comprehensive style in English
9. If any text is already in English, keep it as-is

OUTPUT: Return the complete translated JSON object with the same structure.`;

  const prompt = `Translate this grading result from Marathi to English. Return ONLY valid JSON:

${JSON.stringify(result, null, 2)}`;

  return callWithRetry(async () => {
    const response = await generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        maxOutputTokens: 32000,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            studentName: { type: SchemaType.STRING },
            subject: { type: SchemaType.STRING },
            score: { type: SchemaType.NUMBER },
            totalMarks: { type: SchemaType.NUMBER },
            feedback: { type: SchemaType.STRING },
            className: { type: SchemaType.STRING },
            schoolName: { type: SchemaType.STRING },
            examType: { type: SchemaType.STRING },
            rollNumber: { type: SchemaType.STRING },
            date: { type: SchemaType.STRING },
            corrections: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  questionNo: { type: SchemaType.STRING },
                  questionText: { type: SchemaType.STRING },
                  studentAnswer: { type: SchemaType.STRING },
                  correctAnswer: { type: SchemaType.STRING },
                  marksObtained: { type: SchemaType.NUMBER },
                  maxMarks: { type: SchemaType.NUMBER },
                  analysis: { type: SchemaType.STRING },
                },
                required: [
                  "questionNo",
                  "questionText",
                  "studentAnswer",
                  "correctAnswer",
                  "marksObtained",
                  "maxMarks",
                  "analysis",
                ],
              },
            },
            weakAreas: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
          },
          required: [
            "studentName",
            "subject",
            "score",
            "totalMarks",
            "feedback",
            "corrections",
            "weakAreas",
          ],
        },
      },
    });

    const translated = JSON.parse(cleanJsonText(extractResponseText(response)));
    return {
      ...result,
      ...translated,
      date: result.date,
      learningPlan: result.learningPlan,
    };
  });
}

export async function translateGradingResultToMarathi(
  result: GradingResult,
): Promise<GradingResult> {
  const systemInstruction = `You are a professional translator specializing in educational content.
Your task is to translate a student grading report to Marathi.

RULES:
1. Translate ALL user-facing English text to clear, natural Marathi.
2. Keep the student's name as-is (do not transliterate names unless already in Marathi).
3. Translate subject names naturally into Marathi when needed.
4. Maintain the same warm, encouraging tone.
5. Preserve all numbers, scores, marks, and dates exactly as they are.
6. Translate questionText, studentAnswer, correctAnswer, analysis, feedback, weakAreas, className, schoolName, and examType.
7. If any text is already in Marathi, keep it as-is.
8. Return only JSON with the same structure.

OUTPUT: Return the complete translated JSON object with the same structure.`;

  const prompt = `Translate this grading result to Marathi. Return ONLY valid JSON:

${JSON.stringify(result, null, 2)}`;

  return callWithRetry(async () => {
    const response = await generateContent({
      model: DEFAULT_GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        maxOutputTokens: 32000,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            studentName: { type: SchemaType.STRING },
            subject: { type: SchemaType.STRING },
            score: { type: SchemaType.NUMBER },
            totalMarks: { type: SchemaType.NUMBER },
            feedback: { type: SchemaType.STRING },
            className: { type: SchemaType.STRING },
            schoolName: { type: SchemaType.STRING },
            examType: { type: SchemaType.STRING },
            rollNumber: { type: SchemaType.STRING },
            date: { type: SchemaType.STRING },
            corrections: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  questionNo: { type: SchemaType.STRING },
                  questionText: { type: SchemaType.STRING },
                  studentAnswer: { type: SchemaType.STRING },
                  correctAnswer: { type: SchemaType.STRING },
                  marksObtained: { type: SchemaType.NUMBER },
                  maxMarks: { type: SchemaType.NUMBER },
                  analysis: { type: SchemaType.STRING },
                },
                required: [
                  "questionNo",
                  "questionText",
                  "studentAnswer",
                  "correctAnswer",
                  "marksObtained",
                  "maxMarks",
                  "analysis",
                ],
              },
            },
            weakAreas: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
          },
          required: [
            "studentName",
            "subject",
            "score",
            "totalMarks",
            "feedback",
            "corrections",
            "weakAreas",
          ],
        },
      },
    });

    const translated = JSON.parse(cleanJsonText(extractResponseText(response)));
    return {
      ...result,
      ...translated,
      date: result.date,
      learningPlan: result.learningPlan,
    };
  });
}
