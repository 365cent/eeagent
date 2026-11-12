#!/usr/bin/env bash
# Backup PostgreSQL + object store volumes for Docker Compose deployments.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
out_dir="${1:-./backups}"
mkdir -p "$out_dir"
archive="$out_dir/eea-backup-${stamp}.tar.gz"

docker compose exec -T postgres pg_dump -U "${DB_USER:-eea}" -Fc "${DB_NAME:-eea}" > "$out_dir/eea-${stamp}.dump"

docker run --rm \
  -v eea_objectstore:/data:ro \
  -v "$out_dir":/backup \
  alpine:3.20 \
  tar -czf "/backup/eea-objects-${stamp}.tar.gz" -C /data .

{
  echo "stamp=$stamp"
  echo "db_dump=eea-${stamp}.dump"
  echo "objects=eea-objects-${stamp}.tar.gz"
  sha256sum "$out_dir/eea-${stamp}.dump" "$out_dir/eea-objects-${stamp}.tar.gz" || shasum -a 256 "$out_dir/eea-${stamp}.dump" "$out_dir/eea-objects-${stamp}.tar.gz"
} > "$out_dir/eea-${stamp}.manifest.txt"

tar -czf "$archive" -C "$out_dir" "eea-${stamp}.dump" "eea-objects-${stamp}.tar.gz" "eea-${stamp}.manifest.txt"
echo "Wrote $archive"
