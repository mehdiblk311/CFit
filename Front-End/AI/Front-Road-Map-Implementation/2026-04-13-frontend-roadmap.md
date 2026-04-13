# CFit Frontend Roadmap
**Date:** 2026-04-13
**Source of truth:** `Backend/front_end_plan.md`
**Stack:** React 19 + JSX, Vite, react-router-dom v7, Axios, TanStack Query v5, Zustand v5

---

## Real Customer Problem

> "Help me know what to do today, log workouts and meals quickly, and clearly see if I am making progress."

Product = daily fitness companion, not CRUD panel.

---

## App Structure

**Primary nav:** Home · Workouts · Nutrition · Progress · Coach  
**Secondary nav:** Programs · Templates · Recipes · Notifications · Settings

---

## Foundation Layer — ✅ DONE

All foundation tasks complete and in production.

- [x] React + JSX app shell (Vite, react-router-dom v7)
- [x] `src/api/client.js` — axios instance + interceptors (401 → silent refresh → retry)
- [x] `src/api/auth.js` — login, register, refresh, logout, 2FA endpoints
- [x] `src/api/workouts.js` — workouts, exercises, sets, cardio, templates
- [x] `src/api/nutrition.js` — meals, foods, recipes, favorites
- [x] `src/api/users.js` — profile, weight entries, nutrition targets
- [x] `src/api/analytics.js` — workout-stats, records, activity-calendar, streaks
- [x] `src/api/notifications.js` — list, mark-read, unread-count
- [x] `src/api/chat.js` — AI coach POST /v1/chat
- [x] `src/api/admin.js` — admin dashboard endpoints
- [x] `src/stores/authStore.js` — user, tokens, 2FA token, login/logout/refresh
- [x] `src/stores/workoutStore.js` — active session state + offline queue (persisted)
- [x] `src/stores/nutritionStore.js` — offline meal log queue (persisted)
- [x] `src/stores/uiStore.js` — toasts, language, offline flag
- [x] `src/hooks/useAuth.js`
- [x] `src/hooks/queries/useDashboard.js`
- [x] `src/hooks/queries/useWorkouts.js`
- [x] `src/hooks/queries/useNutrition.js`
- [x] `src/hooks/queries/useAnalytics.js`
- [x] `src/hooks/queries/useNotifications.js`
- [x] `src/hooks/queries/useAdmin.js`
- [x] Token flow: access_token in memory, refresh_token in localStorage, silent refresh on 401
- [x] TanStack Query config: 30s stale (dashboard/nutrition), 1min (workouts), 5min (exercises/foods)
- [x] Protected routes + `isOnboarded` guard (computed from profile completeness)
- [x] Mobile-first layout, bottom nav (5 tabs), 44px tap targets
- [x] RTL support (`dir` on `<html>`, inline-* CSS, Arabic font fallback)
- [x] Offline: Zustand persist middleware, flush on `window online`, offline banner

**Known backend bugs** (fix before wiring affected pages):
- `GET /v1/workouts` → `column "workouts.date" must appear in GROUP BY`
- `GET /v1/workout-templates` → `column "workout_templates.created_at" must appear in GROUP BY`
- `GET /v1/foods?q=...` → `column "foods.name" must appear in GROUP BY`

---

## Phase 1 — MVP Pages (P0)

### 1. Login / Register / 2FA

**Customer job:** Secure app entry + 2FA management.

