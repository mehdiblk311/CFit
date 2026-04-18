# UM6P_FIT — Full-Stack Fitness Platform

UM6P_FIT is a monorepo fitness platform with a React/Vite frontend and a Go backend. It covers onboarding, workout tracking, nutrition logging, AI-assisted coaching, multilingual UX, and an admin workspace for managing users, exercises, programs, and food data.

---

## Project Overview

The platform serves two main roles:

- **User side**: onboarding, dashboard, workouts, nutrition, settings, notifications, AI assistant
- **Admin side**: dashboard, user management, exercise library, nutrition management, workout programs

Current notable capabilities:

- 3-step onboarding with TDEE-based plan completion
- Workout logging with exercises, sets, templates, and assigned programs
- Nutrition logging with meals, foods, favorites, recipes, and weight tracking
- AI chat endpoint with stored history and feedback
- Arabic, French, and English support with RTL behavior
- Admin realtime dashboard metrics over WebSocket

---

## Tech Stack

### Frontend

- **Framework:** React 19 + Vite
- **Routing:** React Router v7
- **Server state:** TanStack Query
- **Client state:** Zustand
- **HTTP client:** Axios
- **Styling:** Custom CSS with a shared visual direction defined in `Front-End/AI/DESIGN.md`
- **Internationalization:** Custom i18n layer in `src/i18n/`
- **Testing:** Vitest + React Testing Library + MSW

### Backend

- **Language:** Go 1.25+
- **HTTP layer:** Standard library `net/http` + `http.ServeMux`
- **Database:** PostgreSQL
- **ORM:** GORM
- **Realtime:** Gorilla WebSocket for admin realtime metrics
- **Authentication:** JWT access/refresh flow + 2FA support
- **Monitoring:** Prometheus + Grafana

### Supporting Services

- **Exercise library service:** Python service used for exercise search, metadata, and image proxying
- **Admin metrics worker:** background worker process for exports, refresh jobs, and notifications

---

## Project Structure

```text
.
├── Front-End/
│   ├── src/
│   │   ├── api/                # API clients by domain
│   │   ├── assets/             # Static assets
│   │   ├── components/
│   │   │   ├── auth/           # Login, signup, onboarding, 2FA
│   │   │   ├── admin/          # Admin dashboard, users, exercises, nutrition, programs
│   │   │   ├── common/         # Shared app shell / layout
│   │   │   ├── shared/         # Cross-feature reusable pieces
│   │   │   └── user/           # Dashboard, workouts, nutrition, AI, settings
│   │   ├── hooks/              # Auth and React Query hooks
│   │   ├── i18n/               # Messages and translation helpers
│   │   ├── router/             # Route guards
│   │   ├── stores/             # Zustand stores
│   │   ├── test/               # Test setup and MSW server
│   │   └── utils/              # Frontend utilities and adapters
│   ├── .env                    # Frontend local env overrides
│   └── package.json
│
├── Backend/
│   ├── api/                    # HTTP handlers, middleware, auth, OpenAPI, admin routes
│   ├── database/               # DB connection and migrations
│   ├── models/                 # GORM models
│   ├── services/               # Business logic
│   ├── metrics/                # Prometheus integration
│   ├── monitoring/             # Grafana + Prometheus configs
│   ├── seed/                   # Seed data generator
│   ├── worker/                 # Background worker runtime
│   ├── postman/                # API collections
│   ├── exercises_lib_service/  # Search/catalog/image service for exercises
│   ├── docker-compose.yml      # Local backend stack
│   └── main.go                 # Shared entrypoint: api | migrate | worker
│
├── docs/                       # Plans, notes, and generated docs
└── README.md                   # Monorepo overview
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Go 1.25+
- Docker + Docker Compose

### 1. Start the backend stack

From `Backend/`:

```bash
cp .env.example .env
docker compose up -d postgres pgadmin exercise-lib
go run . migrate
go run seed/main.go
go run . api
```

If you also want background jobs and monitoring:

```bash
go run . worker
docker compose up -d prometheus grafana
```

Default backend URLs:

- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/docs`
- Exercise library service: `http://localhost:8000`
- pgAdmin: `http://localhost:8081`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`

### 2. Start the frontend

From `Front-End/`:

```bash
npm install
npm run dev
```

The frontend runs by default at:

- Frontend: `http://localhost:5173`

### 3. Frontend environment

