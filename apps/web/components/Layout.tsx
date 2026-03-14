import React, { useEffect, useState } from "react";
import { AppSection } from "@tali/types";

interface LayoutProps {
  children: React.ReactNode;
  activeSection: AppSection;
  currentUserName?: string;
  currentUserRole?: string;
  isSigningOut?: boolean;
  onNavigate: (section: AppSection) => void;
  onSignOut?: () => void;
}

const getInitials = (value?: string): string => {
  if (!value) {
    return "TA";
  }

  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

type ShellLocale = "en" | "mr";
type ThemeMode = "light" | "dark";

interface NavigationItem {
  readonly section: AppSection;
  readonly icon:
    | "dashboard"
    | "students"
    | "curriculum"
    | "reports"
    | "resources"
    | "scan"
    | "chat"
    | "attendance";
  readonly label: Record<ShellLocale, string>;
  readonly shortLabel: Record<ShellLocale, string>;
}

const NAV_ITEMS: readonly NavigationItem[] = [
  {
    section: AppSection.DASHBOARD,
    icon: "dashboard",
    label: { en: "Dashboard", mr: "मुख्य फलक" },
    shortLabel: { en: "Home", mr: "मुख्य" },
  },
  {
    section: AppSection.STUDENTS,
    icon: "students",
    label: { en: "Students", mr: "विद्यार्थी" },
    shortLabel: { en: "Students", mr: "विद्यार्थी" },
  },
  {
    section: AppSection.HOMEWORK,
    icon: "curriculum",
    label: { en: "Curriculum", mr: "अभ्यासक्रम" },
    shortLabel: { en: "Curriculum", mr: "अभ्यास" },
  },
  {
    section: AppSection.HISTORY,
    icon: "reports",
    label: { en: "Reports", mr: "अहवाल" },
    shortLabel: { en: "Reports", mr: "अहवाल" },
  },
  {
    section: AppSection.KNOWLEDGE,
    icon: "resources",
    label: { en: "Resources", mr: "साधने" },
    shortLabel: { en: "Resources", mr: "साधने" },
  },
  {
    section: AppSection.ATTENDANCE,
    icon: "attendance",
    label: { en: "Attendance", mr: "हजेरी" },
    shortLabel: { en: "Attendance", mr: "हजेरी" },
  },
  {
    section: AppSection.SCAN,
    icon: "scan",
    label: { en: "Scanner", mr: "स्कॅनर" },
    shortLabel: { en: "Scan", mr: "स्कॅन" },
  },
  {
    section: AppSection.CHAT,
    icon: "chat",
    label: { en: "AI Chat", mr: "AI संवाद" },
    shortLabel: { en: "Chat", mr: "संवाद" },
  },
] as const;

const SECTION_META: Record<
  AppSection,
  { title: Record<ShellLocale, string>; subtitle: Record<ShellLocale, string> }
> = {
  [AppSection.DASHBOARD]: {
    title: { en: "Teacher Dashboard", mr: "शिक्षक डॅशबोर्ड" },
    subtitle: {
      en: "Track class health, performance trends, and action items in one place.",
      mr: "वर्गाची प्रगती, निकालाचे ट्रेंड आणि महत्त्वाच्या कृती एका ठिकाणी पहा.",
    },
  },
  [AppSection.STUDENTS]: {
    title: { en: "Students", mr: "विद्यार्थी" },
    subtitle: {
      en: "Browse learner profiles, notes, and assessment summaries.",
      mr: "विद्यार्थी प्रोफाइल, नोंदी आणि मूल्यांकन सारांश पहा.",
    },
  },
  [AppSection.HOMEWORK]: {
    title: { en: "Curriculum Studio", mr: "अभ्यासक्रम स्टुडिओ" },
    subtitle: {
      en: "Generate worksheets, homework, and class-ready learning plans.",
      mr: "वर्कशीट, गृहपाठ आणि वर्गासाठी तयार आराखडे तयार करा.",
    },
  },
  [AppSection.HISTORY]: {
    title: { en: "Reports", mr: "अहवाल" },
    subtitle: {
      en: "Review grading history and classroom trends over time.",
      mr: "तपासणीचा इतिहास आणि कालानुसार वर्गाची प्रगती पहा.",
    },
  },
  [AppSection.KNOWLEDGE]: {
    title: { en: "Resources", mr: "साधने" },
    subtitle: {
      en: "Manage textbooks, prompts, and AI-ready classroom knowledge.",
      mr: "पुस्तके, prompts आणि AI साठी वापरता येणारे अभ्याससाहित्य व्यवस्थापित करा.",
    },
  },
  [AppSection.ATTENDANCE]: {
    title: { en: "Attendance", mr: "हजेरी" },
    subtitle: {
      en: "Record attendance and monitor presence patterns across the class.",
      mr: "हजेरी नोंदवा आणि वर्गातील उपस्थितीचे ट्रेंड पाहा.",
    },
  },
  [AppSection.SCAN]: {
    title: { en: "Scanner", mr: "स्कॅनर" },
    subtitle: {
      en: "Upload answer sheets and generate structured grading instantly.",
      mr: "उत्तरपत्रिका अपलोड करा आणि लगेच संरचित तपासणी मिळवा.",
    },
  },
  [AppSection.CHAT]: {
    title: { en: "AI Assistant", mr: "AI सहाय्यक" },
    subtitle: {
      en: "Ask teaching questions, draft plans, and get classroom suggestions.",
      mr: "अध्यापनविषयक प्रश्न विचारा, आराखडे तयार करा आणि AI सूचना मिळवा.",
    },
  },
};

const renderNavIcon = (icon: NavigationItem["icon"]): React.JSX.Element => {
  switch (icon) {
    case "dashboard":
      return (
        <svg
          aria-hidden="true"
          className="size-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M4 13h7V4H4v9Zm0 7h7v-5H4v5Zm9 0h7v-9h-7v9Zm0-16v5h7V4h-7Z"
            fill="currentColor"
          />
        </svg>
      );
    case "students":
      return (
        <svg
          aria-hidden="true"
          className="size-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M16 11c1.66 0 2.99-1.57 2.99-3.5S17.66 4 16 4s-3 1.57-3 3.5S14.34 11 16 11ZM8 11c1.66 0 2.99-1.57 2.99-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11Zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-3.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V20h6v-3.5c0-2.33-4.67-3.5-7-3.5Z"
            fill="currentColor"
          />
        </svg>
      );
    case "curriculum":
      return (
        <svg
          aria-hidden="true"
          className="size-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M18 2H8a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2ZM8 20V4h10v16H8Zm-4-2V6H2v12c0 1.1.9 2 2 2h11v-2H4Z"
            fill="currentColor"
          />
        </svg>
      );
    case "reports":
      return (
        <svg
          aria-hidden="true"
          className="size-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M5 9.2h3V19H5V9.2Zm5.5-4.2h3V19h-3V5Zm5.5 7h3V19h-3v-7Z"
            fill="currentColor"
          />
        </svg>
      );
    case "resources":
      return (
        <svg
          aria-hidden="true"
          className="size-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M19 2H8c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2ZM8 17V4h11v13H8ZM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6Z"
            fill="currentColor"
          />
        </svg>
      );
    case "scan":
      return (
        <svg
          aria-hidden="true"
          className="size-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M7 3H5a2 2 0 0 0-2 2v2h2V5h2V3Zm12 0h-2v2h2v2h2V5a2 2 0 0 0-2-2ZM5 17H3v2a2 2 0 0 0 2 2h2v-2H5v-2Zm16 0v2h-2v2h2a2 2 0 0 0 2-2v-2h-2ZM7 7h10v10H7V7Z"
            fill="currentColor"
          />
        </svg>
      );
    case "chat":
      return (
        <svg
          aria-hidden="true"
          className="size-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2Zm2 5v2h12V9H6Zm0-3v2h12V6H6Zm0 6v2h8v-2H6Z"
            fill="currentColor"
          />
        </svg>
      );
    case "attendance":
      return (
        <svg
          aria-hidden="true"
          className="size-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 15H5V9h14v10Zm-2.59-7.58L11 16.83l-3.41-3.42L9 12l2 2 4-4 1.41 1.42Z"
            fill="currentColor"
          />
        </svg>
      );
  }
};

const Layout: React.FC<LayoutProps> = ({
  children,
  activeSection,
  currentUserName,
  currentUserRole,
  isSigningOut,
  onNavigate,
  onSignOut,
}) => {
  const initials = getInitials(currentUserName);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [locale, setLocale] = useState<ShellLocale>("en");
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  const activeMeta = SECTION_META[activeSection];

  const visibleNavItems = NAV_ITEMS;

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [activeSection]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("tali-theme");

    if (storedTheme === "dark" || storedTheme === "light") {
      setThemeMode(storedTheme);
      return;
    }

    // Keep dashboard in light mode by default unless user explicitly changes it.
    setThemeMode("light");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", themeMode === "dark");
    window.localStorage.setItem("tali-theme", themeMode);
  }, [themeMode]);

  const handleNavigate = (section: AppSection) => {
    onNavigate(section);
  };

  return (
    <div className="dashboard-shell-bg flex h-screen overflow-hidden">
      <div
        className={`dashboard-mobile-overlay lg:hidden ${isMobileSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <aside
        className={`dashboard-sidebar fixed inset-y-0 left-0 z-40 flex h-full flex-col border-r border-slate-200/70 bg-white/96 backdrop-blur-xl transition-[width,transform] duration-300 ease-out dark:border-slate-800/80 dark:bg-slate-950/94 lg:static lg:translate-x-0 ${isSidebarCollapsed ? "lg:w-24" : "lg:w-72"} ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} w-72`}
      >
        <div className="flex items-center justify-between gap-3 px-5 pb-5 pt-6">
          <button
            className="flex min-w-0 items-center gap-3 text-left"
            onClick={() => handleNavigate(AppSection.DASHBOARD)}
            type="button"
          >
            <div className="dashboard-brand-mark">
              <svg
                aria-hidden="true"
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 3 4 7v6c0 5 3.4 9.74 8 11 4.6-1.26 8-6 8-11V7l-8-4Zm-1 14-4-4 1.4-1.4 2.6 2.58 5.6-5.58L18 10l-7 7Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div
              className={`min-w-0 transition-opacity duration-200 ${isSidebarCollapsed ? "lg:opacity-0" : "opacity-100"}`}
            >
              <p className="font-display text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                TALI
              </p>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                AI Education Platform
              </p>
            </div>
          </button>

          <button
            aria-label={
              isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            className="dashboard-icon-button hidden lg:inline-flex"
            onClick={() => setIsSidebarCollapsed((value) => !value)}
            type="button"
          >
            <svg
              aria-hidden="true"
              className={`size-4 transition-transform duration-300 ${isSidebarCollapsed ? "rotate-180" : "rotate-0"}`}
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="m15 18-6-6 6-6"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>

        <nav className="dashboard-soft-scrollbar flex-1 space-y-1 overflow-y-auto px-4 pb-5">
          {visibleNavItems.map((item) => {
            const isActive = item.section === activeSection;

            return (
              <button
                aria-current={isActive ? "page" : undefined}
                className={`dashboard-nav-item ${isActive ? "dashboard-nav-item-active" : "dashboard-nav-item-idle"} ${isSidebarCollapsed ? "lg:justify-center" : ""}`}
                key={item.section}
                onClick={() => handleNavigate(item.section)}
                type="button"
              >
                <span
                  className={`dashboard-nav-icon ${isActive ? "dashboard-nav-icon-active" : ""}`}
                >
                  {renderNavIcon(item.icon)}
                </span>
                <span
                  className={`min-w-0 text-left transition-opacity duration-200 ${isSidebarCollapsed ? "lg:hidden" : "block"}`}
                >
                  <span className="block truncate text-sm font-semibold">
                    {item.label[locale]}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200/70 px-4 pb-4 pt-4 dark:border-slate-800/80">
          <div
            className={`dashboard-profile-card ${isSidebarCollapsed ? "lg:items-center lg:px-2" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="dashboard-avatar-chip">{initials}</div>
              <div className={`${isSidebarCollapsed ? "lg:hidden" : "block"}`}>
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {currentUserName || "Teacher"}
                </p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {currentUserRole || "Authenticated educator"}
                </p>
              </div>
            </div>
            {onSignOut ? (
              <button
                className={`dashboard-secondary-button mt-4 ${isSidebarCollapsed ? "lg:hidden" : ""}`}
                onClick={onSignOut}
                type="button"
              >
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </button>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="dashboard-topbar">
          <div className="flex min-w-0 items-center gap-3">
            <button
              aria-label="Open sidebar"
              className="dashboard-icon-button lg:hidden"
              onClick={() => setIsMobileSidebarOpen(true)}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 6h16M4 12h16M4 18h16"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
            <div className="hidden min-w-0 lg:block">
              <p className="text-sm font-bold text-slate-950 dark:text-white">
                {activeMeta.title[locale]}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {activeMeta.subtitle[locale]}
              </p>
            </div>
            <div className="dashboard-search hidden md:flex md:max-w-md md:flex-1">
              <svg
                aria-hidden="true"
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
              <input
                className="dashboard-search-input"
                placeholder={
                  locale === "en"
                    ? "Search students, subjects..."
                    : "विद्यार्थी, विषय शोधा..."
                }
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="dashboard-language-toggle">
              <button
                className={
                  locale === "en"
                    ? "dashboard-language-option-active"
                    : "dashboard-language-option"
                }
                onClick={() => setLocale("en")}
                type="button"
              >
                English
              </button>
              <button
                className={
                  locale === "mr"
                    ? "dashboard-language-option-active"
                    : "dashboard-language-option"
                }
                onClick={() => setLocale("mr")}
                type="button"
              >
                मराठी
              </button>
            </div>

            <div
              className="dashboard-theme-toggle"
              role="group"
              aria-label="Theme selector"
            >
              <button
                className={
                  themeMode === "light"
                    ? "dashboard-theme-option-active"
                    : "dashboard-theme-option"
                }
                onClick={() => setThemeMode("light")}
                type="button"
              >
                Light
              </button>
              <button
                className={
                  themeMode === "dark"
                    ? "dashboard-theme-option-active"
                    : "dashboard-theme-option"
                }
                onClick={() => setThemeMode("dark")}
                type="button"
              >
                Dark
              </button>
            </div>

            <button
              aria-label={
                themeMode === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              className="dashboard-icon-button"
              onClick={() =>
                setThemeMode((current) =>
                  current === "dark" ? "light" : "dark",
                )
              }
              type="button"
            >
              {themeMode === "dark" ? (
                <svg
                  aria-hidden="true"
                  className="size-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0L16.95 7.05M7.05 16.95l-1.414 1.414M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  className="size-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M21 12.79A9 9 0 1 1 11.21 3c-.04.33-.06.66-.06 1a8 8 0 0 0 8 8c.34 0 .67-.02 1-.06Z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
              )}
            </button>

            <button
              aria-label="Notifications"
              className="dashboard-icon-button relative"
              type="button"
            >
              <svg
                aria-hidden="true"
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-5h-1V11a6 6 0 1 0-12 0v6H5a1 1 0 0 0 0 2h14a1 1 0 1 0 0-2Z"
                  fill="currentColor"
                />
              </svg>
              <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-950" />
            </button>

            {activeSection === AppSection.DASHBOARD ? (
              <button
                className="dashboard-primary-button hidden sm:inline-flex"
                onClick={() => handleNavigate(AppSection.HISTORY)}
                type="button"
              >
                <svg
                  aria-hidden="true"
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 5v14m-7-7h14"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
                <span>{locale === "en" ? "New Report" : "नवीन अहवाल"}</span>
              </button>
            ) : null}

            <div className="dashboard-user-pill">
              <div className="dashboard-user-image">{initials.slice(0, 1)}</div>
              <div className="hidden min-w-0 xl:block">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {currentUserName || "Teacher"}
                </p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {currentUserRole || "Educator"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-soft-scrollbar flex-1 overflow-y-auto px-4 pb-6 pt-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-6">
          <div className="mx-auto w-full max-w-350">
            {activeSection !== AppSection.DASHBOARD ? (
              <div className="mb-6 rounded-[28px] border border-slate-200/70 bg-white/80 px-5 py-4 shadow-[0_18px_60px_-32px_rgba(15,23,42,0.22)] backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-950/70">
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                  {activeMeta.title[locale]}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                  {activeMeta.subtitle[locale]}
                </p>
              </div>
            ) : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
