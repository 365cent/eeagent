# Third-Party Notices

This repository includes vendored and embedded third-party components. Distribution of release artifacts that contain these components must comply with their respective licenses.

## SingleFile (AGPL-3.0)

- **Location**: `client/internal/singlefile/singlefile.js`
- **Purpose**: In-page HTML archiving for the Windows capture client.
- **Source**: Vendored via `client/scripts/vendor-singlefile.sh` from the upstream SingleFile project.
- **License**: GNU Affero General Public License v3.0 (AGPL-3.0). If you distribute a modified capture client binary that includes this bundle, AGPL obligations apply to that distribution.

## deckpeek (vendored reference)

- **Location**: `backend/vendor/deckpeek/deckpeek.py`
- **Purpose**: PPTX structure preview in document ingest.
- **Notes**: See `backend/vendor/deckpeek/README.md` for source lineage and redistribution constraints from the reference package.

## ReportLab (BSD-like)

- **Location**: Python dependency `reportlab` (see `backend/pyproject.toml` / `uv.lock`)
- **Purpose**: Chain report PDF export with CJK CID fonts.

## Other runtime dependencies

Backend (`uv.lock`), frontend (`pnpm-lock.yaml`), and Go client (`go.sum`) lockfiles list additional open-source dependencies used at build and runtime. Release packages should ship corresponding lockfiles and this notice.
