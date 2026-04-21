import { GradingResult } from "@tali/types";
import { mkdtemp, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "url";
import {
  translateGradingResultToEnglish,
  translateGradingResultToMarathi,
} from "../gemini/service";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

const MINIMAX_SCRIPTS_ROOT = path.resolve(
  __dirname,
  "../../../../../.agents/skills/minimax-pdf/scripts",
);

const API_FONTS_DIR = path.resolve(__dirname, "../../fonts");
const DEVANAGARI_REGULAR = path.join(
  API_FONTS_DIR,
  "NotoSansDevanagari-Regular.ttf",
);
const DEVANAGARI_BOLD = path.join(API_FONTS_DIR, "NotoSansDevanagari-Bold.ttf");

const CHILD_FRIENDLY_ACCENT = "#FF7A45";
const CHILD_FRIENDLY_COVER_BG = "#FFF3E0";

const escapeArg = (value: string): string => value.replace(/"/g, '\\"');

const escapeParagraphText = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

const toParagraphText = (value: string): string => {
  const segments: string[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(/\*\*(.+?)\*\*/g)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      segments.push(escapeParagraphText(value.slice(lastIndex, matchIndex)));
    }

    segments.push(`<b>${escapeParagraphText(match[1])}</b>`);
    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < value.length) {
    segments.push(escapeParagraphText(value.slice(lastIndex)));
  }

  return segments.join("");
};

const getResultDisplayName = (
  result: GradingResult,
  locale: "en" | "mr",
): string => {
  const studentName = result.studentName?.trim();
  if (studentName) {
    return studentName;
  }

  const subject = result.subject?.trim();
  if (subject) {
    return subject;
  }

  return locale === "mr" ? "विद्यार्थी अहवाल" : "Student Report";
};

export const mapGradingResultToMinimaxContent = (
  result: GradingResult,
  locale: "en" | "mr",
) => {
  const isMarathi = locale === "mr";
  const L = isMarathi
    ? {
        reportTitle: "विद्यार्थी विश्लेषण अहवाल",
        subject: "विषय",
        aiFeedback: "AI अभिप्राय",
        weakAreas: "कमकुवत क्षेत्रे",
        corrections: "प्रश्नवार दुरुस्त्या",
        qNo: "प्र.क्र.",
        marks: "गुण",
        examType: "परीक्षेचा प्रकार",
        question: "प्रश्न",
        answer: "विद्यार्थ्याचे उत्तर",
        correctAnswer: "बरोबर उत्तर",
        analysis: "विश्लेषण",
      }
    : {
        reportTitle: "Student Analysis Report",
        subject: "Subject",
        aiFeedback: "AI Feedback",
        weakAreas: "Weak Areas",
        corrections: "Question-wise Corrections",
        qNo: "Q#",
        marks: "Marks",
        examType: "Exam Type",
        question: "Question",
        answer: "Student Answer",
        correctAnswer: "Correct Answer",
        analysis: "Analysis",
      };

  const out: any[] = [];
  out.push({ type: "h1", text: getResultDisplayName(result, locale) });
  out.push({ type: "h2", text: L.reportTitle });
  out.push({
    type: "body",
    text: toParagraphText(
      `**${L.subject}**: ${result.subject}  |  **${L.marks}**: ${result.score} / ${result.totalMarks}`,
    ),
  });

  if (result.examType) {
    out.push({
      type: "body",
      text: toParagraphText(`**${L.examType}**: ${result.examType}`),
    });
  }

  out.push({ type: "divider" });

  out.push({ type: "h2", text: L.aiFeedback });
  out.push({ type: "callout", text: toParagraphText(result.feedback) });

  if (result.weakAreas && result.weakAreas.length > 0) {
    out.push({ type: "h2", text: L.weakAreas });
    result.weakAreas.forEach((area: string) => {
      out.push({ type: "bullet", text: toParagraphText(area) });
    });
  }

  if (result.corrections && result.corrections.length > 0) {
    out.push({ type: "h2", text: L.corrections });
    result.corrections.forEach((c: any) => {
      out.push({ type: "h3", text: `${L.qNo} ${c.questionNo}` });
      out.push({
        type: "body",
        text: toParagraphText(`**${L.question}**: ${c.questionText}`),
      });
      out.push({
        type: "body",
        text: toParagraphText(`**${L.answer}**: ${c.studentAnswer}`),
      });
      out.push({
        type: "body",
        text: toParagraphText(`**${L.correctAnswer}**: ${c.correctAnswer}`),
      });
      out.push({
        type: "body",
        text: toParagraphText(
          `**${L.marks}**: ${c.marksObtained} / ${c.maxMarks}`,
        ),
      });
      out.push({
        type: "body",
        text: toParagraphText(`**${L.analysis}**: ${c.analysis}`),
      });
      out.push({ type: "spacer", pt: 10 });
    });
  }

  return out;
};

const buildTokensWithLocaleFonts = async (
  title: string,
  author: string,
  date: string,
  locale: "en" | "mr",
  tokensPath: string,
): Promise<void> => {
  const paletteCmd = [
    "python3",
    `\"${path.join(MINIMAX_SCRIPTS_ROOT, "palette.py")}\"`,
    `--title \"${escapeArg(title)}\"`,
    "--type magazine",
    `--accent \"${CHILD_FRIENDLY_ACCENT}\"`,
    `--cover-bg \"${CHILD_FRIENDLY_COVER_BG}\"`,
    `--author \"${escapeArg(author)}\"`,
    `--date \"${escapeArg(date)}\"`,
    `--out \"${tokensPath}\"`,
  ].join(" ");

  await execAsync(paletteCmd);

  if (locale !== "mr") {
    return;
  }

  const tokens = JSON.parse(await readFile(tokensPath, "utf8")) as Record<
    string,
    unknown
  >;

  tokens.font_display = "Noto Sans Devanagari";
  tokens.font_body = "Noto Sans Devanagari";
  tokens.gfonts_import =
    "https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap";
  tokens.font_display_rl = "NotoSansDevanagari-Bold";
  tokens.font_body_rl = "NotoSansDevanagari";
  tokens.font_body_b_rl = "NotoSansDevanagari-Bold";
  tokens.font_paths = {
    NotoSansDevanagari: DEVANAGARI_REGULAR,
    "NotoSansDevanagari-Bold": DEVANAGARI_BOLD,
  };

  await writeFile(tokensPath, JSON.stringify(tokens, null, 2), "utf8");
};

const normalizeResultForLocale = async (
  result: GradingResult,
  locale: "en" | "mr",
): Promise<GradingResult> => {
  try {
    if (locale === "en") {
      return await translateGradingResultToEnglish(result);
    }

    return await translateGradingResultToMarathi(result);
  } catch (error) {
    console.error("Locale normalization failed for PDF generation:", error);
    return result;
  }
};

const renderPdfWithPipeline = async (
  contentPath: string,
  outPath: string,
  title: string,
  author: string,
  date: string,
  locale: "en" | "mr",
): Promise<void> => {
  const tempDir = await mkdtemp(join(tmpdir(), "tali-minimax-run-"));
  const tokensPath = join(tempDir, "tokens.json");
  const coverHtmlPath = join(tempDir, "cover.html");
  const coverPdfPath = join(tempDir, "cover.pdf");
  const bodyPdfPath = join(tempDir, "body.pdf");

  await buildTokensWithLocaleFonts(title, author, date, locale, tokensPath);

  const coverCmd = [
    "python3",
    `\"${path.join(MINIMAX_SCRIPTS_ROOT, "cover.py")}\"`,
    `--tokens \"${tokensPath}\"`,
    `--out \"${coverHtmlPath}\"`,
  ].join(" ");

  await execAsync(coverCmd);

  const renderCoverCmd = [
    "node",
    `\"${path.join(MINIMAX_SCRIPTS_ROOT, "render_cover.js")}\"`,
    `--input \"${coverHtmlPath}\"`,
    `--out \"${coverPdfPath}\"`,
  ].join(" ");

  await execAsync(renderCoverCmd);

  const renderBodyCmd = [
    "python3",
    `\"${path.join(MINIMAX_SCRIPTS_ROOT, "render_body.py")}\"`,
    `--tokens \"${tokensPath}\"`,
    `--content \"${contentPath}\"`,
    `--out \"${bodyPdfPath}\"`,
  ].join(" ");

  await execAsync(renderBodyCmd);

  const mergeCmd = [
    "python3",
    `\"${path.join(MINIMAX_SCRIPTS_ROOT, "merge.py")}\"`,
    `--cover \"${coverPdfPath}\"`,
    `--body \"${bodyPdfPath}\"`,
    `--out \"${outPath}\"`,
    `--title \"${escapeArg(title)}\"`,
  ].join(" ");

  await execAsync(mergeCmd);
};

export const buildPdfMinimax = async (
  result: GradingResult,
  locale: "en" | "mr" = "en",
): Promise<Buffer> => {
  const localizedResult = await normalizeResultForLocale(result, locale);
  const displayName = getResultDisplayName(localizedResult, locale);
  const content = mapGradingResultToMinimaxContent(localizedResult, locale);
  const tempDir = await mkdtemp(join(tmpdir(), "tali-pdf-"));
  const contentPath = join(tempDir, "content.json");
  const outPath = join(tempDir, "output.pdf");

  await writeFile(contentPath, JSON.stringify(content, null, 2), "utf8");

  const L =
    locale === "mr" ? "विद्यार्थी विश्लेषण अहवाल" : "Student Analysis Report";

  try {
    await renderPdfWithPipeline(
      contentPath,
      outPath,
      `${displayName} - ${L}`,
      displayName,
      localizedResult.date,
      locale,
    );
    const pdfBuffer = await readFile(outPath);
    return pdfBuffer;
  } catch (error) {
    console.error("PDF Generation failed:", error);
    throw error;
  }
};

export const buildBulkPdfMinimax = async (
  results: GradingResult[],
  locale: "en" | "mr" = "en",
): Promise<Buffer> => {
  if (results.length === 0) return Buffer.from("");

  const localizedResults = await Promise.all(
    results.map((result) => normalizeResultForLocale(result, locale)),
  );

  const isMarathi = locale === "mr";
  const L = isMarathi
    ? "विद्यार्थी विश्लेषण अहवाल (Bulk)"
    : "Student Analysis Report (Bulk)";

  const allContent: any[] = [];
  localizedResults.forEach((result, index) => {
    allContent.push(...mapGradingResultToMinimaxContent(result, locale));
    if (index < localizedResults.length - 1) {
      allContent.push({ type: "pagebreak" });
    }
  });

  const tempDir = await mkdtemp(join(tmpdir(), "tali-pdf-bulk-"));
  const contentPath = join(tempDir, "content.json");
  const outPath = join(tempDir, "output.pdf");
  await writeFile(contentPath, JSON.stringify(allContent, null, 2), "utf8");

  try {
    await renderPdfWithPipeline(
      contentPath,
      outPath,
      L,
      "TALI",
      new Date().toISOString(),
      locale,
    );
    const pdfBuffer = await readFile(outPath);
    return pdfBuffer;
  } catch (error) {
    console.error("Bulk PDF Generation failed:", error);
    throw error;
  }
};
