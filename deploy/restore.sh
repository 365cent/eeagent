#!/usr/bin/env bash
# Restore a backup made by backup.sh into the running stack.
# Stop api/worker first so nothing writes during the restore.
#
# Usage: bash deploy/restore.sh <backup-dir-or-stamp>
set -euo pipefail
cd "$(cd "$(dirname "$0")" && pwd)"
if [[ -f .env ]]; then set -a; . ./.env; set +a; fi

ARG="${1:?usage: restore.sh <backup-dir-or-stamp>}"
if [[ -d "$ARG" ]]; then DIR="$ARG"; else DIR="./backups"; fi
STAMP="$(basename "$ARG")"
DIR="$(cd "$DIR" && pwd)"
dump="$DIR/eea-$STAMP.dump"
objects="$DIR/eea-objects-$STAMP.tar.gz"
[[ -f "$dump" ]] || { echo "missing $dump" >&2; exit 1; }
[[ -f "$objects" ]] || { echo "missing $objects" >&2; exit 1; }

echo "==> stopping api/web/worker"
docker compose stop api web worker nginx

echo "==> restoring database"
docker compose exec -T postgres psql -U "${DB_USER:-eea}" -d postgres \
  -c "DROP DATABASE IF EXISTS \"${DB_NAME:-eea}\" WITH (FORCE);" \
  -c "CREATE DATABASE \"${DB_NAME:-eea}\" OWNER \"${DB_USER:-eea}\";"
docker compose exec -T postgres pg_restore -U "${DB_USER:-eea}" -d "${DB_NAME:-eea}" --no-owner < "$dump"

echo "==> restoring objects"
docker compose run --rm --no-deps -T \
  -v "$DIR":/backup:ro \
  api sh -c "rm -rf /var/lib/eea/objects/* && tar -xzf /backup/eea-objects-$STAMP.tar.gz -C /var/lib/eea/objects"

echo "==> starting"
docker compose up -d --wait
echo "Restored $STAMP. Verify with: docker compose logs --tail 50 api"
