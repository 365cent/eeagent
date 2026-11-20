# Linux intranet — Docker Compose (primary)

Production on Linux uses **Docker Compose** under this directory: PostgreSQL, Alembic migrate job, API, capture worker, Next.js, and Nginx on one host. Systemd unit files (`eea-*.service`) remain optional bare-metal templates; they are not the default install path.

## Quick start (intranet host)

1. Install Docker Engine and Docker Compose v2.
2. Copy secrets and ports:

   ```bash
   cd deploy
   cp .env.compose.example .env
   # Edit DB_PASSWORD, optional CHAT_*/EMBEDDING_*/RERANK_* gateways, EEA_HTTP_PORT
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

Optional model gateways: `CHAT_*`, `EMBEDDING_*`, `RERANK_*` — when unset, `/readyz` reports `semantic_gateway: degraded` but storage/DB remain `ready`.

## TLS and identity (OPS-03)

The bundled [`nginx/eea-intranet.conf`](nginx/eea-intranet.conf) listens on port 80 inside the container. Terminate TLS on an outer proxy or extend the Nginx config with certificates under `/etc/nginx/certs/`. The config clears `X-EEA-Authenticated-User` / `X-EEA-Authenticated-Role` from clients; only a trusted edge proxy may set them after authentication.

## Operations

- Re-run migrations after upgrade: `./scripts/compose-migrate.sh`
- Backup DB + objects: `./scripts/backup-eea.sh [output-dir]`
- Restore DB dump: `./scripts/restore-eea.sh ./backups/eea-YYYYMMDD.dump`

Object files are in the `eea_objectstore` Docker volume; restore requires extracting the objects tarball onto that volume during a maintenance window.

## Systemd alternative

For hosts that forbid containers, use `eea-api.service`, `eea-web.service`, and `eea-worker.service` with the paths described in the previous README revision. Build frontend with `NEXT_PUBLIC_EEA_API_BASE=/api/v1`, run Alembic once per release, and point Nginx at loopback `127.0.0.1:8000` / `:3000`.

## Offline bundle (OPS-02)

One host, no network: build the bundle on a connected machine, carry it in, install it.

```bash
# connected machine (Linux with python3.12, Node/pnpm, fonts-noto-cjk)
deploy/scripts/build-offline-bundle.sh --version v0.1.0 --out dist

# intranet host
sudo deploy/scripts/verify-bundle.sh /media/usb/eea-offline-v0.1.0
sudo deploy/scripts/install-offline.sh /media/usb/eea-offline-v0.1.0 --version v0.1.0
```

The bundle contains:

| Path | Contents |
| --- | --- |
| `backend/wheels` + `requirements.txt` | Linux `cp312` wheelhouse, pinned by `uv export --frozen` |
| `backend/app`, `migrations`, `alembic.ini` | service code and migrations |
| `web/` | Next **standalone** server plus `.next/static` and `public` (Next does not trace static assets) |
| `runtime/fonts` | Noto CJK `.ttc` for ReportLab PDFs |
| `deploy/` | systemd units, nginx config |
| `capture-*-windows-amd64.zip` | Windows client package when built |
| `SHA256SUMS`, `MANIFEST.txt` | integrity and build metadata |

`install-offline.sh` creates the venv with `PIP_NO_INDEX=1 --find-links backend/wheels`, runs `alembic upgrade head` with the installed env file, then enables `eea-api`, `eea-web`, `eea-worker` and `eea-maintenance.timer`. It writes `/etc/eea/eea-api.env` with placeholders on first install and refuses to overwrite an existing file.

`verify-bundle.sh` delegates to `check_offline_bundle.py`, which verifies the manifest, every checksum, the layout, wheelhouse coverage of every pinned requirement, and that a CJK font ships. It runs from the build script too, so an incomplete bundle fails before it is carried anywhere.

The Docker path stays available: `deploy/scripts/compose-up.sh` builds images with the same lockfiles; the frontend image now runs `node server.js` from the standalone output.

## Maintenance

Resolved object-store orphans are pruned by `python -m app.services.orphan_maintenance`. The command only removes resolved or missing blobs; it does not prune capture jobs or signals.

Compose installs run it explicitly:

```bash
cd deploy
docker compose --profile ops run --rm maintenance
```

Bare-metal installs use the included timer:

```bash
install -m 0644 deploy/eea-maintenance.service /etc/systemd/system/
install -m 0644 deploy/eea-maintenance.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now eea-maintenance.timer
```

Check `journalctl -u eea-maintenance.service` after the first run.


## Limits (honest)

- Compose stack is implemented in-repo; **Linux acceptance on customer hardware** (TLS, identity, backup restore) remains OPS-06.
- No synthetic eFuse seed in production images; vocabulary-only migrations apply.
- macOS `docker compose build` validates images; Windows client and browser checks are separate.
