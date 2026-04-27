---
name: cmu-oauth-integration
description: 'Implement, modify, or review CMU OAuth 2.0 login in this Next.js app. Use when working on Microsoft Entra ID authorize or token exchange, CMU basicinfo user lookup, oauth_state cookies, callback validation, nursing faculty filtering, JWT cookie issuance, login error mapping, or CMU OAuth environment variables.'
argument-hint: 'What part of the CMU OAuth flow needs work?'
user-invocable: true
---

# CMU OAuth Integration

Use this skill when an agent needs to add, change, debug, or review the CMU Account login flow for this project.

## What This Skill Covers

- `GET /api/auth/cmu` authorize redirect flow
- `GET /api/auth/cmu/callback` code exchange and user provisioning flow
- Microsoft Entra ID authorize and token endpoints
- CMU user profile lookup via `basicinfo`
- `oauth_state` cookie generation and validation
- Faculty gating for Nursing students only
- JWT cookie issuance and post-login redirect logic
- Error code mapping back to the login page

## When to Use

Use this skill when the task mentions any of these terms or behaviors:

- CMU OAuth
- CMU Account login
- Microsoft Entra ID or Azure AD callback
- `oauth_state`
- `CMU_CLIENT_ID`, `CMU_CLIENT_SECRET`, `CMU_REDIRECT_URI`
- `not_nursing_faculty`, `oauth_token_failed`, or related login errors
- JWT cookie issuance after third-party login

## Primary References

Read these first when the task needs implementation detail:

- [OAuth reference](./references/oauth-reference.md)
- [Source routes and file map](./references/file-map.md)

## Procedure

1. Identify the requested slice.
   Match the task to one of these control points:
   - authorize route construction
   - callback validation
   - token exchange
   - CMU profile fetch
   - user upsert and access control
   - JWT cookies and redirect destination
   - login-page error handling

2. Confirm the local integration boundary before editing.
   Read the relevant target files in the repo rather than re-deriving the flow from scratch. Start from the owning route handler:
   - authorize issues start at `src/app/api/auth/cmu/route.ts`
   - callback issues start at `src/app/api/auth/cmu/callback/route.ts`
   - cookie issuance issues start at `src/lib/auth.ts`
   - login messaging issues start at `src/app/(auth)/login/page.tsx`

3. Preserve the required security model.
   Keep these invariants intact:
   - generate a random `state` value server-side
   - store `oauth_state` as an httpOnly cookie with short lifetime
   - reject callback requests when query `state` does not match the cookie
   - perform token exchange only on the server
   - do not persist the CMU access token after user info is fetched

4. Implement the external OAuth steps in order.
   The expected callback sequence is:
   - validate `state`
   - exchange `code` for an access token using the token endpoint
   - request CMU basic info with `Authorization: Bearer <token>`
   - verify `organization_code === "12"`
   - upsert the user as a student account when appropriate
   - reject inactive users
   - issue app JWT cookies
   - clear the temporary `oauth_state` cookie
   - redirect according to role, ToS, and pretest state

5. Keep repo-specific redirect logic aligned with the rest of the app.
   Expected destinations:
   - `ADMIN` or `SUPER_ADMIN` -> `/admin/dashboard`
   - student without accepted ToS -> `/tos`
   - student without pretest completion -> `/pretest`
   - otherwise -> `/subjects`

6. Map failures to stable login error codes.
   Reuse the documented codes instead of inventing new ones unless the task explicitly requires a new UX path.

7. Validate narrowly after edits.
   Prefer the smallest check that can falsify the change:
   - targeted auth or route tests when available
   - focused lint or typecheck for touched files
   - manual review against the documented sequence only if no executable check exists

## Decision Rules

- If the task is about route wiring before redirect to Microsoft, work in the authorize route.
- If the task is about callback query params, token exchange, CMU API responses, or login failures after returning from Microsoft, work in the callback route.
- If the task is about auth cookie names, expiry, secure flags, or JWT creation, inspect `src/lib/auth.ts` before changing route logic.
- If the task is about what students see after failure, inspect the login page and its error-code mapping.
- If the task changes required environment variables, update both the implementation and `env.example` or docs that define deployment inputs.

## Quality Checks

The work is complete only when these are still true:

- the authorize route constructs the correct Microsoft authorize URL
- the callback refuses mismatched or missing `state`
- the server exchanges the code and fetches CMU user info without exposing the client secret
- non-Nursing users are rejected with the documented error code
- inactive users remain blocked
- successful logins issue the app JWT cookies and clear `oauth_state`
- redirect targets still respect admin, ToS, and pretest rules
- docs or environment examples stay in sync with any contract changes

## Output Expectations

When using this skill, the agent should finish with:

- the minimal code change for the requested OAuth behavior
- any necessary test or doc updates
- a short note describing which control point changed and how it was validated