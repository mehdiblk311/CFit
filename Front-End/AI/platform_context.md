# CFit (UM6P_FIT) — Platform Context

## Quick Links

- **Frontend Graph:** `Front-End/AI/graphify/graphify-Front/graph.html` — interactive React component architecture
- **Backend Graph:** `Front-End/AI/graphify/graphify-Backend/graph.html` — interactive Go API structure
- **How to use graphify:** `Front-End/AI/graphify/how-to-use-graphify.md`
- **Design System:** `Front-End/AI/DESIGN.md` — Clay-Artisanal visual system

---

## What This Project Is

**Project:** UM6P_FIT (also called CFit)
**Type:** Mobile-first fitness platform (1337 school validation project)
**Owner:** Mehdi — Coomi CTO, full-stack ownership
**Status:** Backend complete, frontend in progress
**Language Support:** Arabic (RTL), French, English

This is a full-spectrum fitness tracking app: workout logging, nutrition tracking, AI coaching, analytics, and automation.

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
│   └── exercises_lib_service/    # Python FastAPI microservice (Form Atlas)
└── Front-End/AI/                 # Context docs + design system + graphs
    ├── DESIGN.md                 # Full design system (Clay-Artisanal)
    ├── platform_context.md       # This file
    └── graphify/                 # Knowledge graphs (frontend + backend)
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
- `exercises_lib_service` is a **separate Python FastAPI microservice** (Form Atlas) — semantic exercise search using FastEmbed (BAAI/bge-small-en-v1.5) + cosine similarity on 873-exercise dataset. Runs as a Docker service. Go backend calls it via `services/exercise_lib_client.go`.
- `services/integration_rules.go` drives notification automation — connects workout data to nutrition recommendations
- Background worker (`worker/runner.go`) handles export jobs, notification scheduling, admin view refreshes

**Backend API namespaces:**
```
/v1/auth               — register, login, 2FA, refresh, sessions
/v1/users              — profile, TDEE, weight, nutrition targets
/v1/exercises          — exercise library (proxies to Form Atlas)
/v1/workouts           — logging, cardio, analytics, calendar
/v1/templates          — workout templates
/v1/programs           — multi-week training blocks
/v1/program-assignments — user assignment + session apply
/v1/meals              — food logging, recipes, favorites
/v1/foods              — nutritional database
/v1/notifications      — alerts and reminders
/v1/export             — data portability
/v1/admin              — dashboard, user management (admin only)
/v1/chat               — AI coach
/v1/leaderboard        — points and rankings
/v1/summary            — daily + weekly summaries
```

**Seed data (password: `password123`):**
- Admin: `alex@example.com`
- 12 users, 8 exercises, 8 foods, 24 workouts, 36 meals, 6 templates, 2 programs

**Planned but not yet built:**
- Cardio handler expansion (model exists, full CRUD missing)
- USDA micronutrient import (service scaffolded, script pending)
- Workout program admin CRUD (admin-side assignment flows)

---

## Frontend — State of Play

**Stack:** React + TypeScript + Vite, at `/Users/mehdi/Desktop/Cfit/src/`

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

**Frontend knowledge graph (89 nodes, 61 edges, 29 communities):**
- Core abstractions: `useTimer()`, `ActiveSession()`, `CFit Fitness Application`
- No cross-file surprising connections — codebase is small and modular
- `Workout Management System` and `Nutrition Tracking System` are the two top-level domain nodes

---

## Design System — Clay-Artisanal

Full spec: `Front-End/AI/DESIGN.md`. Key rules:

**Theme:** Warm cream canvas (`#faf9f7`), oat borders (`#dad4c8`). Artisanal, not clinical.

**Color palette:**
- Matcha (green): `#38671a` primary, `#084e52` dark — primary CTAs
- Lemon (gold): `#fbbd41` — highlights
- Ube (purple): `#b4a5ff` — badges/accents
- Pomegranate (pink): `#fc7981` — alerts/errors
- Slushie (cyan): `#3bd3fd` — info states
- Blueberry (navy): `#3a03b1` — strong CTA on light bg

