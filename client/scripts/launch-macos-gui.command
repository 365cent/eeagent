#!/usr/bin/env bash
# Double-click in Finder: opens EEA Capture (install app to /Applications if Gatekeeper blocks DMG builds).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/dist/EEA Capture.app"
if [[ ! -d "$APP" ]]; then
  echo "Missing $APP — run: ./scripts/package-macos.sh dev"
  exit 1
fi
osascript <<EOF
tell application "EEA Capture" to activate
EOF
open -n "$APP"
