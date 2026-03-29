import { GradingResult, LearningPlan } from "@tali/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

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

      if (
        errorString.includes("429") ||
        errorString.includes("RESOURCE_EXHAUSTED")
      ) {
        const waitTime = Math.pow(2, attempt + 1) * 2000 + Math.random() * 1000;
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

FEEDBACK STYLE:
- Write in warm, encouraging Marathi (मराठी)
- Start with what the student did well
- Point out specific areas needing improvement
- Suggest concrete next steps

OUTPUT FORMAT: JSON array. One GradingResult per student. Every question must have its own correction entry.
NEVER skip questions. NEVER combine questions. NEVER guess names - use "Unknown Student" if unclear.`;

  return callWithRetry(async () => {
    const response = await generateContent({
      model: "gemini-3-flash-preview",
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
        maxOutputTokens: 65000,
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
            ],
          },
        },
      },
    });

    const results = JSON.parse(cleanJsonText(extractResponseText(response)));
    return results.map((result: GradingResult) => ({
      ...result,
      date: new Date().toISOString(),
    }));
  });
}

export async function generateLearningPlan(
  result: GradingResult,
  days: number,
  dailyMinutes: number,
): Promise<LearningPlan> {
  const systemInstruction = `Identity: Guruji AI (Creative Education Visionary).
Goal: Create a HYPER-CREATIVE Learning Improvement Plan (LIP) for ${result.studentName} in Marathi.

STRICT DESIGN RULES:
1. ANTI-ACADEMIC: Absolutely NO reading textbooks, NO writing in notebooks, NO standard worksheets.
2. CREATIVITY MANDATE: Design activities that feel like 'Play' or 'Quests'.
3. HOUSEHOLD PROPS: Use shadows, mirrors, stones, pulses, spoons, or pillows as learning tools.
4. ROLE-PLAY: Encourage activities like "Be a Scientist", "Explain to a Puppet", or "Build a Model".
5. TOPIC FOCUS: Target these gaps: ${result.weakAreas.join(", ")}.
6. TONE: Exciting, fun, and easy for a child to follow.

Output format (Simple Marathi):
- title: A fun name for the mission.
- whatIsNeeded: Simple household items.
- howToDo: Step-by-step game instructions.
- guidelines: Tips for the 'Guide' (Parent/Teacher) to keep it joyful.

Output ONLY valid JSON.`;

  const prompt = `विषय: ${result.subject}. कमकुवत दुवे: ${result.weakAreas.join(", ")}.
कालावधी: ${days} दिवस, वेळ: ${dailyMinutes} मि.
कृपया एक रंजक आणि कल्पक कृती-आराखडा तयार करा जो मुलाला अभ्यासासारखा वाटणार नाही.`;

  return callWithRetry(async () => {
    const response = await generateContent({
      model: "gemini-3-flash-preview",
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
      model: "gemini-3-pro-preview",
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
      model: "gemini-3-flash-preview",
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
