# Frontend Execution Plan (Respecting Steps 1 -> 6 and 11 -> 13)

Date: 2026-04-15  
Source of truth: `Backend/front_end_plan.md` and `Front-End/AI/Front-Road-Map-Implementation/front_end_plan copy.md`

## Context Baseline Used

- `Front-End/AI/platform_context.md`
- `Front-End/AI/graphify/how-to-use-graphify.md`
- `Front-End/AI/graphify/graphify-Front/GRAPH_REPORT.md`
- `Front-End/AI/graphify/graphify-Backend/GRAPH_REPORT.md`
- `Front-End/AI/DESIGN.md`
- `frontend-design` skill guidance (`/Users/mehdi/.agents/skills/frontend-design/SKILL.md`)

## Rule: Step Gating

- We prioritize Steps `1` to `6` first for MVP stability.
- We also keep Steps `11` to `13` aligned because they are already partially/mostly implemented and affect the same workout experience.
- No new Step `14+` scope should block or delay completion and hardening of these tracked steps.
- Any UI update must keep Clay-Artisanal direction from `Front-End/AI/DESIGN.md`.

## Step 1 -> 6 Status

### 1) Login / Register / 2FA
Status: `Done (stabilize only)`

- Implemented routes and components in `Front-End/src/components/auth/`
- Auth + guards in `Front-End/src/hooks/useAuth.js` and `Front-End/src/router/guards.jsx`
- Silent refresh flow in `Front-End/src/api/client.js`
- 2FA setup is available and currently surfaced through settings flow, which is acceptable for this phase

### 2) Onboarding / Profile Setup
Status: `Done (stabilize only)`

- Onboarding flow implemented in `Front-End/src/components/auth/OnboardingFlow.jsx`
- Basic info + goals + plan pages implemented and connected to profile update/targets

### 3) Home / Today Dashboard
Status: `Mostly Done (QA + endpoint verification)`

- Dashboard wired in `Front-End/src/components/user/Dashboard/Dashboard.jsx`
- Data hooks in `Front-End/src/hooks/queries/useDashboard.js`
- Required next check: verify endpoint contracts against backend for summary/recommendations route shape

### 4) Workout History
Status: `Done (harden only)`

- Implemented in `Front-End/src/components/user/Workouts/Workouts.jsx` (History view)
- Includes list, filters, calendar/list toggle, detail open flow

### 5) Workout Detail / Log Workout
Status: `Done (harden only)`

- Implemented in `Front-End/src/components/user/Workouts/Workouts.jsx` (Active session + summary)
- Set lifecycle supports update-existing and create-new behavior

### 6) Exercise Library / Exercise Search
Status: `Implemented, needs bug-fix pass`

- Implemented in `Front-End/src/components/user/Workouts/Workouts.jsx` (Library view)
- Open issue bucket before moving on:
  - image rendering/fallback behavior in exercise cards/details
  - category selection behavior consistency in library filtering

## Step 11 -> 13 Status

### 11) Progress & Analytics
Status: `Partially Implemented`

- Analytics hooks are present in `Front-End/src/hooks/queries/useAnalytics.js`
- Activity/streak/weekly signals already appear across dashboard and workouts surfaces
- Missing piece: a dedicated progress dashboard that combines PRs, trends, adherence calendar, and progression charts in one user-facing screen

### 12) Workout Templates
Status: `Mostly Implemented`

- Real template APIs exist in `Front-End/src/api/workouts.js`
- Query/mutation hooks exist in `Front-End/src/hooks/queries/useWorkouts.js`
- User-facing template flow is implemented inside `Front-End/src/components/user/Workouts/Workouts.jsx` as `Custom Programs`
- Current gap: edit/delete management UI is still limited compared with full roadmap intent

### 13) Program Assignments / Structured Plans
Status: `Implemented (harden only)`

- Real assignment APIs and apply-session flow are wired in `Front-End/src/api/workouts.js`
- Query/mutation hooks exist in `Front-End/src/hooks/queries/useWorkouts.js`
- User-facing consumption flow is implemented in `Front-End/src/components/user/Workouts/Workouts.jsx` as `Coach Programs`
- Supports active assignment preview, start/apply session flow, and assignment state handling

## Deferred But Still Important

### 7) Daily Nutrition / Meal Log
Status: `Not complete`

- API and hooks exist (`Front-End/src/api/nutrition.js`, `Front-End/src/hooks/queries/useNutrition.js`)
- Main UI is still mostly static placeholders in:
  - `Front-End/src/components/user/Nutrition/Dashboard/Nutrition.jsx`
  - `Front-End/src/components/user/Nutrition/History/NutritionHistory.jsx`
- Keep this visible as the next major unfinished roadmap area after the tracked steps above are stabilized

## Immediate Next Work (To Stay Compliant)

1. Fix Step 6 bugs (exercise images + category selection logic).
2. Harden Step 11 analytics by deciding whether to ship a dedicated progress page now or keep analytics distributed across dashboard/workouts temporarily.
3. Finish template management gaps for Step 12, especially edit/delete UX if required for release.
4. Harden Step 13 program assignment edge cases and verify apply-session behavior against real backend data.
5. Replace static Step 7 nutrition dashboard/history with API-backed meal timeline and macro summary.
6. Run `lint`, `test`, and `build` after each patch affecting these steps.
