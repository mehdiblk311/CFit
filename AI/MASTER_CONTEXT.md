# UM6P_FIT — Master Context Prompt

## What This Project Is

**Project:** UM6P_FIT (also called CFit)
**Type:** Mobile-first fitness platform (1337 school validation project)
**Owner:** Mehdi — Coomi CTO, full-stack ownership
**Status:** Backend complete, frontend in progress

This is a full-spectrum fitness tracking app: workout logging, nutrition tracking, AI coaching, analytics, and automation. Multi-language: Arabic (RTL), French, English.

---

## Repository Layout

```
/Users/mehdi/Desktop/Cfit/
├── src/                          # Frontend (React + TypeScript + Vite)
├── Backend/                      # Go backend API
│   ├── api/                      # HTTP handlers + server.go (god node: 189 edges)
│   ├── services/                 # Business logic
│   ├── models/                   # GORM entities
│   ├── metrics/                  # Prometheus middleware
│   ├── database/                 # Migrations, connection
│   ├── worker/                   # Background job runner
│   ├── seed/                     # Dev data seeder
│   ├── exercises_lib_service/    # Python FastAPI microservice (Form Atlas)
│   └── graphify/                 # Knowledge graph of backend codebase
├── graphify-out/                 # Knowledge graph of frontend codebase
└── agents/                       # Context docs + design system
    ├── DESIGN.md                 # Full design system (Clay-Artisanal)
    ├── platform_context.md       # Full product spec
    └── MASTER_CONTEXT.md         # This file
```

---

## Backend — State of Play

**Stack:** Go 1.25+, PostgreSQL + GORM, Docker Compose, Prometheus + Grafana, OpenAPI/Swagger

**API base:** `http://localhost:8080`, docs at `/docs`

**All implemented and tested:**
- Auth: JWT sessions, refresh tokens, 2FA (TOTP + recovery codes), session revocation
- Users: profiles, TDEE calculation, weight tracking
- Workouts: set-by-set logging, cardio entries, templates, multi-week programs, program assignments
- Nutrition: food catalog (USDA import), meals, meal foods, micronutrients (19+), recipes, favorites
- Analytics: workout volume, personal records (Epley 1RM), exercise history, activity calendar, weekly stats
- Summaries: daily + weekly summaries, deficiency flags, integration rules engine
- Notifications: automation rules, worker-driven scheduling
- Export: JSON/CSV, account deletion (GDPR)
- Leaderboard + points
- AI Coach: LLM chat via OpenRouter with tool calling
- Admin dashboard: SQL views, user management, real-time metrics

**Key architectural facts (from knowledge graph):**
- `api/server.go` is the god node — 189 edges, bridges 6+ communities. It is deliberately fat; do not split it without a plan.
- `AuthService` and `ExportService` are core service abstractions
- `exercises_lib_service` is a **separate Python FastAPI microservice** (Form Atlas) — semantic exercise search using FastEmbed (BAAI/bge-small-en-v1.5) + cosine similarity on 873-exercise dataset. It runs as a Docker service. The Go backend calls it via HTTP client (`services/exercise_lib_client.go`).
- `services/integration_rules.go` drives notification automation — connects workout data to nutrition recommendations
- Background worker (`worker/runner.go`) handles export jobs, notification scheduling, admin view refreshes

**Backend API namespaces:**
```
/v1/auth          — register, login, 2FA, refresh, sessions
/v1/users         — profile, TDEE, weight, nutrition targets
/v1/exercises     — exercise library (proxies to Form Atlas)
/v1/workouts      — logging, cardio, analytics, calendar
/v1/templates     — workout templates
/v1/programs      — multi-week training blocks
/v1/program-assignments — user assignment + session apply
/v1/meals         — food logging, recipes, favorites
/v1/foods         — nutritional database
/v1/notifications — alerts and reminders
/v1/export        — data portability
/v1/admin         — dashboard, user management (admin only)
/v1/chat          — AI coach
/v1/leaderboard   — points and rankings
/v1/summary       — daily + weekly summaries
```

**Seed data (password: `password123`):**
- Admin: `alex@example.com`
- 12 users, 8 exercises, 8 foods, 24 workouts, 36 meals, 6 templates, 2 programs

**Planned but not yet built (from todo.txt):**
- Cardio handler expansion (model exists, full CRUD missing)
- USDA micronutrient import (service scaffolded, script pending)
- Workout program admin CRUD (admin-side assignment flows)

---

## Frontend — State of Play

**Stack:** React + TypeScript + Vite, currently at `/Users/mehdi/Desktop/Cfit/src/`

**What exists:**
- `frontend/` — coach demo: exercise search + program generation (uses Form Atlas API)
- `nutition_standalone_app/frontend/` — standalone food search UI (design system base)
- No unified end-user app yet

