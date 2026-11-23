#!/usr/bin/env bash
# Build and start the EEA stack (Docker Compose). This is the only production path.
#
# Proxy is build-time only: running containers do not get HTTP_PROXY.
# Ensure the Docker daemon itself can reach docker.io (host-level proxy).
#
# Usage:
#   bash deploy/build.sh                    # build + start, no proxy
#   bash deploy/build.sh 10.215.8.74        # proxy host (default port 1000)
#   bash deploy/build.sh http://10.215.8.74:1000
#   bash deploy/build.sh 10.215.8.74 --no-cache
#
# Env: PIP_INDEX_URL (default Tsinghua PyPI mirror), DEFAULT_PROXY_PORT, EEA_HTTP_PORT
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/deploy"

DEFAULT_PROXY_PORT="${DEFAULT_PROXY_PORT:-1000}"
NO_PROXY_LIST="${NO_PROXY_VALUE:-localhost,127.0.0.1,::1,postgres,api,web}"
PIP_INDEX="${PIP_INDEX_URL:-https://pypi.tuna.tsinghua.edu.cn/simple}"

PROXY_INPUT=""
NO_CACHE=0

usage() {
  echo "Usage: $0 [proxy-host-or-url] [--no-cache]" >&2
  exit 1
}

normalize_proxy_url() {
  local input="$1" trimmed
  trimmed="${input#"${input%%[![:space:]]*}"}"
  trimmed="${trimmed%"${trimmed##*[![:space:]]}"}"
  [[ -n "$trimmed" ]] || { echo "Error: proxy host or URL is required." >&2; exit 1; }
  if [[ "$trimmed" == http://* || "$trimmed" == https://* ]]; then
    echo "$trimmed"
  elif [[ "$trimmed" == *:* ]]; then
    echo "http://$trimmed"
  else
    echo "http://$trimmed:$DEFAULT_PROXY_PORT"
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-cache) NO_CACHE=1; shift ;;
    -h|--help) sed -n '2,16p' "$0"; exit 0 ;;
    -*) echo "Error: unknown option: $1" >&2; usage ;;
    *)
      [[ -z "$PROXY_INPUT" ]] || { echo "Error: unexpected argument: $1" >&2; usage; }
      PROXY_INPUT="$1"; shift ;;
  esac
done

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created deploy/.env from .env.example. Review TRUSTED_PROXY_IPS before exposure."
fi

# A copied .env.example has an empty password; generate one so the stack can start.
if ! grep -Eq "^DB_PASSWORD=.+" .env; then
  password="$(head -c 32 /dev/urandom | base64 | tr -dc "A-Za-z0-9" | head -c 24)"
  if grep -q "^DB_PASSWORD=" .env; then
    sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$password|" .env
  else
    printf "
DB_PASSWORD=%s
" "$password" >> .env
  fi
  echo "Generated DB_PASSWORD in deploy/.env."
fi

command -v docker >/dev/null || { echo "Error: docker is not installed on this host." >&2; exit 1; }
docker compose version >/dev/null || { echo "Error: docker compose v2 is required." >&2; exit 1; }

if [[ -n "$PROXY_INPUT" ]]; then
  PROXY_URL="$(normalize_proxy_url "$PROXY_INPUT")"
  export HTTP_PROXY="$PROXY_URL" HTTPS_PROXY="$PROXY_URL"
  export http_proxy="$PROXY_URL" https_proxy="$PROXY_URL"
  export NO_PROXY="$NO_PROXY_LIST" no_proxy="$NO_PROXY_LIST"
  echo "==> building behind $PROXY_URL"
fi
export PIP_INDEX_URL="$PIP_INDEX"
export DOCKER_BUILDKIT=1
export COMPOSE_BAKE=false

if [[ "$NO_CACHE" == "1" ]]; then
  echo "==> docker compose build --no-cache --pull"
  docker compose build --no-cache --pull
  up_args=(up -d --wait --wait-timeout 600 --no-build)
else
  up_args=(up -d --build --wait --wait-timeout 600)
fi

echo "==> docker compose ${up_args[*]}"
if ! docker compose "${up_args[@]}"; then
  echo "Startup did not reach a healthy state. Last logs:" >&2
  docker compose logs --tail 80 migrate api web >&2 || true
  echo "Fix the cause above, then re-run: bash deploy/build.sh" >&2
  exit 1
fi

env -u HTTP_PROXY -u HTTPS_PROXY -u http_proxy -u https_proxy -u NO_PROXY -u no_proxy \
  docker compose ps
cat <<'EOF'

EEA is up.
  UI           http://<host>:8080/
  API docs     http://<host>:8080/api/docs  (same Nginx origin)
  Logs         docker compose logs -f api worker web
  Migrations   docker compose run --rm migrate
  Maintenance  docker compose --profile ops run --rm maintenance
  Backup       bash deploy/backup.sh
  Broken?      bash deploy/build.sh <proxy-host>
EOF
