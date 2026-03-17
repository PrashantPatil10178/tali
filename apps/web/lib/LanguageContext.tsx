"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { EN, MR } from "@/lib/i18n";

export type Locale = "en" | "mr";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [locale, setLocale] = useState<Locale>("en");
  const t = (key: string): string => {
    const dict = locale === "mr" ? MR : EN;
    return (
      (dict as Record<string, string>)[key] ??
      (EN as Record<string, string>)[key] ??
      key
    );
  };
  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