**What must be built (priority order):**
1. Auth flows (login, register, 2FA, session refresh)
2. Onboarding / profile setup (TDEE, goals, activity level)
3. Home dashboard (today: calories vs targets, workout status, deficiency flags)
4. Workout flow (start, log sets/reps/weight, rest timer, save, history, PRs)
5. Nutrition flow (food search, meal logging, macros/micros, favorites, recipe log)
6. Weight tracker
7. AI Coach chat
8. Progress & analytics
9. Programs, templates, notifications, settings (secondary)
10. Admin pages (internal only)

**Frontend knowledge graph summary (89 nodes, 61 edges, 29 communities):**
- Core abstractions: `useTimer()`, `ActiveSession()`, `CFit Fitness Application`
- No cross-file surprising connections found — codebase is small and modular
- `Workout Management System` and `Nutrition Tracking System` are the two top-level domain nodes

---

## Design System — Clay-Artisanal

Full spec: `agents/DESIGN.md`. Key rules:

**Theme:** Warm cream canvas (`#faf9f7`), oat borders (`#dad4c8`). Artisanal, not clinical.

**Color palette (named swatches):**
- Matcha (green): `#38671a` primary, `#084e52` dark — use for primary CTAs
- Lemon (gold): `#fbbd41` primary — use for highlights
- Ube (purple): `#b4a5ff` primary — use for badges/accents
- Pomegranate (pink): `#fc7981` — use for alerts/errors
- Slushie (cyan): `#3bd3fd` — use for info states
- Blueberry (navy): `#3a03b1` — use for strong CTA on light bg

**Typography:**
- Primary: `Roobert` (OpenType sets `ss01 ss03 ss10 ss11 ss12`)
- Monospace/labels: `Space Mono` (uppercase, +1px tracking)
- Display: 80px / -3.2px tracking. Section heads: 44px. Body: 16-18px.
- Weight system: 600 headings, 500 UI, 400 body

**Components:**
- Buttons: pill shape (1584px radius), hover = `rotateZ(-8deg)` + hard shadow `-7px 7px black`
- Cards: 24px radius, 3-layer shadow (hard offset + inset highlight + oat dashed border)
- Inputs: full pill or 24px rounded, oat border → matcha on focus
- No 1px divider lines — use background color shifts for section separation
- Dashed borders for decorative/secondary containers

**Motion:**
- Physics-based: `rotateZ(-8deg)` + `translateY(-80%)` on hover for buttons
- Hard shadow appears on hover: `box-shadow: -7px 7px 0px rgb(0,0,0)`

---

## Product Rules (Non-Negotiable)

1. **Mobile-first** — tap targets, bottom nav, large interactive zones
2. **RTL support required** — Arabic layout must mirror correctly
3. **Offline-capable** — workout + nutrition logging must work offline, sync on reconnect
4. **Quick entry** — logging a meal or set must take < 2 minutes
5. **No forgot-password flow** — backend endpoint does not exist yet, do not design for it

---

## Key Files to Read Before Touching Anything

| File | Why |
|------|-----|
| `Backend/api/server.go` | Route registration, middleware, all handler wiring |
| `Backend/services/` | All business logic — read before writing handlers |
| `Backend/models/` | GORM entities — source of truth for data shape |
| `Backend/graphify/GRAPH_REPORT.md` | Knowledge graph — architecture overview + god nodes |
| `graphify-out/GRAPH_REPORT.md` | Frontend knowledge graph |
| `agents/DESIGN.md` | Full design system — must follow for any UI work |
| `agents/platform_context.md` | Full product spec — features, workflows, calculations |
| `Backend/front_end_plan.md` | Page-by-page frontend todo with backend endpoints per page |
| `Backend/USER_SIDE_COMPLETION_PLAN.md` | Sprint plan for frontend build |

---

## Architecture Warnings (From Graph Analysis)

- **`api/server.go` is a god node** (189 edges). Do not add more responsibility to it. New features go in `services/` first, thin handler in `api/`.
- **Form Atlas is a separate microservice** — do not inline its logic into Go. Call it via HTTP. It has its own Docker container.
- **210 weakly-connected nodes** in backend graph — documentation gaps exist. If behavior seems undocumented, check the test files first.
- **`Workout API + Server Core` has cohesion 0.01** — the community is large and diffuse. When adding workout features, place logic in `services/workout_*.go`, not in the handler.
- **Backend is strong; frontend is the gap.** Do not propose backend refactors unless the task specifically requires it.

---

## How to Use This Prompt

Paste this entire file before describing your task. Then state:

1. **What you want to build/fix** (specific feature or bug)
2. **Which layer** (backend handler / service / model / frontend page / component)
3. **Which API endpoints** are involved (check `Backend/front_end_plan.md` for the per-page list)
4. **Any constraints** (e.g., "mobile only", "must work offline", "admin-only")

The AI will then have full architecture, design, and product context to give accurate, non-hallucinated help.
