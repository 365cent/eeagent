#!/usr/bin/env bash
# Unpack/build the official SingleFile Chromium extension for --load-extension.
#
# Prefer installing SingleFile from Chrome Web Store / Edge Add-ons (capture_archive
# auto-detects it). Use this script when the capture profile cannot read the store
# install or you need a pinned tree.
#
# Requirements: curl, unzip, Node.js/npm (see SingleFile README-BUILD.md).
set -euo pipefail

VERSION="${SINGLEFILE_VERSION:-1.36.0}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${SINGLEFILE_EXTENSION_DIR:-$ROOT/extensions/singlefile-chromium}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

ZIP_URL="https://github.com/gildas-lormeau/SingleFile/releases/download/v${VERSION}/singlefile-extension-source.zip"
echo "==> fetch $ZIP_URL"
curl -sSL --fail "$ZIP_URL" -o "$WORK/sf-src.zip"
unzip -q "$WORK/sf-src.zip" -d "$WORK/src"
(
  cd "$WORK/src"
  if [[ -x ./build-extension.sh ]]; then
    ./build-extension.sh
  else
  npm ci --no-audit --no-fund
  npm run build
  fi
)

rm -rf "$DEST"
mkdir -p "$(dirname "$DEST")"
cp -R "$WORK/src" "$DEST"
echo "==> wrote $DEST (load this directory with capture_archive=extension)"
echo "    set singlefile_extension_path to this path if auto-detect is insufficient"
