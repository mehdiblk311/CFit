# Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete user-facing React app wired to the Go backend API, with foundation (API client, auth, stores) built first, then all pages (auth, dashboard, workouts, nutrition, AI, settings, admin) incrementally.

**Architecture:** Foundation-first approach (Approach B from spec). Install axios + TanStack Query + Zustand. Build API client layer + Zustand stores once. Replace mock AuthContext with real auth logic. Then wire each page to real endpoints one at a time.

**Tech Stack:** React 19 + JSX (no TypeScript), Vite, react-router-dom 7, axios, @tanstack/react-query, zustand

**Backend Status:** Running at `http://localhost:8080`. Three SQL GROUP BY bugs exist:
- `GET /v1/workouts?limit=X` → 500 error (will be fixed before wiring Workouts page)
- `GET /v1/workout-templates` → 500 error (will be fixed before wiring Templates)
- `GET /v1/foods?q=...` → 500 error (will be fixed before wiring Food Search)

All other endpoints tested and working.

---

## File Structure to Create / Modify

**New files:**
```
src/
├── api/
│   ├── client.js          — axios instance, interceptors
│   ├── auth.js            — login, signup, refresh, 2FA, logout
│   ├── workouts.js        — CRUD, sets, cardio, templates
│   ├── nutrition.js       — meals, foods, recipes, favorites
│   ├── users.js           — profile, TDEE, weight, targets
│   ├── analytics.js       — stats, PRs, streaks, calendar
│   ├── notifications.js   — fetch, mark-read, unread count
│   ├── chat.js            — chat messages
│   └── admin.js           — admin endpoints
├── stores/
│   ├── authStore.js       — user, tokens, login/logout
│   ├── workoutStore.js    — active session, offline queue
│   ├── nutritionStore.js  — offline meal queue
│   └── uiStore.js         — nav, modals, toasts, language, offline
├── hooks/
│   ├── useAuth.js         — replaces context-based mock
│   └── queries/
│       ├── useDashboard.js
│       ├── useWorkouts.js
│       ├── useNutrition.js
│       ├── useAnalytics.js
│       ├── useNotifications.js
│       ├── useChat.js
│       └── useAdmin.js
```

**Modified files:**
```
src/
├── main.jsx               — remove <AuthProvider>, add Zustand + TanStack Query
├── router/
│   ├── AppRouter.jsx      — add TwoFactorChallenge route
│   └── guards.jsx         — update isOnboarded logic
├── hooks/useAuth.js       — replace context with authStore
├── components/auth/
│   ├── Login.jsx          — wire to api/auth.js
│   ├── Signup.jsx         — wire to api/auth.js
│   ├── TwoFactorChallenge.jsx — new
│   ├── OnboardingBasicInfo.jsx, OnboardingGoalsActivity.jsx, OnboardingYourPlan.jsx — wire to api/users.js
│   └── ForgotPassword* — DELETE all
├── components/user/
│   ├── Dashboard/Dashboard.jsx — wire to api/analytics.js + queries/useDashboard.js
│   ├── Workouts/Workouts.jsx — wire to api/workouts.js + workoutStore
│   ├── Nutrition/* — wire to api/nutrition.js + nutritionStore
│   ├── AIAssistant/AIAssistant.jsx — wire to api/chat.js
│   ├── Settings/Settings.jsx — wire to api/users.js + auth logout
│   └── Weight tracker (in Settings or new Progress page)
├── components/admin/ — wire to api/admin.js
└── components/common/AppLayout.jsx — add toast rendering from uiStore
```

---

## Phase 1: Foundation Layer (Tasks 1–10)

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add dependencies to package.json**

Update the dependencies section:
```json
{
  "dependencies": {
    "axios": "^1.7.7",
    "@tanstack/react-query": "^5.40.0",
    "zustand": "^4.5.5",
    "graphify": "^1.0.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-router-dom": "^7.14.0"
  }
}
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: All three libraries installed, no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add axios, @tanstack/react-query, zustand"
```

---

### Task 2: Create Axios Client with Interceptors

**Files:**
- Create: `src/api/client.js`

- [ ] **Step 1: Write client.js**

```javascript
import axios from 'axios';
import { authStore } from '../stores/authStore';

const API_BASE = 'http://localhost:8080';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
client.interceptors.request.use(
  (config) => {
    const token = authStore.getState().access_token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401 with refresh
let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (token) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (!isRefreshing) {
        isRefreshing = true;
        originalRequest._retry = true;

        try {
          const { refresh_token } = authStore.getState();
          if (!refresh_token) throw new Error('No refresh token');

          const response = await axios.post(`${API_BASE}/v1/auth/refresh`, {
            refresh_token,
          });

          const { access_token: newToken, refresh_token: newRefreshToken } = response.data;
          authStore.getState().setTokens(newToken, newRefreshToken);
          onRefreshed(newToken);

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          isRefreshing = false;
          return client(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          authStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      return new Promise((resolve) => {
        refreshSubscribers.push((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(client(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  },
);

export default client;
```

- [ ] **Step 2: Verify structure (no runtime yet)**

Just confirm the file is syntactically valid by opening it. No test run needed until stores exist.

- [ ] **Step 3: Commit**

```bash
git add src/api/client.js
git commit -m "feat: add axios client with token refresh interceptor"
```

---

### Task 3: Create Auth Store (Zustand)

**Files:**
- Create: `src/stores/authStore.js`

- [ ] **Step 1: Write authStore.js**

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const authStore = create(
  persist(
    (set, get) => ({
      user: null,
      access_token: null,
      refresh_token: null,

      // ── Getters ─────────────────────────────────────
      isAuthenticated() {
        return !!get().access_token;
      },

      isOnboarded() {
        const user = get().user;
        return !!(user?.weight && user?.height && user?.goal);
      },

      isAdmin() {
        return get().user?.role === 'admin';
      },

      // ── Auth Actions ─────────────────────────────────
      setUser(user) {
        set({ user });
      },

      setTokens(access_token, refresh_token) {
        set({ access_token, refresh_token });
      },

      login(user, access_token, refresh_token) {
        set({ user, access_token, refresh_token });
      },

      logout() {
        set({ user: null, access_token: null, refresh_token: null });
      },

      // ── Profile Updates ──────────────────────────────
      updateProfile(updates) {
        set((state) => ({
          user: { ...state.user, ...updates },
        }));
      },
    }),
    {
      name: 'um6p_fit_auth',
      partialize: (state) => ({
        user: state.user,
        access_token: state.access_token,
        refresh_token: state.refresh_token,
      }),
    }
  )
);
```

- [ ] **Step 2: Test syntax (no runtime)**

File created, structure valid.

- [ ] **Step 3: Commit**

```bash
git add src/stores/authStore.js
git commit -m "feat: add auth store with Zustand"
```

---

### Task 4: Create UI Store (Zustand)

**Files:**
- Create: `src/stores/uiStore.js`

- [ ] **Step 1: Write uiStore.js**

```javascript
import { create } from 'zustand';

