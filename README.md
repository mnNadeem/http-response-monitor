# HTTP Response Monitor

**Live demo:** [https://frontend-staging-0e36.up.railway.app/](https://frontend-staging-0e36.up.railway.app/)

Pings `httpbin.org/anything` every 5 minutes, stores results in PostgreSQL, and streams live updates to a React dashboard.

---

## Setup instructions

### Docker (recommended)

**Prerequisites:** Docker Desktop (or another Docker daemon) running.

```bash
docker compose up --build
```

Open http://localhost:5173  
This starts Postgres + backend + frontend together. Postgres is published on host port **5433**.

### Manual setup

**Prerequisites:** Node.js `>= 20`, PostgreSQL running locally.

```bash
# Database
createdb http_monitor_development

# Backend → http://localhost:4000
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev

# Frontend → http://localhost:5173
cd frontend
cp .env.example .env
npm install
npm run dev
```

If port `5432` is already in use, set `DATABASE_URL` in `backend/.env` to another port (e.g. `postgresql://localhost:5433/http_monitor_development`).

### Useful endpoints (local)

| What | URL |
|---|---|
| Dashboard | http://localhost:5173 |
| Health | http://localhost:4000/api/health |
| Swagger | http://localhost:4000/api/docs |
| WebSocket | `ws://localhost:4000/ws` |

### Configuration

**Backend runtime env**

- `DATABASE_URL` (required)
- `CORS_ORIGIN` (use `*` for dev; set to frontend origin in production)
- `MONITOR_TARGET_URL` (default: `https://httpbin.org/anything`)
- `MONITOR_CRON` (default: `*/5 * * * *`)
- `MONITOR_RUN_ON_BOOT=true` (optional: one run on startup)
- `MONITOR_REQUEST_TIMEOUT_MS` (default: `10000`)
- `PORT` (default: `4000`)

**Frontend build-time env**

- `VITE_API_BASE` (default: `http://localhost:4000`)
- `VITE_WS_URL` (default: `ws://localhost:4000/ws`)

---

## Architecture overview

Backend is feature-based under `backend/src/modules/monitor/` (kebab-case files), with shared cross-cutting code in `backend/src/shared/`.

**Every 5 minutes (or on manual trigger):**

1. `MonitorScheduler` triggers `MonitorService`
2. `MonitorService` builds a random payload, POSTs to httpbin, persists the result in PostgreSQL via `MonitorRepository`, and pushes the saved record over WebSocket via `Broadcaster`
3. Optionally runs anomaly analysis (`AnalysisService` / anomaly detector) and enriches the broadcast
4. React dashboard receives the live push instantly via WebSocket

**On page load / pagination:**

- React dashboard fetches existing records from PostgreSQL via the REST API (`useMonitorData` + TanStack Query)

```
┌─────────────┐     cron / Run now      ┌────────────────┐
│  Scheduler  │ ───────────────────────▶│ MonitorService │
└─────────────┘                         └───────┬────────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    ▼                           ▼                           ▼
             ┌────────────┐             ┌──────────────┐             ┌─────────────┐
             │  httpbin   │             │  PostgreSQL  │             │ Broadcaster │
             └────────────┘             └──────┬───────┘             └──────┬──────┘
                                               │ REST                       │ WS
                                               ▼                            ▼
                                        ┌─────────────────────────────────────────┐
                                        │           React Dashboard               │
                                        │     (useMonitorData + TanStack Query)   │
                                        └─────────────────────────────────────────┘
```

---

## Choice of technologies and reasoning

| Technology | Why |
|---|---|
| **Node.js + Express** | I/O-bound workload (one HTTP ping, one DB write, one socket push). Minimal overhead, familiar stack. |
| **PostgreSQL** | Reliable relational store for time-ordered rows + JSONB for the echoed payload. One table doesn’t need a heavy ORM. |
| **`pg` (no ORM)** | Keeps SQL explicit and easy to reason about for a small schema. |
| **`ws`** | Lightweight single-channel broadcast. Socket.IO extras aren’t needed here. |
| **`node-cron`** | Declarative schedule, env-configurable, good enough for a single-process demo. |
| **React + Vite + TypeScript** | Fast frontend loop and type safety across the API/UI boundary. |
| **TanStack Query** | Owns REST fetch/cache; WebSocket pushes merge into the same cache. |
| **Tailwind + Recharts** | Fast styling and a composed chart for the anomaly confidence band. |
| **Jest + Supertest** | Backend unit/integration/e2e with a real Postgres test DB. |
| **Vitest + Testing Library** | Frontend component tests with a Vite-native runner. |
| **Docker Compose** | One-command local stack for reviewers. |

---

## Core component identification

Focus was on the pieces that define correctness: **ping → persist → stream → display**, plus anomaly detection as the main analysis surface.

| Component | Location | Why it is core |
|---|---|---|
| **MonitorService** | `backend/src/modules/monitor/monitor-service.js` | Owns the full monitor cycle: build payload, call target, persist result, broadcast. Failures are stored, not discarded. |
| **MonitorScheduler** | `backend/src/modules/monitor/monitor-scheduler.js` | Runs the cycle on cron (and optionally on boot). Overlap-safe so concurrent ticks don’t pile up. |
| **Repository** | `backend/src/modules/monitor/monitor-repository.js` | All SQL in one place. Parameterized queries + whitelisted sort columns. |
| **Broadcaster** | `backend/src/modules/monitor/broadcaster.js` | Lightweight WebSocket fan-out with heartbeat. Isolated so socket errors can’t break the monitor cycle. |
| **Anomaly detector / AnalysisService** | `backend/src/modules/monitor/anomaly/`, `analysis-service.js` | Rolling z-score + EWMA forecast for latency spikes. Pure analysis functions, easy to unit-test. |
| **useMonitorData** | `frontend/src/hooks/useMonitorData.ts` | Fuses REST snapshot + live WS pushes into one cache. Keeps UI components presentational. |

---

## Testing strategy

Testing effort was concentrated on the highest-risk paths first (pragmatic coverage over chasing 100%).

### How to run tests

```bash
# Backend
cd backend
npm test
npm run test:coverage
npm run lint

# Frontend
cd frontend
npm test
```

### Priorities and reasoning

| Priority | What | Why |
|---|---|---|
| **1. Unit — MonitorService** | success, 4xx/5xx, timeout, network error, broadcast contract | Business-critical path; regressions here break the product. |
| **1. Unit — anomaly detector** | spikes, drops, warm-up suppression, band ordering | Statistical logic is easy to get subtly wrong and hard to catch in UI. |
| **2. Integration — REST routes** | health, results, stats, analysis, manual run | Confirms HTTP contracts + DB wiring with a real Postgres test DB. |
| **3. E2E — realtime flow** | trigger run → WS broadcast → REST queryable | Proves the end-to-end promise: persist + live stream. |
| **4. Frontend components** | empty/loading states (`ResultsTable`, `LoadingResults`) | Guards the main empty UX; hook-level `useMonitorData` tests are future work. |

Also covered with unit tests: scheduler overlap/boot behaviour, payload generator, analysis service wrappers.

**CI (GitHub Actions):** on every push/PR → backend lint + migrate + test with coverage, and frontend component tests with coverage.

---

## API overview

- `GET /api/health`
- `GET /api/results` (`limit`, `offset`, `success`, `sortBy`, `order`)
- `GET /api/results/:id`
- `GET /api/stats`
- `GET /api/analysis`
- `POST /api/monitor/run` (manual trigger)
- WebSocket: `/ws` (pushes `monitor_result` frames)
- Swagger: `/api/docs`

---

## Deployment (Railway)

Deploy **Postgres**, **backend**, and **frontend** as separate services:

- Backend env: `DATABASE_URL`, `CORS_ORIGIN`, `MONITOR_RUN_ON_BOOT=true`
- Frontend build env: `VITE_API_BASE` (`https://…`), `VITE_WS_URL` (`wss://…/ws`)

Note: the schedule runs inside the backend process. If the service sleeps/scales to zero, cron pauses until it is up again. For demos, use the dashboard **Run now** button.

---

## Assumptions made

Shortcuts / trade-offs taken due to time constraints:

- Failed pings are stored as data, not dropped
- Stats (avg latency) are computed over successful requests only
- No authentication — treated as an internal / single-tenant tool
- Manual trigger (`POST /api/monitor/run`) added so demos don’t have to wait 5 minutes
- Scheduler runs in-process (`node-cron`), not as a separate worker
- Migrations use a minimal custom runner (not Knex / node-pg-migrate)
- Frontend tests currently cover component empty/loading states more than hook fusion logic

---

## Future improvements

- Frontend tests (Vitest + Testing Library for `useMonitorData`)
- Separate scheduler worker so API restarts don’t interrupt the cron
- Rate limiting and auth for public deployments
- Proper migration tool (Knex / node-pg-migrate) instead of the minimal custom runner
