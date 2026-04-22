# AGENTS.md

## Scope
Instructions in this file apply to the whole repository.

## Project Snapshot
- Framework: Next.js 16 (App Router) + React 19 + TypeScript.
- Styling: Tailwind CSS v4 via PostCSS.
- Source root convention: `src/`.
- Routing convention: App Router only.

## First Commands To Run
Run these from the repository root:

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Development Conventions
- Put all new application code under `src/`.
- Place routes/layouts under `src/app/` and use App Router only.
- Prefer server components by default in `src/app/`; add `"use client"` only when required for client-side interactivity.
- Keep TypeScript strictness intact; do not weaken `tsconfig` settings.
- Use the configured path alias `@/*` for imports when it improves clarity.
- Keep style changes aligned with Tailwind v4 patterns already used in [app/globals.css](app/globals.css).
- Avoid introducing new tooling/config unless explicitly requested.

## Key Files
- Current app shell and fonts: [app/layout.tsx](app/layout.tsx)
- Current home route: [app/page.tsx](app/page.tsx)
- Current global styles and theme variables: [app/globals.css](app/globals.css)
- Target structure for ongoing work: `src/app/*`
- TypeScript config: [tsconfig.json](tsconfig.json)
- ESLint setup: [eslint.config.mjs](eslint.config.mjs)
- Package scripts/dependencies: [package.json](package.json)
- Baseline project docs: [README.md](README.md)

## Next.js 16 Compatibility Note
This repository uses a modern Next.js version that may differ from older examples. Prefer current framework docs and verify APIs against project dependencies in [package.json](package.json).
