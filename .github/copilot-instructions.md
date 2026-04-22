# Copilot Instructions

Apply these rules across this repository.

## Stack Requirements
- Use Next.js 16.2.4 and React 19 as defined in [package.json](package.json).
- Use App Router only. Create routes and layouts in src/app.
- Use Tailwind CSS version ^4 for styling.
- Use shadcn for reusable UI components.

## Architecture Rules
- Put all new app code inside src.
- Prefer Server Components by default. Add use client only when needed for browser-only behavior.
- Keep changes compatible with the existing TypeScript and ESLint configuration.

## Dependency Policy
- Keep dependencies minimal.
- Before adding any package, check if Next.js, React, Tailwind, or shadcn already solve the need.
- Do not add overlapping UI libraries when shadcn can cover the requirement.
- If a new dependency is necessary, choose one package only and explain why.

## Implementation Guidance
- Build UI using shadcn component patterns and Tailwind utilities.
- Prefer composition over adding helper libraries.
- Keep PRs focused and avoid unrelated refactors.

## References
- Main agent rules: [AGENTS.md](AGENTS.md)
- Alias instructions: [AGENT.md](AGENT.md)
- Baseline project docs: [README.md](README.md)
