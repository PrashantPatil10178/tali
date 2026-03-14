"use client";

import { useRouter } from "nextjs-toploader/app";
import { FormEvent, useEffect, useState } from "react";
import AuthShell from "@/components/auth/AuthShell";
import { signUp, useSession } from "@/lib/auth-client";

type Locale = "en" | "mr";

const isGoogleAuthEnabled =
  process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true";

const copy = {
  en: {
    loading: "Preparing your account...",
    title: "Create Your Account",
    subtitle:
      "Start using TALI to manage classes, insights, and AI teaching workflows.",
    heroTitle: "Secure onboarding for modern educators.",
    heroDescription:
      "Create your teacher account once and step into a polished AI workspace designed for academic clarity, speed, and trust.",
    heroQuote:
      '"Our onboarding felt simple, secure, and ready for real school operations from the first login."',
    heroAuthor: "School Operations Team, TALI Pilot",
    languageLabel: "English / मराठी",
    topLinkLabel: "Sign In",
    google: "Continue with Google",
    divider: "Or create account with email",
    nameLabel: "Full Name",
    namePlaceholder: "Jane Doe",
    emailLabel: "School Email",
    emailPlaceholder: "name@school.edu",
    passwordLabel: "Password",
    passwordPlaceholder: "Minimum 8 characters",
    confirmLabel: "Confirm Password",
    confirmPlaceholder: "Repeat your password",
    submitIdle: "Create Account",
    submitBusy: "Creating Account...",
    legal:
      "By creating an account, you agree to use TALI for authorized school workflows and classroom-related operations only.",
    footerText: "Already have an account?",
    footerLinkLabel: "Sign in here",
    shortPassword: "Password must be at least 8 characters long.",
    mismatch: "Password and confirm password must match.",
    defaultError: "Unable to create your account.",
    googleNotConfigured:
      "Google sign-up is not configured yet. Add the Google auth env vars to enable it.",
    googlePending:
      "Google sign-up is enabled by configuration, but the provider callback flow still needs credentials in the backend environment.",
  },
  mr: {
    loading: "तुमचे खाते तयार करत आहोत...",
    title: "तुमचे खाते तयार करा",
    subtitle:
      "TALI वापरून classes, insights आणि AI teaching workflows व्यवस्थापित करण्यास सुरुवात करा.",
    heroTitle: "आधुनिक शिक्षकांसाठी सुरक्षित onboarding.",
    heroDescription:
      "एकदाच teacher account तयार करा आणि academic clarity, speed आणि trust यांसाठी बनवलेल्या AI workspace मध्ये प्रवेश करा.",
    heroQuote:
      '"पहिल्या login पासूनच onboarding साधे, सुरक्षित आणि शाळेच्या वापरासाठी तयार वाटले."',
    heroAuthor: "शाळा संचालन संघ, TALI Pilot",
    languageLabel: "मराठी / English",
    topLinkLabel: "साइन इन",
    google: "Google सह पुढे जा",
    divider: "किंवा ईमेलने खाते तयार करा",
    nameLabel: "पूर्ण नाव",
    namePlaceholder: "Jane Doe",
    emailLabel: "शाळेचा ईमेल",
    emailPlaceholder: "name@school.edu",
    passwordLabel: "पासवर्ड",
    passwordPlaceholder: "किमान 8 अक्षरे",
    confirmLabel: "पासवर्ड पुन्हा लिहा",
    confirmPlaceholder: "पासवर्ड पुन्हा टाका",
    submitIdle: "खाते तयार करा",
    submitBusy: "खाते तयार करत आहोत...",
    legal:
      "खाते तयार करून तुम्ही TALI फक्त अधिकृत शालेय workflows आणि classroom-related वापरासाठी वापरण्यास सहमती देता.",
    footerText: "आधीपासून खाते आहे?",
    footerLinkLabel: "इथे साइन इन करा",
    shortPassword: "पासवर्ड किमान 8 अक्षरांचा असावा.",
    mismatch: "पासवर्ड आणि confirm password सारखे असणे आवश्यक आहे.",
    defaultError: "तुमचे खाते तयार करता आले नाही.",
    googleNotConfigured:
      "Google sign-up अजून configure केलेले नाही. Auth env vars जोडा.",
    googlePending:
      "Configuration उपलब्ध आहे, पण backend मध्ये provider credentials अजून जोडायचे आहेत.",
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

export default function SignUpPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [locale, setLocale] = useState<Locale>("en");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [socialMessage, setSocialMessage] = useState<string | null>(null);
  const t = copy[locale];

  useEffect(() => {
    if (session) {
      router.replace("/");
    }
  }, [router, session]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage(t.shortPassword);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(t.mismatch);
      return;
    }

    setIsSubmitting(true);

    const { error } = await signUp.email({
      name,
      email,
      password,
      callbackURL: "/",
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message || t.defaultError);
      return;
    }

    router.replace("/");
  };

  const handleGoogleSignUp = async () => {
    setSocialMessage(null);

    if (!isGoogleAuthEnabled) {
      setSocialMessage(t.googleNotConfigured);
      return;
    }

    setSocialMessage(t.googlePending);
  };

  if (isPending && !session) {
    return <div className="auth-loading-screen">{t.loading}</div>;
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
      topLinkHref="/sign-in"
      topLinkLabel={t.topLinkLabel}
      footerText={t.footerText}
      footerLinkHref="/sign-in"
      footerLinkLabel={t.footerLinkLabel}
    >
      <div className="space-y-6">
        <button
          className="auth-social-button"
          onClick={handleGoogleSignUp}
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
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="auth-label" htmlFor="name">
                {t.nameLabel}
              </label>
              <input
                autoComplete="name"
                className="auth-input"
                id="name"
                onChange={(event) => setName(event.target.value)}
                placeholder={t.namePlaceholder}
                required
                type="text"
                value={name}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
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

            <div className="space-y-2 sm:col-span-1">
              <label className="auth-label" htmlFor="password">
                {t.passwordLabel}
              </label>
              <input
                autoComplete="new-password"
                className="auth-input"
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t.passwordPlaceholder}
                required
                type="password"
                value={password}
              />
            </div>

            <div className="space-y-2 sm:col-span-1">
              <label className="auth-label" htmlFor="confirm-password">
                {t.confirmLabel}
              </label>
              <input
                autoComplete="new-password"
                className="auth-input"
                id="confirm-password"
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={t.confirmPlaceholder}
                required
                type="password"
                value={confirmPassword}
              />
            </div>

            {errorMessage ? (
              <p className="auth-error sm:col-span-2">{errorMessage}</p>
            ) : null}
            {socialMessage ? (
              <p className="auth-note sm:col-span-2">{socialMessage}</p>
            ) : null}

            <div className="sm:col-span-2">
              <button
                className="auth-primary-button"
                disabled={isSubmitting}
                type="submit"
              >
                <span>{isSubmitting ? t.submitBusy : t.submitIdle}</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <p className="text-center text-xs leading-6 text-slate-500 sm:col-span-2 dark:text-slate-400">
              {t.legal}
            </p>
          </div>
        </form>
      </div>
    </AuthShell>
  );
}
