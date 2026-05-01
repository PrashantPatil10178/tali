"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const getApiBaseUrl = (): string => {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"
  ).replace(/\/$/, "");
};

export interface UseSarvamTtsResult {
  /** True while the audio is actively playing */
  isSpeaking: boolean;
  /** True while the API request is in-flight */
  isLoading: boolean;
  /** Initiate TTS playback for the given text */
  speak: (text: string, locale?: string) => Promise<void>;
  /** Stop any current playback immediately */
  stop: () => void;
}

/**
 * React hook that provides Sarvam AI Text-to-Speech playback.
 *
 * Usage:
 * ```tsx
 * const { isSpeaking, isLoading, speak, stop } = useSarvamTts();
 * <button onClick={() => speak(feedbackText, "mr")}>Listen</button>
 * <button onClick={stop} disabled={!isSpeaking}>Stop</button>
 * ```
 */
export function useSarvamTts(): UseSarvamTtsResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /** Clean up any playing audio and revoke the object URL */
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  /** Abort any in-flight request */
  const abortRequest = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    abortRequest();
    cleanup();
    setIsLoading(false);
  }, [abortRequest, cleanup]);

  const speak = useCallback(
    async (text: string, locale: string = "en"): Promise<void> => {
      // Stop anything currently playing before starting a new request
      stop();

      if (!text.trim()) return;

      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);

      try {
        const response = await fetch(`${getApiBaseUrl()}/tts/speak`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, locale }),
          credentials: "include",
          signal: controller.signal,
        });

        if (!response.ok) {
          const err = await response.text().catch(() => "TTS request failed");
          throw new Error(err);
        }

        const blob = await response.blob();

        if (controller.signal.aborted) return;

        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;

        const audio = new Audio(objectUrl);
        audioRef.current = audio;

        audio.onended = () => {
          cleanup();
        };

        audio.onerror = () => {
          console.error("[useSarvamTts] Audio playback error");
          cleanup();
        };

        setIsLoading(false);
        setIsSpeaking(true);
        await audio.play();
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          // Intentionally cancelled — no-op
          return;
        }
        console.error("[useSarvamTts] speak failed:", error);
        setIsLoading(false);
        setIsSpeaking(false);
      }
    },
    [stop, cleanup],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      abortRequest();
      cleanup();
    };
  }, [abortRequest, cleanup]);

  return { isSpeaking, isLoading, speak, stop };
}
