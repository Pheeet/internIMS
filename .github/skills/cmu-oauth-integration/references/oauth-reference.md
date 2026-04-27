# CMU OAuth Reference

This reference captures the current CMU OAuth 2.0 behavior for the Nurse CMU AI Tutor project.

## External Providers

- Authorize endpoint: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize`
- Token endpoint: `https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`
- User info endpoint: `https://api.cmu.ac.th/mis/cmuaccount/prod/v3/me/basicinfo`
- CMU tenant ID: `cf81f1df-de59-4c29-91da-a2dfd04aa751`

## Required Environment Variables

- `CMU_CLIENT_ID`
- `CMU_CLIENT_SECRET`
- `CMU_OAUTH_URL`
- `CMU_TOKEN_URL`
- `CMU_USERINFO_URL`
- `CMU_SCOPE`
- `CMU_REDIRECT_URI`
- `NEXT_PUBLIC_APP_URL`

`CMU_REDIRECT_URI` must exactly match the value registered with CMU OAuth.

## Core Flow

1. `GET /api/auth/cmu`
   - generate a random `state`
   - persist it as an httpOnly `oauth_state` cookie for 10 minutes
   - redirect the browser to the Microsoft authorize URL

2. `GET /api/auth/cmu/callback`
   - compare callback `state` with the `oauth_state` cookie
   - exchange the authorization `code` for an access token
   - fetch CMU basic profile data using the access token
   - require `organization_code === "12"`
   - upsert the local user record
   - reject inactive users
   - issue app JWT cookies
   - clear the `oauth_state` cookie
   - redirect by role and onboarding state

3. Post-login redirect rules
   - admin roles go to `/admin/dashboard`
   - students missing ToS acceptance go to `/tos`
   - students missing pretest completion go to `/pretest`
   - all other successful student logins go to `/subjects`

## CMU User Fields Used by the App

- `cmuitaccount`
- `cmuitaccount_name`
- `firstname_TH`
- `lastname_TH`
- `firstname_EN`
- `lastname_EN`
- `student_id`
- `organization_code`

## Stable Error Codes

- `oauth_state_mismatch`
- `oauth_token_failed`
- `oauth_userinfo_failed`
- `not_nursing_faculty`
- `account_disabled`
- `oauth_error`

## Security Constraints

- keep the client secret server-side only
- use the CMU access token once and do not store it
- keep `oauth_state` short-lived and httpOnly
- reject invalid state before token exchange

## Source of Truth

This reference is derived from `docs/cmu-oauth.md`. Update both when the integration contract changes.