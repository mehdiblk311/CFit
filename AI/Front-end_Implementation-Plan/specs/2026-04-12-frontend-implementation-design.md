# Frontend Implementation Design
**Date:** 2026-04-12  
**Project:** UM6P_FIT (CFit)  
**Approach:** Foundation-first (B)

---

## Backend Status Note

Backend is running and healthy at `http://localhost:8080`. All core endpoints implemented and tested. Three gaps — do NOT build UI for these yet:
- Workout program admin CRUD + assignment flows (models exist, no endpoints)
- Notification auto-trigger from scheduler (manual create works, rules fire but no scheduler)
- Advanced AI features (deferred by design)

---

## Stack

**Existing:** React + JSX (no TypeScript), Vite, react-router-dom  
**Adding:**
- `axios` — HTTP client + interceptors
- `@tanstack/react-query` — server state, caching, background refetch
- `zustand` — client state (active workout, UI, auth)

Stay JSX throughout. No TypeScript conversion.

---

## Section 1: Foundation Layer

### File Structure

```
src/
├── api/
│   ├── client.js          — axios instance, base URL, interceptors
│   ├── auth.js            — login, signup, refresh, logout, 2FA
│   ├── workouts.js        — workout CRUD, sets, cardio, templates
│   ├── nutrition.js       — meals, foods, recipes, favorites
│   ├── users.js           — profile, TDEE, weight, targets
│   ├── analytics.js       — stats, PRs, calendar, streaks
│   ├── notifications.js   — fetch, mark-read, unread count
│   ├── chat.js            — AI coach
│   └── admin.js           — admin dashboard endpoints
├── stores/
│   ├── authStore.js       — user, tokens, login/logout actions
│   ├── workoutStore.js    — active session (sets, timer, exercises, offline queue)
│   ├── nutritionStore.js  — offline meal log queue
│   └── uiStore.js         — bottom nav, modals, toasts, language, offline flag
├── hooks/
│   ├── useAuth.js         — replaces mock, reads authStore
│   └── queries/
│       ├── useDashboard.js
│       ├── useWorkouts.js
│       ├── useNutrition.js
│       ├── useAnalytics.js
│       ├── useNotifications.js
│       └── useAdmin.js
```

### Token Flow

1. Login → store `access_token` in memory (authStore) + `refresh_token` in localStorage
2. Axios request interceptor → attach `Authorization: Bearer <token>`
3. Axios response interceptor → on 401, call `POST /v1/auth/refresh`, retry original request once
4. On refresh failure → logout, redirect to `/login`
5. Logout → `POST /v1/auth/logout`, clear authStore + localStorage

### TanStack Query Config

- Default stale time: 30s
- Static data (exercises, foods catalog): 5 min stale time
- On mutation → `queryClient.invalidateQueries` for affected key
- Optimistic updates for active workout sets

---

## Section 2: Auth + Onboarding

### Pages

| Page | Status | API |
|------|--------|-----|
| `Login.jsx` | Keep skeleton, wire API | `POST /v1/auth/login` |
| `Signup.jsx` | Keep skeleton, wire API | `POST /v1/auth/register` |
| `TwoFactorChallenge.jsx` | New | `POST /v1/auth/2fa/verify` |
| `OnboardingFlow.jsx` | Keep structure, wire API | `PATCH /v1/users/{id}`, `GET /v1/users/{id}/nutrition-targets` |
| `ForgotPassword*.jsx` | **Delete** — no backend endpoint | — |

### Onboarding Steps

1. Basic info: DOB, weight, height → `PATCH /v1/users/{id}`
2. Goal + activity level → `PATCH /v1/users/{id}`
3. Show TDEE + targets → `GET /v1/users/{id}/nutrition-targets` (read-only confirmation)
4. Complete → `onboarded: true` in authStore (local flag)

### Guards (updated)

`isOnboarded` derived from user profile completeness: has `weight` + `height` + `goal` set. Not a stored backend flag.

---

## Section 3: Core Pages

### Dashboard (`/dashboard`)

- `GET /v1/users/{id}/summary` → calories/macros vs targets
- `GET /v1/users/{id}/streaks` → streak badges
- `GET /v1/users/{id}/recommendations` → integration rules output
- `GET /v1/notifications` → unread count in header bell
- Keep existing UI layout, replace hardcoded values

### Workouts (`/workouts`)

**List view:**
- `GET /v1/workouts` — history
- `GET /v1/workout-templates` — templates list

**Active session (Zustand workoutStore):**
- Start → `POST /v1/workouts`
- Add exercise → `POST /v1/workouts/{id}/exercises`
- Log set → `POST /v1/workouts/{id}/exercises/{eid}/sets`
- Rest timer → local store only
- Finish → `PATCH /v1/workouts/{id}` with `completed_at`
- Floating persistent bar above bottom nav when session active

