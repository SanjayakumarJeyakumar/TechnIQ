# TechnIQ — Peer-to-Peer Campus Learning Platform

TechnIQ is a modern, privacy-first peer learning and campus skill-sharing platform designed for college students. Students can discover peers with complementary skills, request learning assistance, collaborate in real-time chats, earn verified peer help endorsements, and consult a dedicated AI Study Guide powered by Google Gemini.

---

## Key Features

### 🎓 Campus Discovery & Peer Learning
- **Same College & Any College Discovery**: Search students by skill with multi-tier relevance ranking (Exact match > Prefix match > Substring match) and college scope filtering.
- **Learning Requests**: Structured learning request state machine (`pending` → `accepted` / `rejected`) preventing duplicate requests and initiating chat threads on acceptance.
- **Real-Time Direct Messaging**: Instant peer-to-peer messaging powered by Supabase Realtime with unread counters and message history.

### 🏆 Peer Help, Endorsements & Leaderboard
- **Verified Peer Help System**: Secure database-enforced `students_helped` counter incremented only through verified peer assistance.
- **8 Structured Peer Endorsements**:
  - 💡 Clear Explainer
  - 🧠 Technical Expert
  - 🤝 Patient & Helpful
  - 💻 Great Debugger
  - 🎯 Problem Solver
  - 🚀 Practical Guidance
  - 📚 Good Teacher
  - ⭐ Highly Recommended
- **Campus Leaderboard**: Live ranking of top peer mentors and helpers per college.
- **Live Notifications**: Real-time notification center for request updates, chat messages, and earned endorsements.

### 🤖 AI Study Guide (Google Gemini)
- **Gemini 3.6 Flash Integration**: Server-side AI study assistant providing academic guidance, concept breakdowns, and learning roadmaps.
- **Rate Limiting**: Sliding-window rate limiter enforcing a limit of 15 requests per 15 minutes per authenticated student.

### 🛡️ Safety, Moderation & Profile Privacy
- **Profile Privacy & Email Isolation**: Strict PostgreSQL Row Level Security (RLS) ensuring student email addresses and private metadata are never exposed in search or peer lookups.
- **Bidirectional Blocking**: Instantly hides blocked users from search, learning requests, and direct messaging with a dedicated **Settings → Privacy & Safety** management view.
- **Moderation Reporting**: In-app reporting for harassment, spam, and inappropriate behavior with snapshot audit retention.
- **Self-Serve Account Deletion**: Atomic deletion RPC purging user profile, skill associations, notifications, and underlying Supabase Auth identity.

### 🎨 Design System
- **Dark Theme Palette**: High-contrast, accessibility-tested dark theme (`#0F1115` canvas, `#1A1D22` surface, `#242930` secondary surface, `#2A2F36` borders, `#00C16A` brand primary, `#7C3AED` AI accent).
- **Responsive**: Fully responsive across mobile (320px+), tablet, and desktop viewports with a 44px minimum touch target.

---

## Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite 5, React Router 6 | Single Page Application with optimized bundle and fast HMR |
| **Styling** | Vanilla CSS Design System, CSS Variables | Token-driven styling with zero runtime CSS overhead |
| **Backend API** | Node.js, Express | Server-side Gemini API proxy, rate limiting, and security headers |
| **AI Engine** | Google Gen AI SDK (`@google/genai`) | Gemini 3.6 Flash model execution |
| **Database & Auth** | Supabase (PostgreSQL 15), Supabase Auth | Row Level Security (RLS), Realtime channels, Storage |

---

## Repository Structure

