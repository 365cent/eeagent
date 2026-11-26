# Capture client downloads

Publish a release here; nginx serves this directory at `/downloads/` and the
app page `下载采集客户端` links to the files listed in its release table.

```bash
# build on Windows, then copy both files here
client/scripts/release.ps1 -Version v0.1.1
scp client/dist/capture-v0.1.1-windows-amd64.zip deploy/downloads/
scp client/dist/SHA256SUMS deploy/downloads/
```

macOS: the client UI is Fyne-based and needs cgo with the macOS SDK, so the
binary must be built on a Mac (`go build ./cmd/capture`). No macOS artifact is
published yet.
