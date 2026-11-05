#!/usr/bin/env bash
# Rebuilds internal/singlefile/singlefile.js from a pinned single-file-core release.
#
# 需要：curl、tar、node/npm（仅构建期）。默认走 npmmirror（企网可访问），可用
# SINGLEFILE_VERSION / NPM_REGISTRY 覆盖。
set -euo pipefail

VERSION="${SINGLEFILE_VERSION:-1.7.1}"
REGISTRY="${NPM_REGISTRY:-https://registry.npmmirror.com}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "==> fetch single-file-core@$VERSION"
curl -sSL --ssl-no-revoke "$REGISTRY/single-file-core/-/single-file-core-$VERSION.tgz" \
	-o "$WORK/sf.tgz"
tar xzf "$WORK/sf.tgz" -C "$WORK"

cat >"$WORK/package/eea-entry.js" <<'EOF'
import * as sf from "./single-file.js";
globalThis.__EEA_SF__ = sf;
EOF

echo "==> bundle (esbuild, IIFE)"
cd "$WORK"
npm init -y >/dev/null
npm install esbuild --registry="$REGISTRY" --no-audit --no-fund >/dev/null
./node_modules/.bin/esbuild package/eea-entry.js \
	--bundle --format=iife --target=chrome110 --minify --legal-comments=none \
	--outfile="$ROOT/internal/singlefile/singlefile.js"

echo "==> wrote $ROOT/internal/singlefile/singlefile.js"
du -h "$ROOT/internal/singlefile/singlefile.js"