```
TechnIQ/
├── client/                     # Vite React Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components & modals
│   │   │   ├── onboarding/     # Multi-step onboarding wizard
│   │   │   ├── BlockModal.jsx  # Student block confirmation modal
│   │   │   ├── ReportModal.jsx # Moderation report modal
│   │   │   ├── MarkHelpedModal.jsx # Help confirmation & endorsement tags
│   │   │   └── MessageBubble.jsx   # Chat message bubble
│   │   ├── context/            # AuthContext & global state
│   │   ├── constants/          # Canonical endorsement tags & metadata
│   │   ├── pages/              # Application views (Home, Search, Messages, Profile, AI Guide, Settings, etc.)
│   │   ├── services/           # Supabase RPC & API service modules
│   │   └── styles/             # Global CSS tokens and base styles
│   ├── public/                 # Static assets and brand wordmark
│   └── package.json
├── server/                     # Node.js Express Backend
│   ├── controllers/            # AI Guide request controller
│   ├── middleware/             # Supabase JWT authentication & sliding-window rate limiter
│   ├── routes/                 # Express API routes (/api/ai/guide, /api/health)
│   ├── services/               # Gemini AI service client
│   └── index.js                # Express app entry point & security headers
├── supabase/
│   └── migrations/             # Idempotent PostgreSQL SQL migrations (0001–0009)
└── README.md
```

---

## Database Migrations

Database migrations are located in `supabase/migrations/` and should be applied sequentially:

| Migration | Description |
| :--- | :--- |
| **`0001_schema.sql`** | Core tables (`colleges`, `profiles`, `skills`, `user_skills`, `learning_requests`, `conversations`, `conversation_members`, `messages`, `notifications`). |
| **`0002_functions_triggers.sql`** | Authentication triggers (`handle_new_auth_user`), learning request state triggers, and conversation helpers. |
| **`0003_rls_policies.sql`** | Base Row Level Security (RLS) policies for all core tables. |
| **`0004_storage.sql`** | Supabase Storage bucket configuration for student avatars. |
| **`0005_peer_help_records.sql`** | Peer help verification table and initial `record_student_helped` RPC. |
| **`0006_search_scope.sql`** | `search_students` RPC with Same College vs. Any College scope and relevance sorting. |
| **`0007_safety_moderation.sql`** | Profile privacy RLS lockdown, `user_blocks`, `user_reports`, block-aware search/messaging RLS, `fetch_blocked_students` RPC, and `delete_user_account` RPC. |
| **`0008_peer_endorsements.sql`** | `peer_endorsements` table, upgraded `record_student_helped` RPC with optional tags, and `fetch_student_endorsements` aggregation RPC. |
| **`0009_leaderboard_fix.sql`** | `fetch_college_leaderboard` RPC preserving profile privacy while ranking same-college peers. |

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Supabase Account**: A Supabase project with Google OAuth enabled
- **Google Gemini API Key**: An API key from Google AI Studio

---

### 1. Environment Setup

#### Client Configuration (`client/.env`)
Copy `client/.env.example` to `client/.env` and provide your public Supabase keys:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Server Configuration (`server/.env`)
Copy `server/.env.example` to `server/.env` and configure backend secrets:

```env
PORT=4000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-google-gemini-api-key
CLIENT_ORIGIN=http://localhost:5173
```

---

### 2. Installation & Running Locally

#### Start the Backend Server
```bash
cd server
npm install
npm run dev
```
*Runs at `http://localhost:4000` (Health check: `http://localhost:4000/api/health`)*.

#### Start the Frontend Client
```bash
cd client
npm install
npm run dev
```
*Runs at `http://localhost:5173`*. The Vite development server automatically proxies `/api/*` calls to the Express backend.

---

## Build & Production Verification

To test the production build:

```bash
# Build the client
cd client
npm run build

# Verify server health
curl http://localhost:4000/api/health
```

---

## Security & Architecture Principles

- **Zero Client-Side Secrets**: All Gemini API keys and Supabase Service Role keys reside strictly on the server.
- **Database-Enforced Authorization**: Row Level Security (RLS) and PostgreSQL `CHECK` constraints protect data integrity regardless of client state.
- **Sliding-Window Rate Limiting**: AI endpoints are protected against abuse via in-memory user-level sliding windows.
- **Content Security Headers**: HTTP responses include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and strict CORS origin verification.
