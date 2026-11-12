#!/usr/bin/env bash
# Restore database dump produced by backup-eea.sh (objects restore is manual tar extract).
set -euo pipefail
dump="${1:?usage: restore-eea.sh <path-to-eea-*.dump>}"
cd "$(dirname "$0")/.."
docker compose exec -T postgres pg_restore -U "${DB_USER:-eea}" -d "${DB_NAME:-eea}" --clean --if-exists < "$dump"
echo "Database restore submitted; verify with curl http://127.0.0.1:${EEA_HTTP_PORT:-8080}/readyz"