export const uiStore = create((set) => ({
  language: 'en', // 'en' | 'fr' | 'ar'
  offline: navigator.onLine === false,
  toasts: [], // Array of { id, message, type }

  // ── Language ─────────────────────────────────────
  setLanguage(lang) {
    set({ language: lang });
    // Apply dir attribute to <html>
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  },

  // ── Offline ──────────────────────────────────────
  setOffline(offline) {
    set({ offline });
  },

  // ── Toasts ──────────────────────────────────────
  addToast(message, type = 'info') {
    const id = Date.now();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },

  removeToast(id) {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

// Listen for online/offline
window.addEventListener('online', () => {
  uiStore.getState().setOffline(false);
});
window.addEventListener('offline', () => {
  uiStore.getState().setOffline(true);
});
```

- [ ] **Step 2: Verify syntax**

File valid.

- [ ] **Step 3: Commit**

```bash
git add src/stores/uiStore.js
git commit -m "feat: add UI store (language, offline, toasts)"
```

---

### Task 5: Create Workout Store (Zustand)

**Files:**
- Create: `src/stores/workoutStore.js`

- [ ] **Step 1: Write workoutStore.js**

```javascript
import { create } from 'zustand';

export const workoutStore = create((set, get) => ({
  // ── Active Workout Session ──────────────────────────
  activeWorkout: null, // { id, exercises: [], startedAt, notes }
  restTimerActive: false,
  restSeconds: 0,

  // ── Offline Queue ───────────────────────────────────
  pendingSets: [], // Sets logged offline, to flush on reconnect

  // ── Session Actions ─────────────────────────────────
  startWorkout(workoutId, notes = '') {
    set({
      activeWorkout: {
        id: workoutId,
        exercises: [],
        startedAt: new Date(),
        notes,
      },
    });
  },

  addExercise(exerciseId, exerciseName) {
    set((state) => ({
      activeWorkout: {
        ...state.activeWorkout,
        exercises: [
          ...state.activeWorkout.exercises,
          {
            id: exerciseId,
            name: exerciseName,
            sets: [],
          },
        ],
      },
    }));
  },

  addSet(exerciseIndex, set) {
    set((state) => {
      const updated = { ...state.activeWorkout };
      updated.exercises[exerciseIndex].sets.push(set);
      return { activeWorkout: updated };
    });
  },

  endWorkout() {
    set({ activeWorkout: null });
  },

  // ── Rest Timer ──────────────────────────────────────
  startRestTimer(seconds) {
    set({ restTimerActive: true, restSeconds: seconds });
    const interval = setInterval(() => {
      set((state) => {
        const remaining = state.restSeconds - 1;
        if (remaining <= 0) {
          clearInterval(interval);
          set({ restTimerActive: false });
          return { restSeconds: 0 };
        }
        return { restSeconds: remaining };
      });
    }, 1000);
  },

  // ── Offline Queue ───────────────────────────────────
  queueSet(set) {
    set((state) => ({
      pendingSets: [...state.pendingSets, set],
    }));
  },

  flushPendingSets() {
    set({ pendingSets: [] });
  },
}));
```

- [ ] **Step 2: Verify syntax**

File valid.

- [ ] **Step 3: Commit**

```bash
git add src/stores/workoutStore.js
git commit -m "feat: add workout store (active session, rest timer, offline queue)"
```

---

### Task 6: Create Nutrition Store (Zustand)

**Files:**
- Create: `src/stores/nutritionStore.js`

- [ ] **Step 1: Write nutritionStore.js**

```javascript
import { create } from 'zustand';

export const nutritionStore = create((set) => ({
  // ── Offline Meal Queue ──────────────────────────────
  pendingMeals: [], // Meals logged offline, to flush on reconnect
  pendingFoods: [], // Foods added to meals offline

  // ── Queue Actions ───────────────────────────────────
  queueMeal(meal) {
    set((state) => ({
      pendingMeals: [...state.pendingMeals, meal],
    }));
  },

  queueFoodToMeal(mealId, food) {
    set((state) => ({
      pendingFoods: [...state.pendingFoods, { mealId, food }],
    }));
  },

  flushPendingMeals() {
    set({ pendingMeals: [], pendingFoods: [] });
  },
}));
```

- [ ] **Step 2: Verify syntax**

File valid.

- [ ] **Step 3: Commit**

```bash
git add src/stores/nutritionStore.js
git commit -m "feat: add nutrition store (offline meal queue)"
```

---

### Task 7: Create API Modules (Auth, Users, Workouts, Nutrition, etc.)

**Files:**
- Create: `src/api/auth.js`
- Create: `src/api/users.js`
- Create: `src/api/workouts.js`
- Create: `src/api/nutrition.js`
- Create: `src/api/analytics.js`
- Create: `src/api/notifications.js`
- Create: `src/api/chat.js`
- Create: `src/api/admin.js`

- [ ] **Step 1: Write src/api/auth.js**

```javascript
import client from './client';
import { authStore } from '../stores/authStore';

export const authAPI = {
  login: async (email, password) => {
    const response = await client.post('/v1/auth/login', { email, password });
    const { user, access_token, refresh_token } = response.data;
    authStore.getState().login(user, access_token, refresh_token);
    return response.data;
  },

  register: async (email, password, name) => {
    const response = await client.post('/v1/auth/register', { email, password, name });
    const { user, access_token, refresh_token } = response.data;
    authStore.getState().login(user, access_token, refresh_token);
    return response.data;
  },

  logout: async () => {
    try {
      await client.post('/v1/auth/logout');
    } catch (err) {
      // Ignore errors on logout
    } finally {
      authStore.getState().logout();
    }
  },

  refresh: async (refreshToken) => {
    const response = await client.post('/v1/auth/refresh', {
      refresh_token: refreshToken,
    });
    const { access_token, refresh_token } = response.data;
    authStore.getState().setTokens(access_token, refresh_token);
    return response.data;
  },

  setupTwoFactor: async () => {
    return client.post('/v1/auth/2fa/setup');
  },

  verifyTwoFactor: async (code) => {
    return client.post('/v1/auth/2fa/verify', { code });
  },

  verifyRecoveryCode: async (code) => {
    return client.post('/v1/auth/2fa/recover', { code });
  },

  disableTwoFactor: async () => {
    return client.post('/v1/auth/2fa/disable');
  },

  getSessions: async () => {
    return client.get('/v1/auth/sessions');
  },

  revokeSession: async (sessionId) => {
    return client.delete(`/v1/auth/sessions/${sessionId}`);
  },
};
```

- [ ] **Step 2: Write src/api/users.js**

```javascript
import client from './client';

export const usersAPI = {
  getProfile: async (userId) => {
    const response = await client.get(`/v1/users/${userId}`);
    return response.data;
  },

  updateProfile: async (userId, updates) => {
    const response = await client.patch(`/v1/users/${userId}`, updates);
    return response.data;
  },

  getNutritionTargets: async (userId) => {
    const response = await client.get(`/v1/users/${userId}/nutrition-targets`);
    return response.data;
  },

  setNutritionTargets: async (userId, targets) => {
    const response = await client.patch(`/v1/users/${userId}/nutrition-targets`, targets);
    return response.data;
  },

  getWeightEntries: async (userId) => {
    const response = await client.get(`/v1/users/${userId}/weight-entries`);
    return response.data;
  },

  addWeightEntry: async (userId, weight, date = new Date().toISOString()) => {
    const response = await client.post(`/v1/users/${userId}/weight-entries`, {
      weight,
      date,
    });
    return response.data;
  },
};
```

- [ ] **Step 3: Write src/api/workouts.js**

```javascript
import client from './client';

export const workoutsAPI = {
  listWorkouts: async (limit = 20, offset = 0) => {
    const response = await client.get('/v1/workouts', {
      params: { limit, offset },
    });
    return response.data;
  },

  createWorkout: async (workout) => {
    const response = await client.post('/v1/workouts', workout);
    return response.data;
  },

  getWorkout: async (workoutId) => {
    const response = await client.get(`/v1/workouts/${workoutId}`);
    return response.data;
  },

  updateWorkout: async (workoutId, updates) => {
    const response = await client.patch(`/v1/workouts/${workoutId}`, updates);
    return response.data;
  },

  addExerciseToWorkout: async (workoutId, exercise) => {
    const response = await client.post(`/v1/workouts/${workoutId}/exercises`, exercise);
    return response.data;
  },

  addSetToExercise: async (workoutId, exerciseId, set) => {
    const response = await client.post(
      `/v1/workouts/${workoutId}/exercises/${exerciseId}/sets`,
      set
    );
    return response.data;
  },

  addCardioEntry: async (workoutId, cardio) => {
    const response = await client.post(`/v1/workouts/${workoutId}/cardio`, cardio);
    return response.data;
  },

  // Templates
  listTemplates: async () => {
    const response = await client.get('/v1/workout-templates');
    return response.data;
  },

  createTemplate: async (template) => {
    const response = await client.post('/v1/workout-templates', template);
    return response.data;
  },

  applyTemplate: async (templateId) => {
    const response = await client.post(`/v1/workout-templates/${templateId}/apply`);
    return response.data;
  },
};
```

- [ ] **Step 4: Write src/api/nutrition.js**

```javascript
import client from './client';

export const nutritionAPI = {
  // Meals
  getMeals: async (date) => {
    const response = await client.get('/v1/meals', {
      params: { date },
    });
    return response.data;
  },

  getMeal: async (mealId) => {
    const response = await client.get(`/v1/meals/${mealId}`);
    return response.data;
  },

  createMeal: async (meal) => {
    const response = await client.post('/v1/meals', meal);
    return response.data;
  },

  updateMeal: async (mealId, updates) => {
    const response = await client.patch(`/v1/meals/${mealId}`, updates);
    return response.data;
  },

  addFoodToMeal: async (mealId, food) => {
    const response = await client.post(`/v1/meals/${mealId}/foods`, food);
    return response.data;
  },

  removeFoodFromMeal: async (mealId, foodId) => {
    const response = await client.delete(`/v1/meals/${mealId}/foods/${foodId}`);
    return response.data;
  },

  // Foods
  searchFoods: async (query, limit = 20) => {
    const response = await client.get('/v1/foods', {
      params: { q: query, limit },
    });
    return response.data;
  },

  getFoodById: async (foodId) => {
    const response = await client.get(`/v1/foods/${foodId}`);
    return response.data;
  },

  // Recipes
  listRecipes: async () => {
    const response = await client.get('/v1/recipes');
    return response.data;
  },

  createRecipe: async (recipe) => {
    const response = await client.post('/v1/recipes', recipe);
    return response.data;
  },

  getRecipe: async (recipeId) => {
    const response = await client.get(`/v1/recipes/${recipeId}`);
    return response.data;
  },

  getRecipeNutrition: async (recipeId) => {
    const response = await client.get(`/v1/recipes/${recipeId}/nutrition`);
    return response.data;
  },

  logRecipeToMeal: async (recipeId, mealId) => {
    const response = await client.post(`/v1/recipes/${recipeId}/log-to-meal`, {
      meal_id: mealId,
    });
    return response.data;
  },

  // Favorites
  addFavoriteFood: async (foodId) => {
    const response = await client.post(`/v1/foods/${foodId}/favorite`);
    return response.data;
  },

  removeFavoriteFood: async (foodId) => {
    const response = await client.delete(`/v1/foods/${foodId}/favorite`);
    return response.data;
  },

  listFavorites: async () => {
    const response = await client.get('/v1/users/favorites');
    return response.data;
  },

  getRecentMeals: async (days = 7) => {
    const response = await client.get('/v1/meals/recent', {
      params: { days },
    });
    return response.data;
  },

  getRecentFoods: async () => {
    const response = await client.get('/v1/foods/recent');
    return response.data;
  },
};
```

- [ ] **Step 5: Write src/api/analytics.js**

```javascript
import client from './client';

export const analyticsAPI = {
  getSummary: async (userId, date) => {
    const response = await client.get(`/v1/users/${userId}/summary`, {
      params: { date },
    });
    return response.data;
  },

  getRecords: async (userId) => {
    const response = await client.get(`/v1/users/${userId}/records`);
    return response.data;
  },

  getWorkoutStats: async (userId) => {
    const response = await client.get(`/v1/users/${userId}/workout-stats`);
    return response.data;
  },

  getActivityCalendar: async (userId) => {
    const response = await client.get(`/v1/users/${userId}/activity-calendar`);
    return response.data;
  },

  getExerciseHistory: async (exerciseId, limit = 20) => {
    const response = await client.get(`/v1/exercises/${exerciseId}/history`, {
      params: { limit },
    });
    return response.data;
  },

  getStreaks: async (userId) => {
    const response = await client.get(`/v1/users/${userId}/streaks`);
    return response.data;
  },

  getRecommendations: async (userId) => {
    const response = await client.get(`/v1/users/${userId}/recommendations`);
    return response.data;
  },

  getWeeklySummary: async (userId) => {
    const response = await client.get(`/v1/users/${userId}/weekly-summary`);
    return response.data;
  },
};
```

- [ ] **Step 6: Write src/api/notifications.js**

```javascript
import client from './client';

export const notificationsAPI = {
  getNotifications: async (limit = 50) => {
    const response = await client.get('/v1/notifications', {
      params: { limit },
    });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await client.get('/v1/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await client.patch(`/v1/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await client.patch('/v1/notifications/read-all');
    return response.data;
  },
};
```

- [ ] **Step 7: Write src/api/chat.js**

```javascript
import client from './client';

export const chatAPI = {
  sendMessage: async (messages) => {
    const response = await client.post('/v1/chat', { messages });
    return response.data;
  },
};
```

- [ ] **Step 8: Write src/api/admin.js**

```javascript
import client from './client';

export const adminAPI = {
  getDashboard: async () => {
    const response = await client.get('/v1/admin/dashboard');
    return response.data;
  },

  getUsers: async (limit = 50, offset = 0) => {
    const response = await client.get('/v1/admin/users', {
      params: { limit, offset },
    });
    return response.data;
  },

  banUser: async (userId, reason) => {
    const response = await client.post(`/v1/admin/users/${userId}/ban`, { reason });
    return response.data;
  },

  unbanUser: async (userId) => {
    const response = await client.post(`/v1/admin/users/${userId}/unban`);
    return response.data;
  },
};
```

- [ ] **Step 9: Verify all files created**

Check that all 8 files exist in `src/api/` directory.

- [ ] **Step 10: Commit all API modules**

```bash
git add src/api/
git commit -m "feat: add API modules for all domains"
```

---

### Task 8: Update main.jsx to Use Zustand + TanStack Query

**Files:**
- Modify: `src/main.jsx`

- [ ] **Step 1: Update main.jsx**

Replace the entire file with:

```javascript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import './index.css'
import AppRouter from './router/AppRouter.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30s
      gcTime: 5 * 60 * 1000, // 5 min
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  </StrictMode>,
)
```

- [ ] **Step 2: Verify file**

File saved, no errors.

- [ ] **Step 3: Commit**

```bash
git add src/main.jsx
git commit -m "refactor: replace AuthProvider with TanStack Query setup"
```

---

### Task 9: Replace useAuth Hook to Read from Zustand

**Files:**
- Modify: `src/hooks/useAuth.js`

- [ ] **Step 1: Replace useAuth.js**

```javascript
import { useCallback } from 'react';
import { authStore } from '../stores/authStore';
import { authAPI } from '../api/auth';
import { uiStore } from '../stores/uiStore';

export function useAuth() {
  const user = authStore((state) => state.user);
  const access_token = authStore((state) => state.access_token);
  const isAuthenticated = authStore((state) => state.isAuthenticated());
  const isOnboarded = authStore((state) => state.isOnboarded());
  const isAdmin = authStore((state) => state.isAdmin());

  const login = useCallback(async (email, password) => {
    try {
      const result = await authAPI.login(email, password);
      return result;
    } catch (error) {
      uiStore.getState().addToast(error.response?.data?.message || 'Login failed', 'error');
      throw error;
    }
  }, []);

  const signup = useCallback(async (email, password, name) => {
    try {
      const result = await authAPI.register(email, password, name);
      return result;
    } catch (error) {
      uiStore.getState().addToast(error.response?.data?.message || 'Signup failed', 'error');
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await authAPI.logout();
    uiStore.getState().addToast('Logged out', 'success');
  }, []);

  const updateProfile = useCallback((updates) => {
    authStore.getState().updateProfile(updates);
  }, []);

  return {
    user,
    access_token,
    isAuthenticated,
    isOnboarded,
    isAdmin,
    login,
    signup,
    logout,
    updateProfile,
  };
}
```

- [ ] **Step 2: Verify**

File saved.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAuth.js
git commit -m "refactor: useAuth now reads from Zustand authStore"
```

---

### Task 10: Update Router Guards to Use New Auth Logic

**Files:**
- Modify: `src/router/guards.jsx`

- [ ] **Step 1: Update guards.jsx**

Replace the entire file with:

```javascript
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AppLayout from '../components/common/AppLayout';

/**
 * PublicRoute — for /login, /signup
 * If authenticated + admin → /admin
 * If authenticated + onboarded user → /dashboard
 * If authenticated but not onboarded → /onboarding
 */
export function PublicRoute() {
  const { isAuthenticated, isOnboarded, isAdmin } = useAuth();
  if (isAuthenticated) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isOnboarded) return <Navigate to="/dashboard" replace />;
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}

/**
 * OnboardingRoute — for /onboarding
 * If not authenticated → /login
 * If admin → /admin
 * If already onboarded user → /dashboard
 */
export function OnboardingRoute() {
  const { isAuthenticated, isOnboarded, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (isOnboarded) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

/**
 * ProtectedRoute — for /dashboard, /workouts, /nutrition, /ai, /settings
 * If not authenticated → /login
 * If admin → /admin
 * If authenticated but not onboarded → /onboarding
 */
export function ProtectedRoute() {
  const { isAuthenticated, isOnboarded, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (!isOnboarded) return <Navigate to="/onboarding" replace />;
  return <AppLayout><Outlet /></AppLayout>;
}

/**
 * AdminRoute — for /admin/*
 * If not authenticated → /login
 * If authenticated but not admin → /dashboard
 */
export function AdminRoute() {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
```

- [ ] **Step 2: Verify**

File updated.

- [ ] **Step 3: Commit**

```bash
git add src/router/guards.jsx
git commit -m "refactor: guards now use new auth logic from Zustand"
```

---

## Phase 2: Auth Pages (Tasks 11–15)

### Task 11: Wire Login Page to Real API

**Files:**
- Modify: `src/components/auth/Login.jsx`

- [ ] **Step 1: Update Login.jsx**

Replace the `handleSubmit` function (lines 47–54) with:

```javascript
async function handleSubmit(ev) {
  ev.preventDefault();
  const e = validate();
  if (Object.keys(e).length) { setErrors(e); return; }
  setLoading(true);
  try {
    await login(email, password);
    // Guard redirects automatically based on auth state
  } catch (err) {
    setErrors({ email: 'Invalid email or password.' });
  } finally {
    setLoading(false);
  }
}
```

No other changes — component already has proper structure.

- [ ] **Step 2: Remove "Forgot Password" button navigation**

Find line ~92 with:
```javascript
<button type="button" className="login-forgot" onClick={() => navigate('/forgot-password')}>
```

Remove or disable this line since forgot-password endpoint doesn't exist. Replace with comment:

```javascript
{/* Forgot password not yet implemented in backend */}
```

- [ ] **Step 3: Test in browser**

Run: `npm run dev`
Open: `http://localhost:5173/login`
Try: Email `alex@example.com`, password `password123`
Expected: Should log in and redirect to `/dashboard`

- [ ] **Step 4: Commit**

```bash
git add src/components/auth/Login.jsx
git commit -m "feat: wire Login page to real API"
```

---

### Task 12: Wire Signup Page to Real API

**Files:**
- Modify: `src/components/auth/Signup.jsx`

- [ ] **Step 1: Update Signup.jsx**

Replace the `handleSubmit` function with:

```javascript
async function handleSubmit(ev) {
  ev.preventDefault();
  const e = validate();
  if (Object.keys(e).length) { setErrors(e); return; }
  setLoading(true);
  try {
    await signup(name, email, pw);
    // Guard redirects to onboarding automatically
  } catch (err) {
    setErrors({ email: 'Could not create account. Try again.' });
  } finally {
    setLoading(false);
  }
}
```

- [ ] **Step 2: Test in browser**

Go to: `http://localhost:5173/signup`
Try: New user with name, email, password
Expected: Should create account, redirect to `/onboarding`

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/Signup.jsx
git commit -m "feat: wire Signup page to real API"
```

---

### Task 13: Delete Forgot Password Files

**Files:**
- Delete: `src/components/auth/ForgotPassword.jsx`
- Delete: `src/components/auth/ForgotPassword.css`
- Delete: `src/components/auth/ForgotPasswordFlow.jsx`
- Delete: `src/components/auth/ResetPassword.jsx`
- Delete: `src/components/auth/ResetPassword.css`
- Delete: `src/components/auth/PasswordChanged.jsx`
- Delete: `src/components/auth/PasswordChanged.css`

- [ ] **Step 1: Remove forgot-password route from router**

In `src/router/AppRouter.jsx`, remove this route from the PublicRoute children:

```javascript
{ path: '/forgot-password', element: <ForgotPasswordFlow /> },
```

And remove the import:

```javascript
import ForgotPasswordFlow  from '../components/auth/ForgotPasswordFlow';
```

- [ ] **Step 2: Delete files**

Run: `rm src/components/auth/ForgotPassword* src/components/auth/Reset* src/components/auth/PasswordChanged*`

- [ ] **Step 3: Verify router still works**

Open browser to login page. Should work without errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: remove forgot-password flow (no backend endpoint)"
```

---

### Task 14: Wire Onboarding Step 1 (Basic Info)

**Files:**
- Modify: `src/components/auth/OnboardingBasicInfo.jsx`

- [ ] **Step 1: Add API import and update handlers**

At the top of the file, add:

```javascript
import { usersAPI } from '../../api/users';
```

Replace the `handleNext` function with:

```javascript
async function handleNext() {
  const e = validate();
  if (Object.keys(e).length) { setErrors(e); return; }
  
  try {
    const userId = user?.id;
    await usersAPI.updateProfile(userId, {
      weight: parseFloat(weight),
      height: parseInt(height),
      date_of_birth: new Date(new Date().getFullYear() - parseInt(age), 0, 1).toISOString(),
      age: parseInt(age),
    });
    updateOnboardingStep({ gender, age: parseInt(age), height: parseInt(height), weight: parseFloat(weight) });
    onNext?.();
  } catch (err) {
    setErrors({ _: 'Could not save profile. Try again.' });
  }
}
```

- [ ] **Step 2: Test**

Go through onboarding flow. Step 1 should save to backend.

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/OnboardingBasicInfo.jsx
git commit -m "feat: wire onboarding step 1 to save profile"
```

---

### Task 15: Wire Onboarding Step 2 + 3

**Files:**
- Modify: `src/components/auth/OnboardingGoalsActivity.jsx`
- Modify: `src/components/auth/OnboardingYourPlan.jsx`

- [ ] **Step 1: Update OnboardingGoalsActivity.jsx**

Add import at top:

```javascript
import { usersAPI } from '../../api/users';
```

Replace `handleNext` function with:

```javascript
async function handleNext() {
  try {
    const userId = user?.id;
    await usersAPI.updateProfile(userId, {
      goal,
      activity_level: activity,
    });
    updateOnboardingStep({ goal, activityLevel: activity, workoutFrequency: frequency });
    onNext?.();
  } catch (err) {
    // Silently handle error, retry on next submit
  }
}
```

- [ ] **Step 2: Update OnboardingYourPlan.jsx**

Add imports at top:

```javascript
import { usersAPI } from '../../api/users';
import { analyticsAPI } from '../../api/analytics';
```

Update component to fetch TDEE data:

```javascript
export default function OnboardingYourPlan({ step = 3, totalSteps = 3, onBack }) {
  const { completeOnboarding, user } = useAuth();
  const [targets, setTargets] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTargets() {
      try {
        const data = await usersAPI.getNutritionTargets(user?.id);
        setTargets(data);
      } catch (err) {
        console.error('Failed to load targets', err);
      } finally {
        setLoading(false);
      }
    }
    loadTargets();
  }, [user?.id]);

  const handleComplete = async () => {
    completeOnboarding();
  };

  if (loading) return <div>Loading...</div>;
  if (!targets) return <div>Could not load targets.</div>;

  // Show targets and a "Let's Go" button
  return (
    <div className="yp-root">
      {/* ... existing UI ... */}
      <button className="yp-btn-primary" onClick={handleComplete}>
        Let's Go!
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Test onboarding flow end-to-end**

Clear localStorage, go to signup, fill all 3 steps, should end at dashboard.

- [ ] **Step 4: Commit**

```bash
git add src/components/auth/OnboardingGoalsActivity.jsx src/components/auth/OnboardingYourPlan.jsx
git commit -m "feat: wire onboarding steps 2 & 3 to save profile and load targets"
```

---

## Phase 3: Query Hooks (Tasks 16–22)

(Each task creates one TanStack Query hook for a domain. Hooks follow pattern: `const { data, isLoading, error } = useQuery(...)` with proper cache keys and error handling.)

### Task 16: Create useDashboard Query Hook

**Files:**
- Create: `src/hooks/queries/useDashboard.js`

- [ ] **Step 1: Write useDashboard.js**

```javascript
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api/analytics';
import { useAuth } from '../useAuth';

export function useDashboardSummary() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard', 'summary', user?.id],
    queryFn: () => analyticsAPI.getSummary(user?.id, new Date().toISOString().split('T')[0]),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}

export function useDashboardStreaks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard', 'streaks', user?.id],
    queryFn: () => analyticsAPI.getStreaks(user?.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardRecommendations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['dashboard', 'recommendations', user?.id],
    queryFn: () => analyticsAPI.getRecommendations(user?.id),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}
```

- [ ] **Step 2: Test (no runtime yet)**

File created, syntax valid.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/queries/useDashboard.js
git commit -m "feat: add useDashboard query hooks"
```

---

### Task 17: Create useWorkouts Query Hook

**Files:**
- Create: `src/hooks/queries/useWorkouts.js`

- [ ] **Step 1: Write useWorkouts.js**

```javascript
import { useQuery } from '@tanstack/react-query';
import { workoutsAPI } from '../../api/workouts';

export function useWorkoutList(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ['workouts', 'list', limit, offset],
    queryFn: () => workoutsAPI.listWorkouts(limit, offset),
    staleTime: 60 * 1000,
  });
}

export function useWorkout(workoutId) {
  return useQuery({
    queryKey: ['workouts', workoutId],
    queryFn: () => workoutsAPI.getWorkout(workoutId),
    enabled: !!workoutId,
    staleTime: 30 * 1000,
  });
}

export function useWorkoutTemplates() {
  return useQuery({
    queryKey: ['workouts', 'templates'],
    queryFn: () => workoutsAPI.listTemplates(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useWorkoutRecords() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['workouts', 'records', user?.id],
    queryFn: () => analyticsAPI.getRecords(user?.id),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}
```

Note: Add `import { useAuth } from '../useAuth'` and `import { analyticsAPI } from '../../api/analytics'` at top.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/queries/useWorkouts.js
git commit -m "feat: add useWorkouts query hooks"
```

---

### Task 18: Create useNutrition Query Hook

**Files:**
- Create: `src/hooks/queries/useNutrition.js`

- [ ] **Step 1: Write useNutrition.js**

```javascript
import { useQuery } from '@tanstack/react-query';
import { nutritionAPI } from '../../api/nutrition';
import { analyticsAPI } from '../../api/analytics';
import { useAuth } from '../useAuth';

export function useMeals(date) {
  return useQuery({
    queryKey: ['nutrition', 'meals', date],
    queryFn: () => nutritionAPI.getMeals(date),
    staleTime: 30 * 1000,
  });
}

export function useNutritionSummary(date) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['nutrition', 'summary', user?.id, date],
    queryFn: () => analyticsAPI.getSummary(user?.id, date),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}

export function useFoodSearch(query) {
  return useQuery({
    queryKey: ['nutrition', 'foods', query],
    queryFn: () => nutritionAPI.searchFoods(query),
    enabled: query.length > 0,
    staleTime: 60 * 1000,
  });
}

export function useRecipes() {
  return useQuery({
    queryKey: ['nutrition', 'recipes'],
    queryFn: () => nutritionAPI.listRecipes(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecipe(recipeId) {
  return useQuery({
    queryKey: ['nutrition', 'recipes', recipeId],
    queryFn: () => nutritionAPI.getRecipe(recipeId),
    enabled: !!recipeId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: ['nutrition', 'favorites'],
    queryFn: () => nutritionAPI.listFavorites(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecentMeals(days = 7) {
  return useQuery({
    queryKey: ['nutrition', 'recent', days],
    queryFn: () => nutritionAPI.getRecentMeals(days),
    staleTime: 30 * 1000,
  });
}

export function useNutritionTargets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['nutrition', 'targets', user?.id],
    queryFn: () => usersAPI.getNutritionTargets(user?.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}
```

Note: Add `import { usersAPI } from '../../api/users'` at top.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/queries/useNutrition.js
git commit -m "feat: add useNutrition query hooks"
```

---

### Task 19: Create useAnalytics Query Hook

**Files:**
- Create: `src/hooks/queries/useAnalytics.js`

- [ ] **Step 1: Write useAnalytics.js**

```javascript
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../../api/analytics';
import { useAuth } from '../useAuth';

export function useWorkoutStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['analytics', 'stats', user?.id],
    queryFn: () => analyticsAPI.getWorkoutStats(user?.id),
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });
}

export function useActivityCalendar() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['analytics', 'calendar', user?.id],
    queryFn: () => analyticsAPI.getActivityCalendar(user?.id),
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });
}

