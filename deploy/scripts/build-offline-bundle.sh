#!/usr/bin/env bash
# Build one offline bundle for a Linux intranet host (OPS-02).
#
# Run on a connected machine with Python 3.12, Node/pnpm and (for fonts) a
# Noto CJK package. The result installs with no network and no compiler: the
# bundle already contains the Linux cp312 site-packages tree.
#
# Usage: deploy/scripts/build-offline-bundle.sh [--version v0.1.0] [--out dist]
set -euo pipefail

VERSION=v0.1.0
OUT=dist
while [[ ${1:-} ]]; do
  case "$1" in
    --version) VERSION="${2:?}"; shift 2 ;;
    --out) OUT="${2:?}"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BUNDLE="$ROOT/$OUT/eea-offline-$VERSION"
SITE="$BUNDLE/backend/site-packages"

echo "== backend dependencies for linux cp312 =="
rm -rf "$BUNDLE"
mkdir -p "$SITE"
( cd "$ROOT/backend" && uv export --frozen --no-dev --no-emit-project \
    --format requirements-txt -o "$BUNDLE/backend/requirements.txt" )
# jieba ships no wheel; install it from its sdist below, everything else as wheels.
grep -vi '^jieba==' "$BUNDLE/backend/requirements.txt" > "$BUNDLE/backend/requirements-wheels.txt"
uv pip install -r "$BUNDLE/backend/requirements-wheels.txt" \
  --python-platform x86_64-manylinux_2_28 --python-version 3.12 \
  --target "$SITE" --no-build
python3 -m pip install --no-deps --no-binary :all: --target "$SITE" jieba==0.42.1

echo "== backend source =="
cp -R "$ROOT/backend/app" "$BUNDLE/backend/app"
cp -R "$ROOT/backend/migrations" "$BUNDLE/backend/migrations"
cp "$ROOT/backend/alembic.ini" "$ROOT/backend/pyproject.toml" \
   "$ROOT/backend/uv.lock" "$BUNDLE/backend/"
# Drop caches and Windows-specific leftovers from the shipped tree.
find "$SITE" -name '__pycache__' -type d -prune -exec rm -rf {} + 2>/dev/null || true

echo "== frontend standalone =="
( cd "$ROOT/frontend" && pnpm install --frozen-lockfile && \
  NEXT_PUBLIC_EEA_API_BASE=/api/v1 pnpm build )
mkdir -p "$BUNDLE/web/.next"
cp -R "$ROOT/frontend/.next/standalone/." "$BUNDLE/web/"
cp -R "$ROOT/frontend/.next/static" "$BUNDLE/web/.next/static"
cp -R "$ROOT/frontend/public" "$BUNDLE/web/public"

echo "== runtime assets =="
mkdir -p "$BUNDLE/runtime/fonts"
for f in /usr/share/fonts/opentype/noto/NotoSansCJK*.ttc \
         /usr/share/fonts/truetype/noto/NotoSansCJK*.ttc \
         /usr/share/fonts/opentype/noto/NotoSerifCJK*.ttc; do
  [[ -e "$f" ]] && cp "$f" "$BUNDLE/runtime/fonts/"
done
if ! ls "$BUNDLE/runtime/fonts"/*.ttc >/dev/null 2>&1; then
  echo "WARN: no Noto CJK font found; install fonts-noto-cjk before building" >&2
fi

echo "== deploy templates =="
mkdir -p "$BUNDLE/deploy"
cp "$ROOT/deploy/eea-api.service" "$ROOT/deploy/eea-web.service" \
   "$ROOT/deploy/eea-worker.service" "$ROOT/deploy/eea-maintenance.service" \
   "$ROOT/deploy/eea-maintenance.timer" "$BUNDLE/deploy/"
cp -R "$ROOT/deploy/nginx" "$BUNDLE/deploy/nginx"
cp "$ROOT/THIRD_PARTY_NOTICES.md" "$BUNDLE/" 2>/dev/null || true
if compgen -G "$ROOT/client/dist/capture-*-windows-amd64.zip" > /dev/null; then
  cp "$ROOT/client/dist/capture-"*"-windows-amd64.zip" "$BUNDLE/"
else
  echo "NOTE: build the Windows client (client/scripts/release.ps1) to include it"
fi

echo "== manifest =="
( cd "$BUNDLE" && find . -type f -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS )
{
  echo "version=$VERSION"
  echo "built_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "python_platform=x86_64-manylinux_2_28"
  echo "python_version=3.12"
  echo "files=$(wc -l < "$BUNDLE/SHA256SUMS" | tr -d ' ')"
} > "$BUNDLE/MANIFEST.txt"

echo "== verify =="
python3 "$(dirname "$0")/check_offline_bundle.py" "$BUNDLE"
echo "bundle: $BUNDLE"
