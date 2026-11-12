#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f .env ]]; then
  echo "Missing deploy/.env — copy .env.compose.example and set DB_PASSWORD." >&2
  exit 1
fi
docker compose up -d --build "$@"
