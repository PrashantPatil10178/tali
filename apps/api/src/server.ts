import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { auth } from "@/lib/auth";
import { geminiRoutes } from "@/modules/gemini/routes";
import { reportsRoutes } from "@/modules/reports/routes";
import { studentsRoutes } from "@/modules/students/routes";

// Read allowed origins from env (comma-separated) with local fallback
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:3000"];

const betterAuthPlugin = new Elysia({ name: "better-auth" })
  .mount(auth.handler)
  .macro({
    auth: {
      async resolve({ request: { headers }, status }) {
        const session = await auth.api.getSession({ headers });

        if (!session) {
          return status(401);
        }

        return {
          session: session.session,
          user: session.user,
        };
      },
    },
  });

export const app = new Elysia()
  .use(
    cors({
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  .use(betterAuthPlugin)
  .use(geminiRoutes)
  .use(reportsRoutes)
  .use(studentsRoutes)
  .get(
    "/api/me",
    ({ session, user }) => ({
      session,
      user,
    }),
    {
      auth: true,
    },
  )
  .get("/", () => ({
    name: "Tali API",
    status: "ok",
    runtime: "bun",
    framework: "elysia",
    timestamp: new Date().toISOString(),
  }))
  .get("/health", () => ({
    status: "healthy",
  }));