**Backend endpoints:**
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/2fa/setup`
- `POST /v1/auth/2fa/verify`
- `POST /v1/auth/2fa/disable`
- `POST /v1/auth/2fa/recover`
- `POST /v1/auth/logout`
- `GET /v1/auth/sessions`
- `DELETE /v1/auth/sessions/{id}`

**Note:** No forgot-password endpoint in backend — do NOT build reset-password flow.

**Tasks:**
- [x] `Login.jsx` — wired to `authStore.login()`, 2FA flag handling, forgot-password link removed
- [x] `Signup.jsx` — wired to `POST /v1/auth/register`
- [x] `TwoFactorChallenge.jsx` — TOTP + recovery code inputs, uses `two_factor_token` from store
- [x] `TwoFactorSetup.jsx` — QR code display, verification, recovery codes shown on success
- [x] Session expiry + silent refresh in `client.js`
- [ ] Delete remaining ForgotPassword*.jsx files (still present in `src/components/auth/`)

---

### 2. Onboarding / Profile Setup

**Customer job:** Collect data to personalize calories, macros, and goals.

**Backend endpoints:**
- `GET /v1/users/{id}`
- `PATCH /v1/users/{id}`
- `GET /v1/users/{user_id}/nutrition-targets`

**Tasks:**
- [x] `OnboardingBasicInfo.jsx` — DOB, weight, height → `PATCH /v1/users/{id}`
- [x] `OnboardingGoalsActivity.jsx` — goal + activity level → `PATCH /v1/users/{id}`
- [x] `OnboardingYourPlan.jsx` — show TDEE + targets (read-only) → `GET /v1/users/{id}/nutrition-targets`
- [x] `isOnboarded()` guard — computed: user has weight + height + goal (no backend flag)
- [x] Goal-focused copy: build muscle / lose fat / maintain

---

### 3. Home / Today Dashboard

**Customer job:** "What should I do today, and am I on track?"

**Backend endpoints:**
- `GET /v1/summary`
- `GET /v1/weekly-summary`
- `GET /v1/recommendations`
- `GET /v1/users/{user_id}/streaks`
- `GET /v1/users/{user_id}/coach-summary`
- `GET /v1/notifications/unread-count`

**Tasks:**
- [ ] Wire dashboard hero cards to `GET /v1/summary` (currently hardcoded)
- [ ] Wire macro progress bars/rings to real calorie/macro data
- [ ] Add recommendation card → `GET /v1/recommendations`
- [ ] Add quick actions: log workout, log meal, add weight
- [ ] Add streak badges → `GET /v1/users/{id}/streaks`
- [ ] Add mini weekly summary → `GET /v1/weekly-summary`
- [ ] Add unread notification count in header bell → `GET /v1/notifications/unread-count`
- [ ] Add empty state for new users with first-action CTAs

---

### 4. Workout History

**Customer job:** Review past sessions and stay consistent.

**Backend endpoints:**
- `GET /v1/workouts`
- `GET /v1/users/{user_id}/workouts`
- `GET /v1/workouts/{id}`

**Tasks:**
- [x] Workout list page built and using `useWorkoutList`
- [x] Workout type + date display
- [ ] Filters: date range and workout type (UI shell exists, not wired)
- [ ] Empty state + start-workout CTA
- [ ] Calendar/list toggle

---

### 5. Workout Detail / Log Workout

**Customer job:** Log a workout fast enough that users actually use it every session.

**Backend endpoints:**
- `POST /v1/workouts`
- `PATCH /v1/workouts/{id}`
- `DELETE /v1/workouts/{id}`
- `GET /v1/workouts/{id}/exercises`
- `POST /v1/workouts/{id}/exercises`
- `PATCH /v1/workout-exercises/{id}`
- `DELETE /v1/workout-exercises/{id}`
- `GET /v1/workout-exercises/{id}/sets`
- `POST /v1/workout-exercises/{id}/sets`
- `PATCH /v1/workout-sets/{id}`
- `DELETE /v1/workout-sets/{id}`
- `GET /v1/workouts/{id}/cardio`
- `POST /v1/workouts/{id}/cardio`
- `PATCH /v1/workout-cardio/{id}`
- `DELETE /v1/workout-cardio/{id}`

**Tasks:**
- [x] Create workout flow → `POST /v1/workouts`, stored in `workoutStore`
- [x] Add exercise flow → `POST /v1/workouts/{id}/exercises`
- [x] Set logger → `POST /v1/workouts/{id}/exercises/{eid}/sets`
- [x] Local rest timer (client-side, `workoutStore`)
- [x] Active workout floating bar above bottom nav
- [x] Finish workout → `PATCH /v1/workouts/{id}` with `completed_at`
- [ ] Edit/delete sets → `PATCH /workout-sets/{id}`, `DELETE /workout-sets/{id}`
- [ ] Edit/delete exercises → `PATCH /workout-exercises/{id}`, `DELETE /workout-exercises/{id}`
- [ ] Cardio block → `POST /v1/workouts/{id}/cardio`
- [ ] Notes + duration + workout type editing
- [ ] "Repeat last set" / quick entry UX
- [ ] Delete workout → `DELETE /v1/workouts/{id}`

---

### 6. Exercise Library / Exercise Search

**Customer job:** Choose the right movement fast and understand how to perform it.

**Backend endpoints:**
- `GET /v1/exercises`
- `GET /v1/exercises/{id}`
- `POST /v1/exercises/search`
- `GET /v1/exercises/library-meta`
- `GET /v1/exercise-images/{path...}`
- `GET /v1/exercises/{id}/history`

**Tasks:**
- [x] `useExercises` hook wired to `GET /v1/exercises`
- [ ] Filter sidebar/sheet: level, equipment, category, muscle
- [ ] Exercise detail page/modal with instructions and images
- [ ] Exercise history/progression for selected exercise → `GET /v1/exercises/{id}/history`
- [ ] "Add to workout" action from search results
- [ ] Semantic search via `POST /v1/exercises/search`

---

### 7. Daily Nutrition / Meal Log

**Customer job:** Log meals quickly and see macro impact immediately.

**Backend endpoints:**
- `GET /v1/meals`
- `POST /v1/meals`
- `GET /v1/meals/{id}`
- `PATCH /v1/meals/{id}`
- `DELETE /v1/meals/{id}`
- `GET /v1/meals/recent`
- `POST /v1/meals/{id}/clone`
- `GET /v1/summary`

**Tasks:**
- [ ] Build daily meal timeline (date-selectable)
- [ ] Add meal modal/page → `POST /v1/meals`
- [ ] Edit meal flow → `PATCH /v1/meals/{id}`
- [ ] Delete meal → `DELETE /v1/meals/{id}`
- [ ] Clone recent meal shortcut → `POST /v1/meals/{id}/clone`
- [ ] Summary strip: calories/protein/carbs/fat from `GET /v1/summary`

---

### 8. Meal Builder / Food Picker

**Customer job:** Make food logging fast enough to become a habit.

**Backend endpoints:**
- `GET /v1/meals/{id}/foods`
- `POST /v1/meals/{id}/foods`
- `PATCH /v1/meal-foods/{id}`
- `DELETE /v1/meal-foods/{id}`
- `GET /v1/foods`
- `GET /v1/foods/{id}`
- `GET /v1/foods/recent`
- `POST /v1/foods/{id}/favorite`
- `DELETE /v1/foods/{id}/favorite`
- `GET /v1/users/{user_id}/favorites`

**Tasks:**
- [ ] Searchable food picker (debounced `GET /v1/foods?q=`)
- [ ] Recent foods tab → `GET /v1/foods/recent`
- [ ] Favorites tab → `GET /v1/users/{id}/favorites`
- [ ] Quantity editor with real-time macro update
- [ ] Meal nutrition summary panel
- [ ] Add/edit/remove foods in meal

---

### 9. Weight Tracker

**Customer job:** See whether body-weight trend matches the goal.

**Backend endpoints:**
- `GET /v1/weight-entries`
- `POST /v1/weight-entries`
- `GET /v1/weight-entries/{id}`
- `PATCH /v1/weight-entries/{id}`
- `DELETE /v1/weight-entries/{id}`

**Tasks:**
- [ ] Weight chart page (line chart over time)
- [ ] Quick weigh-in card → `POST /v1/weight-entries`
- [ ] Date range filters
- [ ] Recent trend summary (compare vs goal direction)
- [ ] Edit/delete entries

---

### 10. Notifications Center

**Customer job:** See reminders and important warnings in one place.

**Backend endpoints:**
- `GET /v1/notifications`
- `PATCH /v1/notifications/{id}/read`
- `PATCH /v1/notifications/read-all`
- `GET /v1/notifications/unread-count`

**Tasks:**
- [ ] Notifications page or drawer
- [ ] Unread badge in nav (bell icon)
- [ ] Mark single read → `PATCH /v1/notifications/{id}/read`
- [ ] Mark all read → `PATCH /v1/notifications/read-all`
- [ ] Deep-link from notification type to relevant page

---

## Phase 2 — Retention + Differentiation (P1)

### 11. Progress & Analytics

**Customer job:** Give users proof their effort is working.

**Backend endpoints:**
- `GET /v1/users/{user_id}/records`
- `GET /v1/users/{user_id}/workout-stats`
- `GET /v1/users/{user_id}/activity-calendar`
- `GET /v1/users/{user_id}/streaks`
- `GET /v1/weekly-summary`
- `GET /v1/exercises/{id}/history`

**Tasks:**
- [ ] Progress dashboard shell
- [ ] PR cards → `GET /v1/users/{id}/records`
- [ ] Volume/progression charts → `GET /v1/users/{id}/workout-stats`
- [ ] Adherence heatmap/calendar → `GET /v1/users/{id}/activity-calendar`
- [ ] Streak display → `GET /v1/users/{id}/streaks`
- [ ] Weekly trends module → `GET /v1/weekly-summary`

---

### 12. Workout Templates

**Customer job:** Reduce repeated logging work for common routines.

**Backend endpoints:**
- `GET /v1/workout-templates`
- `POST /v1/workout-templates`
- `GET /v1/workout-templates/{id}`
- `PATCH /v1/workout-templates/{id}`
- `DELETE /v1/workout-templates/{id}`
- `POST /v1/workout-templates/{id}/apply`

**Tasks:**
- [ ] Templates list page
- [ ] Template builder (name + exercise blocks + default sets)
- [ ] Apply-to-today flow → `POST /v1/workout-templates/{id}/apply`
- [ ] Edit template metadata
- [ ] Delete template
- [ ] Create-from-existing-workout shortcut

---

### 13. Program Assignments / Structured Plans

**Customer job:** Follow a multi-week plan instead of improvising workouts.

**Backend endpoints:**
- `GET /v1/program-assignments`
- `GET /v1/program-assignments/{id}`
- `PATCH /v1/program-assignments/{id}/status`
- `POST /v1/program-sessions/{id}/apply`

**Note:** This is user-facing consumption only. Admin program creation is Phase 3.

**Tasks:**
- [ ] Active program overview
- [ ] Week/day session list
- [ ] Start-session / apply-session CTA → `POST /v1/program-sessions/{id}/apply`
- [ ] Show assignment state: assigned / in_progress / completed / cancelled

---

### 14. Recipes

**Customer job:** Log repeat home meals faster and keep nutrition accurate.

**Backend endpoints:**
- `GET /v1/recipes`
- `POST /v1/recipes`
- `GET /v1/recipes/{id}`
- `PATCH /v1/recipes/{id}`
- `DELETE /v1/recipes/{id}`
- `GET /v1/recipes/{id}/nutrition`
- `POST /v1/recipes/{id}/log-to-meal`

**Tasks:**
- [ ] Recipe list page
- [ ] Recipe builder (add foods, set servings)
- [ ] Per-serving nutrition display → `GET /v1/recipes/{id}/nutrition`
- [ ] Log-to-meal shortcut → `POST /v1/recipes/{id}/log-to-meal`
- [ ] Edit/delete recipe

---

### 15. AI Coach

**Customer job:** Ask natural questions instead of manually interpreting all the data.

**Backend endpoints:**
- `POST /v1/chat`
- `GET /v1/chat/history`
- `POST /v1/chat/feedback`
- `GET /v1/users/{user_id}/coach-summary`

**Tasks:**
- [ ] Coach chat page → `POST /v1/chat`
- [ ] Chat history sidebar/list → `GET /v1/chat/history`
- [ ] Starter prompt chips
- [ ] Thumbs up/down feedback → `POST /v1/chat/feedback`
- [ ] Links from coach answers to workout, nutrition, exercise pages

---

### 16. Settings / Security / Export / Account

**Customer job:** Control over account, privacy, and security.

**Backend endpoints:**
- `GET /v1/users/{id}`
- `PATCH /v1/users/{id}`
- `GET /v1/auth/sessions`
- `DELETE /v1/auth/sessions/{id}`
- `POST /v1/auth/2fa/setup`
- `POST /v1/auth/2fa/verify`
- `POST /v1/auth/2fa/disable`
- `POST /v1/exports`
- `GET /v1/exports/{id}`
- `POST /v1/account/delete-request`
- `POST /v1/auth/logout`

**Tasks:**
- [ ] Profile settings section → `PATCH /v1/users/{id}`
- [ ] Nutrition target display/edit → `GET/PATCH /v1/users/{id}/nutrition-targets`
- [ ] 2FA section: setup / verify / disable flows
- [ ] Active sessions list → `GET /v1/auth/sessions`, `DELETE /v1/auth/sessions/{id}`
- [ ] Export data flow → `POST /v1/exports`, poll `GET /v1/exports/{id}`
- [ ] Delete account confirmation → `POST /v1/account/delete-request`
- [ ] Language toggle (EN/AR) → `uiStore.setLanguage`

---

## Phase 2 — P2

### 17. Leaderboard / Motivation

**Customer job:** Accountability and consistency through friendly competition.

**Backend endpoints:**
- `GET /v1/leaderboard`

**Tasks:**
- [ ] Leaderboard page
- [ ] Period filters: weekly / monthly / yearly / all-time
- [ ] Pillar filters: training / nutrition / consistency / all
- [ ] Highlight current user row

---

## Phase 3 — Internal Admin (build only if needed)

### 18. Admin Dashboard

**Endpoints:** `GET /v1/admin/dashboard/summary`, `/trends`, `/realtime`, `/system/health`, `/admin/users/stats`, `/admin/users/growth`, `/admin/workouts/stats`, `/admin/workouts/exercises/popular`, `/admin/nutrition/stats`, `/admin/moderation/stats`, `/admin/audit-logs`

**Tasks:**
- [ ] Wire `AdminDashboard.jsx` to `GET /v1/admin/dashboard/summary`
- [ ] System health panel
- [ ] Usage + moderation stats

---

### 19. Admin User Management

**Endpoints:** `GET /v1/admin/users`, `GET /v1/admin/users/{id}`, `PATCH /v1/admin/users/{id}`, `DELETE /v1/admin/users/{id}`, `POST /v1/admin/users/{id}/ban`, `POST /v1/admin/users/{id}/unban`

**Tasks:**
- [ ] Wire `AdminUserManagement.jsx` to user list + detail
- [ ] Ban/unban actions
- [ ] Delete user

---

### 20. Admin Program Management

**Endpoints:** `POST /v1/programs`, `GET /v1/programs`, `GET /v1/programs/{id}`, `PATCH /v1/programs/{id}`, `DELETE /v1/programs/{id}`, `POST /v1/programs/{id}/weeks`, `POST /v1/programs/{id}/assignments`, `GET /v1/programs/{id}/assignments`, `GET /v1/program-weeks/{id}`, `PATCH /v1/program-weeks/{id}`, `DELETE /v1/program-weeks/{id}`, `POST /v1/program-weeks/{id}/sessions`, `GET /v1/program-sessions/{id}`, `PATCH /v1/program-sessions/{id}`, `DELETE /v1/program-sessions/{id}`, `PATCH /v1/admin/program-assignments/{id}`, `DELETE /v1/admin/program-assignments/{id}`

**Tasks:**
- [ ] Program list + create
- [ ] Program week + session builder
- [ ] Assign program to user

---

### 21. Admin Nutrition Catalog / Import

**Endpoints:** `POST /v1/admin/import-usda`, `GET /v1/admin/nutrition/stats`

**Tasks:**
- [ ] USDA import trigger UI
- [ ] Nutrition catalog stats display

---

## Build Order

### MVP (do next)
1. ~~Foundation layer~~ ✅
2. ~~Login / Register / 2FA~~ ✅ (delete ForgotPassword files)
3. ~~Onboarding~~ ✅
4. **Home Dashboard** — wire real data (hardcoded now)
5. **Workout History** — filters + empty state
6. **Workout Detail** — cardio, edit/delete sets, quick entry
7. **Exercise Library** — filters, detail modal, history
8. **Daily Nutrition / Meal Log** — full CRUD
9. **Meal Builder / Food Picker** — food search, recents, favorites
10. **Weight Tracker**
11. **Notifications Center**

### After MVP
12. Progress & Analytics
13. Workout Templates
14. Program Assignments
15. Recipes
16. AI Coach
17. Settings / Security / Export / Account
18. Leaderboard

### Internal only (later)
19. Admin Dashboard
20. Admin User Management
21. Admin Program Management
22. Admin Nutrition Catalog

---

## What NOT to Build First

Do not make the first version feel like:
- admin panel
- database browser
- standalone AI chatbot
- exercise-search-only tool

Best user value: today dashboard + fast workout logging + fast meal logging + visible progress + reusable templates/recipes/programs.
