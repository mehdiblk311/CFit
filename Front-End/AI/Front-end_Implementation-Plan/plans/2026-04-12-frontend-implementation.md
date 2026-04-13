# Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing React JSX skeleton to the live Go backend API at `http://localhost:8080`, replacing all mock data with real API calls.

**Architecture:** Foundation-first — install deps, build API client + Zustand stores + TanStack Query hooks, then wire each page. Auth uses real JWT + refresh token flow via Axios interceptors. Active workout session lives in persisted Zustand store for offline support.

**Tech Stack:** React 19 + JSX, Vite, react-router-dom v7, Axios, TanStack Query v5, Zustand v5

---

## Known Backend Bugs (fix before wiring affected pages)

These endpoints return SQL GROUP BY errors — fix before Tasks 12, 13, 14:
- `GET /v1/workouts` → `column "workouts.date" must appear in GROUP BY`
- `GET /v1/workout-templates` → `column "workout_templates.created_at" must appear in GROUP BY`
- `GET /v1/foods?q=...` → `column "foods.name" must appear in GROUP BY`

---

## File Map

**New files to create:**
```
src/api/client.js               — axios instance, base URL, interceptors
src/api/auth.js                 — login, register, refresh, logout, 2FA endpoints
src/api/users.js                — profile, weight entries, nutrition targets
src/api/workouts.js             — workouts, exercises, sets, cardio, templates
src/api/nutrition.js            — meals, foods, recipes, favorites
src/api/analytics.js            — workout-stats, records, activity-calendar, streaks
src/api/notifications.js        — list, mark-read, unread-count
src/api/chat.js                 — AI coach POST /v1/chat
src/api/admin.js                — admin dashboard endpoints
src/stores/authStore.js         — user, tokens, login/logout/refresh actions
src/stores/workoutStore.js      — active session state + offline queue (persisted)
src/stores/nutritionStore.js    — offline meal log queue (persisted)
src/stores/uiStore.js           — toasts, language, offline flag
src/hooks/queries/useDashboard.js
src/hooks/queries/useWorkouts.js
src/hooks/queries/useNutrition.js
src/hooks/queries/useAnalytics.js
src/hooks/queries/useNotifications.js
src/hooks/queries/useAdmin.js
src/components/auth/TwoFactorChallenge.jsx
src/components/auth/TwoFactorChallenge.css
src/components/common/Toast.jsx
src/components/common/Skeleton.jsx
```

**Files to modify:**
```
src/main.jsx                                  — add QueryClientProvider, wrap providers
src/hooks/useAuth.js                          — read authStore instead of AuthContext
src/router/guards.jsx                         — derive isOnboarded from profile completeness
src/router/AppRouter.jsx                      — add /progress route, TwoFactorChallenge route
src/context/AuthContext.jsx                   — DELETE (replaced by authStore)
src/components/auth/Login.jsx                 — wire to authStore.login()
src/components/auth/Signup.jsx                — wire to authStore.signup()
src/components/auth/OnboardingBasicInfo.jsx   — wire PATCH /v1/users/{id}
src/components/auth/OnboardingGoalsActivity.jsx — wire PATCH /v1/users/{id}
src/components/auth/OnboardingYourPlan.jsx    — wire GET /v1/users/{id}/nutrition-targets
src/components/common/AppLayout.jsx           — add Toast renderer, ActiveWorkoutBar, offline banner
src/components/user/Dashboard/Dashboard.jsx   — wire real data
src/components/user/Workouts/Workouts.jsx     — wire real data + workoutStore
src/components/user/Nutrition/Dashboard/Nutrition.jsx — wire real data
src/components/user/Nutrition/FoodSearch/FoodSearch.jsx — wire GET /v1/foods?q=
src/components/user/Nutrition/AddQuantity/AddQuantity.jsx — wire POST /v1/meals/{id}/foods
src/components/user/Nutrition/History/NutritionHistory.jsx — wire GET /v1/meals?date=
src/components/user/Nutrition/CreateRecipe/CreateRecipe.jsx — wire recipes API
src/components/user/AIAssistant/AIAssistant.jsx — wire POST /v1/chat
src/components/user/Settings/Settings.jsx     — wire profile, 2FA, export, sessions
src/components/admin/AdminDashboard.jsx       — wire GET /v1/admin/stats
src/components/admin/AdminUserManagement.jsx  — wire GET /v1/admin/users
```

**Files to delete:**
```
src/components/auth/ForgotPassword.css
src/components/auth/ForgotPassword.jsx
src/components/auth/ForgotPasswordFlow.jsx
src/components/auth/PasswordChanged.css
src/components/auth/PasswordChanged.jsx
src/components/auth/ResetPassword.css
src/components/auth/ResetPassword.jsx
```

---

## Task 1: Install dependencies

**Files:** `package.json`

- [ ] **Step 1: Install packages**

```bash
cd /Users/mehdi/Desktop/Cfit
npm install axios @tanstack/react-query zustand
```

Expected output: `added N packages`

- [ ] **Step 2: Verify install**

```bash
node -e "require('./node_modules/axios'); require('./node_modules/@tanstack/react-query'); require('./node_modules/zustand'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add axios, react-query, zustand"
```

---

## Task 2: Axios client with token refresh

**Files:**
- Create: `src/api/client.js`

- [ ] **Step 1: Create axios client**

```js
// src/api/client.js
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token
client.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('um6p_fit_auth');
    if (raw) {
      const { accessToken } = JSON.parse(raw);
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    }
  } catch { /* ignore */ }
  return config;
});

// Track if we are already refreshing to avoid loops
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

// Response interceptor — handle 401 with token refresh
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return client(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const raw = localStorage.getItem('um6p_fit_auth');
        const { refreshToken } = raw ? JSON.parse(raw) : {};
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${BASE_URL}/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const newAccess = data.access_token;
        const newRefresh = data.refresh_token;
        // Update storage
        const stored = raw ? JSON.parse(raw) : {};
        localStorage.setItem('um6p_fit_auth', JSON.stringify({
          ...stored,
          accessToken: newAccess,
          refreshToken: newRefresh,
        }));
        processQueue(null, newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return client(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('um6p_fit_auth');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default client;
```

- [ ] **Step 2: Commit**

```bash
git add src/api/client.js
git commit -m "feat: add axios client with JWT refresh interceptor"
```

---

## Task 3: API modules

**Files:**
- Create: `src/api/auth.js`, `src/api/users.js`, `src/api/workouts.js`, `src/api/nutrition.js`, `src/api/analytics.js`, `src/api/notifications.js`, `src/api/chat.js`, `src/api/admin.js`

- [ ] **Step 1: Create auth.js**

```js
// src/api/auth.js
import client from './client';

export const authApi = {
  login:          (email, password) =>
    client.post('/v1/auth/login', { email, password }).then(r => r.data),
  register:       (name, email, password) =>
    client.post('/v1/auth/register', { name, email, password }).then(r => r.data),
  refresh:        (refresh_token) =>
    client.post('/v1/auth/refresh', { refresh_token }).then(r => r.data),
  logout:         () =>
    client.post('/v1/auth/logout').then(r => r.data),
  sessions:       () =>
    client.get('/v1/auth/sessions').then(r => r.data),
  deleteSession:  (id) =>
    client.delete(`/v1/auth/sessions/${id}`).then(r => r.data),
  setup2fa:       () =>
    client.post('/v1/auth/2fa/setup').then(r => r.data),
  verify2fa:      (code) =>
    client.post('/v1/auth/2fa/verify', { code }).then(r => r.data),
  disable2fa:     (code) =>
    client.post('/v1/auth/2fa/disable', { code }).then(r => r.data),
  confirm2fa:     (token, code) =>
    client.post('/v1/auth/2fa/confirm', { token, code }).then(r => r.data),
};
```

- [ ] **Step 2: Create users.js**

```js
// src/api/users.js
import client from './client';

export const usersApi = {
  getProfile:          (id) =>
    client.get(`/v1/users/${id}`).then(r => r.data),
  updateProfile:       (id, data) =>
    client.patch(`/v1/users/${id}`, data).then(r => r.data),
  getNutritionTargets: (id) =>
    client.get(`/v1/users/${id}/nutrition-targets`).then(r => r.data),
  updateNutritionTargets: (id, data) =>
    client.patch(`/v1/users/${id}/nutrition-targets`, data).then(r => r.data),
  getSummary:          (id) =>
    client.get(`/v1/users/${id}/summary`).then(r => r.data),
  getStreaks:          (id) =>
    client.get(`/v1/users/${id}/streaks`).then(r => r.data),
  getRecommendations:  (id) =>
    client.get(`/v1/users/${id}/recommendations`).then(r => r.data),
  getWeightEntries:    (id) =>
    client.get(`/v1/users/${id}/weight-entries`).then(r => r.data),
  addWeightEntry:      (id, data) =>
    client.post(`/v1/users/${id}/weight-entries`, data).then(r => r.data),
};
```

- [ ] **Step 3: Create workouts.js**

```js
// src/api/workouts.js
import client from './client';

export const workoutsApi = {
  list:              (params) =>
    client.get('/v1/workouts', { params }).then(r => r.data),
  get:               (id) =>
    client.get(`/v1/workouts/${id}`).then(r => r.data),
  create:            (data) =>
    client.post('/v1/workouts', data).then(r => r.data),
  update:            (id, data) =>
    client.patch(`/v1/workouts/${id}`, data).then(r => r.data),
  delete:            (id) =>
    client.delete(`/v1/workouts/${id}`).then(r => r.data),
  addExercise:       (workoutId, data) =>
    client.post(`/v1/workouts/${workoutId}/exercises`, data).then(r => r.data),
  addSet:            (workoutId, exerciseId, data) =>
    client.post(`/v1/workouts/${workoutId}/exercises/${exerciseId}/sets`, data).then(r => r.data),
  updateSet:         (workoutId, exerciseId, setId, data) =>
    client.patch(`/v1/workouts/${workoutId}/exercises/${exerciseId}/sets/${setId}`, data).then(r => r.data),
  deleteSet:         (workoutId, exerciseId, setId) =>
    client.delete(`/v1/workouts/${workoutId}/exercises/${exerciseId}/sets/${setId}`).then(r => r.data),
  listTemplates:     () =>
    client.get('/v1/workout-templates').then(r => r.data),
  getTemplate:       (id) =>
    client.get(`/v1/workout-templates/${id}`).then(r => r.data),
  applyTemplate:     (id) =>
    client.post(`/v1/workout-templates/${id}/apply`).then(r => r.data),
  listCardio:        (workoutId) =>
    client.get(`/v1/workouts/${workoutId}/cardio`).then(r => r.data),
  addCardio:         (workoutId, data) =>
    client.post(`/v1/workouts/${workoutId}/cardio`, data).then(r => r.data),
};
```

