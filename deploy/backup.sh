#!/usr/bin/env bash
# Dump PostgreSQL and the object-store volume, write a checksum manifest.
# Usage: bash deploy/backup.sh [output-dir]   (default: deploy/backups)
set -euo pipefail
cd "$(cd "$(dirname "$0")" && pwd)"
if [[ -f .env ]]; then set -a; . ./.env; set +a; fi

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
out="${1:-./backups}"
mkdir -p "$out"

docker compose exec -T postgres pg_dump -U "${DB_USER:-eea}" -Fc "${DB_NAME:-eea}" \
  > "$out/eea-$stamp.dump"

docker compose run --rm --no-deps -T \
  -v "$(cd "$out" && pwd)":/backup \
  api tar -czf "/backup/eea-objects-$stamp.tar.gz" -C /var/lib/eea/objects .

{
  echo "stamp=$stamp"
  echo "db_dump=eea-$stamp.dump"
  echo "objects=eea-objects-$stamp.tar.gz"
  echo "app_version=${EEA_VERSION:-latest}"
} > "$out/eea-$stamp.manifest.txt"
( cd "$out" && sha256sum "eea-$stamp.dump" "eea-objects-$stamp.tar.gz" >> "eea-$stamp.manifest.txt" )

echo "Backup written to $out (eea-$stamp.*)"
