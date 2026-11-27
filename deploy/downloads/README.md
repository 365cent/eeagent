# Capture client downloads

The client ships **uncompressed** — there is no zip to unpack. Drop the build in
this directory; the API lists it at `GET /api/v1/capture/client-releases` and
serves it at `GET /api/v1/capture/client-download?platform=windows|macos`
(`nginx` also exposes the directory at `/downloads/`). The import page links
whatever is published here, so a platform with no file shows “暂未发布” instead
of a dead link.

```bash
# Windows (build on Windows, Go >= 1.26)
cd client
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/release.ps1 -Version v0.1.5
cp dist/capture.exe ../deploy/downloads/capture.exe
cp dist/capture.exe.json ../deploy/downloads/capture.exe.json

# macOS (.app + .dmg, must run on a Mac: Fyne needs cgo + the macOS SDK)
cd client
bash scripts/package-macos.sh v0.1.2
cp dist/EEA-Capture-v0.1.2-macOS.dmg ../deploy/downloads/

# Checksums for whatever is published here — each block starts at the repo root.
# Do not copy dist/SHA256SUMS as-is: it also covers the versioned release zip,
# which this page never serves, so sha256sum -c would fail on the missing file.
cd deploy/downloads
sha256sum capture.exe EEA-Capture*.dmg > SHA256SUMS
```

The Windows build is published as plain `capture.exe` (no version in the name,
no archive). A leftover `capture-vX-windows-amd64.exe` is served only when
`capture.exe` is missing, so a stale file cannot shadow the current build.

Because the name carries no version, publish `capture.exe.json` beside it
(`{"version": "v0.1.5", "built_at": "…", "sha256": "…"}`; the release script
writes it). The download page reads it for its 版本 column and shows `—` when
the sidecar is missing — or when its `sha256` no longer matches the exe beside
it, which is what a half-finished publish looks like.

Publish the whole set together. Copying a new `capture.exe` while leaving an
older `capture.exe.json` or `SHA256SUMS` behind is the failure mode to avoid:
the bytes are right, but the page and any checksum run would describe a build
that is no longer there.

The Windows binary alone is enough: its default `capture_archive=auto` uses the
staged SingleFile extension when present and otherwise falls back to the
embedded SingleFile core, so no `data/` folder has to travel with the exe.

macOS still needs a Mac (or a macOS CI runner) to produce the `.dmg`; no macOS
artifact exists in this repository yet.