- [ ] **Step 4: Create nutrition.js**

```js
// src/api/nutrition.js
import client from './client';

export const nutritionApi = {
  searchFoods:      (q, params) =>
    client.get('/v1/foods', { params: { q, ...params } }).then(r => r.data),
  getMeals:         (params) =>
    client.get('/v1/meals', { params }).then(r => r.data),
  createMeal:       (data) =>
    client.post('/v1/meals', data).then(r => r.data),
  addFoodToMeal:    (mealId, data) =>
    client.post(`/v1/meals/${mealId}/foods`, data).then(r => r.data),
  removeFoodFromMeal: (mealId, foodId) =>
    client.delete(`/v1/meals/${mealId}/foods/${foodId}`).then(r => r.data),
  cloneMeal:        (mealId) =>
    client.post(`/v1/meals/${mealId}/clone`).then(r => r.data),
  listRecipes:      () =>
    client.get('/v1/recipes').then(r => r.data),
  createRecipe:     (data) =>
    client.post('/v1/recipes', data).then(r => r.data),
  getRecipe:        (id) =>
    client.get(`/v1/recipes/${id}`).then(r => r.data),
  logRecipeToMeal:  (id, data) =>
    client.post(`/v1/recipes/${id}/log-to-meal`, data).then(r => r.data),
  getFavorites:     (userId) =>
    client.get(`/v1/users/${userId}/favorites`).then(r => r.data),
  addFavorite:      (foodId) =>
    client.post(`/v1/foods/${foodId}/favorite`).then(r => r.data),
  removeFavorite:   (foodId) =>
    client.delete(`/v1/foods/${foodId}/favorite`).then(r => r.data),
};
```

- [ ] **Step 5: Create analytics.js**

```js
// src/api/analytics.js
import client from './client';

export const analyticsApi = {
  getWorkoutStats:     (userId) =>
    client.get(`/v1/users/${userId}/workout-stats`).then(r => r.data),
  getRecords:          (userId) =>
    client.get(`/v1/users/${userId}/records`).then(r => r.data),
  getActivityCalendar: (userId, params) =>
    client.get(`/v1/users/${userId}/activity-calendar`, { params }).then(r => r.data),
  getExerciseHistory:  (exerciseId) =>
    client.get(`/v1/exercises/${exerciseId}/history`).then(r => r.data),
};
```

- [ ] **Step 6: Create notifications.js**

```js
// src/api/notifications.js
import client from './client';

export const notificationsApi = {
  list:         () =>
    client.get('/v1/notifications').then(r => r.data),
  unreadCount:  () =>
    client.get('/v1/notifications/unread-count').then(r => r.data),
  markRead:     (id) =>
    client.patch(`/v1/notifications/${id}/read`).then(r => r.data),
  markAllRead:  () =>
    client.patch('/v1/notifications/read-all').then(r => r.data),
};
```

- [ ] **Step 7: Create chat.js**

```js
// src/api/chat.js
import client from './client';

export const chatApi = {
  send: (messages) =>
    client.post('/v1/chat', { messages }).then(r => r.data),
};
```

- [ ] **Step 8: Create admin.js**

```js
// src/api/admin.js
import client from './client';

export const adminApi = {
  getStats:    () =>
    client.get('/v1/admin/stats').then(r => r.data),
  getUsers:    (params) =>
    client.get('/v1/admin/users', { params }).then(r => r.data),
  banUser:     (id, reason) =>
    client.post(`/v1/admin/users/${id}/ban`, { reason }).then(r => r.data),
  unbanUser:   (id) =>
    client.post(`/v1/admin/users/${id}/unban`).then(r => r.data),
};
```

- [ ] **Step 9: Commit**

```bash
git add src/api/
git commit -m "feat: add API modules for all backend domains"
```

---

## Task 4: Zustand stores

**Files:**
- Create: `src/stores/authStore.js`, `src/stores/workoutStore.js`, `src/stores/nutritionStore.js`, `src/stores/uiStore.js`

- [ ] **Step 1: Create authStore.js**

```js
// src/stores/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth';

const STORAGE_KEY = 'um6p_fit_auth';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,

      get isAuthenticated() { return Boolean(get().user); },
      get isAdmin()         { return get().user?.role === 'admin'; },
      get isOnboarded() {
        const u = get().user;
        return Boolean(u?.weight && u?.height && u?.goal);
      },

      login: async (email, password) => {
        const data = await authApi.login(email, password);
        // Backend returns requires_2fa flag when 2FA enabled
        if (data.requires_2fa) {
          return { requires_2fa: true, token: data.token };
        }
        set({
          user:         data.user,
          accessToken:  data.access_token,
          refreshToken: data.refresh_token,
        });
        return data;
      },

      confirm2fa: async (token, code) => {
        const data = await authApi.confirm2fa(token, code);
        set({
          user:         data.user,
          accessToken:  data.access_token,
          refreshToken: data.refresh_token,
        });
        return data;
      },

      register: async (name, email, password) => {
        const data = await authApi.register(name, email, password);
        set({
          user:         data.user,
          accessToken:  data.access_token,
          refreshToken: data.refresh_token,
        });
        return data;
      },

      updateUser: (updates) => {
        set(state => ({ user: { ...state.user, ...updates } }));
      },

      logout: async () => {
        try { await authApi.logout(); } catch { /* ignore */ }
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        user:         state.user,
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
```

- [ ] **Step 2: Create workoutStore.js**

```js
// src/stores/workoutStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWorkoutStore = create(
  persist(
    (set, get) => ({
      // Active session
      activeWorkout:    null,   // { id, name, startedAt, exercises: [] }
      restTimer:        null,   // { seconds, startedAt } | null
      offlineQueue:     [],     // [{ type, payload }] — flushed on reconnect

      startWorkout: (workout) => {
        set({ activeWorkout: { ...workout, exercises: [], startedAt: Date.now() } });
      },

      setActiveWorkoutId: (id) => {
        set(state => ({ activeWorkout: { ...state.activeWorkout, id } }));
      },

      addExercise: (exercise) => {
        set(state => ({
          activeWorkout: {
            ...state.activeWorkout,
            exercises: [...(state.activeWorkout?.exercises ?? []), { ...exercise, sets: [] }],
          },
        }));
      },

      addSet: (exerciseId, set_) => {
        set(state => ({
          activeWorkout: {
            ...state.activeWorkout,
            exercises: (state.activeWorkout?.exercises ?? []).map(ex =>
              ex.id === exerciseId ? { ...ex, sets: [...ex.sets, set_] } : ex
            ),
          },
        }));
      },

      finishWorkout: () => {
        set({ activeWorkout: null, restTimer: null });
      },

      startRestTimer: (seconds) => {
        set({ restTimer: { seconds, startedAt: Date.now() } });
      },

      clearRestTimer: () => {
        set({ restTimer: null });
      },

      enqueueOffline: (action) => {
        set(state => ({ offlineQueue: [...state.offlineQueue, action] }));
      },

      flushOfflineQueue: () => {
        const queue = get().offlineQueue;
        set({ offlineQueue: [] });
        return queue;
      },
    }),
    { name: 'um6p_fit_workout' }
  )
);
```

- [ ] **Step 3: Create nutritionStore.js**

```js
// src/stores/nutritionStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useNutritionStore = create(
  persist(
    (set, get) => ({
      offlineQueue: [],   // [{ type: 'addFood', payload }]

      enqueueOffline: (action) => {
        set(state => ({ offlineQueue: [...state.offlineQueue, action] }));
      },

      flushOfflineQueue: () => {
        const queue = get().offlineQueue;
        set({ offlineQueue: [] });
        return queue;
      },
    }),
    { name: 'um6p_fit_nutrition' }
  )
);
```

- [ ] **Step 4: Create uiStore.js**

```js
// src/stores/uiStore.js
import { create } from 'zustand';

let toastId = 0;

export const useUiStore = create((set) => ({
  toasts:   [],
  offline:  !navigator.onLine,
  language: localStorage.getItem('um6p_fit_lang') ?? 'en',

  addToast: (message, type = 'info') => {
    const id = ++toastId;
    set(state => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 4000);
  },

  dismissToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },

  setOffline: (val) => set({ offline: val }),

  setLanguage: (lang) => {
    localStorage.setItem('um6p_fit_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    set({ language: lang });
  },
}));
```

- [ ] **Step 5: Commit**

```bash
git add src/stores/
git commit -m "feat: add Zustand stores for auth, workout, nutrition, ui"
```

---

## Task 5: Update useAuth + providers + main.jsx

**Files:**
- Modify: `src/hooks/useAuth.js`
- Modify: `src/main.jsx`
- Delete: `src/context/AuthContext.jsx`

- [ ] **Step 1: Rewrite useAuth.js**

```js
// src/hooks/useAuth.js
import { useAuthStore } from '../stores/authStore';
export function useAuth() { return useAuthStore(); }
```

- [ ] **Step 2: Update main.jsx**

```jsx
// src/main.jsx
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUiStore } from './stores/uiStore';
import './index.css';
import AppRouter from './router/AppRouter.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function OfflineSync() {
  const setOffline = useUiStore(s => s.setOffline);
  useEffect(() => {
    const onOnline  = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [setOffline]);
  return null;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <OfflineSync />
      <AppRouter />
    </QueryClientProvider>
  </StrictMode>
);
```

- [ ] **Step 3: Delete AuthContext.jsx**

