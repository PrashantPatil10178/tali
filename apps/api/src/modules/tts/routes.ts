import { Elysia, t } from "elysia";
import { textToSpeech } from "./service";

export const ttsRoutes = new Elysia({ prefix: "/tts" }).post(
  "/speak",
  async ({ body, set }) => {
    try {
      const text = (body.text as string).trim();
      const locale = (body.locale as string) || "en";

      if (!text) {
        set.status = 400;
        return { success: false, error: "text is required" };
      }

      const audioBuffer = await textToSpeech(text, locale);

      set.headers["Content-Type"] = "audio/mpeg";
      set.headers["Content-Length"] = String(audioBuffer.length);
      set.headers["Cache-Control"] = "no-store";

      return audioBuffer;
    } catch (error) {
      console.error("[tts/speak] failed:", error);
      set.status = 500;
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "TTS generation failed",
      };
    }
  },
  {
    auth: true,
    body: t.Object({
      text: t.String(),
      locale: t.Optional(t.String()),
    }),
  },
);
