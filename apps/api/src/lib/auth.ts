import { Database } from "bun:sqlite";
import { betterAuth } from "better-auth";

const trustedOrigins = [
  "https://tali-frontend.prashantpatil.dev",
  "http://localhost:3000",
];

const authBaseUrl = "https://tali-backend.prashantpatil.dev";

const databasePath = (process.env.DATABASE_URL || "file:./dev.db").replace(
  /^file:/,
  "",
);

const database = new Database(databasePath, {
  create: true,
});

const socialProviders =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : undefined;

export const auth = betterAuth({
  appName: "TALI",
  baseURL: authBaseUrl,
  basePath: "/api/auth",
  database,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders,
  trustedOrigins,
  user: {
    modelName: "users",
  },
  account: {
    modelName: "accounts",
  },
  session: {
    modelName: "sessions",
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  verification: {
    modelName: "verifications",
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: "memory",
    customRules: {
      "/api/auth/sign-in/email": {
        window: 60,
        max: 5,
      },
      "/api/auth/sign-up/email": {
        window: 60,
        max: 3,
      },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  experimental: {
    joins: true,
  },
});
