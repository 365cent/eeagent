# EEA

EEA is a foresight / signal intelligence platform: FastAPI backend, Next.js UI, and an optional Windows capture client for public-web ingestion.

From the **repository root**, use three terminals when developing locally: start the **backend** first, then the **frontend**; run the **capture client** when you need uploads from the public web.

Project status and implementation order: [project TODO](TODO.md), [source and requirement index](docs/PROJECT-INDEX.md), [requirement traceability](docs/REQUIREMENTS-TRACEABILITY.md). The development host is macOS; use the [Mac setup and checks](docs/DEVELOPMENT-MAC.md). The PowerShell bootstrap and commands below are Windows development instructions; they are not the Linux production deployment procedure. See [Linux deployment work](deploy/TODO.md).

---

### Backend (API + local Postgres)

**First time only** (portable DB, migrations, seed):

```powershell
cd backend
uv run python scripts/bootstrap.py
```

**Every day — pick one:**

| Mode | Command | Stop |
|------|---------|------|
| **Foreground** (logs in terminal) | `uv run python scripts/dev.py` | **Ctrl+C** |
| **Background** (daemon) | `uv run python scripts/start_api.py` | `uv run python scripts/stop_api.py` |

- API: **http://127.0.0.1:8000** (Swagger: `/docs`, health: `/healthz`)
- Copy `backend/.env.example` → `backend/.env` and set your LLM gateway; restart the API after changes
- Stop Postgres only: `uv run python scripts/stop_db.py`

---

### Frontend (Next.js UI)

**First time:**

```powershell
cd frontend
pnpm install
```

**Dev server:**

```powershell
cd frontend
pnpm dev
```

- App: **http://localhost:3000**
- The UI derives the API base from the browser host (same machine → port **8000** on that host)
- Production: `pnpm build` then `pnpm start`

---

### Capture client (Go, Windows)

**First time:**

1. Copy `client/config.example.json` → `client/config.json`
2. Set `api_base` to **`http://127.0.0.1:8000`** (API root, **not** `/api/v1`), or leave empty with `auto_api: true` for LAN auto-detect
3. Build (Go ≥ 1.24):

```powershell
cd client
go build -trimpath -ldflags "-s -w -H=windowsgui" -o dist/capture.exe ./cmd/capture
```

**Run:**

```powershell
client\dist\capture.exe              # GUI
client\dist\capture.exe doctor       # browser + backend check
client\dist\capture.exe upload --url https://example.com
```

Or from `client/`: `go run ./cmd/capture` (GUI). Requires **Edge or Chrome**; use `headless: false` for WeChat or login flows.

---

### Quick checklist

1. Backend: `http://127.0.0.1:8000/healthz`
2. Frontend: `http://localhost:3000`
3. Client: `capture.exe doctor` reports a reachable `api_base`

---

### Publishing / cloning

- Do **not** commit `backend/.env`, `client/config.json`, browser profiles under `client/data/`, or the downloaded Postgres bundle under `backend/.pg/` (see root `.gitignore`).
- Planning docs and requirements live under [`docs/`](docs/README.md).