**Typography:**
- Primary: `Roobert` (OpenType sets `ss01 ss03 ss10 ss11 ss12`)
- Monospace/labels: `Space Mono` (uppercase, +1px tracking)
- Display: 80px / -3.2px tracking. Section heads: 44px. Body: 16-18px.
- Weights: 600 headings, 500 UI, 400 body

**Components:**
- Buttons: pill shape (1584px radius), hover = `rotateZ(-8deg)` + hard shadow `-7px 7px black`
- Cards: 24px radius, 3-layer shadow (hard offset + inset highlight + oat dashed border)
- Inputs: full pill or 24px rounded, oat border → matcha on focus
- No 1px divider lines — use background color shifts
- Dashed borders for decorative/secondary containers

**Motion:** Physics-based hover: `rotateZ(-8deg)` + `translateY(-80%)`. Hard shadow on hover: `box-shadow: -7px 7px 0px rgb(0,0,0)`

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
| `Front-End/AI/graphify/graphify-Backend/GRAPH_REPORT.md` | Backend architecture + god nodes |
| `Front-End/AI/graphify/graphify-Front/GRAPH_REPORT.md` | Frontend knowledge graph |
| `Front-End/AI/DESIGN.md` | Full design system — must follow for any UI work |
| `Backend/front_end_plan.md` | Page-by-page frontend todo with backend endpoints per page |
| `Backend/USER_SIDE_COMPLETION_PLAN.md` | Sprint plan for frontend build |

---

## Architecture Warnings (From Graph Analysis)

- **`api/server.go` is a god node** (189 edges). Do not add more responsibility to it. New features go in `services/` first, thin handler in `api/`.
- **Form Atlas is a separate microservice** — do not inline its logic into Go. Call it via HTTP.
- **210 weakly-connected nodes** in backend graph — documentation gaps exist. If behavior seems undocumented, check test files first.
- **`Workout API + Server Core` has cohesion 0.01** — the community is large and diffuse. Place workout logic in `services/workout_*.go`, not in the handler.
- **Backend is strong; frontend is the gap.** Do not propose backend refactors unless the task specifically requires it.

---

## How to Use This File

Paste this file before describing your task. Then state:

1. **What you want to build/fix** (specific feature or bug)
2. **Which layer** (backend handler / service / model / frontend page / component)
3. **Which API endpoints** are involved (check `Backend/front_end_plan.md`)
4. **Any constraints** (e.g., "mobile only", "must work offline", "admin-only")

---

## 1. Application Overview

**Project Name:** UM6P_FIT
**Type:** Mobile-First Fitness Platform
**Core Function:** Workout planning + Nutrition tracking + Progress monitoring
**Status:** Validation project (1337 school assignment)
**Owner/Builder:** Mehdi (Coomi CTO)
**Language Support:** Multi-language (Arabic, French, English)
**Language Direction:** RTL support required (Arabic)

---

## 2. Core Features & Functionality

### 2.1 Workout Management System

**Program-Based Hierarchy:**
- Users select or create fitness programs
- Each program contains multiple phases/weeks
- Each week contains multiple training days
- Each training day contains multiple exercises
- Each exercise has:
  - Exercise name and description
  - Target muscle group(s)
  - Sets and reps configuration
  - Rest periods between sets
  - Weight/resistance levels
  - Exercise video reference or form notes
  - Difficulty level
  - Equipment required (if any)

**Program Types Supported:**
- Pre-built programs (strength, cardio, flexibility, hypertrophy, etc.)
- Custom programs (user-created)
- Progressive overload tracking (increasing weight/reps over time)

**User Interactions with Workouts:**
- Browse available programs
- Filter by: fitness goal, duration, difficulty level, equipment
- Start a program
- Log completed workouts with:
  - Actual weight used
  - Actual reps completed
  - Actual sets completed
  - Time taken
  - Perceived difficulty (RPE - Rate of Perceived Exertion)
  - Notes on performance
- Track personal records (PRs)
- Skip or reschedule workout days
- View workout history and analytics

### 2.2 Nutrition Tracking System

**Core Nutrition Features:**
- Daily calorie tracking (target vs. actual)
- Macronutrient breakdown: Protein, Carbohydrates, Fats
- Micronutrient tracking (optional): Vitamins, Minerals, Fiber
- Water intake logging
- Meal logging:
  - Pre-built meal database (common foods)
  - Barcode scanning for quick food entry
  - Manual food entry with portion sizes
  - Favorite meals for quick re-logging
  - Recipe creation and tracking