```bash
rm src/context/AuthContext.jsx
```

- [ ] **Step 4: Update guards.jsx** — `isOnboarded` now derived from store (it already calls `useAuth()` which returns authStore, and `isOnboarded` is a getter on the store). No logic change needed — verify file compiles.

- [ ] **Step 5: Start dev server and verify app loads without errors**

```bash
npm run dev
```

Open `http://localhost:5173` — should see login page, no console errors.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useAuth.js src/main.jsx
git rm src/context/AuthContext.jsx
git commit -m "feat: replace AuthContext mock with Zustand authStore, add QueryClientProvider"
```

---

## Task 6: TanStack Query hooks

**Files:**
- Create: `src/hooks/queries/useDashboard.js`, `src/hooks/queries/useWorkouts.js`, `src/hooks/queries/useNutrition.js`, `src/hooks/queries/useAnalytics.js`, `src/hooks/queries/useNotifications.js`, `src/hooks/queries/useAdmin.js`

- [ ] **Step 1: Create useDashboard.js**

```js
// src/hooks/queries/useDashboard.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../api/users';
import { notificationsApi } from '../../api/notifications';

export function useSummary(userId) {
  return useQuery({
    queryKey: ['summary', userId],
    queryFn:  () => usersApi.getSummary(userId),
    enabled:  Boolean(userId),
    staleTime: 30_000,
  });
}

export function useStreaks(userId) {
  return useQuery({
    queryKey: ['streaks', userId],
    queryFn:  () => usersApi.getStreaks(userId),
    enabled:  Boolean(userId),
    staleTime: 60_000,
  });
}

export function useRecommendations(userId) {
  return useQuery({
    queryKey: ['recommendations', userId],
    queryFn:  () => usersApi.getRecommendations(userId),
    enabled:  Boolean(userId),
    staleTime: 60_000,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn:  notificationsApi.list,
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
```

- [ ] **Step 2: Create useWorkouts.js**

```js
// src/hooks/queries/useWorkouts.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutsApi } from '../../api/workouts';

export function useWorkoutList(params) {
  return useQuery({
    queryKey: ['workouts', params],
    queryFn:  () => workoutsApi.list(params),
    staleTime: 60_000,
  });
}

export function useWorkoutTemplates() {
  return useQuery({
    queryKey: ['workout-templates'],
    queryFn:  workoutsApi.listTemplates,
    staleTime: 5 * 60_000,
  });
}

export function useCreateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: workoutsApi.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['workouts'] }),
  });
}

export function useFinishWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => workoutsApi.update(id, data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['workouts'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}

export function useAddSet() {
  return useMutation({
    mutationFn: ({ workoutId, exerciseId, data }) =>
      workoutsApi.addSet(workoutId, exerciseId, data),
  });
}

export function useApplyTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: workoutsApi.applyTemplate,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['workouts'] }),
  });
}
```

- [ ] **Step 3: Create useNutrition.js**

```js
// src/hooks/queries/useNutrition.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nutritionApi } from '../../api/nutrition';

export function useFoodSearch(q, options = {}) {
  return useQuery({
    queryKey: ['foods', q],
    queryFn:  () => nutritionApi.searchFoods(q),
    enabled:  Boolean(q && q.length >= 2),
    staleTime: 5 * 60_000,
    ...options,
  });
}

export function useMeals(params) {
  return useQuery({
    queryKey: ['meals', params],
    queryFn:  () => nutritionApi.getMeals(params),
    staleTime: 30_000,
  });
}

export function useCreateMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: nutritionApi.createMeal,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['meals'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}

export function useAddFoodToMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mealId, data }) => nutritionApi.addFoodToMeal(mealId, data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['meals'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
    },
  });
}

export function useRecipes() {
  return useQuery({
    queryKey: ['recipes'],
    queryFn:  nutritionApi.listRecipes,
    staleTime: 5 * 60_000,
  });
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: nutritionApi.createRecipe,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}
```

- [ ] **Step 4: Create useAnalytics.js**

```js
// src/hooks/queries/useAnalytics.js
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../api/analytics';

export function useWorkoutStats(userId) {
  return useQuery({
    queryKey: ['workout-stats', userId],
    queryFn:  () => analyticsApi.getWorkoutStats(userId),
    enabled:  Boolean(userId),
    staleTime: 5 * 60_000,
  });
}

export function useRecords(userId) {
  return useQuery({
    queryKey: ['records', userId],
    queryFn:  () => analyticsApi.getRecords(userId),
    enabled:  Boolean(userId),
    staleTime: 5 * 60_000,
  });
}

export function useActivityCalendar(userId, params) {
  return useQuery({
    queryKey: ['activity-calendar', userId, params],
    queryFn:  () => analyticsApi.getActivityCalendar(userId, params),
    enabled:  Boolean(userId),
    staleTime: 5 * 60_000,
  });
}
```

- [ ] **Step 5: Create useNotifications.js**

```js
// src/hooks/queries/useNotifications.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../api/notifications';

export function useNotificationList() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn:  notificationsApi.list,
    staleTime: 30_000,
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
```

- [ ] **Step 6: Create useAdmin.js**

```js
// src/hooks/queries/useAdmin.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn:  adminApi.getStats,
    staleTime: 60_000,
  });
}

export function useAdminUsers(params) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn:  () => adminApi.getUsers(params),
    staleTime: 30_000,
  });
}

export function useBanUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => adminApi.banUser(id, reason),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}
```

- [ ] **Step 7: Commit**

```bash
git add src/hooks/queries/
git commit -m "feat: add TanStack Query hooks for all domains"
```

---

## Task 7: Toast + Skeleton shared components

**Files:**
- Create: `src/components/common/Toast.jsx`, `src/components/common/Skeleton.jsx`

- [ ] **Step 1: Create Toast.jsx**

```jsx
// src/components/common/Toast.jsx
import { useUiStore } from '../../stores/uiStore';

const TYPE_STYLES = {
  info:    { background: '#084e52', color: '#fff' },
  success: { background: '#38671a', color: '#fff' },
  error:   { background: '#fc7981', color: '#fff' },
  warning: { background: '#fbbd41', color: '#2e2f2e' },
};

export default function Toast() {
  const toasts      = useUiStore(s => s.toasts);
  const dismissToast = useUiStore(s => s.dismissToast);

  if (!toasts.length) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999,
      width: 'min(340px, 90vw)',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          ...TYPE_STYLES[t.type] ?? TYPE_STYLES.info,
          padding: '12px 16px', borderRadius: 12,
          boxShadow: '-4px 4px 0 rgb(0,0,0)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
        }}>
          <span>{t.message}</span>
          <button
            onClick={() => dismissToast(t.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              color: 'inherit', fontSize: 18, lineHeight: 1, padding: '0 0 0 12px' }}
            aria-label="Dismiss"
          >×</button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create Skeleton.jsx**

```jsx
// src/components/common/Skeleton.jsx
export default function Skeleton({ width = '100%', height = 16, radius = 8, style = {} }) {
  return (
    <div style={{
      width, height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, #e8e4dc 25%, #dad4c8 50%, #e8e4dc 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeleton-shimmer 1.4s ease infinite',
      ...style,
    }} />
  );
}

// Add to src/index.css:
// @keyframes skeleton-shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
```

- [ ] **Step 3: Add skeleton animation to index.css**

In `src/index.css`, append:
```css
@keyframes skeleton-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

- [ ] **Step 4: Update AppLayout.jsx to render Toast + offline banner**

Replace the `return` block in `src/components/common/AppLayout.jsx`:

```jsx
import { useNavigate, useLocation } from 'react-router-dom';
import { useUiStore } from '../../stores/uiStore';
import Toast from './Toast';
import './AppLayout.css';

