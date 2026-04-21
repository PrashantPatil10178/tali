"use client";
import { useTheme } from "next-themes";
import React from "react";
import { ActiveThemeProvider } from "../themes/active-theme";
import QueryProvider from "./query-provider";
import { LanguageProvider } from "@/lib/LanguageContext";

export default function Providers({
  activeThemeValue,
  children,
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <LanguageProvider>
          <QueryProvider>{children}</QueryProvider>
        </LanguageProvider>
      </ActiveThemeProvider>
    </>
  );
}
