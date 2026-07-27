# HTTP Monitor

Pings `httpbin.org/anything` every 5 minutes, stores results in PostgreSQL, and streams live updates to a React dashboard.

## Quick start

### Docker (recommended)

1. `docker compose up --build`
2. Open `http://localhost:5173`

This starts Postgres + backend + frontend together. (Postgres is published on host port `5433`.)

### Manual (optional)

Requirements: Node.js `>= 20`, PostgreSQL running locally.

**Backend** (http://localhost:4000)

```bash
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev
```

**Frontend** (http://localhost:5173)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Configuration

### Backend runtime env

- `DATABASE_URL` (required)
- `CORS_ORIGIN` (use `*` for dev)
- `MONITOR_TARGET_URL` (default: `https://httpbin.org/anything`)
- `MONITOR_CRON` (default: `*/5 * * * *`)
- `MONITOR_RUN_ON_BOOT=true` (optional: triggers one run on startup)
- `MONITOR_REQUEST_TIMEOUT_MS` (default: `10000`)
- `PORT` (default: `4000`)

### Frontend build-time env

- `VITE_API_BASE` (default: `http://localhost:4000`)
- `VITE_WS_URL` (default: `ws://localhost:4000/ws`)

## API

### REST

- `GET /api/health`
- `GET /api/results` (supports `limit`, `offset`, `success`, `sortBy`, `order`)
- `GET /api/results/:id`
- `GET /api/stats`
- `GET /api/analysis`
- `POST /api/monitor/run` (manual trigger)

### WebSocket

- `ws://localhost:4000/ws` (pushes `monitor_result` frames)

### Swagger

- `http://localhost:4000/api/docs`
- OpenAPI JSON: `http://localhost:4000/api/docs.json`

## Testing

Backend:

```bash
cd backend
npm test
npm run test:coverage
npm run lint
```

Frontend:

```bash
cd frontend
npm test
```

## Deployment

### Railway

Deploy backend + frontend as separate services and set:

- Backend env: `DATABASE_URL`, `CORS_ORIGIN`, `MONITOR_RUN_ON_BOOT=true`
- Frontend build env: `VITE_API_BASE`, `VITE_WS_URL`

Note: the monitor schedule runs inside the backend process (`node-cron`). If the service sleeps/scales down, cron ticks pause until it’s up again. For demos, use the dashboard **Run now** button.

### Other Docker-based hosts (Render/Fly/Heroku/etc.)

Use:

- `backend/Dockerfile` for the backend
- `frontend/Dockerfile` for the frontend

Set backend runtime env: `DATABASE_URL`, `CORS_ORIGIN`, `PORT` (if needed).  
Provide frontend build args: `VITE_API_BASE`, `VITE_WS_URL`.

