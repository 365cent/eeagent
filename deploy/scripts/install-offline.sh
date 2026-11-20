#!/usr/bin/env bash
# Install an EEA offline bundle on a Linux intranet host (OPS-02/OPS-04).
#
# No network and no compiler are used: the bundle ships the Linux site-packages
# tree, so install is "copy files, write env, migrate, start services".
#
# Usage: sudo deploy/scripts/install-offline.sh <bundle-dir> [--version v0.1.0]
set -euo pipefail

BUNDLE="${1:?usage: install-offline.sh <bundle-dir> [--version v0.1.0]}"
VERSION=v0.1.0
if [[ "${2:-}" == "--version" ]]; then VERSION="${3:?}"; fi
BUNDLE="$(cd "$BUNDLE" && pwd)"

PREFIX=/opt/eea
RELEASE="$PREFIX/releases/$VERSION"
DATA=/var/lib/eea
ENV_FILE=/etc/eea/eea-api.env

[[ $EUID -eq 0 ]] || { echo "run as root" >&2; exit 1; }
python3 "$(dirname "$0")/check_offline_bundle.py" "$BUNDLE"

id -u eea >/dev/null 2>&1 || useradd --system --home "$DATA" --shell /usr/sbin/nologin eea

echo "== release $RELEASE =="
mkdir -p "$RELEASE" "$DATA/objects" "$DATA/logs" /etc/eea
cp -R "$BUNDLE/backend" "$BUNDLE/web" "$BUNDLE/runtime" "$BUNDLE/deploy" "$RELEASE/"

echo "== env file =="
if [[ ! -f "$ENV_FILE" ]]; then
  cat > "$ENV_FILE" <<'EOF'
APP_ENV=production
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=eea
DB_USER=eea
DB_PASSWORD=CHANGE_ME_BEFORE_START
OBJECT_DIR=/var/lib/eea/objects
CAPTURE_SERVER_FETCH_ENABLED=false
TRUSTED_PROXY_IPS=127.0.0.1/32
PYTHONPATH=/opt/eea/current/backend/site-packages
FONTS_DIR=/opt/eea/current/runtime/fonts
EOF
  chmod 0640 "$ENV_FILE"
  chown root:eea "$ENV_FILE"
  echo "WROTE $ENV_FILE - set DB_PASSWORD and TRUSTED_PROXY_IPS before starting"
fi
grep -q '^PYTHONPATH=' "$ENV_FILE" || \
  echo "PYTHONPATH=$PREFIX/current/backend/site-packages" >> "$ENV_FILE"

ln -sfn "$RELEASE" "$PREFIX/current"
chown -R eea:eea "$DATA"
chmod -R u+rwX,go-rwx "$DATA/objects"

echo "== services =="
for unit in eea-api eea-web eea-worker eea-maintenance; do
  install -m 0644 "$RELEASE/deploy/$unit.service" /etc/systemd/system/
done
install -m 0644 "$RELEASE/deploy/eea-maintenance.timer" /etc/systemd/system/
systemctl daemon-reload

echo "== migrate =="
set -a; . "$ENV_FILE"; set +a
( cd "$PREFIX/current/backend" && python3 -m alembic upgrade head )

systemctl enable --now eea-api eea-web eea-worker eea-maintenance.timer
echo "installed $VERSION; check: systemctl status eea-api eea-web eea-worker"