**Nutrition Management:**
- Set daily calorie goals (calculated from body metrics or manual input)
- Set macro targets (auto-calculated or custom)
- Log meals throughout the day
- View remaining calories/macros at any time
- Meal timing recommendations
- Nutrition alerts (approaching limits, under targets)

---

## 3. User Profile & Onboarding

### 3.1 User Information Collected

**Initial Setup:**
- Name, Age/Date of birth, Gender, Height, Current weight
- Fitness goal (weight loss, muscle gain, maintenance, strength building, endurance)
- Activity level (sedentary → extremely active)
- Experience level (beginner, intermediate, advanced)
- Equipment access (home, gym, both)
- Dietary preferences/restrictions (vegetarian, vegan, keto, halal, allergies, dislikes)
- Training days per week preference, workout duration preference

**Ongoing Profile Data:**
- Weight tracking (weekly or custom frequency)
- Body measurements (chest, waist, hips, arms, legs — optional)
- Photos for progress tracking
- Performance metrics: one-rep max estimates, cardio benchmarks, flexibility metrics

### 3.2 Goal Setting

**Goal Types:**
- Weight-based: "Lose 10kg in 3 months"
- Strength-based: "Bench press 100kg"
- Endurance-based: "Run 5km in 30 minutes"
- Aesthetic: "Get visible abs"
- Health: "Lower blood pressure"

**Goal Attributes:** Target value, target date, priority level, current progress tracking

---

## 4. Data & Calculation Logic

### 4.1 Key Calculations

**Caloric Needs Estimation:**
- BMR using Harris-Benedict or Mifflin-St Jeor equation
- TDEE = BMR × Activity Factor
- Caloric surplus/deficit based on goal

**Macronutrient Distribution:**
- Protein: 1.6–2.2g/kg (muscle gain), 1.2–1.6g/kg (maintenance/loss)
- Fat: 20–35% of total calories
- Carbs: Remaining calories after protein and fat allocation

**Progress Metrics:**
- Weekly average weight change
- Body fat % estimate (if measurements provided)
- Strength progression (weight × reps volume)
- Caloric surplus/deficit actual vs. target
- Workout completion rate, program adherence %

### 4.2 Data Storage Requirements Per User

- Profile information, goal history
- Workout logs (date, program, exercises, sets, reps, weight, duration)
- Nutrition logs (food, quantity, calories, macros, time)
- Weight entries with timestamps, body measurement history
- Performance records (PRs, benchmarks), progress photos with timestamps
- Program subscriptions/assignments

---

## 5. User Workflows

### 5.1 Daily User Flow

1. **Morning/Pre-Workout:** Check today's scheduled workout, review nutrition targets
2. **During Workout:** Log each set, input actual weight/reps, log rest periods
3. **Post-Workout:** Log notes, view performance summary vs. previous session, check for PRs
4. **Throughout Day (Nutrition):** Log meals, scan barcodes or search food database, check macro progress
5. **Evening:** View daily summary (calories consumed vs. target, macro breakdown, workout adherence)
6. **Weekly:** Log weight, review progress vs. goals, adjust calories if needed

### 5.2 Program Selection Workflow

1. Browse programs by goal
2. View program details (duration, weekly frequency, equipment, difficulty, expected outcomes)
3. Start program → automatically generates weekly schedules

### 5.3 Analytics & Progress Viewing

- **Strength Progress:** Weight × reps volume over time per exercise
- **Weight Trend:** Weekly average with trend line
- **Nutrition Adherence:** % of days hitting calorie target
- **Workout Adherence:** % of scheduled workouts completed
- **Caloric Balance:** Cumulative surplus/deficit over time
- **Macro Trends:** Average daily macro breakdown vs. target

---

## 6. Multi-Language & RTL Support

**Supported Languages:** Arabic (RTL), French, English

**RTL Considerations:**
- All text direction flipped for Arabic
- Navigation/buttons mirrored for RTL
- Number formatting (Arabic numerals vs. European)
- Decimal separators based on locale
- Date formats (DD/MM/YYYY for FR/AR)

