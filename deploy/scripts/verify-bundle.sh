#!/usr/bin/env bash
# Verify an EEA offline bundle before shipping or installing it (OPS-02).
# The checks themselves live in check_offline_bundle.py so the same logic runs
# during the Linux build and on any host that only has Python.
set -euo pipefail
exec python3 "$(dirname "$0")/check_offline_bundle.py" "$@"
