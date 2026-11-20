#!/usr/bin/env bash
# Apply pending migrations (the migrate service already runs on start; this is
# for a deliberate re-run after restoring a backup or pinning an older release).
set -euo pipefail
cd "$(cd "$(dirname "$0")" && pwd)"
exec docker compose run --rm migrate
