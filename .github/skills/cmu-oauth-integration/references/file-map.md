# CMU OAuth File Map

Start from the nearest file that owns the requested behavior.

## Main Files

- `src/app/api/auth/cmu/route.ts`
  - builds the authorize URL
  - generates and stores `oauth_state`
  - redirects the browser to Microsoft Entra ID

- `src/app/api/auth/cmu/callback/route.ts`
  - validates `state`
  - exchanges the authorization code for a token
  - fetches CMU user info
  - checks faculty eligibility and account status
  - issues cookies and redirects the user

- `src/lib/auth.ts`
  - signs JWT tokens
  - sets auth cookies

- `src/app/(auth)/login/page.tsx`
  - links users into the CMU login flow
  - maps error codes to visible login messages

- `env.example`
  - defines deployment-facing environment variables for the integration

## Fast Triage Guide

- Wrong redirect target after login: inspect the callback route first.
- State mismatch or CSRF issue: inspect authorize and callback routes together.
- Token or profile fetch failure: inspect callback request construction and env vars.
- Cookie behavior or expiry issue: inspect `src/lib/auth.ts`.
- User-facing error text mismatch: inspect the login page.