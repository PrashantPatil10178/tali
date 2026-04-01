"use client";

import { useRouter } from "nextjs-toploader/app";
import { FormEvent, useEffect, useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { signIn, useSession } from "@/lib/auth-client";

const isGoogleAuthEnabled =
  process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true";

type Locale = "en" | "mr";

const copy = {
  en: {
    checkingSession: "Checking session...",
    title: "Welcome Back",
    subtitle:
      "Sign in to access your AI insights, classroom workflows, and secure teacher dashboard.",
    heroTitle: "Transforming Education with AI.",
    heroDescription:
      "Empower your teaching with real-time insights, personalized learning paths, and intelligent classroom management built for modern educators.",
    heroQuote:
      '"TALI has changed how I track student progress. It feels like a trusted teaching assistant that helps me respond faster and with more clarity."',
    heroAuthor: "Dr. Aditi Sharma, Lead Educator",
    languageLabel: "English / मराठी",
    topLinkLabel: "Create Account",
    google: "Sign in with Google",
    divider: "Or continue with email",
    emailLabel: "Email Address",
    emailPlaceholder: "name@school.edu",
    passwordLabel: "Password",
    passwordHint: "Reset flow next",
    passwordPlaceholder: "••••••••",
    rememberMe: "Remember for 30 days",
    submitIdle: "Sign In",
    submitBusy: "Signing In...",
    footerText: "Don't have an account?",
    footerLinkLabel: "Sign up for free",
    defaultError: "Unable to sign in right now.",
  },
  mr: {
    checkingSession: "सेशन तपासत आहोत...",
    title: "पुन्हा स्वागत आहे",
    subtitle:
      "तुमचे AI insights, classroom workflows आणि सुरक्षित teacher dashboard वापरण्यासाठी sign in करा.",
    heroTitle: "AI सोबत शिक्षण अधिक प्रभावी करा.",
    heroDescription:
      "रिअल-टाइम insights, वैयक्तिक learning paths आणि smart classroom management यांच्या मदतीने अध्यापन अधिक सक्षम करा.",
    heroQuote:
      '"TALI मुळे विद्यार्थ्यांची प्रगती समजून घेणे खूप सोपे झाले. हे जणू माझ्यासोबत काम करणारे smart teaching assistant आहे."',
    heroAuthor: "डॉ. अदिती शर्मा, प्रमुख शिक्षिका",
    languageLabel: "मराठी / English",
    topLinkLabel: "नवीन खाते तयार करा",
    google: "Google सह साइन इन करा",
    divider: "किंवा ईमेलद्वारे पुढे जा",
    emailLabel: "ईमेल पत्ता",
    emailPlaceholder: "name@school.edu",
    passwordLabel: "पासवर्ड",
    passwordHint: "Reset flow पुढे जोडू",
    passwordPlaceholder: "••••••••",
    rememberMe: "30 दिवस लक्षात ठेवा",
    submitIdle: "साइन इन",
    submitBusy: "साइन इन करत आहोत...",
    footerText: "अजून खाते नाही?",
    footerLinkLabel: "मोफत साइन अप करा",
    defaultError: "आत्ता साइन इन करता आले नाही.",
  },
} as const;

const GoogleIcon = () => (
  <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
    <path
      d="M21.805 10.023H12v3.955h5.615c-.242 1.27-.968 2.346-2.062 3.068v2.549h3.345c1.958-1.803 3.087-4.455 3.087-7.595 0-.661-.059-1.297-.18-1.977Z"
      fill="#4285F4"
    />
    <path
      d="M12 22c2.805 0 5.16-.93 6.879-2.525l-3.345-2.549c-.929.626-2.121.999-3.534.999-2.719 0-5.026-1.836-5.849-4.305H2.699v2.629A10.386 10.386 0 0 0 12 22Z"
      fill="#34A853"
    />
    <path
      d="M6.151 13.62A6.244 6.244 0 0 1 5.823 12c0-.562.106-1.105.328-1.62V7.751H2.699A9.986 9.986 0 0 0 1.64 12c0 1.607.386 3.126 1.059 4.249l3.452-2.629Z"
      fill="#FBBC05"
    />
    <path
      d="M12 6.075c1.524 0 2.891.525 3.973 1.555l2.977-2.977C17.155 2.976 14.8 2 12 2 7.694 2 3.97 4.478 2.699 7.751l3.452 2.629C6.974 7.911 9.281 6.075 12 6.075Z"
      fill="#EA4335"
    />
  </svg>
);

export default function SignInPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [locale, setLocale] = useState<Locale>("en");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const t = copy[locale];

  useEffect(() => {
    if (session) {
      router.replace("/");
    }
  }, [router, session]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const { error } = await signIn.email({
      email,
      password,
      rememberMe,
      callbackURL: "/",
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message || t.defaultError);
      return;
    }

    router.replace("/");
  };

  const handleGoogleSignIn = async () => {
    if (!isGoogleAuthEnabled) {
      return;
    }
  };

  if (isPending && !session) {
    return <div className="auth-loading-screen">{t.checkingSession}</div>;
  }

  return (
    <AuthShell
      title={t.title}
      subtitle={t.subtitle}
      heroTitle={t.heroTitle}
      heroDescription={t.heroDescription}
      heroQuote={t.heroQuote}
      heroAuthor={t.heroAuthor}
      languageLabel={t.languageLabel}
      onToggleLanguage={() =>
        setLocale((current) => (current === "en" ? "mr" : "en"))
      }
      topLinkHref="/sign-up"
      topLinkLabel={t.topLinkLabel}
      footerText={t.footerText}
      footerLinkHref="/sign-up"
      footerLinkLabel={t.footerLinkLabel}
    >
      <div className="space-y-6">
        <button
          className="auth-social-button"
          onClick={handleGoogleSignIn}
          type="button"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200/70">
            <GoogleIcon />
          </span>
          <span>{t.google}</span>
        </button>

        <div className="auth-divider">
          <span>{t.divider}</span>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="auth-label" htmlFor="email">
              {t.emailLabel}
            </label>
            <input
              autoComplete="email"
              className="auth-input"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t.emailPlaceholder}
              required
              type="email"
              value={email}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label className="auth-label" htmlFor="password">
                {t.passwordLabel}
              </label>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t.passwordHint}
              </span>
            </div>
            <input
              autoComplete="current-password"
              className="auth-input"
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t.passwordPlaceholder}
              required
              type="password"
              value={password}
            />
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
            <input
              checked={rememberMe}
              className="h-4 w-4 rounded border-slate-300 text-(--color-primary) focus:ring-(--color-primary)/30"
              onChange={(event) => setRememberMe(event.target.checked)}
              type="checkbox"
            />
            {t.rememberMe}
          </label>

          {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}

          <button
            className="auth-primary-button"
            disabled={isSubmitting}
            type="submit"
          >
            <span>{isSubmitting ? t.submitBusy : t.submitIdle}</span>
            <span aria-hidden="true">→</span>
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
