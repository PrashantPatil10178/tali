import { Database } from "bun:sqlite";
import { betterAuth } from "better-auth";

// Resolve trusted origins from env (comma-separated) with local fallback
const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS
  ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000"];

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
  // baseURL is read from BETTER_AUTH_URL env var automatically.
  // Only set it explicitly here if the env var is not defined.
  baseURL: process.env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  database,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders,
  trustedOrigins,
  // modelName must match the Prisma model name (@@map table name for raw SQLite adapter)
  user: {
    modelName: "users",
  },
  account: {
    modelName: "accounts",
  },
  session: {
    modelName: "sessions",
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // refresh cookie daily
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