export function useExerciseHistory(exerciseId) {
  return useQuery({
    queryKey: ['analytics', 'exercise', exerciseId],
    queryFn: () => analyticsAPI.getExerciseHistory(exerciseId),
    enabled: !!exerciseId,
    staleTime: 30 * 1000,
  });
}

export function useWeeklySummary() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['analytics', 'weekly', user?.id],
    queryFn: () => analyticsAPI.getWeeklySummary(user?.id),
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/queries/useAnalytics.js
git commit -m "feat: add useAnalytics query hooks"
```

---

### Task 20: Create useNotifications Query Hook

**Files:**
- Create: `src/hooks/queries/useNotifications.js`

- [ ] **Step 1: Write useNotifications.js**

```javascript
import { useQuery } from '@tanstack/react-query';
import { notificationsAPI } from '../../api/notifications';

export function useNotifications(limit = 50) {
  return useQuery({
    queryKey: ['notifications', 'list', limit],
    queryFn: () => notificationsAPI.getNotifications(limit),
    staleTime: 30 * 1000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationsAPI.getUnreadCount(),
    staleTime: 30 * 1000,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/queries/useNotifications.js
git commit -m "feat: add useNotifications query hooks"
```

---

### Task 21: Create useChat Query Hook

**Files:**
- Create: `src/hooks/queries/useChat.js`

- [ ] **Step 1: Write useChat.js**

```javascript
import { useMutation } from '@tanstack/react-query';
import { chatAPI } from '../../api/chat';

export function useSendChatMessage() {
  return useMutation({
    mutationFn: (messages) => chatAPI.sendMessage(messages),
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/queries/useChat.js
git commit -m "feat: add useChat mutation hook"
```

---

### Task 22: Create useAdmin Query Hook

**Files:**
- Create: `src/hooks/queries/useAdmin.js`

- [ ] **Step 1: Write useAdmin.js**

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api/admin';

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminAPI.getDashboard(),
    staleTime: 60 * 1000,
  });
}

export function useAdminUsers(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['admin', 'users', limit, offset],
    queryFn: () => adminAPI.getUsers(limit, offset),
    staleTime: 60 * 1000,
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }) => adminAPI.banUser(userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useUnbanUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId) => adminAPI.unbanUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/queries/useAdmin.js
git commit -m "feat: add useAdmin query hooks"
```

---

## Phase 4: Wire Dashboard Page (Task 23)

### Task 23: Wire Dashboard to Real Data

**Files:**
- Modify: `src/components/user/Dashboard/Dashboard.jsx`

- [ ] **Step 1: Update imports**

Add at top:

```javascript
import { useDashboardSummary, useDashboardStreaks, useDashboardRecommendations } from '../../../hooks/queries/useDashboard';
import { useUnreadCount } from '../../../hooks/queries/useNotifications';
```

- [ ] **Step 2: Replace hardcoded data with hooks**

Replace the entire component body to fetch from queries:

```javascript
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: streaks } = useDashboardStreaks();
  const { data: unreadCount } = useUnreadCount();

  if (summaryLoading) return <div className="dash-root"><p>Loading...</p></div>;
  if (!summary) return <div className="dash-root"><p>No data</p></div>;

  const name = user?.name ?? 'Athlete';
  const firstName = name.charAt(0).toUpperCase() + name.slice(1);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="dash-root">
      <header className="dash-header">
        <div className="dash-header-left">
          <h1 className="dash-greeting">Hey, {firstName}</h1>
          <p className="dash-tagline">The Kinetic Craft is a journey.</p>
        </div>
        <div className="dash-header-right">
          <button className="dash-notif-btn" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount?.count > 0 && (
              <span className="dash-notif-badge">{unreadCount.count}</span>
            )}
          </button>
          <div className="dash-avatar">
            <span>{firstName.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </header>

      <main className="dash-main">
        {/* Today's Summary */}
        <section className="dash-card dash-card--summary">
          <div className="dash-summary-grid">
            <div className="dash-stat-box">
              <span className="dash-stat-label">Calories</span>
              <div className="dash-stat-row">
                <span className="dash-stat-val">{summary.total_calories}</span>
                <span className="dash-stat-sub">/ {summary.target_calories} kcal</span>
              </div>
            </div>
          </div>
        </section>

        {/* Macro Rings */}
        <section className="dash-card dash-card--macros">
          <span className="dash-section-label">Macro Progress</span>
          <div className="dash-rings">
            <MacroRing value={summary.total_protein} total={summary.target_protein} color="#38671a" label="Protein" />
            <MacroRing value={summary.total_carbs} total={summary.target_carbs} color="#5d3fd3" label="Carbs" />
            <MacroRing value={summary.total_fat} total={summary.target_fat} color="#f95630" label="Fats" />
          </div>
        </section>

        {/* Streaks */}
        {streaks && (
          <section className="dash-card dash-card--streak">
            <span className="dash-section-label">Streaks</span>
            <div>🔥 {streaks.streaks.workout_streak} day workout streak</div>
          </section>
        )}

        {/* Quick Actions */}
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
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Test in browser**

Login, should see real dashboard data (calories, macros, streaks from API).

- [ ] **Step 4: Commit**

```bash
git add src/components/user/Dashboard/Dashboard.jsx
git commit -m "feat: wire Dashboard to real API data"
```

---

## Phase 5: Wire Remaining Pages (Tasks 24–30)

(Each task wires one major page. Follows same pattern: import hooks, replace hardcoded data, test.)

### Task 24: Wire Workouts Page (List + Active Session)

**Status Note:** Backend `/v1/workouts` endpoint has a SQL GROUP BY bug. Before wiring:

Run: `curl -s -H "Authorization: Bearer <token>" http://localhost:8080/v1/workouts?limit=5` → returns 500 error

**Workaround:** Implement fetching, but expect failure until backend is fixed. Plan should note this.

**Files:**
- Modify: `src/components/user/Workouts/Workouts.jsx`

- [ ] **Step 1: Add imports**

```javascript
import { useWorkoutList, useWorkoutTemplates } from '../../../hooks/queries/useWorkouts';
import { workoutStore } from '../../../stores/workoutStore';
import { useAuth } from '../../../hooks/useAuth';
```

- [ ] **Step 2: Replace mock data with queries**

```javascript
export default function Workouts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const activeWorkout = workoutStore((state) => state.activeWorkout);
  const { data: workouts, isLoading } = useWorkoutList();
  const { data: templates } = useWorkoutTemplates();

  if (isLoading) return <div>Loading workouts...</div>;

  // Show active session if one exists
  if (activeWorkout) {
    return <ActiveWorkoutSession />;
  }

  // Show list of workouts + templates
  return (
    <div className="workouts-root">
      {/* Existing UI, but replace PROGRAMS mock with workouts data */}
      {/* This will fail until backend is fixed */}
    </div>
  );
}
```

Note: Full implementation deferred until backend `/v1/workouts` bug is fixed.

- [ ] **Step 3: Commit (partial)**

```bash
git add src/components/user/Workouts/Workouts.jsx
git commit -m "wip: start wiring Workouts page (waiting for backend fix)"
```

---

### Task 25: Wire Nutrition Pages

**Status Note:** Backend `/v1/foods?q=...` endpoint has a SQL GROUP BY bug. Before wiring food search.

**Files:**
- Modify: `src/components/user/Nutrition/Dashboard/Nutrition.jsx`
- Modify: `src/components/user/Nutrition/FoodSearch/FoodSearch.jsx`
- Modify: `src/components/user/Nutrition/History/NutritionHistory.jsx`

(Implementation follows same pattern as Dashboard: add hooks, replace mock data. Deferred for food search until backend bug fixed.)

- [ ] **Step 1: Commit placeholder**

```bash
git add src/components/user/Nutrition/
git commit -m "wip: prepare Nutrition pages for real data (food search blocked by backend)"
```

---

### Task 26: Wire AI Chat Page

**Files:**
- Modify: `src/components/user/AIAssistant/AIAssistant.jsx`

- [ ] **Step 1: Add imports**

```javascript
import { useSendChatMessage } from '../../../hooks/queries/useChat';
import { useAuth } from '../../../hooks/useAuth';
```

- [ ] **Step 2: Replace mock with real chat**

```javascript
const [messages, setMessages] = useState([]);
const [inputValue, setInputValue] = useState('');
const { mutate: sendMessage, isPending } = useSendChatMessage();

const handleSendMessage = async () => {
  if (!inputValue.trim()) return;
  
  const newMessage = { role: 'user', content: inputValue };
  setMessages((m) => [...m, newMessage]);
  setInputValue('');

  sendMessage(
    [...messages, newMessage],
    {
      onSuccess: (response) => {
        if (response.message) {
          setMessages((m) => [...m, { role: 'assistant', content: response.message }]);
        }
      },
      onError: (error) => {
        console.error('Chat error:', error);
      },
    }
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add src/components/user/AIAssistant/AIAssistant.jsx
git commit -m "feat: wire AI Chat to real API"
```

---

### Task 27: Wire Settings Page (Profile + Logout)

**Files:**
- Modify: `src/components/user/Settings/Settings.jsx`

- [ ] **Step 1: Add imports + handlers**

```javascript
import { useAuth } from '../../../hooks/useAuth';
import { usersAPI } from '../../../api/users';
import { authAPI } from '../../../api/auth';
```

- [ ] **Step 2: Add logout handler**

```javascript
const { logout, user } = useAuth();
const navigate = useNavigate();

const handleLogout = async () => {
  await logout();
  navigate('/login');
};
```

- [ ] **Step 3: Add profile save handler**

```javascript
const [name, setName] = useState(user?.name || '');
const [email, setEmail] = useState(user?.email || '');

const handleSaveProfile = async () => {
  try {
    await usersAPI.updateProfile(user?.id, { name });
    // Show success toast
  } catch (err) {
    // Show error toast
  }
};
```

- [ ] **Step 4: Commit**

```bash
git add src/components/user/Settings/Settings.jsx
git commit -m "feat: wire Settings page for profile + logout"
```

---

### Task 28: Wire Admin Pages

**Files:**
- Modify: `src/components/admin/Admin.jsx`
- Modify: `src/components/admin/AdminDashboard.jsx`
- Modify: `src/components/admin/AdminUserManagement.jsx`

- [ ] **Step 1: Add hooks**

```javascript
import { useAdminDashboard, useAdminUsers, useBanUser } from '../../../hooks/queries/useAdmin';
```

- [ ] **Step 2: Replace mock admin data**

(Similar pattern to Dashboard: use queries, show loading states, display real data.)

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/
git commit -m "feat: wire Admin pages to real API"
```

---

### Task 29: Add Toast Rendering to AppLayout

**Files:**
- Modify: `src/components/common/AppLayout.jsx`

- [ ] **Step 1: Import uiStore**

```javascript
import { uiStore } from '../../stores/uiStore';
```

- [ ] **Step 2: Add toast rendering**

```javascript
const toasts = uiStore((state) => state.toasts);

return (
  <div className="app-layout">
    {/* existing layout */}
    
    {/* Toast container */}
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          {toast.message}
        </div>
      ))}
    </div>
  </div>
);
```

- [ ] **Step 3: Add CSS for toasts**

In `src/components/common/AppLayout.css`, add:

```css
.toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  background: #2e2f2e;
  color: #faf9f7;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  animation: slideIn 0.3s ease-out;
}

.toast--success {
  background: #38671a;
}

.toast--error {
  background: #fc7981;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/common/AppLayout.jsx src/components/common/AppLayout.css
git commit -m "feat: add toast notification rendering to AppLayout"
```

---

### Task 30: Add RTL + Language Toggle Support

**Files:**
- Modify: `src/index.css`
- Modify: `src/router/AppRouter.jsx`

- [ ] **Step 1: Initialize language on app start**

In `src/router/AppRouter.jsx`, add at top level:

```javascript
import { useEffect } from 'react';
import { uiStore } from '../stores/uiStore';

export default function AppRouter() {
  useEffect(() => {
    const savedLanguage = localStorage.getItem('um6p_fit_language') || 'en';
    uiStore.getState().setLanguage(savedLanguage);
  }, []);

  return <RouterProvider router={router} />;
}
```

- [ ] **Step 2: Add RTL CSS support**

In `src/index.css`, add after global reset:

```css
html[dir="rtl"] {
  text-align: right;
  direction: rtl;
}

html[dir="rtl"] * {
  text-align: right;
}

/* Use logical properties for RTL */
.app-layout {
  margin-inline-start: 0;
}
```

- [ ] **Step 3: Add language toggle to Settings**

In `src/components/user/Settings/Settings.jsx`, add:

```javascript
const { language, setLanguage } = uiStore();

const handleLanguageChange = (lang) => {
  setLanguage(lang);
  localStorage.setItem('um6p_fit_language', lang);
};

// In UI:
<div className="settings-language">
  <label>Language</label>
  <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
    <option value="en">English</option>
    <option value="fr">Français</option>
    <option value="ar">العربية</option>
  </select>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/index.css src/router/AppRouter.jsx src/components/user/Settings/Settings.jsx
git commit -m "feat: add RTL + language toggle support"
```

---

## Phase 5: Offline Support (Task 31)

### Task 31: Add Offline Queue + Sync Logic

**Files:**
- Modify: `src/main.jsx` (add offline listener)
- Modify: `src/stores/workoutStore.js` + `src/stores/nutritionStore.js` (add persistence)

- [ ] **Step 1: Persist Zustand stores to localStorage**

Update `src/stores/workoutStore.js`:

```javascript
import { persist } from 'zustand/middleware';

export const workoutStore = create(
  persist(
    (set, get) => ({
      // ... existing state ...
    }),
    { name: 'um6p_fit_workout' }
  )
);
```

Same for `nutritionStore.js`.

- [ ] **Step 2: Add offline sync on reconnect**

In `src/main.jsx`, add after QueryClient creation:

```javascript
window.addEventListener('online', async () => {
  uiStore.getState().setOffline(false);
  
  // Flush pending sets
  const pendingSets = workoutStore.getState().pendingSets;
  for (const set of pendingSets) {
    try {
      // Upload to API
      await workoutsAPI.addSet(set.workoutId, set.exerciseId, set);
    } catch (err) {
      console.error('Failed to sync set:', err);
    }
  }
  workoutStore.getState().flushPendingSets();

  // Similar for meals
});
```

- [ ] **Step 3: Test offline**

Open DevTools, go offline, log a set/meal, go online → should sync.

- [ ] **Step 4: Commit**

```bash
git add src/main.jsx src/stores/workoutStore.js src/stores/nutritionStore.js
git commit -m "feat: add offline queue + sync on reconnect"
```

---

## Backend Fixes Needed

Three endpoints have SQL GROUP BY bugs blocking page implementation:

1. **`GET /v1/workouts?limit=X`** — used by Workouts list
2. **`GET /v1/workout-templates`** — used by Templates list
3. **`GET /v1/foods?q=...`** — used by Food Search

These must be fixed in the backend before those pages can fully work. Add to a separate backend hotfix plan once frontend is mostly wired.

---

## Summary

- **31 tasks total**
- **Phase 1 (Foundation):** Tasks 1–10 → API client, Zustand stores, auth logic
- **Phase 2 (Auth):** Tasks 11–15 → Login, Signup, Onboarding pages
- **Phase 3 (Query Hooks):** Tasks 16–22 → TanStack Query hooks per domain
- **Phase 4 (Dashboard):** Task 23 → Wire first page to real data
- **Phase 5 (Pages):** Tasks 24–30 → Wire remaining pages + toasts + RTL
- **Phase 6 (Offline):** Task 31 → Offline queue + sync

**Next:** Choose execution approach (subagent-driven or inline) to begin.
