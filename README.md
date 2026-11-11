# EEA

Foresight / signal intelligence: **FastAPI** backend, **Next.js** UI, **Windows** capture client for public-web ingestion.

**Production (Linux intranet):** [deploy/README.md](deploy/README.md) — not the portable-Postgres flow below.

## Setup

**Stack:** Python 3.12 (`uv`), PostgreSQL **16+**, pnpm **12.3.4**, Go **1.24** (client). Copy `backend/.env.example` → `backend/.env` (set `DB_*` and LLM when needed).

**Two terminals daily:** `backend` → `uv run python scripts/dev.py` (API + worker); `frontend` → `pnpm dev`.

| | API / OpenAPI | UI |
| --- | --- | --- |
| Local | `http://127.0.0.1:8000/healthz`, `/docs` | `http://localhost:3000` |

### Windows

Portable PostgreSQL in `backend/.pg/` (port **54329**, gitignored).

```powershell
cd backend
copy .env.example .env
uv sync --locked
uv run python scripts/bootstrap.py
uv run python scripts/dev.py

cd ..\frontend
pnpm install
pnpm dev
```

Background API: `start_api.py` / `stop_api.py`. pytest: Git Bash, WSL, or `uv run pytest -q` in `backend/`.

### macOS / Linux (dev)

System PostgreSQL on port **5432** (override in `.env`; code default is 54329).

```bash
# macOS: brew install uv postgresql@16 && brew services start postgresql@16
# Linux: install postgresql-16, enable service
createuser --createdb eea 2>/dev/null || sudo -u postgres createuser --createdb eea
psql -d postgres -c "ALTER ROLE eea WITH LOGIN CREATEDB PASSWORD 'eea';"  # or via sudo -u postgres

cd backend
cp .env.example .env
export DB_HOST=127.0.0.1 DB_PORT=5432 DB_USER=eea DB_PASSWORD=eea
uv sync --locked && uv run python scripts/bootstrap.py && uv run python scripts/dev.py

cd frontend
corepack enable && corepack pnpm install --frozen-lockfile && corepack pnpm dev
```

Start PostgreSQL before `pytest` (uses DB **`eea_test`** only). Slices: `backend/scripts/pytest_slices.sh` (bash). External DB: pytest does not start Postgres for you.

### Capture client (Windows)

Edge/Chrome required. `client/config.example.json` → `config.json`, `api_base`: `http://127.0.0.1:8000`.

```powershell
cd client
go build -trimpath -ldflags "-s -w -H=windowsgui" -o dist/capture.exe ./cmd/capture
.\dist\capture.exe doctor
```

Public-web capture is a Windows GUI target; macOS/Linux use API/UI uploads or `go test -short` in `client/internal/...`.

## Docs

[TODO.md](TODO.md) · [docs/PROJECT-INDEX.md](docs/PROJECT-INDEX.md) · [docs/REQUIREMENTS-TRACEABILITY.md](docs/REQUIREMENTS-TRACEABILITY.md) · [backend/README.md](backend/README.md) · [frontend/docs/ACCEPTANCE-WALKTHROUGH.md](frontend/docs/ACCEPTANCE-WALKTHROUGH.md)

## Do not commit

`backend/.env`, `client/config.json`, `client/data/`, `backend/.pg/` (see `.gitignore`).
