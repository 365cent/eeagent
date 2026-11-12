# Linux intranet — Docker Compose (primary)

Production on Linux uses **Docker Compose** under this directory: PostgreSQL, Alembic migrate job, API, capture worker, Next.js, and Nginx on one host. Systemd unit files (`eea-*.service`) remain optional bare-metal templates; they are not the default install path.

## Quick start (intranet host)

1. Install Docker Engine and Docker Compose v2.
2. Copy secrets and ports:

   ```bash
   cd deploy
   cp .env.compose.example .env
   # Edit DB_PASSWORD, optional LLM/MaaS keys, EEA_HTTP_PORT
   ```

3. Build and start:

   ```bash
   ./scripts/compose-up.sh
   ```

4. Verify:

   ```bash
   curl -sS "http://127.0.0.1:${EEA_HTTP_PORT:-8080}/readyz" | jq .
   curl -sS "http://127.0.0.1:${EEA_HTTP_PORT:-8080}/healthz"
   ```

Browser entry: `http://<host>:${EEA_HTTP_PORT:-8080}/` (same-origin `/api/v1`).

## Compose layout

| Service   | Role |
|-----------|------|
| `postgres` | PostgreSQL 16 persistent volume `pgdata` |
| `migrate`  | One-shot `alembic upgrade head` before API/worker |
| `api`      | FastAPI on `:8000` (not published; Nginx only) |
| `worker`   | `python -m app.worker` (durable capture jobs) |
| `web`      | Next.js production server |
| `nginx`    | Same-origin `/api/` + UI, upload 120m, SSE `proxy_buffering off` |

Shared volume `objectstore` → `/var/lib/eea/objects` in API and worker.

`EEA_CAPTURE_EMBEDDED=0` so only the worker consumes the job queue (matches systemd production split).

## Configuration

All runtime settings come from `deploy/.env` (see `.env.compose.example`). Do not commit `deploy/.env`.

Minimum production:

- `APP_ENV=production`
- `CAPTURE_SERVER_FETCH_ENABLED=false`
- Strong `DB_PASSWORD`
- `TRUSTED_PROXY_IPS` narrowed to your authenticating reverse proxy when TLS terminates upstream

Optional model gateways: `LLM_*`, `MAAS_*` — when unset, `/readyz` reports `semantic_gateway: degraded` but storage/DB remain `ready`.

## TLS and identity (OPS-03)

The bundled [`nginx/eea-intranet.conf`](nginx/eea-intranet.conf) listens on port 80 inside the container. Terminate TLS on an outer proxy or extend the Nginx config with certificates under `/etc/nginx/certs/`. The config clears `X-EEA-Authenticated-User` / `X-EEA-Authenticated-Role` from clients; only a trusted edge proxy may set them after authentication.

## Operations

- Re-run migrations after upgrade: `./scripts/compose-migrate.sh`
- Backup DB + objects: `./scripts/backup-eea.sh [output-dir]`
- Restore DB dump: `./scripts/restore-eea.sh ./backups/eea-YYYYMMDD.dump`

Object files are in the `eea_objectstore` Docker volume; restore requires extracting the objects tarball onto that volume during a maintenance window.

## Systemd alternative

For hosts that forbid containers, use `eea-api.service`, `eea-web.service`, and `eea-worker.service` with the paths described in the previous README revision. Build frontend with `NEXT_PUBLIC_EEA_API_BASE=/api/v1`, run Alembic once per release, and point Nginx at loopback `127.0.0.1:8000` / `:3000`.

## Limits (honest)

- Compose stack is implemented in-repo; **Linux acceptance on customer hardware** (TLS, identity, backup restore) remains OPS-06.
- No synthetic eFuse seed in production images; vocabulary-only migrations apply.
- macOS `docker compose build` validates images; Windows client and browser checks are separate.
