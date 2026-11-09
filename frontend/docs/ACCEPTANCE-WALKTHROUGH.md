# Frontend acceptance walkthrough (2026-10-29 meeting)

Manual checklist after deploy or local `pnpm dev` + backend API on `:8000`.

## Prerequisites

- Backend: `uv run --directory backend python scripts/dev.py` (do **not** run `bootstrap.py` on cleared DB)
- Frontend: `cd frontend && pnpm dev`
- Optional browser automation: run `ego-browser skill` and follow the guide before scripted UI checks

## Smoke

1. Open `http://127.0.0.1:3000` — overview loads without console errors
2. `curl http://127.0.0.1:8000/healthz` — 200
3. Cleared DB: overview shows **0** signals, empty theme/signals copy (no mock rows when API is up)

## Capture → list → detail

1. Capture client or **新增信号** paste/upload
2. Signal appears in **最新信号** and **证据库**
3. Open evidence detail — archive iframe and/or body text visible

## Edit loop (Phase 1)

1. **编辑标签** → suggestions chips → save → reload persists
2. **指定主题** / **移出主题** on web signal; **自动归集** hidden on document signal
3. Document upload → **保存为信号** → detail with `theme=null` → manual theme assign

## W3 tags and themes

1. Open a signal — **修正** 价值链环节 and 信号类型, save, reload; values persist
2. Expand **修正记录** — row shows 原值, 新值, 人员, 时间
3. Open **标签与主题归纳** — tag chips and theme metrics come from the API (empty copy when the library is empty)
4. **新建主题** creates a row; **查看信号** opens the evidence list filtered by that theme
5. Hover 信号频次 / 来源数 — tooltip states the REQ-DEM-14 counting rules

## 20-signal batch (when sources arrive)

For each of 邱志光’s 20 URLs/files: ingest → tags present → human edit once → theme assign if needed; log failures for client/backend.

## Production build

```bash
cd frontend
pnpm build
pnpm start
```

See [`../../backend/DEPLOY.md`](../../backend/DEPLOY.md) for server paths.
