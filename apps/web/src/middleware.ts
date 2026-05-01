import { NextRequest, NextResponse } from "next/server";

// ─── Route config ─────────────────────────────────────────────────────────────

/** Routes that require an authenticated session. */
const PROTECTED_PREFIXES = ["/dashboard"];

/** Routes that should redirect authenticated users away (to dashboard). */
const AUTH_ROUTES = ["/auth/sign-in", "/auth/sign-up", "/auth"];

/** Routes the middleware should never touch. */
const PUBLIC_PREFIXES = [
  "/_next",
  "/api",
  "/favicon",
  "/public",
  "/about",
  "/privacy-policy",
  "/terms-of-service",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((p) => pathname.startsWith(p));
}

/**
 * Check for a Better Auth session cookie.
 * Better Auth sets a cookie named "better-auth.session_token"
 * (or "__Secure-better-auth.session_token" in production HTTPS).
 */
function hasSessionCookie(request: NextRequest): boolean {
  const cookieNames = [
    "better-auth.session_token",
    "__Secure-better-auth.session_token",
  ];
  return cookieNames.some((name) => request.cookies.has(name));
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files, Next internals, and public API routes
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const isLoggedIn = hasSessionCookie(request);

  // Unauthenticated user hitting a protected route → send to sign-in
  if (isProtected(pathname) && !isLoggedIn) {
    const signInUrl = new URL("/auth/sign-in", request.url);
    // Preserve the destination so we can redirect back after login
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Authenticated user hitting an auth page → send to dashboard
  if (isAuthRoute(pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard/overview", request.url));
  }

  return NextResponse.next();
}

// ─── Matcher ─────────────────────────────────────────────────────────────────

export const config = {
  /*
   * Match everything EXCEPT:
   * - _next/static  (static files)
   * - _next/image   (image optimisation)
   * - favicon.ico
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
