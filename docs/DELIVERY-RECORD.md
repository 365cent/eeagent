# Delivery Record

This record keeps evidence for implementation slices removed from the remaining-work TODOs. A slice does not close its parent task; acceptance stays open until the subsystem TODO criteria and required platform evidence pass.

## 2026-11-05

### BE-01 — capture idempotency and durable worker slice

- Added request-fingerprint idempotency for capture submissions, bounded upload reads, and a production guard against server-side URL fetching.
- Added the durable `capture_job` table and API, object-backed request payloads, leased PostgreSQL worker, bounded retry/backoff, terminal status, retry, and queued-job cancellation. The synchronous route remains available for compatibility.
- Evidence: [capture API](../backend/app/api/v1/capture.py), [job service](../backend/app/services/capture_jobs.py), [worker entry](../backend/app/worker.py), [job model](../backend/app/models/models.py), [migration 0008](../backend/migrations/versions/0008_capture_jobs.py), [worker service unit](../deploy/eea-worker.service), and [backend TODO acceptance remainder](../backend/TODO.md#be-01-统一采集与可靠任务).
- Checks: Python AST parsing succeeded for nine changed backend Python files. No test suite or database migration was run. Linux worker lifecycle, migration upgrade on an existing database, permissions, authentication, cooperative running-job cancellation, and cleanup remain unverified or incomplete.

### CC-02 — asynchronous capture and durable client queue slice

- The Go client prefers `POST /api/v1/capture/jobs`, uses a stable `submission_id`, polls for a terminal result, resumes an accepted remote job, and retries uncertain submissions with the same key. It honors bounded `Retry-After` delays for retryable responses.
- The local queue stores job metadata in a versioned atomic state file and pending page snapshots in separate files under `queue_dir`. GUI startup restores unfinished work; CLI supports `upload --resume`. Browser credentials are not included in queue state.
- Evidence: [API client](../client/internal/platform/client.go), [queue](../client/internal/queue/queue.go), [persistence store](../client/internal/queue/persistence.go), [CLI](../client/internal/cli/cli.go), [GUI integration](../client/internal/ui/app.go), [configuration](../client/internal/config/config.go), and [client TODO acceptance remainder](../client/TODO.md#cc-02-统一-api-与任务恢复).
- Checks: `gofmt` and `go build ./internal/config ./internal/platform ./internal/queue ./internal/cli` passed on macOS. A subagent reported a Windows/amd64 cross-build of the queue package before GUI integration; this is not a Windows runtime check or a build of the final GUI change. No tests or real browser checks were run. Cross-restart behavior, Windows file permissions, GUI retry/cancel actions, per-job GUI history, and document migration to the async route remain unverified or incomplete.

### DOC-03 — current capture route and worker index slice

- Updated the backend README, project index, and local development docs (now consolidated in root README) to identify the async capture route, migration head, worker entry point, and worker service template.
- Evidence: [project index](PROJECT-INDEX.md), [root README](../README.md), [backend README](../backend/README.md), and [docs TODO acceptance remainder](TODO.md#doc-03-架构数据和接口同步).
- Checks: content and links were reviewed in the workspace; no application test was run. Full architecture, identity, audit, and business-state documentation remains open.

### FE-01 — API-backed overview and technology slice

- The overview and technology views use API query results, show loading/error/empty states, and no longer render the removed hard-coded metrics, technology graph, or sample landing points.
- Evidence: [dashboard workspace](../frontend/views/dashboard/workspace.tsx), [dashboard query loader](../frontend/components/dashboard-client-loader.tsx), and [frontend TODO acceptance remainder](../frontend/TODO.md#fe-01-页面职责与真实数据).
- Checks: no frontend build or browser check is recorded for this slice. Strategy-page behavior, full view separation, and the prescribed local Ant Design/Next.js references remain open.

### OPS-04 — service unit templates

- Added foreground systemd templates for the API, Next.js web process, and durable capture worker, with loopback binding for the web-facing services and external environment/object-directory conventions.
- Evidence: [deployment templates](../deploy/), [deployment guide](../deploy/README.md), and [deployment TODO acceptance remainder](../deploy/TODO.md#ops-04-服务任务与可观测性).
- Checks: templates and command paths were reviewed locally. No Linux service, reverse-proxy, permission, migration, restart, or health-check validation was run.

## 2026-11-09

### BE-03/06/07/08/09 — trusted edits and function publish-gate slice

- Added server-derived operator identity for development/test and production identity headers accepted only from configured trusted proxy addresses. Correction records now keep explicit before/after values with subject, role, and timestamp.
- Demand points are created pending review. Confirmation requires two real retained signals in the selected theme, distinct source URLs, publishers and channels, differing stored technical-tag sets, and at least two distinct perspectives. Only `taxonomy_admin` or `platform_admin` can confirm. The same persisted evidence is rechecked before function or landing-point changes; changing confirmed demand evidence demotes it and revokes downstream publication.
- Demand derivations require five ordered steps, each with content and citations to retained signals in the selected source theme. Pending-review, failed, archived, cross-theme, or missing evidence is rejected; additive migration `0011_demand_derivation_trace` stores the trace.
- Function creation requires five complete forward steps. Publishing requires a same-request forward and reverse confirmation, necessary rationale, a coverage explanation for every listed core need, no uncovered/duplicate/extra need, no unresolved contradiction, a consistent conclusion, human confirmation, a complete card, administrator-managed recommendation/target-domain vocabulary, and a currently valid demand. Edits to published reasoning revoke publication.
- Landing-point PATCH edits name, domain and role with before/after audit. Standard writes require explicit text or `null`; missing cells stay unfilled, `null` marks a reviewed blank. A per-cell PostgreSQL advisory transaction lock serializes concurrent first writes and updates.
- Added additive migrations `0009_audit_before_after`, `0010_fn_card_domains`, and `0011_demand_derivation_trace`; seeded only the five user-confirmed technical-domain terms. The development seed no longer creates synthetic business records. Recommendation levels and vehicle/application target-domain values remain administrator-managed and are not invented.
- Evidence: [identity resolver](../backend/app/core/identity.py), [audit service](../backend/app/services/audit.py), [demand validation](../backend/app/services/demand_validation.py), [demand API](../backend/app/api/v1/demands.py), [function validator](../backend/app/services/function_validation.py), [function API](../backend/app/api/v1/functions.py), [landing-point API](../backend/app/api/v1/landing_points.py), [standards API](../backend/app/api/v1/standards.py), [reference seed](../backend/app/seed.py), [migrations](../backend/migrations/versions/), and [backend TODO remainder](../backend/TODO.md).
- Checks: full macOS backend suite on isolated local PostgreSQL `eea_test`: **285 passed, 1 skipped**. This does not verify the production identity proxy, Linux service behavior, or Windows client.

### FE-05 — demand point workbench slice

- Replaced the read-only/mock demand table with a live workbench on the topics page. It selects real themes and retained signals, requires five evidence-backed derivation steps, separately records cross-validation evidence, preserves original time text including unknown dates, and creates records as pending. Confirmation is a separate server-authorized action; the server checks source, publisher, channel and stored tags.
- Evidence: [demand workbench](../frontend/components/topics/demand-point-workbench.tsx), [topics page](../frontend/components/topics/topics-view.tsx), [API client and types](../frontend/lib/api/eea-api.ts), and [frontend TODO remainder](../frontend/TODO.md#fe-05-需求点工作台).
- Checks: `next build` passed; Ant Design lint passed with zero issues for the workbench and topics page; full backend suite passed **285 tests, 1 skipped**. No browser run was made for this FE-05 slice; the earlier browser smoke check covers FE-06 only. Linux role mapping and real business-sample acceptance remain open.

### CC-02 — macOS queue contract follow-up

- Updated Go test servers to advertise the supported legacy route through OpenAPI before accepting multipart uploads, matching the client’s capability probe and explicit fallback contract.
- Evidence: [platform tests](../client/internal/platform/client_test.go), [queue tests](../client/internal/queue/queue_test.go), and [client TODO remainder](../client/TODO.md#cc-02-统一-api-与任务恢复).
- Checks: Go `1.24.0` on macOS: `go test -short ./internal/archive ./internal/cdp ./internal/capture ./internal/config ./internal/netinfo ./internal/platform ./internal/queue` passed. Windows GUI and real-browser checks remain unverified.

### FE-03 — tag review editor slice

- Signal classification exposes LLM/fallback recommendations for value-chain stage and signal type, plus technology-tag suggestions; the researcher explicitly adopts changes. Technology tags can be chosen from the shared vocabulary or added as open terms. The correction view displays old/new values, actor, and time from the API.
- Evidence: [classification editor](../frontend/components/evidence/signal-classification-editor.tsx), [tag editor](../frontend/components/evidence/signal-tags-editor.tsx), [audit view](../frontend/components/evidence/signal-correction-audit.tsx), and [frontend TODO remainder](../frontend/TODO.md#fe-03-标签分类与复核).
- Checks: scoped Ant Design lint and production frontend build passed; full classification role/quality/real-gateway acceptance remains open.

### FE-06 — function derivation editor slice

- TechnologyView uses persisted demands/functions and vocabulary. It provides the five-step derivation, reverse necessity and need-coverage checklist, contradiction/conclusion confirmation, recommendation level, multi-select L0–L5, target domain, recommendation reason, and L2/L4 differences. Drafts save separately; publication submits fresh forward/reverse checks together and surfaces server errors. The coverage rows synchronize from the forward core-needs list.
- Evidence: [function editor](../frontend/components/technology/function-derivation-editor.tsx), [TechnologyView integration](../frontend/views/dashboard/workspace.tsx), [API client/types](../frontend/lib/api/eea-api.ts), and [frontend TODO remainder](../frontend/TODO.md#fe-06-车辆功能与双向验证).
- Checks: `next build` passed; scoped Ant Design lint passed for the editor and workspace; backend function tests passed (21) including missing-step, reverse inconsistency, incomplete coverage, and publish-gate cases. The full backend suite passed **276 tests, 1 skipped**. Ego-browser on macOS verified the live empty state and API-backed technology page, blocked an empty five-step save without creating a function, and saved a completed five-step draft with `published=false`. Temporary records were removed from `eea_test`; its demand/function/audit tables were verified empty afterward. This smoke check does not cover full eFuse acceptance or publication, because real recommendation-level and target-domain vocabulary has not been provided.

### FE-07/08 — landing-point and standards grid slice

- Added a live landing-point workbench backed by the functions, landing-points, standards, and domain-vocabulary APIs. It supports viewing/editing points, creates only under published functions, and lets an operator select an existing domain or enter a new one that the server adds to the shared vocabulary.
- Added the 3×3 design/manufacturing/operations grid. Missing rows, `NULL` explicit blanks, and text remain distinct. Saves require an explicit choice, check for concurrent edits before overwriting, and refresh landing-point counts, panorama, vocabulary and trace queries. The technology panorama now renders API-backed associations and no sample graph.
- Evidence: [landing-point workbench](../frontend/components/technology/landing-point-workbench.tsx), [technology view](../frontend/views/dashboard/workspace.tsx), [API client and types](../frontend/lib/api/eea-api.ts), [landing-point API](../backend/app/api/v1/landing_points.py), [standards API](../backend/app/api/v1/standards.py), and [frontend TODO remainder](../frontend/TODO.md#fe-07-技术全景与落脚点).
- Checks: macOS `next build`, `tsc --noEmit`, and scoped Ant Design lint passed. Browser verification against the local API showed the five confirmed domains, landing-point create/view, a user-entered domain persisted to the shared vocabulary, and the missing/NULL/text cell states. A reload retained the new point in the API-backed panorama. Temporary synthetic records were removed from isolated `eea_test`; signal, demand, function, landing-point, and standard counts are zero, with only the five confirmed domain terms restored. The full backend suite passed **285 tests, 1 skipped** on isolated `eea_test`, including landing-point PATCH and standard-cell serialization cases. Reopening the grid after reload, audit walk-through, real eFuse acceptance, trace-page review, Linux, and Windows checks remain open.

### FE-12 — production same-origin API routing slice

- The browser now uses `/api/v1` through the current origin in production. Local Next development continues to call the API on port 8000; `NEXT_PUBLIC_EEA_API_BASE` remains an explicit override.
- Evidence: [API base config](../frontend/lib/api/config.ts) and [frontend TODO remainder](../frontend/TODO.md#fe-12-前端验收与-linux-接入).
- Checks: included in the successful production frontend build. TLS and reverse-proxy routing remain unverified on Linux.

### DOC-03 — migration and identity documentation sync

- Updated current Alembic head references to `0011`, documented the Mac `eea_test` procedure and local reviewer role, removed the incorrect claim that an IP address is a user identity, and removed the synthetic eFuse chain from the local seed. A test confirms repeat-safe vocabulary seeding without synthetic business records.
- Evidence: [backend README](../backend/README.md), [root README](../README.md), [root TODO](../TODO.md), and subsystem TODOs.
- Checks: local content and migration-head references reviewed. No Linux documentation validation was run.

### DOC-02 — external input register slice

- Added a source-aware register for the user-provided workflow image, original project documents, business sample sets, skills, vocabularies, Tier1 strategy input, methodology text, collector extension, Linux infrastructure, and production responsibilities. Unknown providers, dates, versions, and license terms remain explicitly unrecorded.
- Evidence: [input register](INPUT-REGISTER.md), [Docs TODO](TODO.md#doc-02-业务与环境输入), and [project index](PROJECT-INDEX.md).
- Checks: local Markdown links passed a five-file check and the register was compared with DOC-02 requirements. No external input was requested or fabricated; DOC-02 remains open until named owners and actual source materials are registered.

### BE-10 / FE-09 / DOC-05 — strategic funnel and acceptance-record slices

- BE-10 adds the persisted four-step strategy draft and append-only assessment snapshots. The API gates industry-scan and Tier1 adaptation, exits rejected candidates without scores, requires five integer scores with rationales, calculates the total on the server, requires an explicit strategy class, and records edits with actor/time and old/new values. The legacy assessment endpoint uses the same gate. Migration `0012_strategy_funnel` is additive.
- FE-09 replaces the strategy demo with the API-backed four-step workbench and version timeline. An earlier final assessment stays visible as a prior version marked for review when the current draft has changed.
- DOC-05 now links a reusable blank acceptance-run record template. It distinguishes Mac checks from Linux, Windows, and real-business evidence; copies begin as “未运行”.
- Evidence: [strategy funnel service](../backend/app/services/strategy_funnel.py), [migration 0012](../backend/migrations/versions/0012_strategic_funnel.py), [strategy workbench](../frontend/components/strategy/strategy-funnel-workbench.tsx), [acceptance template](ACCEPTANCE-EXECUTION-RECORD-TEMPLATE.md), and [remaining acceptance criteria](../backend/TODO.md#be-10-战略四步漏斗), [frontend TODO](../frontend/TODO.md#fe-09-战略四步与改判), and [docs TODO](TODO.md#doc-05-验收执行与缺陷记录).
- Checks: macOS isolated `eea_test` backend focus tests **23 passed** and full backend suite **291 passed, 1 skipped**; migration `0012` was applied to that isolated database. Frontend `next build` passed; scoped Ant Design lint for the workbench and workspace reported zero issues; scoped diff check and Python `compileall` passed. The docs template link/marker checks passed.
- Remaining: the later BE-11 check covered live database counts and the empty strategy page. A populated walkthrough of edits, rejection and finalization is still pending. Real Tier1/score rationale and eFuse acceptance inputs are outstanding, as are Linux and production identity checks. This is an implementation slice, not full BE-10/FE-09/DOC-05 acceptance.

### BE-11 / FE-01 / FE-10 — real overview and trace slice

- `/overview` now returns database-backed counts for distinct normalized source URLs, exact signal states, open/failed capture jobs, failed document ingestion, substantive standards, and UTC-week additions. Four strategy-stage counts are exclusive by each landing point's current persisted funnel state; step four includes draft-finalization-ready and completed items.
- The landing-point trace includes the present/missing stages, unresolved evidence/document references, theme membership and demand-evidence relationships, persisted archive/body/document references, demand/function review state, and all assessment versions. Archived signal status comes from `evidence_status_code='archived'`.
- The overview and signal screens show source/status/week/failure counts with their count definitions. The trace screen links to a selected landing-point deep link and presents the five-step demand basis, function forward/reverse records, nine deployment-standard cells, evidence, document figure count and strategy history.
- Basis freshness is returned as `unknown_untracked`: DemandPoint has no review timestamp baseline. The UI states that limitation instead of deriving freshness from creation dates. Object-key presence does not prove storage readability; the linked endpoints remain the check.
- Evidence: [overview API](../backend/app/api/v1/overview.py), [trace API](../backend/app/api/v1/trace.py), [trace tests](../backend/tests/test_trace_audit_overview.py), [trace view](../frontend/views/dashboard/workspace.tsx), and [remaining acceptance criteria](../backend/TODO.md#be-11-追溯与真实总览), [FE-01](../frontend/TODO.md#fe-01-页面职责与真实数据), and [FE-10](../frontend/TODO.md#fe-10-全链追溯与导出).
- Checks: macOS isolated `eea_test` trace/overview tests **20 passed**; frontend `next build`, `tsc --noEmit`, and scoped Ant Design lint for the workspace passed. The integrated backend run on the dedicated Mac database passed **300 tests, 1 skipped**. With the local API, the Mac browser displayed the UTC week, pending/failed task totals, all strategy stage counts, the empty trace list and a warning for a missing landing point after reload. The warning action is now labelled “重新选择落脚点”. The previous browser session was unavailable on resuming the action check. A populated trace, valid-ID refresh, source navigation, storage reads and target-platform acceptance remain open.

### BE-03 / BE-05 / FE-03 / FE-04 — batch 2 signal edit guards slice

- Tag suggestions respect `eea_correction_audit` (`protected_fields`, `degraded_reason`). Mutations accept `expected_updated_at` → **409** when stale. Theme overlap preview + stricter auto-aggregate guards. MaaS embedding/rerank client + config placeholders. Frontend editors send `updated_at` and refetch on conflict.
- Evidence: [tagging_guard.py](../backend/app/services/tagging_guard.py), [signals.py](../backend/app/api/v1/signals.py), [semantic_api.py](../backend/app/services/semantic_api.py), evidence UI under `frontend/components/evidence/`.
- Checks: macOS `eea_test` full backend suite **314 passed, 1 skipped**; frontend `next build` passed. BE-04 pipeline integration, OPS-03 gates, and DOC-04 business evidence remain open.

### BE-01 / FE-02 / CC-02 — durable document and HTML ingest slice

- Backend worker already handled non-HTML `capture/jobs` payloads; added [`test_capture_jobs.py`](../backend/tests/test_capture_jobs.py) for async document/HTML jobs, submission idempotency, cancel, manual retry, and no duplicate signals.
- Frontend import sends all file drops (HTML and Office/PDF) to `POST /api/v1/capture/jobs` with stable `submission_id`, polls terminal status, resumes via `sessionStorage`, and auto-opens the derived signal on success. Paste-only fallback unchanged.
- Go `SubmitFileJob` uploads documents through the same durable API; queue `KindFile` jobs now persist `submission_id`, record the final signal id, and keep resume/retry parity with page capture.
- `POST /documents/raw` remains for legacy callers; new UI and file queue default to jobs.
- Evidence: [capture jobs tests](../backend/tests/test_capture_jobs.py), [import UI](../frontend/components/import/new-signal-import.tsx), [capture job API](../frontend/lib/api/eea-api.ts), [session helper](../frontend/lib/capture-job-session.ts), [SubmitFileJob](../client/internal/platform/client.go), [queue KindFile](../client/internal/queue/queue.go).
- Checks: macOS isolated `eea_test` full backend suite **307 passed, 1 skipped**; frontend `next build` passed; Go `go test -short ./internal/platform ./internal/queue` passed. Ant Design lint via `./node_modules/.bin/antd lint` on changed frontend files passed (pnpm launcher still broken on this Mac). Local UI async ingest still requires `uv run python -m app.worker` beside the API. No live browser refresh/resume check, Windows GUI, or Linux worker lifecycle evidence in this slice. Parent tasks BE-01/FE-02/CC-02 remain open per subsystem acceptance.

### CC-02 / CC-04 — collector recovery checks

- The Windows task view lists individual items, opens their signals, retries eligible failures with their original identity, and cancels queued items before the first attempt. Manual WeChat recovery preserves the original URL and submits pasted text for review. Windows runtime acceptance remains open.
- The collector subagent stopped before verification. On review, two identical declarations of the recovered-job cancellation test prevented compilation of the queue tests. Removed the duplicate and retained the test case.
- On macOS with Go 1.24.0, the portable package checks documented in [README.md](../README.md) passed with the test cache disabled. The Windows/amd64 build of `./cmd/capture` also succeeded. Windows GUI, real Edge/Chrome capture, multi-file recovery across application restart and package installation still need a Windows run.
- The frontend production build using the installed Next executable and scoped Ant Design lint passed after clarifying the trace recovery action label. The pnpm launcher failed to locate its cached 12.3.4 entry point during the earlier build attempt.
- Implementation and remaining work are in the [queue](../client/internal/queue/queue.go), [queue tests](../client/internal/queue/queue_test.go), [Windows UI](../client/internal/ui/app.go) and [client TODO](../client/TODO.md#cc-04-gui-和人工恢复).

## 2026-11-12

### Release readiness wave 0 — foundation migration and CI (partial)

- Migration [0016_release_foundation](../backend/migrations/versions/0016_release_foundation.py): capture `owner_subject` and cooperative `cancel_requested_at`; signal list date fields; demand confirm timestamps; audit provenance columns; `eea_embedding_cache`, `eea_signal_source`, `eea_stored_object_orphan`, `eea_chain_report`.
- BE-01/03/06/07/08/15 stubs: capture identity and orphan tracking, cooperative cancel hook, `X-Total-Count` + tag filter, demand `confirmed_at`, function stale-save **409**, panorama substantive standard counts, chain report Markdown API (`POST/GET /api/v1/reports`, PDF **501**).
- Test harness: default `EEA_PYTEST_LOCK=takeover` so stale `.pg/eea_test_suite.lock` does not block disposable `eea_test` runs; slice runner documented in [pytest_slices.sh](../backend/scripts/pytest_slices.sh).
- Added [.github/workflows/ci.yml](../.github/workflows/ci.yml) (backend slices + frontend build/lint + Go `-short`).
- Checks (macOS, branch `release/readiness-wave0`): `pytest_slices.sh contracts` **1 passed**; `unit` **66 passed**; `capture` **33 passed** (~7.5 min); OpenAPI snapshot **1 passed** after reports router. Full `integration` slice re-run in progress this session. Linux Actions postgres matrix and wave 2–5 UI/client/deploy acceptance remain open.

### Release readiness wave 1 — backend BE-01…05 / BE-17 slice

- **BE-01:** Cooperative cancel on running capture jobs (heartbeat + pre-processing gate); `cancel_requested_at` on `CaptureJobOut`; production URL-only rejection test; [`orphan_maintenance`](../backend/app/services/orphan_maintenance.py) CLI retained.
- **BE-02:** `event_date_text` / `event_date_precision` derived on ingest via [`event_dates.py`](../backend/app/domains/evidence/event_dates.py); exposed on `SignalBase`.
- **BE-04:** DB-backed embedding cache wired into optional `create_embeddings(..., db=)`; tag-suggestions `details` populated.
- **BE-05:** Structured aggregation consistency gates in [`judgment.py`](../backend/app/services/judgment.py) + [`theme_match.py`](../backend/app/domains/evidence/theme_match.py); migration **0017** theme `source_count`; signal sources API; offline [`theme_clustering.py`](../backend/app/services/theme_clustering.py) report CLI.
- **BE-17:** Demand serialization remains in domains; import-linter contracts kept.
- Tests: production URL-only guard and event-date fields in [`test_capture_unified.py`](../backend/tests/test_capture_unified.py); cooperative running-job cancel in [`test_capture_jobs.py`](../backend/tests/test_capture_jobs.py).
- Checks (macOS, branch `release/readiness-wave0`, this session): `contracts` **kept**; `unit` **65 passed**; `capture` **33 passed**; `openapi` **1 passed**; full `integration` slice running (`/tmp/eea-integration-wave1.log`). DOC-02 golden fixtures, OPS-03 production identity, and Linux worker lifecycle remain open for strict BE acceptance.

### Release readiness wave 2 — trace freshness, documents, skills, reports

- **BE-11:** `compute_basis_freshness` compares `DemandPoint.confirmed_at` to theme/evidence `Signal.updated_at` and blob readability (`fresh` / `stale` / `unconfirmed` / `unknown_untracked`).
- **BE-12:** `GET/POST /api/v1/documents/{id}/figures` and `GET/POST …/keywords` (chunk index + tagging pipeline).
- **BE-13:** `python -m app.services.skill_eval` fixture runner; existing `skills.py` declarative loader unchanged.
- **BE-15:** Fixed chain report Markdown render (`build_signal_trace_markdown` tuple unpack); `test_chain_reports.py`.
- OpenAPI snapshot adds document figure/keyword routes.
- Checks (macOS): `unit` **65 passed**; `contracts` **kept**; `test_chain_reports` + trace freshness cases **3 passed** (isolated `eea_test`).

### Public release v0.1.0 — engineering closure slice (2026-11-12)

- **BE-15**: Chain reports export deterministic Markdown + ReportLab PDF (`STSong-Light` CID); expanded landing-point sections (需求五步、交叉验证、功能正反向、九宫格、战略版本).
- **BE-14**: `GET /api/v1/agent/sessions/{id}/messages|patches`, `GET /api/v1/agent/skills/status`.
- **BE-01/OPS-03**: Capture job `claim|client-*|retry` routes use `get_capture_identity` + owner access checks.
- **CC-03/CC-07**: Client `ca_cert_path`, bearer token via env/file, HTTPS/non-loopback disables LAN `auto_api`; `platform` split into `probe.go`, `documents.go`, `factory.go`.
- **FE-10/11/12**: PDF chain report download; multi-session agent UI with patches/memories + legacy fallback; hide unconfigured LaunchDarkly banner; remove `@vercel/analytics`.
- **Repo**: Apache-2.0 `LICENSE`, `THIRD_PARTY_NOTICES.md`; removed meetings PDF bundle and enterprise UI screenshot study from public tree (retained `docs/reference/*.docx`, `docs/wbs/*.xlsx`).
- Checks (macOS): `test_chain_reports` **3 passed**; `test_agent_workflow::test_session_messages_and_skills_status` passed; `go test -short ./internal/config ./internal/platform` passed; `pnpm typecheck` + `pnpm build` passed. Linux OPS-06 / Windows CC-06 sign-off remain open.
- CI (GitHub `main` @ `c662098`): `deploy-compose` **failed** on `docker compose config` because `deploy/.env` was missing before validate (fixed in follow-up: copy `.env.compose.example` before config).

### Release recheck — v0.1.0 post-public (2026-11-12)

- **FE-11**: Evidence assistant wires SSE replay (`agent-events.ts`), run cancel API, and `sessionStorage` session persistence per signal; still no Playwright E2E or in-run live token stream (backend buffers SSE until turn commit).
- **CI**: `deploy-compose` copies `deploy/.env.compose.example` → `.env` before `docker compose config` + build; validate/build run with `working-directory: deploy`.
- **Docs**: `platform-implementation-plan.md` no longer links removed `enterprise-ui-study.md`.
- Checks (macOS, this recheck): `contracts` **1 passed**; `unit` **65 passed**; `pnpm typecheck` **passed**; `integration` slice **`341 passed, 1 skipped`** (`pytest -m db`, ~77 min, exclusive `eea_test`, 2026-11-12).

### Release readiness wave 4 — Docker Compose Linux deploy (OPS-01/04/05 partial)

- [`deploy/docker-compose.yml`](../deploy/docker-compose.yml): PostgreSQL, migrate, API, worker, Next.js, Nginx; shared `objectstore` volume.
- Images: [`deploy/Dockerfile.backend`](../deploy/Dockerfile.backend), [`deploy/Dockerfile.frontend`](../deploy/Dockerfile.frontend); [`deploy/nginx/eea-intranet.conf`](../deploy/nginx/eea-intranet.conf).
- Ops scripts: `compose-up.sh`, `compose-migrate.sh`, `backup-eea.sh`, `restore-eea.sh`.
- `/readyz` adds `semantic_gateway` degraded when LLM/MaaS unset; DB/object failures still 503.
- CI job `deploy-compose`: `docker compose config` + `build` on Ubuntu.
- Checks: `docker compose config` (local when Docker available). OPS-06 physical host sign-off still open.

### Release readiness wave 3 — frontend FE-02/03/10/11/12 slice

- **FE-10:** 链路报告页 [`chain-report-view.tsx`](../frontend/views/utility/chain-report-view.tsx) 接入 `POST/GET /api/v1/reports` 与 Markdown 下载预览；追溯工作台展示 `basis_freshness` 标签（[`basis-freshness.ts`](../frontend/lib/basis-freshness.ts)）。
- **FE-02/03:** 信号列表读取 `X-Total-Count` 服务端分页、技术标签 `tag` 筛选；标签建议展示 `TagSuggestion.details` 折叠面板。
- **FE-11（局部）:** 文档入库结果支持图块索引与章节关键词读取/重算（BE-12 API）。
- **FE-12:** 新增 `pnpm typecheck`；`pnpm build` + `tsc --noEmit` 通过（macOS）。
- 待续：Playwright E2E、FE-13 大规模 view 拆分；Agent UI 已接 SSE 重放与取消 API（非流式 token）。

## 2026-11-11

### BE-14 — Pydantic AI durable agent workflow (backend)

- Single orchestration path via **Pydantic AI 2.63** (`app.services.agent_workflow.build_eea_agent`): typed `AgentDeps`, `AgentTurn`, seven registered tools, `DeferredToolRequests` for `apply_confirmed_patch`, citation ledger validation, and `ModelMessagesTypeAdapter` persistence on `eea_agent_session.model_messages_json`.
- HTTP: `POST/GET /api/v1/agent/sessions`, messages, SSE (`Last-Event-ID`), run cancel, patch confirm/reject, memories — all gated by `get_operator_identity` (no caller `user_id`/`role`). Legacy `POST /api/v1/signals/{id}/assistant/messages` unchanged.
- Migration [0013_agent_workflow](../backend/migrations/versions/0013_agent_workflow.py): sessions, runs, messages, SSE events, deferred patches, memory, document chunks/figures for RAG citations.
- Dynamic instructions: `agent_instructions.build_instruction_addon` (project, page context, operator memory) injected per run; SSE events buffered until turn completion to avoid mid-run session corruption.
- `draft_trace_report` traverses signal → theme → demand → function → landing → standards/assessment via [agent_trace.py](../backend/app/services/agent_trace.py).
- Evidence: [agent API](../backend/app/api/v1/agent.py), [runtime](../backend/app/services/agent_runtime.py), [patches](../backend/app/services/agent_patches.py), [tests/test_agent_workflow.py](../backend/tests/test_agent_workflow.py), [tests/test_pydantic_ai_wiring.py](../backend/tests/test_pydantic_ai_wiring.py).
- Checks (macOS, isolated PostgreSQL `eea_test`): `uv run pytest -q tests/test_agent_workflow.py tests/test_pydantic_ai_wiring.py` → **18 passed** (includes AT-AGT smoke: SSE replay, patch propose/confirm/duplicate/stale/expired/reject, session message JSON persistence, two-actor isolation, gateway unconfigured path). Optional live: `EEA_LLM_INTEGRATION=1 … test_agent_live.py`. Full backend suite not re-signed in this slice when concurrent long pytest jobs were holding the test DB. FE-11 UI, OPS-03 production identity, and Linux gateway SLO remain open.

### LaunchDarkly — WBS 七环节能力进度标记（workflow flags）

- Marked the four workflow flags that map to the six platform capabilities under review (环节一/四/五/六): Chinese descriptions, capability tags (`cap-*`), `impl-partial` / `wbs-workflow`, and custom properties `eea-capability-status=partial`, `eea-acceptance=open`, `eea-wbs-ref` (BE/REQ ids).
- Flags (project **default**, targeting still off; code `variation_bool(..., default=True)` unchanged): [evidence-capture](https://app.launchdarkly.com/default/test/features/evidence-capture), [demand-function-mapping](https://app.launchdarkly.com/default/test/features/demand-function-mapping), [technology-decomposition](https://app.launchdarkly.com/default/test/features/technology-decomposition), [deployment-standards](https://app.launchdarkly.com/default/test/features/deployment-standards).
- Implementation cross-check (no code change in this slice): server gates in [function_validation.py](../backend/app/services/function_validation.py) + [functions.py](../backend/app/api/v1/functions.py) (五步保存/发布、功能卡); [landing_points.py](../backend/app/api/v1/landing_points.py) (五域落脚点); [standards.py](../backend/app/api/v1/standards.py) (九宫格 NULL 留空); document ingest under BE-01/BE-12. Subsystem TODO BE-07/08/09/01 and eFuse/黄金集 acceptance remain open.
- Checks: LaunchDarkly `update-flag` succeeded for the four flags above. Scoped integration re-run (`test_functions.py`, `test_standards.py`, `test_landing_points.py`) was **not** signed here: multiple concurrent local pytest jobs held `eea_test` / `.pg/eea_test_suite.lock`; prior delivery slices already recorded green function/standards/landing tests when the DB was exclusive.
