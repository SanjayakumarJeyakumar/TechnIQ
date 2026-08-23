# TechnIQ — Phase 1: Product & System Architecture

**One architectural note before we start:** your project context has this stack as Supabase + an Anthropic API-based AI module, but the prompt spec says Gemini "or another suitable AI API." I'm going with **the Anthropic API (Claude)** for the AI Guide since that's already your established stack — the integration pattern (secure backend proxy, env var key, no frontend exposure) is identical regardless of provider, so swapping to Gemini later is a one-file change if you ever want to.

---

## 1. Final Product Definition

TechnIQ is a **college-scoped, peer-to-peer skill exchange platform**. A student who wants to learn a skill searches for it, finds classmates at their own college who know that skill and are willing to teach, sends a structured "learning request," and — once accepted — unlocks a real-time chat with that person. A lightweight AI Guide sits on top, using a student's known skills to suggest what to learn next.

The three pillars, in priority order:
1. **Skill Discovery** — search → filtered, college-scoped results
2. **Learning Requests → Messaging** — the trust-gated connection lifecycle
3. **AI Guide** — a thin recommendation layer, not the centerpiece

Everything else (leaderboard, notifications, onboarding) exists to support these three.

---

## 2. Feature Hierarchy

```
TechnIQ
├── Auth & Identity
│   ├── Google OAuth (Supabase Auth)
│   ├── Session management / protected routes
│   └── New-user detection → onboarding gate
├── Onboarding
│   ├── Profile basics (name, avatar, college, dept, year, bio)
│   ├── Skill selection (multi-select, categorized, searchable)
│   └── Teaching availability (can_teach)
├── Skill Discovery
│   ├── Skill taxonomy (categories + ~150+ seeded skills)
│   ├── Search (debounced, partial match, case-insensitive)
│   ├── Filters (skill, college [locked to self], dept, year, can_teach)
│   └── Student cards + Student profile page
├── Learning Requests
│   ├── Request creation (skill + custom message)
│   ├── Duplicate-pending prevention
│   ├── Accept / Reject
│   └── Status lifecycle (pending/accepted/rejected/cancelled)
├── Messaging
│   ├── Conversation auto-created on accept
│   ├── Conversation list (last message, unread count)
│   ├── Realtime chat (Supabase Realtime)
│   └── RLS-gated read/write
├── AI Guide
│   ├── Prompt input + auto-injected user skill context
│   ├── Backend proxy → Anthropic API
│   └── Loading/error/rate-limit handling
├── Notifications
│   ├── request_received / request_accepted / request_rejected / new_message
│   └── Unread count, mark-read, mark-all-read
├── Leaderboard
│   └── Derived from accepted requests + real message activity (not spammable)
└── Profile & Settings
    ├── Public profile view
    └── Self-edit (skills, can_teach, bio, avatar)
```

---

## 3. User Journeys

**New user (first login):**
Google OAuth → Supabase creates auth user → app checks `profiles` table for matching `id` → not found → onboarding wizard (10 steps) → profile + `user_skills` rows written → redirect to dashboard.

**Returning user:**
Google OAuth → profile found → dashboard directly.

**Core learning loop:**
Dashboard search "React" → results filtered to `same college_id + can_teach=true + has skill` → open Student B's profile → "Request Help" → fill message → submit → Student B gets notification → accepts → conversation row + conversation_members rows created → both redirected/linked to chat → realtime messaging.

**AI Guide loop:**
Open AI Guide → type goal ("I know HTML/CSS/JS, want full-stack") → frontend attaches user's `user_skills` → backend endpoint builds prompt → calls Anthropic API server-side → streams/returns structured learning path → rendered as a step list.

---

## 4. System Architecture

```
┌─────────────────────┐        ┌──────────────────────┐        ┌─────────────────────┐
│   React (Vite) SPA  │  REST  │  Express API (Node)  │  SQL   │   Supabase Postgres  │
│  - React Router     │◄──────►│  - /api/search        │◄──────►│  - RLS policies      │
│  - Supabase client  │        │  - /api/requests       │        │  - Triggers/functions│
│    (direct for      │        │  - /api/ai             │        └─────────────────────┘
│    auth/CRUD/       │        │  - /api/notifications   │
│    realtime)        │        └──────────┬────────────┘
└──────────┬───────────┘                   │
           │  Supabase JS SDK              │ server-side only
           │  (auth, most reads/writes,    ▼
           │   Realtime subscriptions)   ┌─────────────────┐
           └────────────────────────────►│  Anthropic API  │
                                          └─────────────────┘
```

**Key design decision:** Supabase handles auth, most CRUD, storage, and realtime *directly from the frontend*, protected entirely by RLS — this is the standard, secure Supabase pattern and avoids building a redundant CRUD backend. Express exists only for logic that must never run client-side or that benefits from server orchestration: **the AI Guide (API key secrecy)**, complex/aggregated search if it outgrows PostgREST, and future rate-limiting/business logic. This keeps the backend thin and the architecture honest about why each piece exists.

