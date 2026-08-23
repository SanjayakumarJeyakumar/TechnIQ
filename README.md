# TechnIQ — local dev quick start

This is the Phase 3 scaffold: project structure, routing, auth wiring, base
design system, and an Express API skeleton. Feature logic (onboarding,
search, requests, messaging, AI Guide UI) lands in Phases 4–8. The full
architecture reference is `TechnIQ-Phase1-Architecture.md`; the database is
in `supabase/`.

## Prerequisites

- Node.js 18+
- A Supabase project with the Phase 2 migrations + seed already applied
- A Google OAuth client configured in Supabase Auth (Authentication →
  Providers → Google), with `http://localhost:5173` added to the redirect
  allow-list for local dev

## 1. Client setup

```bash
cd client
npm install
cp .env.example .env
# edit .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev
```

Runs at `http://localhost:5173`.

## 2. Server setup

```bash
cd server
npm install
cp .env.example .env
# edit .env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
npm run dev
```

Runs at `http://localhost:4000`. The Vite dev server proxies `/api/*`
requests here automatically (see `client/vite.config.js`), so the frontend
never needs to know the backend's real URL.

## 3. Verify

- Visit `http://localhost:5173` → should redirect to `/login`.
- `curl http://localhost:4000/api/health` → `{"status":"ok", ...}`.
- Click "Continue with Google" → should complete OAuth and land on `/` (the
  `handle_new_auth_user()` trigger from Phase 2 will have already created a
  bare `profiles` row; the onboarding wizard that fills it in is Phase 4).

## Where things live

| What | Where |
|---|---|
| Pages | `client/src/pages/` |
| Route guards | `client/src/components/RequireAuth.jsx` |
| Auth/session state | `client/src/context/AuthContext.jsx` |
| Supabase client (frontend) | `client/src/services/supabaseClient.js` |
| Design tokens | `client/src/styles/tokens.css` |
| Express routes | `server/routes/` |
| AI Guide logic | `server/services/anthropic.service.js` |
| DB migrations | `supabase/migrations/` |

## Security reminders baked into this scaffold

- `client/.env` may only ever contain `VITE_`-prefixed **public** values.
- `server/.env` holds the service-role key and the Anthropic API key —
  never imported into anything under `client/`.
- Every `server/routes/ai.routes.js` request goes through
  `requireAuth` middleware, which verifies the Supabase JWT before any
  Anthropic call is made.
