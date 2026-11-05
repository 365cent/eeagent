# Platform fonts (local)

Place licensed **woff2** files here (no Google Fonts). Expected names:

| File | Use |
|------|-----|
| `AvenirNext-Regular.woff2` | Latin 400 |
| `AvenirNext-Medium.woff2` | Latin 500 |
| `AvenirNext-DemiBold.woff2` | Latin 600 |
| `PingFangSC-Regular.woff2` | Chinese 400 |
| `PingFangSC-Medium.woff2` | Chinese 500 |
| `PingFangSC-Semibold.woff2` | Chinese 600 |

On macOS, `local('PingFang SC')` and `local('Avenir Next')` are used when the OS fonts are installed; woff2 files cover Windows/Linux and offline deploys.

Install from a shared folder (optional):

```powershell
cd frontend
pnpm run fonts:install
```

Set `EEA_PLATFORM_FONTS_DIR` to a directory that already contains the files above.