---

## 5. Frontend Architecture

- **React + Vite**, plain JavaScript (`.jsx`, no TypeScript)
- **React Router** for page routing + protected-route wrapper
- **Context**: `AuthContext` (session/user), `ToastContext` (global feedback)
- **Data access**: a thin `services/` layer wrapping the Supabase client (`services/skills.js`, `services/requests.js`, `services/messages.js`) so components never call `supabase.from(...)` directly — keeps queries testable and centralized
- **Realtime**: a `useConversationMessages(conversationId)` hook wrapping a Supabase Realtime channel subscription, cleaned up on unmount
- **Styling**: modern CSS (CSS Modules or a small design-token stylesheet), no heavy UI kit — keeps the "not a template" look required by the brief

---

## 6. Backend Architecture

Express app, organized by feature, not by technical layer:

```
server/
├── routes/
│   ├── search.routes.js
│   ├── requests.routes.js
│   ├── ai.routes.js
│   └── notifications.routes.js
├── controllers/
│   ├── search.controller.js
│   ├── ai.controller.js
│   └── ...
├── services/
│   ├── anthropic.service.js
│   └── supabaseAdmin.service.js   (service-role client, server-only)
├── middleware/
│   ├── auth.middleware.js         (verifies Supabase JWT on protected routes)
│   └── errorHandler.middleware.js
└── index.js
```

Every route that touches the AI or the service-role key goes through `auth.middleware.js`, which verifies the Supabase JWT passed from the frontend before doing anything.

---

## 7. Database Architecture — Overview

Relational core (full DDL comes in Phase 2):

```
colleges ──< profiles >──< user_skills >── skills
                │
                ├──< learning_requests >── (sender/receiver = profiles, skill = skills)
                │
                ├──< conversation_members >── conversations >── messages
                │
                └──< notifications
```

Design decisions worth calling out now:
- `profiles.id` is the same UUID as `auth.users.id` (1:1), which is the standard Supabase pattern and lets RLS use `auth.uid()` directly.
- `user_skills` is a pure join table (`user_id`, `skill_id`, composite PK) — no extra metadata needed for the MVP.
- `learning_requests.status` is a Postgres `enum` (`pending`, `accepted`, `rejected`, `cancelled`) rather than a free-text field, for integrity.
- Conversations are generic (`conversation_members` many-to-many) rather than hardcoding "2-person chat," so group study rooms are a clean future extension without a schema change.
- `students_helped` on `profiles` is a **denormalized counter maintained by a Postgres trigger** on `learning_requests` (increment on accept), not computed ad hoc — keeps leaderboard queries cheap and prevents client-side manipulation.

---

## 8. Authentication Architecture

- Supabase Auth, Google provider only, for MVP.
- College is **not** trusted from free text: on first login we take the Google email domain and look it up in `colleges.email_domain`. If it matches, `college_id` is set automatically. If no domain match exists yet, onboarding falls back to a **dropdown of seeded colleges** (admin-curated list) rather than a free-text field — this is what "controlled college selection" means in practice and keeps college segregation enforceable server-side.
- Session persistence via Supabase's built-in local storage session + `onAuthStateChange` listener in `AuthContext`.
- Protected routes: a `<RequireAuth>` wrapper checks session; a `<RequireOnboarded>` wrapper checks whether a `profiles` row exists and redirects to `/onboarding` if not.

---

## 9. Search Flow

1. User types in debounced search box (300ms).
2. Frontend calls a Postgres **RPC function** (`search_students(query text)`) rather than building the filter client-side — this is where "same college AND has skill AND can_teach" gets enforced as a single indexed query, not stitched together in JS.
3. Function does case-insensitive `ILIKE` partial match against `skills.name`, joins to `user_skills` → `profiles`, filters `profiles.college_id = requesting user's college_id` (read from the JWT via `auth.uid()`), `can_teach = true`, and excludes `profiles.id = auth.uid()`.
4. Results returned sorted by relevance (exact match first, then partial), paginated (limit/offset).

---

## 10. Learning Request Flow

1. `Request Help` opens a modal pre-filled with a default message, editable.
2. Insert into `learning_requests` with `status='pending'` — a partial unique index prevents a duplicate pending request from the same sender→receiver→skill triple.
3. A Postgres trigger on insert writes a `notifications` row for the receiver (`type='request_received'`).
4. Receiver accepts → trigger: (a) update status, (b) create `conversations` + two `conversation_members` rows if one doesn't already exist between these two users, (c) increment sender's... actually receiver's `students_helped`, (d) notify sender (`type='request_accepted'`).
5. Reject → just update status + notify sender (`type='request_rejected'`). No conversation created.

---

## 11. Messaging Flow

