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

const TaliLogo = ({ className = "size-6" }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 48 48"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.578 8.578C5.528 11.628 3.451 15.515 2.61 19.745c-.842 4.23-.41 8.616 1.241 12.601 1.651 3.985 4.446 7.392 8.033 9.788C15.47 44.531 19.686 45.81 24 45.81c4.314 0 8.53-1.279 12.117-3.676 3.586-2.396 6.382-5.803 8.032-9.788 1.651-3.985 2.083-8.37 1.242-12.6-.842-4.231-2.92-8.118-5.97-11.168L24 24 8.578 8.578Z"
      fill="currentColor"
    />
  </svg>
);

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
    <div className="auth-shell">
      {/* Left Hero Panel - Desktop Only */}
      <section className="auth-hero-panel">
        {/* Ambient glow effects */}
        <div className="auth-hero-glow auth-hero-glow-1" />
        <div className="auth-hero-glow auth-hero-glow-2" />
        <div className="auth-hero-glow auth-hero-glow-3" />

        {/* Grid pattern overlay */}
        <div className="auth-hero-grid" />

        <div className="auth-hero-content">
          {/* Top section with badge */}
          <div className="auth-hero-top">
            <div className="auth-hero-badge">
              <span className="auth-hero-badge-dot" />
              AI-Powered Education
            </div>
          </div>

          {/* Main content - centered */}
          <div className="auth-hero-main">
            <div className="auth-hero-icon">
              <TaliLogo className="size-7" />
            </div>
            <h1 className="auth-hero-title">{heroTitle}</h1>
            <p className="auth-hero-description">{heroDescription}</p>

            {/* Feature pills */}
            <div className="auth-hero-features">
              <span className="auth-hero-feature">
                <svg
                  className="size-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                Real-time Analytics
              </span>
              <span className="auth-hero-feature">
                <svg
                  className="size-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                Smart Insights
              </span>
              <span className="auth-hero-feature">
                <svg
                  className="size-3.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                Secure Access
              </span>
            </div>
          </div>

          {/* Testimonial - bottom */}
          <div className="auth-hero-bottom">
            <div className="auth-hero-testimonial">
              <div className="auth-hero-testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="size-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="auth-hero-testimonial-text">{heroQuote}</p>
              <p className="auth-hero-testimonial-author">{heroAuthor}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Right Form Panel */}
      <section className="auth-form-panel">
        {/* Mobile Hero Banner */}
        <div className="auth-mobile-hero">
          <div className="auth-mobile-hero-bg" />
          <div className="auth-mobile-hero-content">
            <div className="auth-hero-badge auth-hero-badge-mobile">
              <span className="auth-hero-badge-dot" />
              AI-Powered
            </div>
            <h1 className="auth-mobile-hero-title">{heroTitle}</h1>
          </div>
        </div>

        {/* Header */}
        <header className="auth-header">
          <Link className="auth-brand" href="/">
            <div className="auth-brand-icon">
              <TaliLogo className="size-5" />
            </div>
            <div className="auth-brand-text">
              <span className="auth-brand-name">TALI</span>
              <span className="auth-brand-tagline">AI Education</span>
            </div>
          </Link>

          <div className="auth-header-actions">
            <button
              className="auth-language-toggle"
              onClick={onToggleLanguage}
              type="button"
              aria-label="Toggle language"
            >
              <svg
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              <span className="auth-language-label">{languageLabel}</span>
            </button>
            <Link className="auth-header-link" href={topLinkHref}>
              {topLinkLabel}
              <svg
                className="size-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        </header>

        {/* Main Form Area */}
        <main className="auth-main">
          <div className="auth-main-inner">
            <div className="auth-form-header">
              <h2 className="auth-form-title">{title}</h2>
              <p className="auth-form-subtitle">{subtitle}</p>
            </div>

            <div className="auth-form-card">{children}</div>

            <p className="auth-form-footer">
              {footerText}{" "}
              <Link className="auth-form-footer-link" href={footerLinkHref}>
                {footerLinkLabel}
              </Link>
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="auth-footer">
          <span>© 2026 TALI</span>
          <span className="auth-footer-dot">·</span>
          <span>AI Education Platform</span>
        </footer>
      </section>
    </div>
  );
}
