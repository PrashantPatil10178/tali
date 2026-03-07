import { GoogleGenAI, Type } from "@google/genai";
import { GradingResult, LearningPlan } from "@tali/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createClient = () => {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing Gemini API key. Set GEMINI_API_KEY in your environment.",
    );
  }

  return new GoogleGenAI({ apiKey });
};

async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const errorStr = JSON.stringify(error);

      if (errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED")) {
        const waitTime = Math.pow(2, i + 1) * 2000 + Math.random() * 1000;
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
  const ai = createClient();
  const [header, base64Data] = dataUrl.split(",");
  const mimeType = header.match(/:(.*?);/)?.[1] || "image/jpeg";

  const systemInstruction = `Identity: Guruji AI (The Infallible Auditor).
Role: You are a strict, perfectionist school examiner.
Mandatory Scanning Rules:
1. TOTAL SCAN: You MUST scan the document from top to bottom. Identify every single question number, even if written small or unclearly.
2. ZERO OMISSION: If there are 20 questions, you must provide 20 correction objects. Skipping any question is a critical failure.
3. MULTI-PAGE AWARENESS: Treat the entire input as a continuous set of answers.
4. GRADING: Be extremely strict but fair. 0 marks for conceptually wrong answers. Give partial marks ONLY if the logic is partially correct.
5. LADDER OF FEEDBACK: Use warm, encouraging Marathi. Value the effort, then state specific concerns about gaps.
6. FORMAT: Output MUST be a JSON array of GradingResult objects.

CRITICAL: Never summarize multiple questions into one. Every question gets its own entry.
Output ONLY valid JSON.`;

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          {
            text: "प्रत्येक प्रश्नाचे स्वतंत्रपणे विश्लेषण करा. एकही प्रश्न गाळू नका. सर्व विद्यार्थ्यांची नावे ओळखा आणि स्वतंत्र अहवाल तयार करा.",
          },
        ],
      },
      config: {
        systemInstruction,
        temperature: 0.1,
        maxOutputTokens: 65000,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              studentName: { type: Type.STRING },
              subject: { type: Type.STRING },
              score: { type: Type.NUMBER },
              totalMarks: { type: Type.NUMBER },
              feedback: { type: Type.STRING },
              corrections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionNo: { type: Type.STRING },
                    questionText: { type: Type.STRING },
                    studentAnswer: { type: Type.STRING },
                    correctAnswer: { type: Type.STRING },
                    marksObtained: { type: Type.NUMBER },
                    maxMarks: { type: Type.NUMBER },
                    analysis: { type: Type.STRING },
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
              weakAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
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

    let cleanedText = response.text.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText
        .replace(/^```json\n?/, "")
        .replace(/\n?```$/, "");
    }

    const results = JSON.parse(cleanedText);
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
  const ai = createClient();

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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weakAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            timeline: { type: Type.STRING },
            dailyTime: { type: Type.STRING },
            activities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  whatIsNeeded: { type: Type.STRING },
                  howToDo: { type: Type.STRING },
                  guidelines: { type: Type.STRING },
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

    return JSON.parse(response.text.trim());
  });
}

export async function complexEducationalQuery(
  query: string,
  useThinking = true,
): Promise<string> {
  const ai = createClient();

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: query,
      config: {
        systemInstruction:
          "तुम्ही 'गुरुजी AI' आहात. सखोल आणि कल्पक मराठी मार्गदर्शन करा.",
        thinkingConfig: { thinkingBudget: useThinking ? 32768 : 0 },
      },
    });

    return response.text;
  });
}

export async function searchGroundingQuery(
  query: string,
): Promise<{ text: string; sources: any[] }> {
  const ai = createClient();

  return callWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: { tools: [{ googleSearch: {} }] },
    });

    return {
      text: response.text,
      sources:
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
    };
  });
}