- Conversation list query: conversations where `auth.uid()` is a member, joined to the other member's profile, ordered by latest message timestamp.
- Chat window: initial page of messages via query, then a Supabase Realtime channel (`postgres_changes` on `messages` filtered to `conversation_id`) appends new messages live.
- Sending a message is a plain insert; RLS checks the sender is a member of that conversation before allowing it — this is the actual security boundary, not the frontend.

---

## 12. AI Guide Flow

1. Frontend gathers the user's `user_skills` (already in app state) + their free-text goal/question.
2. `POST /api/ai/guide` with `{ skills: [...], prompt: "..." }`, JWT in `Authorization` header.
3. Express verifies JWT, builds a system prompt framing Claude as a "friendly learning-path assistant, not an authoritative advisor," injects the skill list, calls the Anthropic API server-side (key from `process.env.ANTHROPIC_API_KEY`, never sent to the browser).
4. Response parsed into a simple structured shape (ordered list of next skills + short rationale) and returned to the frontend for a clean step-list render, not a raw chat bubble.
5. Failures (timeout, API error, empty prompt) return a typed error the frontend renders as a friendly inline message, never a raw stack trace.

---

## 13. Notification Flow

- All notifications are server/trigger-generated (never client-created directly) so they can't be spoofed.
- `notifications` table: `type`, `reference_id` (points to the request/message/etc.), `is_read`.
- Frontend subscribes via Realtime to `notifications` filtered to `auth.uid()` for live unread-count updates; a bell icon shows the count; mark-read is a simple update the user can only perform on their own rows (RLS).

---

## 14. Leaderboard Logic

`students_helped` is **not** a raw counter of any activity — it only increments when a `learning_requests` row transitions to `accepted` (via the trigger in §10), which requires the receiver's deliberate action. Sending messages or receiving requests does nothing to the score, which directly satisfies the "don't let users game it by spamming messages" requirement. Leaderboard query is a simple `ORDER BY students_helped DESC LIMIT 10` scoped to the user's college (keeps it meaningful and comparable, consistent with the college-segregation requirement).

---

## 15. Security Model

- **RLS is the real authorization boundary**, not frontend checks — every table has explicit policies (detailed in Phase 2), default-deny.
- Service-role key exists **only** in the Express server's environment, never in Vite env vars (which are bundled into the client).
- College segregation enforced inside the `search_students` RPC and in RLS `SELECT` policies on `profiles`, not just in UI filtering.
- File uploads (avatars) validated for MIME type and size both client-side (fast feedback) and via a Supabase Storage bucket policy (actual enforcement).
- Anthropic API key server-side only, per §12.

---

## 16. Folder Structure

**Frontend (`/client`):**
```
client/
├── src/
│   ├── components/      (Navbar, StudentCard, SkillBadge, SkillSelector,
│   │                      MessageBubble, ConversationList, RequestCard,
│   │                      NotificationItem, LoadingSpinner, EmptyState, Modal)
│   ├── pages/            (Login, Onboarding, Home, Search, StudentProfile,
│   │                      Requests, Messages, Conversation, AIGuide,
│   │                      Notifications, Profile, Settings, NotFound)
│   ├── layouts/          (AppLayout with Navbar, AuthLayout)
│   ├── context/          (AuthContext, ToastContext)
│   ├── hooks/            (useConversationMessages, useDebouncedValue, useNotifications)
│   ├── services/         (supabaseClient.js, skills.js, requests.js, messages.js, ai.js)
│   ├── lib/              (constants, skillCategories)
│   ├── utils/            (formatters, validators)
│   └── styles/            (tokens.css, globals.css)
├── .env.example
└── vite.config.js
```

**Backend (`/server`):**
```
server/
├── routes/
├── controllers/
├── services/
├── middleware/
├── .env.example
└── index.js
```

**Database:**
```
supabase/
├── migrations/           (numbered SQL files — schema in Phase 2)
└── seed.sql
```

---

## 17. Development Roadmap

| Phase | Deliverable |
|---|---|
| 2 | Full Postgres schema, RLS policies, seed data |
| 3 | Vite/React + Express project scaffolding, Supabase config, routing, base styles |
| 4 | Google OAuth, session handling, onboarding flow |
| 5 | Skill taxonomy, search RPC, student cards & profile |
| 6 | Learning requests: create/accept/reject, notifications trigger |
| 7 | Conversations, realtime chat, RLS-gated messaging |
| 8 | AI Guide endpoint + UI (Anthropic API) |
| 9 | Leaderboard, notification center UI |
| 10 | UI/responsive polish, empty/loading/error states |
| 11 | Security audit, test checklist |
| 12 | README, env docs, deployment guide, resume copy |

---

**PHASE 1 COMPLETE**

Tell me to continue to **Phase 2 (Database)** when ready, and confirm you're good with the Anthropic API decision in §1 (or say the word and I'll swap the AI architecture to Gemini instead — it's a contained change).
