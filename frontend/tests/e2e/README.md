# Browser smoke tests

Playwright covers the browser paths that matter for acceptance. It reuses the
host Edge/Chrome (no browser download is bundled for the intranet image); set
`EEA_PW_CHANNEL` to `chrome` if Edge is unavailable.

| Command | Scope | Needs |
| --- | --- | --- |
| `pnpm pw:smoke` | trace overview empty/relation state, invalid landing-point link | API :8000, web :3000 |
| `pnpm pw:chain` | seeded signal → theme → demand → function → landing point → standards | API :8000, web :3000, `EEA_PW_SEED_FILE` |
| `pnpm pw:report` | chain report Markdown preview and PDF request | API :8000, web :3000, an eFuse landing point |
| `pnpm pw:demands` | demand workbench drawer opens and loads the five-step record | API :8000, web :3000, a confirmed demand |
| `pnpm pw:roles` | non-admin token issuance denied, body-supplied role rejected, spoofed identity header ignored | API :8000 |
| `pnpm pw:persist` | classification edit persists after reload, stale revision is refused, audit shows old/new with actor and time | API :8000, web :3000 |
| `pnpm pw:degraded` | model-unavailable reason from the API is shown verbatim and a manual classification save still persists (skips when the gateway answers) | API :8000, web :3000 |
| `pnpm pw:async` | document upload keeps its job across a reload and still reaches the result panel; needs `EEA_PW_DOC_ROWS=1` because it writes a document row (no delete route) | API :8000, web :3000 |
| `pnpm pw:history` | strategy page shows the current assessment version plus the older ones as history, with the stored operator and time; skips unless a landing point has two versions, or set `EEA_PW_HISTORY_SEED=1` to finalize a second one (that leaves a version row) | API :8000, web :3000 |
| `pnpm pw:refcodes` | a failed reference-dictionary load shows a retryable error and never claims the signal is missing; retry recovers the page | API :8000, web :3000 |

## Seeding the chain

The chain smoke test asserts on real rows, so seed them first through the public
API. Use an **isolated** dev/test database; the script writes an acceptance
sample, not production data.

```bash
cd backend
uv run python scripts/seed_smoke_chain.py > .seed-chain.json
```

The script confirms a demand point, which requires an admin role. Restart the
dev API with `DEV_OPERATOR_ROLE=taxonomy_admin` for the seed, then restart with
your normal role before running the browser tests.

```powershell
# frontend
$env:EEA_PW_SEED_FILE = "D:\dev\EEA\backend\.seed-chain.json"
pnpm pw:chain
pnpm pw:roles
```

## What is deliberately not asserted

- Linux intranet TLS/proxy behaviour: these tests run on the dev host.
- Real Word seven-figure/eight-insertion acceptance and PDF OCR.
- Full role matrix: only the capture-token, body-role and identity-header paths
  are covered; classification/permission gates still need their own cases.
