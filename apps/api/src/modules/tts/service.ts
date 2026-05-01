/**
 * Sarvam AI Text-to-Speech service
 *
 * Uses the Bulbul v3 model via POST https://api.sarvam.ai/text-to-speech.
 * Returns decoded MP3 audio as a Buffer.
 */

const SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech";

/** Maximum characters per Sarvam TTS request (bulbul:v3 limit) */
const SARVAM_CHUNK_SIZE = 2500;

const LANGUAGE_CODE_MAP: Record<string, string> = {
  en: "en-IN",
  mr: "mr-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  gu: "gu-IN",
  pa: "pa-IN",
  or: "or-IN",
};

/**
 * Speaker that works well for both en-IN and mr-IN.
 * Full list: https://docs.sarvam.ai/api-reference-docs/getting-started/models/bulbul
 */
const DEFAULT_SPEAKER = "meera";

interface SarvamTtsResponse {
  request_id: string;
  audios: string[]; // base64-encoded audio
}

/**
 * Split text into chunks no larger than maxLen, breaking on sentence/word
 * boundaries where possible.
 */
const chunkText = (text: string, maxLen: number): string[] => {
  if (text.length <= maxLen) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    // Try to break on a sentence boundary within the allowed window
    const window = remaining.slice(0, maxLen);
    const lastSentence = Math.max(
      window.lastIndexOf(". "),
      window.lastIndexOf("। "), // Devanagari danda
      window.lastIndexOf("! "),
      window.lastIndexOf("? "),
    );

    const breakAt =
      lastSentence > maxLen * 0.5 ? lastSentence + 2 : maxLen;

    chunks.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }

  return chunks;
};

/**
 * Call the Sarvam TTS REST API for a single chunk and return the base64
 * audio string.
 */
const callSarvamTts = async (
  apiKey: string,
  text: string,
  languageCode: string,
): Promise<string> => {
  const response = await fetch(SARVAM_TTS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": apiKey,
    },
    body: JSON.stringify({
      inputs: [text],
      target_language_code: languageCode,
      speaker: DEFAULT_SPEAKER,
      model: "bulbul:v3",
      output_audio_codec: "mp3",
      speech_sample_rate: 22050,
      pace: 1.0,
      loudness: 1.5,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "(no body)");
    throw new Error(
      `Sarvam TTS API error ${response.status}: ${errorBody}`,
    );
  }

  const data = (await response.json()) as SarvamTtsResponse;

  if (!data.audios || data.audios.length === 0) {
    throw new Error("Sarvam TTS returned empty audio array");
  }

  return data.audios[0];
};

/**
 * Convert text to MP3 audio using Sarvam AI Bulbul v3.
 *
 * @param text     - The text to synthesise (any length; chunked automatically)
 * @param locale   - "en" | "mr" (or any supported Sarvam language short code)
 * @returns        - Buffer containing concatenated MP3 audio
 */
export const textToSpeech = async (
  text: string,
  locale: string = "en",
): Promise<Buffer> => {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    throw new Error(
      "SARVAM_API_KEY is not set. Add it to apps/api/.env to enable TTS.",
    );
  }

  const languageCode = LANGUAGE_CODE_MAP[locale] ?? "en-IN";
  const chunks = chunkText(text.trim(), SARVAM_CHUNK_SIZE);

  // Process chunks sequentially to respect rate-limits
  const audioChunks: Buffer[] = [];
  for (const chunk of chunks) {
    if (!chunk) continue;
    const base64Audio = await callSarvamTts(apiKey, chunk, languageCode);
    audioChunks.push(Buffer.from(base64Audio, "base64"));
  }

  return Buffer.concat(audioChunks);
};