Use `Front-End/.env` to point the app at the active backend:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_EXERCISE_IMAGE_BASE_URL=http://localhost:8000
VITE_ADMIN_REALTIME_WS_AUTH_MODE=header
```

Notes:

- `VITE_API_BASE_URL` drives the Axios client base URL
- `VITE_EXERCISE_IMAGE_BASE_URL` is used for exercise image rendering/proxying
- `VITE_ADMIN_REALTIME_WS_AUTH_MODE` controls how the admin realtime socket authenticates

---

## API Surface

The backend uses `/v1/...` routes, not `/api/v1/...`.

### Authentication

```text
POST   /v1/auth/register
POST   /v1/auth/login
POST   /v1/auth/refresh
POST   /v1/auth/2fa/recover
POST   /v1/auth/logout
GET    /v1/auth/sessions
DELETE /v1/auth/sessions/{id}
POST   /v1/auth/2fa/setup
POST   /v1/auth/2fa/verify
POST   /v1/auth/2fa/disable
```

### Users and summaries

```text
GET    /v1/users
GET    /v1/users/{id}
PATCH  /v1/users/{id}
DELETE /v1/users/{id}
GET    /v1/summary
GET    /v1/weekly-summary
GET    /v1/recommendations
GET    /v1/users/{user_id}/nutrition-targets
GET    /v1/users/{user_id}/streaks
GET    /v1/users/{user_id}/records
GET    /v1/users/{user_id}/workout-stats
GET    /v1/users/{user_id}/activity-calendar
GET    /v1/users/{user_id}/coach-summary
```

### Workouts

```text
POST   /v1/workouts
GET    /v1/workouts
GET    /v1/workouts/{id}
PATCH  /v1/workouts/{id}
DELETE /v1/workouts/{id}
GET    /v1/workouts/{id}/exercises
POST   /v1/workouts/{id}/exercises
GET    /v1/workout-exercises/{id}/sets
POST   /v1/workout-exercises/{id}/sets
PATCH  /v1/workout-sets/{id}
DELETE /v1/workout-sets/{id}
GET    /v1/workouts/{id}/cardio
POST   /v1/workouts/{id}/cardio
PATCH  /v1/workout-cardio/{id}
DELETE /v1/workout-cardio/{id}
```

### Exercise library

```text
GET    /v1/exercises
GET    /v1/exercises/{id}
POST   /v1/exercises/search
GET    /v1/exercises/library-meta
GET    /v1/exercises/{id}/history
GET    /v1/exercise-images/{path...}
```

### Nutrition

```text
POST   /v1/meals
GET    /v1/meals
GET    /v1/meals/{id}
PATCH  /v1/meals/{id}
DELETE /v1/meals/{id}
GET    /v1/foods
GET    /v1/foods/{id}
POST   /v1/foods
PATCH  /v1/foods/{id}
DELETE /v1/foods/{id}
POST   /v1/meals/{id}/foods
PATCH  /v1/meal-foods/{id}
DELETE /v1/meal-foods/{id}
POST   /v1/recipes
GET    /v1/recipes
PATCH  /v1/recipes/{id}
DELETE /v1/recipes/{id}
POST   /v1/recipes/{id}/log-to-meal
POST   /v1/weight-entries
GET    /v1/weight-entries
PATCH  /v1/weight-entries/{id}
DELETE /v1/weight-entries/{id}
```

### Chat and AI

```text
POST   /v1/chat
GET    /v1/chat/history
POST   /v1/chat/feedback
```

### Notifications and export

```text
GET    /v1/notifications
GET    /v1/notifications/unread-count
PATCH  /v1/notifications/{id}/read
PATCH  /v1/notifications/read-all
POST   /v1/exports
GET    /v1/exports/{id}
POST   /v1/account/delete-request
```

### Admin

```text
GET    /v1/admin/dashboard/summary
GET    /v1/admin/dashboard/trends
GET    /v1/admin/dashboard/realtime
GET    /v1/admin/users
GET    /v1/admin/users/{id}
PATCH  /v1/admin/users/{id}
DELETE /v1/admin/users/{id}
POST   /v1/admin/users/{id}/ban
POST   /v1/admin/users/{id}/unban
GET    /v1/admin/nutrition/stats
GET    /v1/admin/workouts/stats
GET    /v1/admin/workouts/exercises/popular
GET    /v1/admin/audit-logs
```

### Programs

```text
GET    /v1/program-assignments
GET    /v1/program-assignments/{id}
PATCH  /v1/program-assignments/{id}/status
POST   /v1/program-sessions/{id}/apply
POST   /v1/programs
GET    /v1/programs
GET    /v1/programs/{id}
PATCH  /v1/programs/{id}
DELETE /v1/programs/{id}
POST   /v1/programs/{id}/weeks
POST   /v1/programs/{id}/assignments
POST   /v1/program-weeks/{id}/sessions
PATCH  /v1/admin/program-assignments/{id}
DELETE /v1/admin/program-assignments/{id}
```

---

## Real-Time Architecture

Realtime support is currently focused on the **admin dashboard**, not the entire application.

### Current implementation

- **Endpoint:** `GET /v1/admin/dashboard/realtime`
- **Protocol:** WebSocket
- **Access:** authenticated admin only
- **Purpose:** push fresh admin dashboard metrics every ~5 seconds

The payload includes:

```json
{
  "active_users": 12,
  "workouts_today": 34,
  "meals_today": 51,
  "timestamp": "2026-04-17T10:30:00Z"
}
```

### Frontend behavior

- The admin UI uses `useAdminRealtime` to open the WebSocket connection
- If the socket is unavailable, the dashboard falls back to query-based metrics
- Connection state is surfaced as `live`, `connecting`, `reconnecting`, `disconnected`, or `disabled`

### Important clarification

The current app does **not** use WebSockets for:

- live workout session synchronization
- AI streaming chat
- user notification streams across devices

Those areas currently rely on normal HTTP requests plus TanStack Query refresh/invalidation behavior.

---

## Testing

### Frontend

From `Front-End/`:

```bash
npm run test
npm run build
npm run lint
```

### Backend

From `Backend/`:

```bash
go test ./...
go run . migrate
go run seed/main.go
```

---

## Internationalization

The frontend ships with three languages:

- Arabic
- French
- English

Implementation details:

- custom translation layer in `Front-End/src/i18n/messages.js`
- language switching in the frontend UI
- RTL support for Arabic via document direction and mirrored layout behavior

---

## Notes

- The frontend expects both the Go API and the exercise library service to be available
- API docs are available at `http://localhost:8080/docs`
- Postman collections live in `Backend/postman/`
- The backend seed creates demo users, workouts, foods, meals, templates, programs, notifications, and related analytics data
