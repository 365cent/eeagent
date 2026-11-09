# Linux foreground service slice

These systemd units run the FastAPI, Next.js and durable capture worker as foreground processes. They are starter configuration artifacts, not a tested installer or a complete production deployment. They do not install PostgreSQL, configure TLS or authentication, or run migrations automatically.

## Paths and configuration

The units use this example filesystem layout; change the paths consistently if the approved host layout differs:

- Release symlink: `/opt/eea/current`
- Backend: `/opt/eea/current/backend`, with its locked Python environment at `backend/.venv`
- Frontend: `/opt/eea/current/frontend`, installed dependencies and production build in that directory
- API environment: `/etc/eea/eea-api.env` (outside the repository)
- Durable uploaded objects: `/var/lib/eea/objects`
- Service account: `eea` (a dedicated, unprivileged Linux account)

The API reads the existing settings names from the systemd environment file. Create that file as an administrator with only the values supplied by the environment owner; do not copy local development defaults or put real values in this repository. At minimum configure `APP_ENV=production`, `CAPTURE_SERVER_FETCH_ENABLED=false`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and `OBJECT_DIR=/var/lib/eea/objects`. Set `CORS_ORIGINS=` and `CORS_ORIGIN_REGEX=` when the browser uses the same-origin reverse proxy shown below. For audited writes, set `TRUSTED_PROXY_IPS` to the exact direct peer addresses/CIDRs used by the authenticated proxy. That proxy must strip incoming `X-EEA-Authenticated-User` and `X-EEA-Authenticated-Role` headers, then set both from its verified session and server-side role map; requests from any other peer are rejected. Add the approved model gateway settings only if the environment provides them. Restrict the file to root and the API service group (for example mode `0640`); never make it world-readable.

Create the configured service account and directories using the host's approved account-management procedure. Grant `eea` read/execute access to the release, write access to `/var/lib/eea/objects`, and write access to the Next cache directory `/opt/eea/current/frontend/.next/cache` (create it if absent). The units make the rest of the filesystem read-only to their processes. Keep PostgreSQL data in its own persistent database location or managed service; do not use `backend/.pg` or `backend/scripts/bootstrap.py` on Linux production. Ensure `/etc/eea/eea-api.env` exists before starting the API because systemd treats it as required.

## Build and install

Build the release on Linux for the target architecture, or in a matching Linux build environment. The Python project requires Python 3.12 or newer and includes `uv.lock`; the frontend pins pnpm 12.3.4 in `package.json`.

From the backend directory, install the locked runtime environment with the project's pinned uv version and `uv sync --locked --no-dev`. From the frontend directory, install with `pnpm install --frozen-lockfile`, then build with the browser API base set to the same-origin path:

```sh
NEXT_PUBLIC_EEA_API_BASE=/api/v1 pnpm build
```

That value is embedded at frontend build time. It makes browser API requests use `/api/v1` on the page's origin. The application currently falls back to `http://<browser-host>:8000/api/v1` when that build variable is absent, so a production build must set it explicitly.

Install the unit files into the host's systemd unit directory and adjust their paths and binary paths to the actual approved release layout:

```sh
sudo install -o root -g root -m 0644 deploy/eea-api.service /etc/systemd/system/eea-api.service
sudo install -o root -g root -m 0644 deploy/eea-web.service /etc/systemd/system/eea-web.service
sudo install -o root -g root -m 0644 deploy/eea-worker.service /etc/systemd/system/eea-worker.service
```

The API unit invokes `python -m uvicorn app.main:app` directly from the backend directory. It deliberately does not invoke `scripts/start_api.py` or `scripts/dev.py`: those scripts start a detached API and manage a Windows portable PostgreSQL development instance. The API binds only to `127.0.0.1:8000`. The worker unit runs `python -m app.worker`, claims durable capture jobs from PostgreSQL and uses the same persistent object directory. The web unit invokes the installed Next CLI directly through Node and binds only to `127.0.0.1:3000`; update `/usr/bin/node` if Node is installed elsewhere.

Apply the repository's Alembic migrations as a controlled one-off release operation using the same approved API environment and service identity. Do not add migrations to either long-running service's `ExecStart`; the units do not currently define a migration command. Provision PostgreSQL separately and make sure the database is reachable before starting the API.

After verifying the environment file, persistent directory permissions, release paths, database, and completed migrations, load and start the services:

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now eea-api.service eea-web.service eea-worker.service
sudo systemctl status eea-api.service eea-web.service eea-worker.service
```

For a local process check, `/healthz` is served by the API at `http://127.0.0.1:8000/healthz`; the Next server listens at `http://127.0.0.1:3000/`. These checks confirm only the processes and their basic responses. They do not establish TLS, user identity, authorization, readiness against database/object-store failures, or production acceptance.

## Reverse-proxy wiring

Configure the approved host name, certificates, and TLS policy in the site's Nginx configuration. The following locations show the intended loopback routing; the host name and certificate values are deliberately left to the environment owner. Nginx must forward `/api/` unchanged to FastAPI and the page routes to Next. Disable proxy buffering for streaming API responses and set the upload cap to match the API's configured limit.

```nginx
# Inside the approved TLS server block:
client_max_body_size 120m;

location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_read_timeout 300s;
}

location = /healthz {
    proxy_pass http://127.0.0.1:8000/healthz;
}

location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

This proxy example does not implement authentication or trusted identity headers. Complete the environment's authenticated proxy module and role map before enabling audited production writes; an IP address or caller-provided role is not user identity. The API and web services remain bound to loopback, so clients should reach them through the approved reverse proxy.

## Current limits

- The worker unit is a starter template and has not been exercised on Linux. OPS-04 remains incomplete pending lifecycle, recovery and proxy validation.
- PostgreSQL service setup, migrations, seed policy, TLS, authentication, authorization, backup, offline packaging, and rollback are not performed by these units.
- The unit paths, `/usr/bin/node`, ports, service account, and persistent object directory are example host conventions. Confirm them against the actual Linux environment before installation.
- These files have not been exercised on Linux; no Linux lifecycle or deployment checks were run.
