# Tali Monorepo

Tali is organized as a Turborepo with `pnpm` workspaces.

## Workspace structure

```text
.
├── apps/
│   ├── api/              # Bun + Elysia backend
│   │   └── src/
│   │       ├── index.ts
│   │       └── server.ts
│   └── web/              # Next.js 16 frontend
│       ├── app/
│       │   ├── api/
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   └── page.tsx
│       └── components/
├── packages/
│   ├── gemini/           # Shared Gemini client/server helpers
│   │   └── src/
│   │       ├── client.ts
│   │       └── server.ts
│   └── types/            # Shared TypeScript types
│       └── src/
│           └── index.ts
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Apps

- `apps/web` - Next.js 16 app using the App Router and Tailwind CSS
- `apps/api` - Bun API using Elysia

## Shared packages

- `@tali/types` - shared models and enums
- `@tali/gemini` - shared Gemini helpers for client and server usage

## Commands

### Root

- `pnpm install` - install all workspace dependencies
- `pnpm dev` - run all development tasks with Turbo
- `pnpm build` - build all workspace projects

### Web

- `pnpm dev:web` - run only the Next.js app
- `pnpm build:web` - build only the Next.js app
- `pnpm start:web` - start only the Next.js app

### API

- `pnpm dev:api` - run only the Bun + Elysia API
- `pnpm build:api` - build only the API
- `pnpm start:api` - start only the API build output

## Environment

Set the Gemini key inside the web app:

```env
apps/web/.env.local
GEMINI_API_KEY=your_key_here
```

## Notes

- `pnpm` manages the workspace dependencies
- `bun` is used as the runtime for `apps/api`
- Turborepo orchestrates builds and dev tasks across the repo
