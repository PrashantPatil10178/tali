/**
 * seed-demo-accounts.ts
 *
 * Creates demo accounts via Better Auth's API directly against the SQLite DB.
 * Idempotent — skips accounts that already exist.
 *
 * Usage:
 *   cd apps/api
 *   bun run src/scripts/seed-demo-accounts.ts
 */

import { auth } from "../lib/auth";

// ─── Demo accounts ────────────────────────────────────────────────────────────

const DEMO_ACCOUNTS = [
  {
    name: "Admin Demo",
    email: "admin@tali.dev",
    password: "Demo@1234",
    role: "admin" as const,
    description: "Full admin access",
  },
  {
    name: "Teacher Priya",
    email: "teacher@tali.dev",
    password: "Demo@1234",
    role: "teacher" as const,
    description: "Standard teacher account",
  },
  {
    name: "Teacher Rahul",
    email: "rahul@tali.dev",
    password: "Demo@1234",
    role: "teacher" as const,
    description: "Secondary teacher account",
  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeHeaders(): Headers {
  const h = new Headers();
  h.set("Content-Type", "application/json");
  return h;
}

async function accountExists(email: string): Promise<boolean> {
  try {
    const res = await auth.api.listUsers({
      query: { searchField: "email", searchValue: email, limit: 1 },
    });
    return (res?.users?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const run = async (): Promise<void> => {
  console.log("\n🌱  Seeding demo accounts...\n");

  let created = 0;
  let skipped = 0;

  for (const account of DEMO_ACCOUNTS) {
    const exists = await accountExists(account.email);

    if (exists) {
      console.log(`  ⚠️  Skipped  ${account.email} (already exists)`);
      skipped++;
      continue;
    }

    try {
      // Create user via Better Auth internal API
      await auth.api.signUpEmail({
        body: {
          name: account.name,
          email: account.email,
          password: account.password,
        },
        headers: makeHeaders(),
      });

      console.log(`  ✅  Created  ${account.email}  — ${account.description}`);
      created++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ❌  Failed   ${account.email}: ${msg}`);
    }
  }

  // ─── Summary ────────────────────────────────────────────────────────────────

  console.log(`
─────────────────────────────────────────────
  Demo accounts ready
  Created : ${created}
  Skipped : ${skipped} (already existed)
─────────────────────────────────────────────

  Credentials (all share the same password):

  Role     Email               Password
  ───────  ──────────────────  ──────────
  Admin    admin@tali.dev      Demo@1234
  Teacher  teacher@tali.dev    Demo@1234
  Teacher  rahul@tali.dev      Demo@1234

  ⚠️  Change passwords before deploying to production!
─────────────────────────────────────────────
`);
};

void run().catch((err) => {
  console.error("Demo seed failed:", err);
  process.exitCode = 1;
});