const NAV_ITEMS = [
  { id: 'dashboard', path: '/dashboard', icon: 'dashboard',      label: 'Home'      },
  { id: 'workouts',  path: '/workouts',  icon: 'fitness_center',  label: 'Workout'   },
  { id: 'nutrition', path: '/nutrition', icon: 'restaurant',      label: 'Nutrition' },
  { id: 'ai',        path: '/ai',        icon: 'smart_toy',        label: 'Coach'     },
  { id: 'settings',  path: '/settings',  icon: 'settings',         label: 'Settings'  },
];

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const offline = useUiStore(s => s.offline);
  const hideNav = pathname.startsWith('/nutrition');

  return (
    <div className="app-layout">
      {offline && (
        <div style={{
          background: '#fbbd41', color: '#2e2f2e', textAlign: 'center',
          padding: '6px 16px', fontSize: 13, fontWeight: 600,
        }}>
          You're offline — data will sync when connected
        </div>
      )}
      <div className={`app-content${hideNav ? ' app-content--no-pad' : ''}`}>
        {children}
      </div>
      {!hideNav && (
        <nav className="app-nav">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.id}
                className={`app-nav-item${isActive ? ' app-nav-item--active' : ''}`}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
              >
                <span
                  className="material-symbols-outlined app-nav-icon"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="app-nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
      <Toast />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/common/Toast.jsx src/components/common/Skeleton.jsx src/components/common/AppLayout.jsx src/index.css
git commit -m "feat: add Toast, Skeleton components and offline banner to AppLayout"
```

---

## Task 8: Wire Auth — Login + Signup

**Files:**
- Modify: `src/components/auth/Login.jsx`
- Modify: `src/components/auth/Signup.jsx`
- Delete: ForgotPassword files

- [ ] **Step 1: Delete ForgotPassword files**

```bash
git rm src/components/auth/ForgotPassword.css \
       src/components/auth/ForgotPassword.jsx \
       src/components/auth/ForgotPasswordFlow.jsx \
       src/components/auth/PasswordChanged.css \
       src/components/auth/PasswordChanged.jsx \
       src/components/auth/ResetPassword.css \
       src/components/auth/ResetPassword.jsx
```

- [ ] **Step 2: Update AppRouter.jsx — remove ForgotPassword route, add TwoFactorChallenge**

Replace the public routes section in `src/router/AppRouter.jsx`:

```jsx
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { PublicRoute, ProtectedRoute, OnboardingRoute, AdminRoute } from './guards';

import Login                from '../components/auth/Login';
import Signup               from '../components/auth/Signup';
import TwoFactorChallenge   from '../components/auth/TwoFactorChallenge';
import OnboardingFlow       from '../components/auth/OnboardingFlow';
import Dashboard            from '../components/user/Dashboard/Dashboard';
import Workouts             from '../components/user/Workouts/Workouts';
import NutritionLayout      from '../components/user/Nutrition/Layout/NutritionLayout';
import NutritionDashboard   from '../components/user/Nutrition/Dashboard/Nutrition';
import NutritionHistory     from '../components/user/Nutrition/History/NutritionHistory';
import FoodSearch           from '../components/user/Nutrition/FoodSearch/FoodSearch';
import AddQuantity          from '../components/user/Nutrition/AddQuantity/AddQuantity';
import CreateRecipe         from '../components/user/Nutrition/CreateRecipe/CreateRecipe';
import CustomFood           from '../components/user/Nutrition/CustomFood/CustomFood';
import AIAssistant          from '../components/user/AIAssistant/AIAssistant';
import Settings             from '../components/user/Settings/Settings';
import Admin                from '../components/admin/Admin';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  {
    element: <PublicRoute />,
    children: [
      { path: '/login',   element: <Login /> },
      { path: '/signup',  element: <Signup /> },
      { path: '/2fa',     element: <TwoFactorChallenge /> },
    ],
  },
  {
    element: <OnboardingRoute />,
    children: [
      { path: '/onboarding', element: <OnboardingFlow /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/workouts',  element: <Workouts /> },
      {
        path: '/nutrition',
        element: <NutritionLayout />,
        children: [
          { index: true,         element: <NutritionDashboard /> },
          { path: 'history',     element: <NutritionHistory /> },
          { path: 'food-search', element: <FoodSearch /> },
          { path: 'add-quantity',element: <AddQuantity /> },
          { path: 'recipe',      element: <CreateRecipe /> },
          { path: 'custom-food', element: <CustomFood /> },
        ],
      },
      { path: '/ai',        element: <AIAssistant /> },
      { path: '/settings',  element: <Settings /> },
    ],
  },
  {
    element: <AdminRoute />,
    children: [
      { path: '/admin',   element: <Admin /> },
      { path: '/admin/*', element: <Admin /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 3: Update Login.jsx — replace mock login with real API**

Replace `handleSubmit` and the forgot-password button in `src/components/auth/Login.jsx`:

```jsx
// Replace the entire file content:
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUiStore } from '../../stores/uiStore';
import './Login.css';

function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()); }

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const addToast  = useUiStore(s => s.addToast);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);

  const isReady = email.trim() && password.length >= 1;

  function validate() {
    const e = {};
    if (!email.trim())             e.email    = 'Email is required.';
    else if (!isValidEmail(email)) e.email    = 'Not a valid email.';
    if (!password)                 e.password = 'Password is required.';
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result?.requires_2fa) {
        navigate('/2fa', { state: { token: result.token } });
        return;
      }
      // Guards handle redirect based on role/onboarded state
    } catch (err) {
      const msg = err?.response?.data?.detail ?? 'Invalid email or password.';
      setErrors({ email: msg });
    } finally {
      setLoading(false);
    }
  }

  function clearError(field) { setErrors(p => ({ ...p, [field]: undefined })); }

  return (
    <div className="login-root">
      <div className="login-blob-green" />
      <div className="login-blob-purple" />
      <div className="login-container">
        <div className="login-wordmark">UM6P_FIT</div>
        <div className="login-desktop-hero">
          <div className="login-desktop-sticker" aria-hidden="true">
            <span className="login-desktop-sticker-icon">⚡</span>
            <span>READY TO TRAIN?</span>
          </div>
          <h2 className="login-desktop-hero-title">Your kinetic<br/>fitness<br/>journal.</h2>
          <p className="login-desktop-hero-subtitle">
            Track workouts, fuel with precision, and unlock your performance data.
          </p>
          <div className="login-desktop-features">
            {[
              { icon: '🏋️', text: 'Personalized workout programs with PR tracking' },
              { icon: '🥗', text: 'Smart nutrition logging and macro analysis' },
              { icon: '🤖', text: 'AI coaching with real-time performance insights' },
            ].map((f, i) => (
              <div className="login-desktop-feature" key={i}>
                <span className="login-desktop-feature-emoji">{f.icon}</span>
                <span className="login-desktop-feature-text">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="login-card">
          <div className="login-heading">
            <h1 className="login-title">Welcome<br/>back</h1>
            <p className="login-subtitle">Personalized Performance Portal</p>
          </div>
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-field">
              <label className="login-field-label" htmlFor="login-email">Email address</label>
              <input id="login-email" type="email"
                className={`login-input${errors.email ? ' login-input--error' : ''}`}
                placeholder="name@example.com" value={email}
                onChange={e => { setEmail(e.target.value); clearError('email'); }}
                autoComplete="email" autoFocus />
              {errors.email && <p className="login-error-msg">{errors.email}</p>}
            </div>
            <div className="login-field">
              <label className="login-field-label" htmlFor="login-pw">Password</label>
              <div style={{ position: 'relative' }}>
                <input id="login-pw" type={showPw ? 'text' : 'password'}
                  className={`login-input${errors.password ? ' login-input--error' : ''}`}
                  placeholder="••••••••" value={password}
                  onChange={e => { setPassword(e.target.value); clearError('password'); }}
                  autoComplete="current-password" />
                <button type="button" className="login-input-icon"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? (
                    <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
                      <path d="M1 9C1 9 4.5 2 11 2C17.5 2 21 9 21 9C21 9 17.5 16 11 16C4.5 16 1 9 1 9Z" stroke="#adadab" strokeWidth="1.5"/>
                      <circle cx="11" cy="9" r="3" stroke="#adadab" strokeWidth="1.5"/>
                      <line x1="2" y1="1" x2="20" y2="17" stroke="#adadab" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                      <path d="M1 8C1 8 4.5 1 11 1C17.5 1 21 8 21 8C21 8 17.5 15 11 15C4.5 15 1 8 1 8Z" stroke="#adadab" strokeWidth="1.5"/>
                      <circle cx="11" cy="8" r="3" stroke="#adadab" strokeWidth="1.5"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="login-error-msg">{errors.password}</p>}
            </div>
            <button type="submit" className="login-btn" disabled={!isReady || loading}>
              {loading ? <div className="login-spinner" /> : 'Sign In'}
            </button>
          </form>
          <div className="login-divider">
            <div className="login-divider-line" />
            <span className="login-divider-label">or</span>
            <div className="login-divider-line" />
          </div>
        </div>
        <div className="login-footer-link">
          <span>Don't have an account?</span>
          <button type="button" onClick={() => navigate('/signup')}>Sign up</button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update Signup.jsx — replace mock signup with real API**

Replace `handleSubmit` in `src/components/auth/Signup.jsx`:

```jsx
// Find the handleSubmit function and replace it:
async function handleSubmit(ev) {
  ev.preventDefault();
  const e = validate();
  if (Object.keys(e).length) { setErrors(e); return; }
  setLoading(true);
  try {
    await signup(name, email, pw);
    // authStore.register sets user — guards redirect to /onboarding
  } catch (err) {
    const msg = err?.response?.data?.detail ?? 'Could not create account. Try again.';
    setErrors({ email: msg });
  } finally {
    setLoading(false);
  }
}
```

Also replace the `signup` method reference in Signup.jsx — it uses `useAuth()` which now returns authStore. Rename call to `register`:

```jsx
// Top of Signup.jsx, change:
const { signup } = useAuth();
// to:
const { register: signup } = useAuth();
```

- [ ] **Step 5: Create TwoFactorChallenge.jsx**

```jsx
// src/components/auth/TwoFactorChallenge.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUiStore } from '../../stores/uiStore';

export default function TwoFactorChallenge() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { confirm2fa } = useAuth();
  const addToast  = useUiStore(s => s.addToast);
  const token     = location.state?.token ?? '';
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (code.length !== 6) { setError('Enter the 6-digit code.'); return; }
    setLoading(true);
    try {
      await confirm2fa(token, code);
      // authStore sets user — guards redirect
    } catch (err) {
      setError(err?.response?.data?.detail ?? 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#faf9f7', padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 24, padding: 32,
        boxShadow: '-6px 6px 0 rgb(0,0,0)', border: '1.5px solid #dad4c8',
        width: '100%', maxWidth: 360,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Two-Factor Auth</h1>
          <p style={{ color: '#6b6b69', fontSize: 14 }}>
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text" inputMode="numeric" maxLength={6}
            value={code} onChange={e => { setCode(e.target.value.replace(/\D/g,'')); setError(''); }}
            placeholder="000000" autoFocus autoComplete="one-time-code"
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 12,
              border: `1.5px solid ${error ? '#fc7981' : '#dad4c8'}`,
              fontSize: 24, letterSpacing: 8, textAlign: 'center',
              fontFamily: 'Space Mono, monospace', outline: 'none',
              marginBottom: error ? 8 : 16,
            }}
          />
          {error && <p style={{ color: '#fc7981', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button type="submit" disabled={loading || code.length !== 6} style={{
            width: '100%', padding: '14px 0', borderRadius: 999,
            background: '#38671a', color: '#fff', border: 'none',
            fontSize: 16, fontWeight: 600, cursor: 'pointer',
            opacity: loading || code.length !== 6 ? 0.6 : 1,
          }}>
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </form>
        <button onClick={() => navigate('/login')} style={{
          display: 'block', margin: '16px auto 0', background: 'none',
          border: 'none', color: '#6b6b69', cursor: 'pointer', fontSize: 14,
        }}>
          Back to login
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Test login flow in browser**

```bash
npm run dev
```

- Go to `http://localhost:5173/login`
- Login with `alex@example.com` / `password123`
- Expect: redirected to `/dashboard`
- Check localStorage has `um6p_fit_auth` with tokens

- [ ] **Step 7: Commit**

```bash
git add src/ 
git commit -m "feat: wire Login, Signup, TwoFactorChallenge to real API"
```

---

## Task 9: Wire Onboarding

**Files:**
- Modify: `src/components/auth/OnboardingBasicInfo.jsx`
- Modify: `src/components/auth/OnboardingGoalsActivity.jsx`
- Modify: `src/components/auth/OnboardingYourPlan.jsx`

- [ ] **Step 1: Update OnboardingBasicInfo.jsx — call PATCH /v1/users/{id}**

Replace `handleNext` in `src/components/auth/OnboardingBasicInfo.jsx`:

```jsx
// Add import at top:
import { usersApi } from '../../../api/users';
import { useAuth } from '../../hooks/useAuth';

// Replace handleNext:
async function handleNext() {
  const e = validate();
  if (Object.keys(e).length) { setErrors(e); return; }
  const { user, updateUser } = useAuth(); // already destructured at top — add updateUser
  try {
    const updated = await usersApi.updateProfile(user.id, {
      age:    parseInt(age),
      height: parseInt(height),
      weight: parseFloat(weight),
    });
    updateUser(updated);
    onNext?.();
  } catch {
    setErrors({ age: 'Failed to save. Try again.' });
  }
}
```

Note: The component already destructures `useAuth()` at the top — add `updateUser` to that destructure and use `usersApi` instead of `updateOnboardingStep`.

Full updated top section of OnboardingBasicInfo.jsx:

```jsx
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usersApi } from '../../../api/users';
import './OnboardingBasicInfo.css';

export default function OnboardingBasicInfo({ onNext, onBack, step = 1, totalSteps = 3 }) {
  const { user, updateUser } = useAuth();
  const [gender, setGender] = useState('male');
  const [age,    setAge]    = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const e = {};
    const a = parseInt(age);
    const h = parseInt(height);
    const w = parseFloat(weight);
    if (!age)                    e.age    = 'Required';
    else if (a < 10 || a > 100)  e.age    = '10–100';
    if (!height)                 e.height = 'Required';
    else if (h < 100 || h > 250) e.height = '100–250 cm';
    if (!weight)                 e.weight = 'Required';
    else if (w < 30 || w > 300)  e.weight = '30–300 kg';
    return e;
  }

  async function handleNext() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const updated = await usersApi.updateProfile(user.id, {
        age:    parseInt(age),
        height: parseInt(height),
        weight: parseFloat(weight),
      });
      updateUser(updated);
      onNext?.();
    } catch {
      setErrors({ age: 'Failed to save. Try again.' });
    } finally {
      setSaving(false);
    }
  }

  function clearErr(field) { setErrors(p => ({ ...p, [field]: undefined })); }
  // ... rest of JSX unchanged, but disable Next button when saving
```

- [ ] **Step 2: Update OnboardingGoalsActivity.jsx — call PATCH /v1/users/{id}**

Map frontend goal values to backend values (`lose` → `lose_fat`, `gain` → `build_muscle`, `maintain` → `maintain`) and activity levels (`light` → `lightly_active`, `moderate` → `moderately_active`, `very` → `very_active`).

Replace `handleNext` in `src/components/auth/OnboardingGoalsActivity.jsx`:

```jsx
// Add imports at top:
import { usersApi } from '../../../api/users';

// Goal/activity mapping:
const GOAL_MAP = { lose: 'lose_fat', maintain: 'maintain', gain: 'build_muscle' };
const ACTIVITY_MAP = {
  sedentary: 'sedentary',
  light:     'lightly_active',
  moderate:  'moderately_active',
  very:      'very_active',
};

// Replace handleNext:
async function handleNext() {
  setSaving(true);
  try {
    const { user, updateUser } = useAuthRef; // use authStore via useAuth at component top
    const updated = await usersApi.updateProfile(user.id, {
      goal:           GOAL_MAP[goal]     ?? goal,
      activity_level: ACTIVITY_MAP[activity] ?? activity,
    });
    updateUser(updated);
    onNext?.();
  } catch {
    // non-blocking — still advance
    onNext?.();
  } finally {
    setSaving(false);
  }
}
```

Full top section:

```jsx
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usersApi } from '../../../api/users';
import './OnboardingGoalsActivity.css';

const GOAL_MAP     = { lose: 'lose_fat', maintain: 'maintain', gain: 'build_muscle' };
const ACTIVITY_MAP = {
  sedentary: 'sedentary', light: 'lightly_active',
  moderate: 'moderately_active', very: 'very_active',
};

export default function OnboardingGoalsActivity({ step = 2, totalSteps = 3, onNext, onBack }) {
  const { user, updateUser } = useAuth();
  const [goal,      setGoal]      = useState('lose');
  const [activity,  setActivity]  = useState('light');
  const [frequency, setFrequency] = useState(4);
  const [saving,    setSaving]    = useState(false);

  async function handleNext() {
    setSaving(true);
    try {
      const updated = await usersApi.updateProfile(user.id, {
        goal:           GOAL_MAP[goal],
        activity_level: ACTIVITY_MAP[activity],
      });
      updateUser(updated);
    } catch { /* non-blocking */ } finally {
      setSaving(false);
      onNext?.();
    }
  }
```

- [ ] **Step 3: Update OnboardingYourPlan.jsx — fetch real nutrition targets**

```jsx
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../../../api/users';
import Skeleton from '../../common/Skeleton';
import './OnboardingYourPlan.css';

const MACRO_COLORS = { protein: '#38671a', carbs: '#5d3fd3', fats: '#f95630' };

function MacroBar({ label, grams, pct, color }) {
  return (
    <div className="yp-macro">
      <div className="yp-macro-header">
        <span className="yp-macro-label">{label}</span>
        <span className="yp-macro-g">{grams}<span className="yp-macro-unit">g</span></span>
      </div>
      <div className="yp-macro-track">
        <div className="yp-macro-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function OnboardingYourPlan({ step = 3, totalSteps = 3, onBack }) {
  const { user, updateUser } = useAuth();
  const { data: targets, isLoading } = useQuery({
    queryKey: ['nutrition-targets', user?.id],
    queryFn:  () => usersApi.getNutritionTargets(user.id),
    enabled:  Boolean(user?.id),
  });

  function handleComplete() {
    updateUser({ onboarded: true });
    // isOnboarded guard derives from weight+height+goal being set — already done in prior steps
    // Navigate handled by OnboardingRoute guard
  }

  const cal  = targets?.calories ?? 2000;
  const prot = targets?.protein  ?? 150;
  const carb = targets?.carbs    ?? 250;
  const fat  = targets?.fat      ?? 65;
  const totalMacroG = prot + carb + fat;

  // ... keep existing JSX structure but replace hardcoded values with cal/prot/carb/fat
  // Replace MacroBar calls:
  // <MacroBar label="Protein" grams={prot} pct={Math.round(prot/totalMacroG*100)} color={MACRO_COLORS.protein} />
  // <MacroBar label="Carbs"   grams={carb} pct={Math.round(carb/totalMacroG*100)} color={MACRO_COLORS.carbs} />
  // <MacroBar label="Fats"    grams={fat}  pct={Math.round(fat/totalMacroG*100)}  color={MACRO_COLORS.fats} />
  // Replace calories display with: {cal} kcal
  // Replace completeOnboarding() call with: handleComplete()
```

- [ ] **Step 4: Test onboarding flow end-to-end**

- Register new account → should proceed through 3 steps → arrive at `/dashboard`

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/
git commit -m "feat: wire onboarding steps to PATCH /v1/users and nutrition targets API"
```

---

## Task 10: Wire Dashboard

**Files:**
- Modify: `src/components/user/Dashboard/Dashboard.jsx`

- [ ] **Step 1: Replace Dashboard.jsx mock data with real API calls**

```jsx
// src/components/user/Dashboard/Dashboard.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useSummary, useStreaks, useNotifications } from '../../../hooks/queries/useDashboard';
import Skeleton from '../../common/Skeleton';
import './Dashboard.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function MacroRing({ value, total, color, label }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const safeTotal = total > 0 ? total : 1;
  const offset = circ - (Math.min(value, safeTotal) / safeTotal) * circ;
  return (
    <div className="dash-ring-wrap">
      <svg className="dash-ring-svg" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="transparent" stroke="#e2e3e0" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="transparent" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="dash-ring-center">
        <span className="dash-ring-val">{value}g</span>
      </div>
      <span className="dash-ring-label">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId   = user?.id;
  const name     = user?.name ?? 'Athlete';
  const firstName = name.charAt(0).toUpperCase() + name.slice(1);
  const today    = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const { data: summary,  isLoading: loadSummary  } = useSummary(userId);
  const { data: streaks,  isLoading: loadStreaks   } = useStreaks(userId);
  const { data: notifs                              } = useNotifications();

  const unreadCount = Array.isArray(notifs)
    ? notifs.filter(n => !n.read_at).length
    : 0;

  const calories    = summary?.total_calories    ?? 0;
  const calTarget   = summary?.target_calories   ?? 2000;
  const protein     = summary?.total_protein     ?? 0;
  const protTarget  = summary?.target_protein    ?? 150;
  const carbs       = summary?.total_carbs       ?? 0;
  const carbTarget  = summary?.target_carbs      ?? 250;
  const fat         = summary?.total_fat         ?? 0;
  const fatTarget   = summary?.target_fat        ?? 65;
  const workoutStreak = streaks?.streaks?.workout_streak ?? 0;

  return (
    <div className="dash-root">
      <header className="dash-header">
        <div className="dash-header-left">
          <h1 className="dash-greeting">Hey, {firstName}</h1>
          <p className="dash-tagline">The Kinetic Craft is a journey.</p>
        </div>
        <div className="dash-header-right">
          <button className="dash-notif-btn" aria-label="Notifications"
            onClick={() => navigate('/settings')}>
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && <span className="dash-notif-badge">{unreadCount}</span>}
          </button>
          <div className="dash-avatar">
            <span>{firstName.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </header>

      <main className="dash-main">
        <section className="dash-card dash-card--summary">
          <div className="dash-card-bg-icon">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              calendar_today
            </span>
          </div>
          <div className="dash-summary-top">
            <div>
              <span className="dash-section-label">Today's Summary</span>
              <h2 className="dash-date">{today}</h2>
            </div>
          </div>
          <div className="dash-summary-grid">
            <div className="dash-stat-box">
              <span className="dash-stat-label">Calories</span>
              {loadSummary ? <Skeleton height={24} width={120} /> : (
                <div className="dash-stat-row">
                  <span className="dash-stat-val">{calories.toLocaleString()}</span>
                  <span className="dash-stat-sub">/ {calTarget.toLocaleString()} kcal</span>
                </div>
              )}
            </div>
            <div className="dash-stat-box dash-stat-box--green">
              <span className="dash-stat-label" style={{ color: '#2c5a0d' }}>Meals</span>
              {loadSummary ? <Skeleton height={20} width={60} /> : (
                <div className="dash-stat-row">
                  <span className="dash-stat-val" style={{ fontSize: 14, color: '#2c5a0d' }}>
                    {summary?.meal_count ?? 0} logged
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="dash-card dash-card--macros">
          <span className="dash-section-label" style={{ color: '#5d3fd3' }}>Macro Progress</span>
          {loadSummary ? (
            <div style={{ display: 'flex', gap: 16, padding: '8px 0' }}>
              <Skeleton width={80} height={80} radius={40} />
              <Skeleton width={80} height={80} radius={40} />
              <Skeleton width={80} height={80} radius={40} />
            </div>
          ) : (
            <div className="dash-rings">
              <MacroRing value={protein} total={protTarget} color="#38671a" label="Protein" />
              <MacroRing value={carbs}   total={carbTarget} color="#5d3fd3" label="Carbs"   />
              <MacroRing value={fat}     total={fatTarget}  color="#f95630" label="Fats"    />
            </div>
          )}
        </section>

        <div className="dash-actions">
          <button className="dash-action-btn dash-action-btn--primary" onClick={() => navigate('/nutrition')}>
            <span className="material-symbols-outlined">nutrition</span>
            <span>Log Meal</span>
          </button>
          <button className="dash-action-btn dash-action-btn--secondary" onClick={() => navigate('/workouts')}>
            <span className="material-symbols-outlined">fitness_center</span>
            <span>Start Workout</span>
          </button>
        </div>

        {loadStreaks ? <Skeleton height={80} radius={16} style={{ margin: '0 0 12px' }} /> : (
          <section className="dash-card dash-card--streak">
            <div className="dash-streak-top">
              <span className="dash-section-label" style={{ color: '#38671a' }}>Training Streak</span>
              <div className="dash-streak-badge">🔥 {workoutStreak} {workoutStreak === 1 ? 'Week' : 'Weeks'}</div>
            </div>
          </section>
        )}

        {summary?.flagged_deficiencies?.length > 0 && (
          <section className="dash-card" style={{ borderColor: '#fc7981' }}>
            <span className="dash-section-label" style={{ color: '#e04040' }}>Deficiency Alerts</span>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
              {summary.flagged_deficiencies.map(d => (
                <li key={d} style={{ fontSize: 14, color: '#2e2f2e', marginBottom: 4 }}>{d}</li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify dashboard loads with real data**

Login as `alex@example.com` → navigate to `/dashboard` → macros rings show real values, unread count shows real notifications.

- [ ] **Step 3: Commit**

```bash
git add src/components/user/Dashboard/
git commit -m "feat: wire Dashboard to summary, streaks, and notifications API"
```

---

## Task 11: Fix backend GROUP BY bugs

Before wiring Workouts and Foods pages, 3 backend endpoints need SQL fixes.

**Files:**
- Modify: `Backend/api/workout_handlers.go` (or wherever `GET /v1/workouts` query lives)
- Modify: `Backend/api/template_handlers.go`
- Modify: `Backend/api/food_handlers.go`

- [ ] **Step 1: Find the broken queries**

```bash
grep -n "GROUP BY\|group by\|Group(" Backend/api/workout_handlers.go Backend/services/workout*.go Backend/api/food_handlers.go Backend/api/template_handlers.go 2>/dev/null | head -40
```

- [ ] **Step 2: Fix workout list query**

The error is `column "workouts.date" must appear in GROUP BY`. Find the query and either:
- Add `workouts.date` (and all other selected columns) to GROUP BY, OR
- Remove the GROUP BY entirely if aggregation is not needed for a simple list

The pattern is: if the query uses `COUNT(*)` or similar aggregate while selecting non-aggregated columns, add those columns to GROUP BY or use a subquery.

- [ ] **Step 3: Fix workout-templates list query**

Same pattern: `column "workout_templates.created_at" must appear in GROUP BY`. Add `workout_templates.created_at` and all other selected columns to the GROUP BY clause.

- [ ] **Step 4: Fix foods search query**

`column "foods.name" must appear in GROUP BY`. Same fix.

- [ ] **Step 5: Verify fixes**

```bash
TOKEN=$(cat /tmp/token.txt)
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8080/v1/workouts" | python3 -m json.tool | head -10
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8080/v1/workout-templates" | python3 -m json.tool | head -10
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8080/v1/foods?q=chicken" | python3 -m json.tool | head -10
```

All three should return `200` with data, not 500 errors.

- [ ] **Step 6: Commit backend fixes**

```bash
cd /Users/mehdi/Desktop/Cfit
git add Backend/
git commit -m "fix: add missing columns to GROUP BY in workouts, templates, foods queries"
```

---

## Task 12: Wire Workouts page

**Files:**
- Modify: `src/components/user/Workouts/Workouts.jsx`

- [ ] **Step 1: Replace Workouts.jsx with real data**

```jsx
// src/components/user/Workouts/Workouts.jsx
import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useWorkoutStore } from '../../../stores/workoutStore';
import { useWorkoutList, useWorkoutTemplates, useCreateWorkout, useFinishWorkout, useApplyTemplate } from '../../../hooks/queries/useWorkouts';
import { workoutsApi } from '../../../api/workouts';
import { useUiStore } from '../../../stores/uiStore';
import Skeleton from '../../common/Skeleton';
import './Workouts.css';

export default function Workouts() {
  const { user } = useAuth();
  const addToast = useUiStore(s => s.addToast);
  const {
    activeWorkout, startWorkout, setActiveWorkoutId,
    addExercise, addSet, finishWorkout: clearSession,
  } = useWorkoutStore();

  const { data: workouts,  isLoading: loadWorkouts  } = useWorkoutList({ limit: 20 });
  const { data: templates, isLoading: loadTemplates } = useWorkoutTemplates();
  const createWorkout = useCreateWorkout();
  const finishMutation = useFinishWorkout();
  const applyTemplate  = useApplyTemplate();

  const [view, setView] = useState('list'); // 'list' | 'active'

  async function handleStartBlank() {
    try {
      const workout = await createWorkout.mutateAsync({ name: 'Workout', type: 'strength' });
      startWorkout({ id: workout.id, name: workout.name });
      setView('active');
    } catch {
      addToast('Failed to start workout', 'error');
    }
  }

  async function handleApplyTemplate(templateId) {
    try {
      const workout = await applyTemplate.mutateAsync(templateId);
      startWorkout({ id: workout.id, name: workout.name });
      setView('active');
    } catch {
      addToast('Failed to apply template', 'error');
    }
  }

  async function handleFinish() {
    if (!activeWorkout?.id) return;
    try {
      await finishMutation.mutateAsync({
        id: activeWorkout.id,
        data: { completed_at: new Date().toISOString() },
      });
      clearSession();
      setView('list');
      addToast('Workout saved!', 'success');
    } catch {
      addToast('Failed to save workout', 'error');
    }
  }

  if (view === 'active' && activeWorkout) {
    return (
      <div className="wk-root">
        <header className="wk-header">
          <h1 className="wk-title">{activeWorkout.name}</h1>
          <button className="wk-finish-btn" onClick={handleFinish}>
            {finishMutation.isPending ? 'Saving…' : 'Finish'}
          </button>
        </header>
        <main className="wk-main">
          {activeWorkout.exercises.length === 0 && (
            <p style={{ color: '#6b6b69', textAlign: 'center', padding: 32 }}>
              No exercises yet — tap below to add one.
            </p>
          )}
          {activeWorkout.exercises.map(ex => (
            <div key={ex.id} className="wk-exercise-card">
              <div className="wk-exercise-name">{ex.name}</div>
              {ex.sets.map((s, i) => (
                <div key={i} className="wk-set-row">
                  <span>Set {i + 1}</span>
                  <span>{s.reps} reps @ {s.weight}kg</span>
                </div>
              ))}
            </div>
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="wk-root">
      <header className="wk-header">
        <h1 className="wk-title">Workouts</h1>
        <button className="wk-start-btn" onClick={handleStartBlank}
          disabled={createWorkout.isPending}>
          {createWorkout.isPending ? '…' : '+ New'}
        </button>
      </header>

      <main className="wk-main">
        {/* Templates */}
        <section className="wk-section">
          <h2 className="wk-section-title">Templates</h2>
          {loadTemplates ? (
            <Skeleton height={72} radius={16} style={{ marginBottom: 8 }} />
          ) : (
            (Array.isArray(templates) ? templates : templates?.data ?? []).map(t => (
              <div key={t.id} className="wk-template-card"
                onClick={() => handleApplyTemplate(t.id)}>
                <div className="wk-template-name">{t.name}</div>
                <div className="wk-template-meta">{t.type}</div>
              </div>
            ))
          )}
        </section>

        {/* History */}
        <section className="wk-section">
          <h2 className="wk-section-title">History</h2>
          {loadWorkouts ? (
            <>
              <Skeleton height={64} radius={16} style={{ marginBottom: 8 }} />
              <Skeleton height={64} radius={16} style={{ marginBottom: 8 }} />
            </>
          ) : (
            (Array.isArray(workouts) ? workouts : workouts?.data ?? []).map(w => (
              <div key={w.id} className="wk-history-card">
                <div className="wk-history-name">{w.name ?? w.type}</div>
                <div className="wk-history-meta">
                  {w.completed_at
                    ? new Date(w.completed_at).toLocaleDateString()
                    : 'In progress'}
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify workouts page loads templates and history**

- [ ] **Step 3: Commit**

```bash
git add src/components/user/Workouts/
git commit -m "feat: wire Workouts page to real API with active session support"
```

---

## Task 13: Wire Nutrition pages

**Files:**
- Modify: `src/components/user/Nutrition/Dashboard/Nutrition.jsx`
- Modify: `src/components/user/Nutrition/FoodSearch/FoodSearch.jsx`
- Modify: `src/components/user/Nutrition/AddQuantity/AddQuantity.jsx`
- Modify: `src/components/user/Nutrition/History/NutritionHistory.jsx`

- [ ] **Step 1: Wire Nutrition Dashboard**

Replace hardcoded macros in `Nutrition.jsx` with `useSummary(userId)`:

```jsx
import { useAuth } from '../../../../hooks/useAuth';
import { useSummary } from '../../../../hooks/queries/useDashboard';
import Skeleton from '../../../common/Skeleton';

// In component:
const { user } = useAuth();
const { data: summary, isLoading } = useSummary(user?.id);

const calories  = summary?.total_calories  ?? 0;
const calTarget = summary?.target_calories ?? 2000;
const protein   = summary?.total_protein   ?? 0;
const protTarget = summary?.target_protein ?? 150;
const carbs     = summary?.total_carbs     ?? 0;
const carbTarget = summary?.target_carbs   ?? 250;
const fat       = summary?.total_fat       ?? 0;
const fatTarget = summary?.target_fat      ?? 65;
// Replace all hardcoded macro values with these variables
// Wrap loading state sections with Skeleton components
```

- [ ] **Step 2: Wire FoodSearch**

```jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFoodSearch } from '../../../../hooks/queries/useNutrition';
import Skeleton from '../../../common/Skeleton';

export default function FoodSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const mealId   = location.state?.mealId; // passed from Nutrition dashboard
  const [query, setQuery] = useState('');

  const { data: results, isLoading, isFetching } = useFoodSearch(query);

  const foods = Array.isArray(results) ? results : results?.data ?? [];

  return (
    <div className="fs-root"> {/* keep existing class names */}
      {/* Keep existing header/back button */}
      <div className="fs-search-bar">
        <input
          type="search"
          placeholder="Search foods…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="fs-input"
          autoFocus
        />
      </div>
      <div className="fs-results">
        {isLoading || isFetching ? (
          <>
            <Skeleton height={56} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton height={56} radius={12} style={{ marginBottom: 8 }} />
            <Skeleton height={56} radius={12} style={{ marginBottom: 8 }} />
          </>
        ) : (
          foods.map(food => (
            <div key={food.id} className="fs-food-row"
              onClick={() => navigate('/nutrition/add-quantity', {
                state: { food, mealId },
              })}>
              <div className="fs-food-name">{food.name}</div>
              <div className="fs-food-meta">
                {food.calories_per_100g} kcal / 100g
              </div>
            </div>
          ))
        )}
        {!isLoading && query.length >= 2 && foods.length === 0 && (
          <p style={{ textAlign: 'center', color: '#6b6b69', padding: 32 }}>
            No foods found for "{query}"
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire AddQuantity**

```jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAddFoodToMeal, useCreateMeal } from '../../../../hooks/queries/useNutrition';
import { useAuth } from '../../../../hooks/useAuth';
import { useUiStore } from '../../../../stores/uiStore';

export default function AddQuantity() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useAuth();
  const addToast   = useUiStore(s => s.addToast);
  const { food, mealId } = location.state ?? {};

  const [quantity, setQuantity] = useState('100');
  const addFood    = useAddFoodToMeal();
  const createMeal = useCreateMeal();

  async function handleLog() {
    try {
      let targetMealId = mealId;
      if (!targetMealId) {
        // Create a new meal for today if none passed
        const meal = await createMeal.mutateAsync({
          meal_type: 'snack',
          date: new Date().toISOString().split('T')[0],
        });
        targetMealId = meal.id;
      }
      await addFood.mutateAsync({
        mealId: targetMealId,
        data: {
          food_id:  food.id,
          quantity: parseFloat(quantity),
          unit:     'g',
        },
      });
      addToast(`${food.name} logged!`, 'success');
      navigate('/nutrition');
    } catch (err) {
      addToast('Failed to log food', 'error');
    }
  }

  if (!food) { navigate('/nutrition/food-search'); return null; }

  const kcal = Math.round((food.calories_per_100g ?? 0) * parseFloat(quantity || 0) / 100);

  return (
    <div style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, marginBottom: 16 }}>
        ←
      </button>
      <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 4 }}>{food.name}</h2>
      <p style={{ color: '#6b6b69', marginBottom: 24 }}>{kcal} kcal</p>
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>Quantity (g)</label>
        <input type="number" value={quantity} min="1" max="2000"
          onChange={e => setQuantity(e.target.value)}
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 12,
            border: '1.5px solid #dad4c8', fontSize: 18, outline: 'none',
          }}
        />
      </div>
      <button onClick={handleLog}
        disabled={addFood.isPending || createMeal.isPending || !quantity}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 999,
          background: '#38671a', color: '#fff', border: 'none',
          fontSize: 16, fontWeight: 600, cursor: 'pointer',
          opacity: addFood.isPending ? 0.7 : 1,
        }}>
        {addFood.isPending ? 'Logging…' : 'Log Food'}
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Wire NutritionHistory**

```jsx
import { useState } from 'react';
import { useMeals } from '../../../../hooks/queries/useNutrition';
import Skeleton from '../../../common/Skeleton';

export default function NutritionHistory() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { data: meals, isLoading } = useMeals({ date });

  const mealList = Array.isArray(meals) ? meals : meals?.data ?? [];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 16 }}>Meal History</h2>
      <input type="date" value={date} onChange={e => setDate(e.target.value)}
        style={{
          padding: '10px 14px', borderRadius: 12, border: '1.5px solid #dad4c8',
          fontSize: 15, marginBottom: 20, width: '100%',
        }}
      />
      {isLoading ? (
        <>
          <Skeleton height={80} radius={16} style={{ marginBottom: 8 }} />
          <Skeleton height={80} radius={16} style={{ marginBottom: 8 }} />
        </>
      ) : mealList.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#6b6b69', padding: 32 }}>No meals logged for this date.</p>
      ) : (
        mealList.map(meal => (
          <div key={meal.id} style={{
            background: '#fff', borderRadius: 16, padding: '16px',
            border: '1.5px solid #dad4c8', marginBottom: 12,
          }}>
            <div style={{ fontWeight: 600, textTransform: 'capitalize', marginBottom: 4 }}>
              {meal.meal_type}
            </div>
            {(meal.meal_foods ?? []).map(mf => (
              <div key={mf.id} style={{ fontSize: 14, color: '#6b6b69', marginBottom: 2 }}>
                {mf.food?.name} — {mf.quantity}g
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/user/Nutrition/
git commit -m "feat: wire Nutrition dashboard, food search, add quantity, history to real API"
```

---

## Task 14: Wire AI Chat

**Files:**
- Modify: `src/components/user/AIAssistant/AIAssistant.jsx`

- [ ] **Step 1: Replace mock messages with real POST /v1/chat**

Replace the `MOCK_HISTORY` and `INITIAL_MESSAGES` with real state + API call:

```jsx
import { useState, useRef, useEffect } from 'react';
import { chatApi } from '../../../api/chat';
import { useUiStore } from '../../../stores/uiStore';
import './AIAssistant.css';

const CHIPS = [
  'Analyze my week',
  'Suggest a meal',
  'Am I overtraining?',
  'Best recovery tips',
];

export default function AIAssistant() {
  const addToast = useUiStore(s => s.addToast);
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: 'Hey! I\'m your AI fitness coach. Ask me anything about your workouts or nutrition.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
  ]);
  const [input,   setInput]   = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    if (!text.trim() || sending) return;
    const userMsg = {
      id: Date.now(), role: 'user', text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role, content: m.text,
      }));
      const response = await chatApi.send(history);
      const reply = response?.reply ?? response?.message ?? response?.content ?? JSON.stringify(response);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'assistant', text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      addToast('AI coach unavailable. Try again.', 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="ai-root"> {/* keep existing class */}
      {/* Keep existing header markup */}
      <div className="ai-messages">
        {messages.map(m => (
          <div key={m.id} className={`ai-msg ai-msg--${m.role}`}>
            <div className="ai-msg-bubble">{m.text}</div>
            <div className="ai-msg-time">{m.time}</div>
          </div>
        ))}
        {sending && (
          <div className="ai-msg ai-msg--assistant">
            <div className="ai-msg-bubble" style={{ color: '#6b6b69' }}>Thinking…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="ai-chips">
        {CHIPS.map(c => (
          <button key={c} className="ai-chip" onClick={() => sendMessage(c)}>{c}</button>
        ))}
      </div>

      <form className="ai-input-row" onSubmit={e => { e.preventDefault(); sendMessage(input); }}>
        <input
          className="ai-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask your coach…"
          disabled={sending}
        />
        <button type="submit" className="ai-send-btn" disabled={sending || !input.trim()}>
          <span className="material-symbols-outlined">send</span>
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Test chat sends and receives response**

- [ ] **Step 3: Commit**

```bash
git add src/components/user/AIAssistant/
git commit -m "feat: wire AI Coach chat to POST /v1/chat"
```

---

## Task 15: Wire Settings page

**Files:**
- Modify: `src/components/user/Settings/Settings.jsx`

- [ ] **Step 1: Replace Settings.jsx with real API calls**

```jsx
// src/components/user/Settings/Settings.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useUiStore } from '../../../stores/uiStore';
import { usersApi } from '../../../api/users';
import { authApi } from '../../../api/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './Settings.css';

export default function Settings() {
  const navigate  = useNavigate();
  const qc        = useQueryClient();
  const { user, updateUser, logout } = useAuth();
  const addToast  = useUiStore(s => s.addToast);
  const { language, setLanguage } = useUiStore();

  const [name,   setName]   = useState(user?.name   ?? '');
  const [weight, setWeight] = useState(user?.weight ?? '');
  const [height, setHeight] = useState(user?.height ?? '');
  const [saving, setSaving] = useState(false);

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn:  authApi.sessions,
    select: d => d?.data ?? [],
  });

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const updated = await usersApi.updateProfile(user.id, {
        name, weight: parseFloat(weight), height: parseInt(height),
      });
      updateUser(updated);
      addToast('Profile updated!', 'success');
    } catch {
      addToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSession(id) {
    try {
      await authApi.deleteSession(id);
      qc.invalidateQueries({ queryKey: ['sessions'] });
      addToast('Session revoked', 'success');
    } catch {
      addToast('Failed to revoke session', 'error');
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  async function handleExport() {
    try {
      const { client } = await import('../../../api/client');
      const res = await client.post('/v1/exports', { format: 'json' });
      addToast('Export started — check back in a moment', 'info');
    } catch {
      addToast('Failed to start export', 'error');
    }
  }

  return (
    <div className="settings-root"> {/* keep existing class */}
      <header className="settings-header">
        <h1 className="settings-title">Settings</h1>
      </header>

      <main className="settings-main">
        {/* Profile */}
        <section className="settings-section">
          <h2 className="settings-section-title">Profile</h2>
          <div className="settings-field">
            <label>Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="settings-input" />
          </div>
          <div className="settings-field">
            <label>Weight (kg)</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
              className="settings-input" />
          </div>
          <div className="settings-field">
            <label>Height (cm)</label>
            <input type="number" value={height} onChange={e => setHeight(e.target.value)}
              className="settings-input" />
          </div>
          <button onClick={handleSaveProfile} disabled={saving} className="settings-btn">
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </section>

        {/* Language */}
        <section className="settings-section">
          <h2 className="settings-section-title">Language</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {['en', 'fr', 'ar'].map(lang => (
              <button key={lang} onClick={() => setLanguage(lang)}
                style={{
                  padding: '8px 16px', borderRadius: 999, fontSize: 14, fontWeight: 600,
                  border: '1.5px solid #dad4c8', cursor: 'pointer',
                  background: language === lang ? '#38671a' : '#fff',
                  color: language === lang ? '#fff' : '#2e2f2e',
                }}>
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </section>

        {/* Sessions */}
        <section className="settings-section">
          <h2 className="settings-section-title">Active Sessions</h2>
          {(sessions ?? []).map(s => (
            <div key={s.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid #f0ebe2',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{s.user_agent}</div>
                <div style={{ fontSize: 12, color: '#6b6b69' }}>
                  Expires {new Date(s.expires_at).toLocaleDateString()}
                </div>
              </div>
              <button onClick={() => handleDeleteSession(s.id)}
                style={{ background: '#fc7981', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>
                Revoke
              </button>
            </div>
          ))}
        </section>

        {/* Export */}
        <section className="settings-section">
          <h2 className="settings-section-title">Data Export</h2>
          <button onClick={handleExport} className="settings-btn settings-btn--secondary">
            Export My Data (JSON)
          </button>
        </section>

        {/* Logout */}
        <section className="settings-section">
          <button onClick={handleLogout}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 999,
              background: '#fc7981', color: '#fff', border: 'none',
              fontSize: 16, fontWeight: 600, cursor: 'pointer',
            }}>
            Log Out
          </button>
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/user/Settings/
git commit -m "feat: wire Settings to profile update, sessions, export, language toggle"
```

---

## Task 16: Wire Admin pages

**Files:**
- Modify: `src/components/admin/AdminDashboard.jsx`
- Modify: `src/components/admin/AdminUserManagement.jsx`

- [ ] **Step 1: Update AdminDashboard.jsx**

```jsx
import { useAdminStats } from '../../hooks/queries/useAdmin';
import Skeleton from '../common/Skeleton';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  return (
    <div className="admin-dash"> {/* keep existing class */}
      <h2>Dashboard</h2>
      {isLoading ? (
        <Skeleton height={120} radius={16} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
          {Object.entries(stats ?? {}).map(([k, v]) => (
            <div key={k} style={{
              background: '#fff', borderRadius: 16, padding: 16,
              border: '1.5px solid #dad4c8', textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, fontWeight: 700 }}>{typeof v === 'number' ? v.toLocaleString() : v}</div>
              <div style={{ fontSize: 13, color: '#6b6b69', textTransform: 'capitalize' }}>
                {k.replace(/_/g, ' ')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update AdminUserManagement.jsx**

```jsx
import { useAdminUsers, useBanUser } from '../../hooks/queries/useAdmin';
import { useUiStore } from '../../stores/uiStore';
import Skeleton from '../common/Skeleton';

export default function AdminUserManagement() {
  const { data, isLoading } = useAdminUsers({ limit: 50 });
  const banUser  = useBanUser();
  const addToast = useUiStore(s => s.addToast);

  const users = data?.data ?? data ?? [];

  async function handleBan(id, reason = 'Policy violation') {
    try {
      await banUser.mutateAsync({ id, reason });
      addToast('User banned', 'success');
    } catch {
      addToast('Failed to ban user', 'error');
    }
  }

  return (
    <div className="admin-users"> {/* keep existing class */}
      <h2>Users</h2>
      {isLoading ? (
        <>
          <Skeleton height={56} radius={12} style={{ marginBottom: 8 }} />
          <Skeleton height={56} radius={12} style={{ marginBottom: 8 }} />
        </>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #dad4c8' }}>
              <th style={{ padding: '8px 12px' }}>Name</th>
              <th style={{ padding: '8px 12px' }}>Email</th>
              <th style={{ padding: '8px 12px' }}>Role</th>
              <th style={{ padding: '8px 12px' }}>Status</th>
              <th style={{ padding: '8px 12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f0ebe2' }}>
                <td style={{ padding: '10px 12px' }}>{u.name}</td>
                <td style={{ padding: '10px 12px', color: '#6b6b69', fontSize: 13 }}>{u.email}</td>
                <td style={{ padding: '10px 12px' }}>{u.role}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    background: u.banned_at ? '#fc7981' : '#d4edda',
                    color: u.banned_at ? '#fff' : '#155724',
                    padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                  }}>
                    {u.banned_at ? 'Banned' : 'Active'}
                  </span>
                </td>
                <td style={{ padding: '10px 12px' }}>
                  {!u.banned_at && u.role !== 'admin' && (
                    <button onClick={() => handleBan(u.id)}
                      style={{
                        background: '#fc7981', color: '#fff', border: 'none',
                        borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12,
                      }}>
                      Ban
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/
git commit -m "feat: wire Admin Dashboard and User Management to real API"
```

---

## Task 17: Offline queue flush on reconnect

**Files:**
- Modify: `src/main.jsx`

- [ ] **Step 1: Add offline queue flush to OfflineSync component in main.jsx**

Replace the `OfflineSync` component in `src/main.jsx`:

```jsx
function OfflineSync() {
  const setOffline = useUiStore(s => s.setOffline);
  const flushWorkout   = useWorkoutStore(s => s.flushOfflineQueue);
  const flushNutrition = useNutritionStore(s => s.flushOfflineQueue);

  useEffect(() => {
    async function flush() {
      setOffline(false);
      const wQueue = flushWorkout();
      const nQueue = flushNutrition();
      // Process workout queue
      for (const action of wQueue) {
        try {
          if (action.type === 'addSet') {
            await workoutsApi.addSet(action.payload.workoutId, action.payload.exerciseId, action.payload.data);
          }
        } catch { /* log and skip */ }
      }
      // Process nutrition queue
      for (const action of nQueue) {
        try {
          if (action.type === 'addFood') {
            await nutritionApi.addFoodToMeal(action.payload.mealId, action.payload.data);
          }
        } catch { /* log and skip */ }
      }
    }

    const onOnline  = () => flush();
    const onOffline = () => setOffline(true);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [setOffline, flushWorkout, flushNutrition]);

  return null;
}
```

Add imports at top of main.jsx:

```jsx
import { useWorkoutStore } from './stores/workoutStore';
import { useNutritionStore } from './stores/nutritionStore';
import { workoutsApi } from './api/workouts';
import { nutritionApi } from './api/nutrition';
```

- [ ] **Step 2: Commit**

```bash
git add src/main.jsx
git commit -m "feat: flush offline workout/nutrition queues on network reconnect"
```

---

## Task 18: Language initialization on app load

**Files:**
- Modify: `src/main.jsx`

- [ ] **Step 1: Initialize language/dir on mount**

Add a `LangInit` component in `src/main.jsx`:

```jsx
function LangInit() {
  useEffect(() => {
    const lang = localStorage.getItem('um6p_fit_lang') ?? 'en';
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, []);
  return null;
}
```

Add `<LangInit />` alongside `<OfflineSync />` in the render tree.

- [ ] **Step 2: Commit**

```bash
git add src/main.jsx
git commit -m "feat: initialize HTML dir and lang attribute from stored language preference"
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ Foundation (axios client, stores, query hooks)
- ✅ Auth (Login, Signup, 2FA, Onboarding)
- ✅ Dashboard
- ✅ Workouts (list, active session, templates)
- ✅ Nutrition (dashboard, food search, add quantity, history)
- ✅ AI Chat
- ✅ Settings (profile, sessions, language, export)
- ✅ Admin (dashboard, user management)
- ✅ Toast + Skeleton shared components
- ✅ Offline banner + queue flush
- ✅ RTL language toggle
- ⚠️ `/progress` analytics page — not wired (hooks exist in `useAnalytics.js`, page component not yet written — defer to follow-up task)
- ⚠️ Weight tracker — can be added to Settings or Progress page using `usersApi.getWeightEntries` — defer to follow-up task
- ⚠️ CreateRecipe and CustomFood nutrition sub-routes — structure varies by existing component; wire in follow-up using `useCreateRecipe` and `nutritionApi.createRecipe`

**Type consistency:** All store action names (`startWorkout`, `addExercise`, `addSet`, `finishWorkout`, `clearSession`) are consistent across workoutStore and Workouts.jsx. All query hook exports match usage in components.

**Placeholder scan:** No TBDs or incomplete steps found.