**Content to Translate:** All UI labels, exercise names/descriptions, food database names, program descriptions, notifications, error messages, tips, goal descriptions, macro recommendation text

---

## 7. Integration & External Data

### 7.1 Food Database

**Source:** USDA FoodData Central (imported), Open Food Facts, or custom

**Data Fields per Food:** Food name (multi-language), serving size unit, calories, protein (g), carbs (g), fat (g), fiber (g optional), barcode (UPC)

### 7.2 Exercise Database

**Data per Exercise:** Name (multi-language), primary muscle group, secondary muscle groups, equipment required, exercise type (compound/isolation/cardio/flexibility), difficulty level, form cues

---

## 8. Notification & Reminder System

**Types of Notifications:**
- Workout reminder (configurable time), workout overdue
- Macro alerts: approaching calorie limit, protein target under 80%, exceeding target by 10%
- Water intake reminder (periodic, optional)
- Weekly progress summary (configurable)
- Goal progress milestone (e.g., 50% toward goal)

---

## 9. Validation & Error Handling

**Weight Entry:** Must be > 0 and < 500kg. New entry should not deviate > 5kg from previous without confirmation. No future dates.

**Workout Logging:** Reps > 0, weight ≥ 0 (bodyweight allowed), rest period ≥ 0s, sets > 0

**Nutrition Logging:** Quantity > 0, valid portion size unit, food item exists in database

---

## 10. User Engagement & Motivation

**Gamification Elements (Optional):**
- Streak tracking (consecutive days logged)
- Milestone badges (e.g., 10kg lost, 50 workouts completed)
- Progress comparison to previous weeks
- Goal achievement celebration
- Personal records highlighted

**Progress Metrics Displayed:** Total workouts (all-time), current streak, weight/measurement change, strength gains (e.g., "+20kg on bench press"), consistency %

---

## 11. Performance Considerations

**Data Volume per User (Estimate):** 1–2 years = ~500–1000 nutrition entries + 300–500 workout entries + 2–4 progress photos (~1–3MB each)

**Real-Time Requirements:**
- Calorie calculation: instant
- Barcode scanning: < 2 seconds
- Weight/rep entry: < 100ms UI feedback

---

## 12. Accessibility & Usability

**Core Usability Goals:** Quick entry (barcode scan, favorites, search), large tap targets, clear visual feedback, minimal typing during workouts, voice input (optional future)

**Accessibility Requirements:** Text contrast ratios, alt text for images/icons, RTL-compatible accessibility tree, keyboard navigation, screen reader compatibility

---

## 13. Future Enhancement Possibilities

- Social features (friend tracking, shared programs, challenges)
- Coach/trainer interface (manage multiple clients)
- API for wearable integration (Apple Health, Google Fit, Fitbit)
- Advanced analytics (periodization tracking, deload weeks)
- AI-powered program recommendations based on progress
- Meal planning automation
- Progressive overload suggestions
- Form analysis (video upload, AI feedback)

---

## 14. Business Model & Monetization (Context)

**Current Status:** Validation/MVP project for school

**Potential Monetization (Future):**
- Free tier: Basic program access, 30-day nutrition history
- Premium tier: Custom programs, unlimited history, advanced analytics
- Coach tier: Multi-client management, custom program creation tools
- Subscription model (monthly/annual)

---

## 15. Technical Architecture Context

**Target Platform:** Mobile-first (iOS/Android)
**Builder:** Mehdi (Full stack ownership)
**Data Persistence:** User profiles, workouts, nutrition, goals (persistent backend)
**User Authentication:** Required for data sync and multi-device access
**Offline Capability:** Workouts and nutrition logging should work offline, sync when online

---

## 16. Success Metrics & Validation Goals

**For 1337 School Project:**
- Functional workout logging with program structure
- Functional nutrition tracking with macro calculation
- Multi-language support working, RTL layout functional
- User can complete typical daily flow (workout + nutrition logging)
- Progress tracking (graphs, summaries)
- Goal tracking and milestone detection

**Expected User Journey Time:**
- Onboarding: 5–10 minutes
- Logging workout: 3–5 min (pre) + 5–10 min (during) + 2–3 min (post)
- Logging nutrition: 1–2 minutes per meal
- Checking progress: 2–3 minutes