**Analytics:**
- PRs: `GET /v1/users/{id}/records`
- History: `GET /v1/exercises/{id}/history`

### Nutrition (`/nutrition/*` — already sub-routed)

| Sub-route | Data |
|-----------|------|
| `/nutrition` (dashboard) | `GET /v1/users/{id}/summary` macros ring |
| `/nutrition/history` | `GET /v1/meals?date=...` |
| `/nutrition/food-search` | `GET /v1/foods?q=...` debounced |
| `/nutrition/add-quantity` | `POST /v1/meals/{id}/foods` |
| `/nutrition/recipe` | `GET /v1/recipes`, `POST /v1/recipes` |
| `/nutrition/custom-food` | `POST /v1/foods` |

### Weight Tracker (`/settings` or `/progress`)

- `GET /v1/users/{id}/weight-entries`
- `POST /v1/users/{id}/weight-entries`

### AI Chat (`/ai`)

- `POST /v1/chat` with message array
- History in component state only (no persistence)

### Analytics (`/progress`)

- `GET /v1/users/{id}/workout-stats`
- `GET /v1/users/{id}/activity-calendar`
- `GET /v1/exercises/{id}/history`
- `GET /v1/users/{id}/streaks`

### Settings (`/settings`)

- Profile: `PATCH /v1/users/{id}`
- Nutrition targets: `GET/PATCH /v1/users/{id}/nutrition-targets`
- 2FA: `POST /v1/auth/2fa/setup`, verify, disable
- Export: `POST /v1/exports`, `GET /v1/exports/{id}`
- Language toggle → `uiStore.setLanguage`
- Sessions: `GET /v1/auth/sessions`, `DELETE /v1/auth/sessions/{id}`

### Admin (`/admin/*`)

Keep existing structure, wire to `GET /v1/admin/...` endpoints.

---

## Section 4: Data Flow + Error Handling

### Query Pattern

```js
const { data, isLoading, error } = useDashboardSummary(userId);
```

Stale times:
- Dashboard, nutrition summary: 30s
- Workout history: 1 min
- Exercises, food catalog: 5 min

### Error Handling

| Error | Behavior |
|-------|----------|
| 401 | Interceptor refreshes token silently, retries request |
| 403 | Redirect `/dashboard` + toast |
| 400/422 | Surface field errors in form |
| 500/network | Toast "Something went wrong, try again" |
| Offline | `uiStore.offline = true` → banner, queue writes locally |

### Loading States

- Skeletons (not spinners) for page-level loads
- Button loading state for mutations
- No full-page overlays

### Toast System

- `uiStore.toasts[]` — add/dismiss actions
- Rendered once in `AppLayout.jsx`

---

## Section 5: Mobile-first + RTL + Offline

### Mobile

- Bottom nav: 5 tabs (Dashboard, Workouts, Nutrition, AI, Settings)
- Tap targets: minimum 44px
- Active workout: floating bar above bottom nav
- Modals: bottom sheet pattern (slide up), not center dialogs

### RTL

- `dir` attribute on `<html>` toggled from `uiStore.language`
- CSS uses `margin-inline-start/end`, `padding-inline-*`, `inset-inline-*`
- Arabic → system font fallback (Roobert doesn't cover Arabic glyphs)
- Language toggle in Settings

### Offline

- `workoutStore` persisted via Zustand persist middleware → localStorage
- `nutritionStore` offline queue → same pattern
- Flush pending on `window` `online` event
- `uiStore.offline` driven by `navigator.onLine` + event listeners
- Offline banner: "You're offline — data will sync when connected"

---

## Build Order

1. Install deps (axios, @tanstack/react-query, zustand)
2. `src/api/client.js` — axios instance + interceptors
3. `src/api/auth.js` + all other api modules
4. `src/stores/authStore.js` — replace AuthContext mock
5. `src/stores/workoutStore.js`, `nutritionStore.js`, `uiStore.js`
6. `src/hooks/useAuth.js` — update to read authStore
7. `src/hooks/queries/` — TanStack Query hooks per domain
8. Wire Auth pages (Login, Signup, 2FA, Onboarding)
9. Delete ForgotPassword files
10. Wire Dashboard
11. Wire Workouts (list + active session)
12. Wire Nutrition sub-routes
13. Wire AI Chat
14. Wire Analytics/Progress
15. Wire Settings (profile, 2FA, export, sessions)
16. Wire Admin pages
17. RTL + language toggle
18. Offline queue + sync
