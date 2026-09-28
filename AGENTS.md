# Liafrik Command Center — agent notes

Vite + React SPA with Cloudflare Pages Functions and Neon (PostgreSQL + Neon Auth).

## Layout
- `src/` — frontend. Data access goes through `src/lib/data/repositories.js`; backend calls through `src/lib/api.js`; auth through `src/lib/neonAuth.js`.
- `functions/api/*.js` — Cloudflare Pages Functions (`/api/<kebab-name>`). Shared code in `functions/_shared/`.
- Auth: Neon Auth (Better Auth). Functions verify the JWT via JWKS (`functions/_shared/auth.js`); non-admin users must exist in `administrators`.

## Environment (Cloudflare Pages)
`DATABASE_URL` (required), `NEON_AUTH_JWKS_URL` (optional), `GEMINI_API_KEY`/`GEMINI_MODEL` (AI), `RESEND_API_KEY`/`EMAIL_FROM` (email), `GITHUB_TOKEN` (push to GitHub), `PSP_*` (payment providers). Frontend: `VITE_NEON_AUTH_URL` (optional).

## Guidelines
Keep changes focused, preserve conventions, never interpolate client input into SQL (use `ident()` for column names).
