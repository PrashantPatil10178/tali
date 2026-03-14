import Link from "next/link";
import React from "react";

interface AuthShellProps {
  readonly title: string;
  readonly subtitle: string;
  readonly heroTitle: string;
  readonly heroDescription: string;
  readonly heroQuote: string;
  readonly heroAuthor: string;
  readonly languageLabel: string;
  readonly topLinkHref: string;
  readonly topLinkLabel: string;
  readonly footerText: string;
  readonly footerLinkHref: string;
  readonly footerLinkLabel: string;
  readonly onToggleLanguage: () => void;
  readonly children: React.ReactNode;
}

export default function AuthShell({
  title,
  subtitle,
  heroTitle,
  heroDescription,
  heroQuote,
  heroAuthor,
  languageLabel,
  topLinkHref,
  topLinkLabel,
  footerText,
  footerLinkHref,
  footerLinkLabel,
  onToggleLanguage,
  children,
}: AuthShellProps) {
  return (
    <div className="h-screen overflow-hidden bg-(--color-bg-light) text-(--color-text-light) antialiased">
      <div className="flex h-full flex-col lg:flex-row">
        <section className="auth-hero-panel hidden h-full lg:flex lg:w-[48%] xl:w-1/2">
          <div className="auth-hero-glow auth-hero-glow-left" />
          <div className="auth-hero-glow auth-hero-glow-right" />
          <div className="relative z-10 flex max-w-2xl flex-col justify-center px-16 py-20 xl:px-24">
            <div className="auth-hero-badge">AI Teacher Workspace</div>
            <div className="mb-8 inline-flex size-16 items-center justify-center rounded-2xl bg-white/12 backdrop-blur-md">
              <svg
                aria-hidden="true"
                className="size-8"
                fill="none"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.578 8.578C5.528 11.628 3.451 15.515 2.61 19.745c-.842 4.23-.41 8.616 1.241 12.601 1.651 3.985 4.446 7.392 8.033 9.788C15.47 44.531 19.686 45.81 24 45.81c4.314 0 8.53-1.279 12.117-3.676 3.586-2.396 6.382-5.803 8.032-9.788 1.651-3.985 2.083-8.37 1.242-12.6-.842-4.231-2.92-8.118-5.97-11.168L24 24 8.578 8.578Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h1 className="font-display text-5xl font-extrabold leading-tight text-white xl:text-6xl">
              {heroTitle}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-indigo-100/90 xl:text-xl">
              {heroDescription}
            </p>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              <div className="auth-hero-stat">
                <span className="auth-hero-stat-value">24/7</span>
                <span className="auth-hero-stat-label">Insight support</span>
              </div>
              <div className="auth-hero-stat">
                <span className="auth-hero-stat-value">Smart</span>
                <span className="auth-hero-stat-label">Class analysis</span>
              </div>
              <div className="auth-hero-stat">
                <span className="auth-hero-stat-value">Secure</span>
                <span className="auth-hero-stat-label">Teacher access</span>
              </div>
            </div>
            <div className="mt-12 max-w-md rounded-3xl border border-white/12 bg-white/8 p-6 backdrop-blur-sm">
              <div className="mb-3 flex gap-1 text-amber-300">
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
              </div>
              <p className="text-sm leading-7 text-indigo-50/90">{heroQuote}</p>
              <p className="mt-4 text-sm font-semibold text-white">
                {heroAuthor}
              </p>
            </div>
          </div>
        </section>

        <section className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <div className="auth-mobile-hero shrink-0 lg:hidden">
            <div className="auth-mobile-hero-inner">
              <div className="auth-hero-badge auth-hero-badge-mobile">
                AI Teacher Workspace
              </div>
              <h1 className="font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
                {heroTitle}
              </h1>
              <p className="mt-3 max-w-md text-sm leading-7 text-indigo-100/90 sm:text-base">
                {heroDescription}
              </p>
            </div>
          </div>

          <header className="shrink-0 flex items-center justify-between gap-4 px-5 py-4 sm:px-6 lg:px-12 lg:py-5">
            <Link className="group flex items-center gap-3" href="/">
              <div className="flex size-11 items-center justify-center rounded-xl bg-(--color-primary) text-white shadow-lg shadow-indigo-500/20 transition-transform group-hover:scale-105">
                <svg
                  aria-hidden="true"
                  className="size-6"
                  fill="none"
                  viewBox="0 0 48 48"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.578 8.578C5.528 11.628 3.451 15.515 2.61 19.745c-.842 4.23-.41 8.616 1.241 12.601 1.651 3.985 4.446 7.392 8.033 9.788C15.47 44.531 19.686 45.81 24 45.81c4.314 0 8.53-1.279 12.117-3.676 3.586-2.396 6.382-5.803 8.032-9.788 1.651-3.985 2.083-8.37 1.242-12.6-.842-4.231-2.92-8.118-5.97-11.168L24 24 8.578 8.578Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div>
                <p className="font-display text-2xl font-black tracking-tight">
                  TALI
                </p>
                <p className="text-xs font-medium text-slate-500">
                  AI Education Platform
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3 sm:gap-4 lg:gap-6">
              <button
                className="auth-language-toggle"
                onClick={onToggleLanguage}
                type="button"
              >
                <span className="text-base">🌐</span>
                <span>{languageLabel}</span>
              </button>
              <Link
                className="text-right text-sm font-semibold text-(--color-primary) transition-opacity hover:opacity-80"
                href={topLinkHref}
              >
                {topLinkLabel}
              </Link>
            </div>
          </header>

          <main className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-12 lg:py-8">
            <div className="w-full max-w-115 space-y-5 sm:space-y-6 lg:my-auto">
              <div>
                <h2 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl dark:text-slate-50">
                  {title}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-7 text-slate-500 sm:text-base dark:text-slate-400">
                  {subtitle}
                </p>
              </div>

              <div className="auth-form-card">{children}</div>

              <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                {footerText}{" "}
                <Link
                  className="font-bold text-(--color-primary) hover:underline"
                  href={footerLinkHref}
                >
                  {footerLinkLabel}
                </Link>
              </p>
            </div>
          </main>

          <footer className="shrink-0 px-6 pb-4 text-center text-xs text-slate-400 lg:px-12 lg:pb-5 dark:text-slate-600">
            © 2026 TALI AI Education Platform. All rights reserved.
          </footer>
        </section>
      </div>
    </div>
  );
}
