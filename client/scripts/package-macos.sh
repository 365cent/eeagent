#!/usr/bin/env bash
# Build EEA Capture as a macOS .app and optional .dmg (run from client/).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION="${1:-dev}"
APP_NAME="EEA Capture"
APP_ID="com.eea.capture"
DIST="$ROOT/dist"
APP="$DIST/${APP_NAME}.app"
MACOS="$APP/Contents/MacOS"
RES="$APP/Contents/Resources"

rm -rf "$APP"
mkdir -p "$MACOS" "$RES"

echo "Building ${APP_NAME} (${VERSION})..."
CGO_ENABLED=1 go build -trimpath \
  -ldflags "-s -w -X main.version=${VERSION}" \
  -o "$MACOS/capture" ./cmd/capture

if [[ ! -f "$ROOT/config.json" ]]; then
  cp "$ROOT/config.example.json" "$RES/config.json"
else
  cp "$ROOT/config.json" "$RES/config.json"
fi
cp "$ROOT/config.example.json" "$RES/config.example.json"

BUNDLED_EXT="$ROOT/data/extensions/singlefile"
if [[ -f "$BUNDLED_EXT/manifest.json" ]]; then
  mkdir -p "$RES/data/extensions"
  rm -rf "$RES/data/extensions/singlefile"
  cp -R "$BUNDLED_EXT" "$RES/data/extensions/singlefile"
  echo "Bundled SingleFile -> Contents/Resources/data/extensions/singlefile"
else
  echo "warning: $BUNDLED_EXT missing — run: go run ./cmd/capture doctor (from client/, with network)" >&2
fi

cat >"$APP/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDevelopmentRegion</key>
  <string>zh_CN</string>
  <key>CFBundleExecutable</key>
  <string>capture</string>
  <key>CFBundleIdentifier</key>
  <string>${APP_ID}</string>
  <key>CFBundleName</key>
  <string>${APP_NAME}</string>
  <key>CFBundleDisplayName</key>
  <string>${APP_NAME}</string>
  <key>LSUIElement</key>
  <false/>
  <key>NSHighResolutionCapable</key>
  <true/>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>${VERSION}</string>
  <key>CFBundleVersion</key>
  <string>${VERSION}</string>
  <key>LSMinimumSystemVersion</key>
  <string>11.0</string>
</dict>
</plist>
EOF

DMG="$DIST/EEA-Capture-${VERSION}-macOS.dmg"
rm -f "$DMG"
hdiutil create -volname "$APP_NAME" -srcfolder "$APP" -ov -format UDZO "$DMG" >/dev/null

echo "App:  $APP"
echo "DMG:  $DMG"
echo "Open: open \"$APP\""
