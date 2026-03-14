"use client";

import { createAuthClient } from "better-auth/react";

const getApiBaseUrl = (): string =>
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001").replace(
    /\/$/,
    "",
  );

export const authClient = createAuthClient({
  baseURL: getApiBaseUrl(),
});

export const { signIn, signOut, signUp, useSession } = authClient;
