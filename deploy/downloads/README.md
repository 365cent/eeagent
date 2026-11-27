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
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/release.ps1 -Version v0.1.2
cp dist/capture.exe ../deploy/downloads/capture.exe

# macOS (.app + .dmg, must run on a Mac: Fyne needs cgo + the macOS SDK)
cd client
bash scripts/package-macos.sh v0.1.2
cp dist/EEA-Capture-v0.1.2-macOS.dmg ../deploy/downloads/

# checksums for whatever is published
sha256sum capture.exe EEA-Capture*.dmg > SHA256SUMS
```

The Windows build is published as plain `capture.exe` (no version in the name,
no archive). A leftover `capture-vX-windows-amd64.exe` is served only when
`capture.exe` is missing, so a stale file cannot shadow the current build.

The Windows binary alone is enough: its default `capture_archive=auto` uses the
staged SingleFile extension when present and otherwise falls back to the
embedded SingleFile core, so no `data/` folder has to travel with the exe.

macOS still needs a Mac (or a macOS CI runner) to produce the `.dmg`; no macOS
artifact exists in this repository yet.
