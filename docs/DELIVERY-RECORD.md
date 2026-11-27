# Delivery Record

This record keeps evidence for implementation slices removed from the remaining-work TODOs. A slice does not close its parent task; acceptance stays open until the subsystem TODO criteria and required platform evidence pass.

## 2026-11-27

### Local backup/restore drill (OPS-05 evidence)

- On the Windows portable PostgreSQL (not production): `probe_migrations.py` re-ran clean (fresh upgrade to 0027; downgrade -3 and upgrade with a row surviving; upgrade from 0022 with data surviving).
- Created `eea_ops_drill` (migrate + `app.seed` + one signal), `pg_dump -Fc` produced 75,943 B (sha256 `a1e87940...`), restored it into `eea_ops_restore`, and asserted the Alembic revision, signal count, ref-code count and the drill row. Both databases and the dump were removed.
- End-to-end restore: on scratch DB/object dirs, an isolated API created an HTML signal (body 301 B, snapshot 550 B); `pg_dump -Fc` (76,865 B, sha256 `57610652...`) plus a copy of the object directory into a new database/directory. A second isolated API returned byte-identical body/snapshot with the same object keys and `body_sha256`. All scratch databases and directories were removed.
- Not exercised: the in-container Docker volume path (the same tar/extract was exercised outside Docker), encryption, off-site retention and RPO/RTO; those stay with OPS-05 in pre-production.
- Object side: `tar -czf` of `backend/.pg/objects` (784 files, 1.47 GB) produced a 785,301,982 B archive (sha256 `a3aa7be1...`); extracting it reproduced all 784 file hashes. The archive was removed afterwards.

### Edge 158 blocks the staged SingleFile extension; auto mode now falls back (CC-06 slice)

- Repro: packaged v0.1.1 with `capture_archive=extension` on Edge `158.0.4370.33` waits 45 s for the SingleFile extension target and fails with "SingleFile extension did not load"; the same page succeeds with `embedded` (example.com, 5 KB, signal `e8e114d3...`, archived and deleted afterwards).
- Fix: `auto` now falls back to the injected core when the extension fails to load (previously it fell back only when staging failed); explicit `extension` still fails, but the message points at `auto`/`embedded`. `config.example.json` defaults to `auto` and the README table matches.
- Evidence: `go test ./internal/capture ./internal/application ./internal/config` -> 3 ok (capture 130.7 s).
- Runtime check: a temp CLI built from the same source (`CGO_ENABLED=0`, no Fyne) with `capture_archive=auto` fell back after the extension load failure and uploaded example.com (5 KB, signal 91684da6..., archived and deleted). The packaged v0.1.1 still predates the fix. A Windows build runner must repackage before the browser re-check; the local dist config stays `embedded` so the current binary keeps working.
- Windows GUI build: w64devkit 2.11 (GCC 16.2) was installed locally and `CGO_ENABLED=1 go build ./cmd/capture` succeeded. A `v0.1.2-dev` GUI binary with `capture_archive=auto` fell back from the blocked extension and uploaded example.com (5 KB, signal `4bef8097...`, archived and deleted).
- `scripts/release.ps1 -Version v0.1.2` produced `capture-v0.1.2-windows-amd64.zip` (5,116,519 B) and `capture.exe`; `SHA256SUMS` verifies (exe `f8bd3e52...`, zip `966c9e3a...`) and `capture.exe version` reports `capture v0.1.2`. The artifact stays in the local dist; publishing it to the download page/server is OPS.
- Deploy staging: `deploy/downloads/capture.exe` now carries the fixed v0.1.2 build (`f8bd3e52...`) with `SHA256SUMS` updated; the dev API's `/api/v1/capture/client-releases` reports the same hash. The intranet host keeps serving the previous build until an OPS deploy.

### Skipped Playwright cases run against an isolated API (FE-12 / BE-16 evidence)

- New `frontend/tests/e2e/api-origin.ts` exports `divertApiOrigin(page, origin)`: when `EEA_PW_API_ORIGIN` is set, page `/api/v1/**` requests are re-pointed with `route.continue({url})`, so streamed multipart uploads keep their body. `pw:chain`, `pw:async` and `pw:history` call it; `EEA_API_URL` still drives the request fixture.
- Scratch database `eea_pw_history`: `alembic upgrade head`, then `DB_NAME=eea_pw_history python -m app.seed` for the closed vocabularies and the five domains, then `seed_smoke_chain.py` against an isolated API on :8001. Without the seed step `/panorama` returns no stages and the chain smoke cannot find a landing point.
- Results: `pnpm pw:chain` **2 passed** (27.6 s); `pnpm pw:async` with `EEA_PW_DOC_ROWS=1` **1 passed** (21.9 s); `pnpm pw:history` **1 passed** (20.4 s) with v1 20, v2 20 as history and v3 21 current. These are the four cases the earlier 8-worker run skipped.
- Cleanup: API :8001 stopped and `eea_pw_history` dropped; the dev database was not written. The first helper version used `route.fetch` and the multipart upload came back 422 with an empty file part; `route.continue` fixed it.

### Capture client build, upgrade and real upload check (CC-06 slice)

- `dist/capture.exe` had drifted from the v0.1.1 archive; it was replaced with the archive's copy, and both `capture.exe` (`4b81940c…b2084ee`) and `capture-v0.1.1-windows-amd64.zip` (`38ff97c4…bf818`) now match `SHA256SUMS`. `dist` is gitignored, so the repo diff is documentation only.
- `capture.exe doctor` on this Windows host: `backend ok`, `capture ok`, `auth ok (local-development-user, researcher)`, Edge found, SingleFile extension present; `version` returned `capture v0.1.1`.
- Upgrade/rollback simulation in a temp directory (v0.1.0 -> v0.1.1 -> v0.1.0) kept a marker `config.json` and `data/capture-queue/pending.json`; the binary reported v0.1.1 after the upgrade and v0.1.0 after the rollback. The v0.1.1 archive has 191 entries and contains only `config.example.json` - no user config, browser profile or queue.
- Real packaged-client upload (not a stub): `capture.exe upload -html ... -html-url https://example.com/eea-client-check` returned `ok 6e716479-b77c-41e1-ac1d-78b0f46fe20b 825B`; `GET /api/v1/signals/<id>` returned the title, source URL, excerpt, body/snapshot object keys and `retained` status, which also proves the moved capture worker still serves the shipped client. The sample was archived and deleted afterwards (DELETE 204, then 404).
- Remaining: clean business-machine install and the 10-web/5-WeChat real-material runs need DOC-02 material and OPS-06 sign-off; this slice closes no parent task.


### Detail page no longer reports a failed dictionary as a missing signal (FE-12 slice)

- Symptom: during an 8-worker Playwright run, `/singal/<id>` showed “信号不存在 / 请从证据库打开有效信号” for rows that existed and the classification drawer never appeared; `report-smoke` also waited out its 10 s bound while the generation request was still in flight.
- Root cause: `useSignalDetail` enabled the detail request only after `GET /api/v1/ref-codes` succeeded. With the dictionary failing or still retrying, the detail query stayed disabled, so both `isLoading` and `isError` were false and the page fell through to the “missing signal” branch. That branch was unreachable for a real 404 (which sets `isError`), so its copy was wrong in every case it could show. The trigger was a transient platform event: a backend reload and Next recompilation landed mid-run while another slice was being saved.
- Fix: the hook returns `codesPending` / `codesError` / `retryCodes`; the page shows a spinner while the dictionary loads and a retryable “基础字典加载失败” state when it fails, keeping the real 404 under “无法加载信号”. The dictionary query now retries three times with capped backoff (1 s / 2 s / 4 s), so a backend restart or proxy hiccup recovers without a manual reload.
- Regression case `pnpm pw:refcodes` (`frontend/tests/e2e/ref-codes-recovery.spec.ts`): blocks `/api/v1/ref-codes` with 503, asserts the retryable error and the absence of “信号不存在”, then lets the request through and asserts the drawer appears after clicking 重试. The scratch signal is archived and deleted in `finally`.
- Also hardened two browser waits that assumed a 10 s server turnaround (`report-smoke` generation/PDF, `degraded-suggestions` and `persistent-edit` editor visibility after a reload).
- Evidence (2026-11-27, Windows dev host, dev API :8000 + Next :3000 + portable PostgreSQL): `pnpm typecheck` exit 0; `pnpm pw:refcodes` 1 passed (12.1 s); the three cases that failed in the 8-worker run pass serially (3 passed, 52.6 s); full `pnpm exec playwright test` with eight workers: **10 passed, 4 skipped, 0 failed** (36.6 s). The skips are the documented opt-in seeds: `async-task` (`EEA_PW_DOC_ROWS`), two `chain-smoke` cases (`EEA_PW_SEED_FILE`), `history-versions` (needs two assessment versions).
- Dev data after the runs: 65 signals, no `PW %` rows, eFuse landing point still on assessment v1 (score_total 20, score_moat 3).
- Remaining: Linux intranet TLS/same-origin/SSE figures stay with OPS-06; this slice closes no parent task.

### Rejected funnel branch and re-judgment (FE-09 slice)

- New `pnpm pw:rejudge` (`frontend/tests/e2e/strategy-rejudge.spec.ts`) walks the real strategy page: step 1 scan → step 2 reject → steps 3/4 show only the filtered notice with no score inputs → switch to pass → 4/4/3/4/5 shows 20/25 → classify and finalize v1 → `修改` on step 3 raises moat 3→4 → “上次已生成版本，当前依据待复核” and v1 “最近定稿 · 待复核” → re-enter classification → finalize v2 → v2 当前版本, v1 历史. The API history then returns [1, 2], v1 total 20, v2 total 21, exactly one current.
- Opt-in: needs `EEA_PW_REJUDGE_LP=<landing point id|name>` naming an unscanned, pool-eligible landing point. The flow writes funnel, audit and assessment rows and there is no delete route, so the case skips without the flag; the README says so.
- Run note: a parallel run had pointed the shared dev API on :8000 at a scratch database, so the browser flow was verified against an isolated API on :8001 serving `eea`, with the normal web app on :3000 and an uncommitted route shim. Evidence: 1 passed (13.7 s); `pnpm typecheck` exit 0.
- The dev database was restored afterwards: cabin landing point back to `industry_scan` with no versions and only its original `created` audit; eFuse untouched (v1, 20/25, current); 65 signals.
- Remaining: the 4/4/3/4/5 figures still need real business-material review, and Linux acceptance stays with OPS-06.

### Document research deep link, counts and figure focus (FE-11 slice)

- New `pnpm pw:research` (`frontend/tests/e2e/document-research.spec.ts`): picks a real document signal, opens 文档研究, and asserts the toolbar counts equal the server payload, the default section renders chunk text, 定位图块 writes `doc_figure` and the stored image actually decodes (`naturalWidth > 0`), a needs-review figure is labelled 待复核, a reload keeps the same figure focused, and a sectioned chunk opens from the tree with `doc_chunk`.
- Defect found and fixed in `components/evidence/document-research-panel.tsx`: when a figure has no chunk-level index (the ANCAP document has 16 such figures), `?doc_figure=N` was dropped on reload because the effect only set the active figure inside the “mapped section” branch. The parameter now always activates the figure and keeps the mapped section when one exists.
- Run note: the shared dev API on :8000 was still serving a scratch database, so verification used an isolated API on :8001 serving `eea` plus the normal web app on :3000 with a temporary route shim for both the API calls and the same-origin figure image that Next rewrites to the API origin.
- Evidence: 1 passed (14.7 s); `pnpm typecheck` exit 0; `pnpm build` exit 0. `pnpm antd:lint` reports 5 issues in unrelated pre-existing files (`components/reminders/`, `components/search/`, `components/topics/`); the changed panel adds none.
- Remaining: the assistant citation → chunk/figure jump still needs a live model gateway, and Linux figures stay with OPS-06.

### Object storage moved into the platform layer (BE-17 slice)

- `app/services/objectstore.py` → `app/platform/objectstore.py`; 30 imports across API, domains, services, scripts and tests now point at the new module. No behaviour change: the file still imports only `app.core.config` and keeps the lexical containment and concurrency rules from the 2026-11-26 slice.
- The platform contract is stricter: `platform-isolation` now forbids `app.domains`, `app.services` and `app.api`, not just the first and last. `pyproject.toml` and `tests/contracts.ini` stay in sync.
- Evidence: `lint-imports` 3 kept / 0 broken against both configs; `pytest tests/test_objectstore_concurrency.py tests/test_missing_objects.py tests/test_documents_raw.py tests/test_signals_ingest.py tests/test_pptx_deck_preview.py tests/test_capture_job_retention.py tests/test_openapi_snapshot.py` → 47 passed (34.1 s). The OpenAPI path snapshot is unchanged, as expected for a module move.
- Two more pure modules left `app.services`: `useragent.py` → `app/platform/useragent.py` (session domain + its test) and `signal_duplicate.py` → `app/domains/evidence/signal_duplicate.py` (both evidence callers and `signal_dedup`), 5 import sites in total. The duplicate-title rule now lives entirely inside the evidence domain.
- Evidence for the second move: `lint-imports` 3 kept against both configs; `pytest tests/test_useragent.py tests/test_signal_dedup.py tests/test_signals_ingest.py` → 49 passed (35.3 s); `pytest --collect-only -q` still collects 624 tests.
- Third move: `tagging_guard.py` → `app/domains/evidence/tagging_guard.py` (API signals, agent patches/tools, panorama import) and `refcodes.py` → `app/domains/vocab/refcodes.py`, which introduces the `vocab` bounded context (seed, schemas, conftest and 9 more call sites). Migration `0002_canonical_codes` only had its import path updated — no SQL or schema change; this repository already lets migrations import current code (`0001_init` imports the models).
- Evidence for the third move: `lint-imports` 3 kept against both configs; `pytest tests/test_panorama_import.py tests/test_signals_ingest.py tests/test_useragent.py` → 44 passed (35.2 s); `import app.main` loads 5 vocabulary domains; `alembic heads` reports `0027_capture_job_progress`; collection still 624 tests.
- Fourth move: `judgment.py` (stage/type rules and theme ranking) and `doc_structure.py` (Markdown sections and figure placement) joined `app/domains/evidence/`, 12 import sites updated. `judgment` now depends only on `app.domains.vocab.refcodes`; `doc_structure` has no app imports at all.
- Evidence for the fourth move: `lint-imports` 3 kept against both configs; `pytest tests/test_document_structure.py tests/test_document_ingest.py tests/test_signals_ingest.py` → 56 passed (46.7 s); collection still 624 tests.
- Fifth move: `audit.py` → `app/platform/audit.py`. `record_correction` only needs `app.core.identity` and the model, so the correction-audit writer is cross-cutting infrastructure; which field changes get audited stays with the callers. Eleven import sites updated (eight API routes, two services, one script).
- Evidence for the fifth move: `lint-imports` 3 kept against both configs; `pytest tests/test_strategy.py tests/test_themes.py tests/test_theme_naming.py tests/test_signals_ingest.py` → 59 passed (54.3 s); collection still 624 tests.
- Sixth move: `tagging.py` → `app/domains/tagging/service.py`, creating the `tagging` context for tag suggestions, URL normalisation and vocabulary creation. The closed reference vocabulary stays in `app/domains/vocab/refcodes.py`. Twenty-one import sites updated across five API modules, six services, one domain module, two scripts and seven tests.
- Evidence for the sixth move: `lint-imports` 3 kept against both configs; `pytest tests/test_tagging_text.py tests/test_tech_tag_pipeline.py tests/test_semantic_document_keywords.py tests/test_signal_dedup.py tests/test_signals_ingest.py` → 51 passed, 1 skipped (27.8 s, the skip is a live-gateway case); collection still 624 tests.
- Seventh move: `doc_summary.py` (no app imports) and `signal_sources.py` (models plus the tagging domain) joined `app/domains/evidence/`; four import sites updated, and the README, backend TODO and the deckpeek research note now point at the new path.
- Evidence for the seventh move: `lint-imports` 3 kept against both configs; `pytest tests/test_document_signals.py tests/test_signals_ingest.py tests/test_document_ingest.py` → 60 passed (66.6 s); collection still 624 tests.
- Eighth move: `model_speed.py`, `hedged_model.py`, `semantic_api.py` and `embedding_cache.py` → `app/platform/`. They only need `app.core.config`, `app.platform.http`, the model layer and each other, so they are model-runtime infrastructure; `llm_gateway` stays in services and now reads them from platform. Fifteen files updated, including three tests and one probe script; two multi-name `from app.services import …` lines were split (the function-local one in `api/v1/signals.py` needed its indentation restored, caught by `py_compile` before any test run).
- Evidence for the eighth move: `lint-imports` 3 kept against both configs; `pytest tests/test_hedged_model.py tests/test_model_speed.py tests/test_llm_gateway_models.py tests/test_agent_rag_semantic.py tests/test_semantic_document_keywords.py` → 48 passed, 1 skipped (20.0 s); collection still 624 tests.
- Ninth move: `llm_prompts.py` (prompt templates + revision), `llm_usage.py` (call logging) and `llm_gateway.py` (OpenAI-compatible client) joined `app/platform/`, 25 files updated. The gateway now imports only config, platform.http and platform modules — no services. `app/services/llm.py` (business suggestion layer) stays put and reads the gateway from platform.
- Evidence for the ninth move: `lint-imports` 3 kept against both configs; `pytest tests/test_caption_cache.py tests/test_llm_usage.py tests/test_llm_gateway_models.py tests/test_agent_workflow.py tests/test_signal_assistant.py` → 54 passed (30.3 s); `py_compile` clean on the moved modules and `api/v1/signals.py`; collection is 628 tests.
- Tenth move: the business suggestion layer `llm.py` → `app/domains/semantic/llm.py`, creating the `semantic` context. After the platform work it imported only `app.platform.*` plus the `vocab` and `tagging` domains, so the move adds no new coupling; eight files updated. `tagging.service` and `evidence.signal_record` now read it as a domain sibling.
- Evidence for the tenth move: `lint-imports` 3 kept against both configs; `pytest tests/test_llm_tags.py tests/test_tech_tag_pipeline.py tests/test_signals_ingest.py tests/test_themes.py` → 52 passed (46.5 s); `py_compile` clean; collection is 628 tests.
- Eleventh move: `body_excerpt.py` → `app/domains/evidence/body_excerpt.py` (imports only the semantic and tagging domains plus models; seven call sites) and `caption_cache.py` → `app/platform/caption_cache.py` (imports core config and the platform prompt revision; four call sites). Both were dependency-clean for their target layers.
- Evidence for the eleventh move: `lint-imports` 3 kept against both configs; `pytest tests/test_body_excerpt.py tests/test_caption_cache.py tests/test_document_ingest.py tests/test_signals_ingest.py` → 57 passed (39.7 s); `py_compile` clean; collection is 628 tests.
- Twelfth move: the document ingest pipeline `doc_ingest.py` → `app/domains/evidence/doc_ingest.py`. After the cache/platform work it imported only core config, platform modules and `doc_structure`, so the evidence domain now owns the whole ingest path. Eighteen files updated, including four `from app.services import doc_ingest` module imports and one comment in `core/config.py`.
- Evidence for the twelfth move: `lint-imports` 3 kept against both configs; `pytest tests/test_document_ingest.py tests/test_document_signals.py tests/test_capture_unified.py tests/test_figure_recaption.py tests/test_document_structure.py` → 63 passed (36.1 s); `py_compile` clean; collection is 628 tests.
- Thirteenth move: the preview trio `doc_pdf_preview.py`, `pptx_slide_render.py` and `pptx_deck_preview.py` → `app/platform/`. The shared extension helper `suffix_for` was extracted to `app/platform/files.py` first, so preview code never imports the evidence domain (platform→domains is forbidden); `doc_ingest` and `api/v1/signals.py` now share that helper.
- Evidence for the thirteenth move: `lint-imports` 3 kept against both configs; `pytest tests/test_doc_pdf_preview.py tests/test_pptx_deck_preview.py tests/test_pptx_slide_render.py tests/test_document_ingest.py` → 37 passed (28.8 s); `py_compile` clean after fixing one indentation slip in a function-local import; collection is 628 tests.
- Fourteenth move: `figure_recaption.py` (evidence domain + platform only) and `signal_dedup.py` (evidence.signal_duplicate only) → `app/domains/evidence/`. Five import sites updated: two API routes, one probe script, two test modules (including module-style imports). Only `signal_recaption`/html snapshot work remains in the ingest-adjacent services.
- Evidence for the fourteenth move: `lint-imports` 3 kept against both configs; `pytest tests/test_figure_recaption.py tests/test_signal_dedup.py tests/test_document_signals.py tests/test_signals_ingest.py` → 61 passed (39.5 s); `py_compile` clean; collection is 628 tests.
- Fifteenth move: `html_snapshot.py` and `signal_recaption.py` → `app/domains/evidence/`. Both depended only on core, platform, the models and each other, so the evidence domain now owns snapshot ingestion and article recaption end to end. Six import sites updated; `html_capture` and `signal_recaption` became intra-domain references.
- Evidence for the fifteenth move: `lint-imports` 3 kept against both configs; `pytest tests/test_html_snapshot.py tests/test_signal_recaption.py tests/test_document_signals.py tests/test_missing_objects.py` → 37 passed (20.6 s); `py_compile` clean; collection is 628 tests.
- Sixteenth move: `url_fetch.py` (only `core.config` and `platform.http`) and `pydantic_agent.py` (core plus `platform.llm`, `hedged_model`, `llm_gateway` and `llm_prompts`) joined `app/platform/`; five app modules and two test modules now import the new paths. `agent_workflow` and `demand_agent` only changed their import site.
- Evidence for the sixteenth move: `lint-imports` 3 kept against both configs; `pytest tests/test_capture_unified.py tests/test_capture_worker_errors.py tests/test_capture_tokens.py` → 45 passed (36.0 s); `py_compile` clean; collection is 628 tests.
- Seventeenth move: `chain_report.py` and `chain_report_pdf.py` → the new `app/domains/report/` context. The pair only needs the models, `platform.objectstore` and reportlab, and `api/v1/reports.py` was the only external caller.
- Evidence for the seventeenth move: `lint-imports` 3 kept against both configs; `pytest tests/test_chain_reports.py tests/test_openapi_snapshot.py` → 6 passed (16.4 s); collection is 628 tests.
- Eighteenth move: `demand_validation.py` → `app/domains/demand/validation.py` and `function_validation.py` → `app/domains/landing/validation.py`. Both needed only the models and the standard library; five API modules plus `panorama_import_graph` updated their imports, and both contexts already existed.
- Evidence for the eighteenth move: `lint-imports` 3 kept against both configs; `pytest tests/test_demands.py tests/test_landing_points.py tests/test_functions.py tests/test_panorama_import.py tests/test_openapi_snapshot.py` → 79 passed (63.1 s); collection is 628 tests.
- Nineteenth move: `theme_naming.py` → `app/domains/theme/naming.py`, `theme_clustering.py` → `app/domains/theme/clustering.py` and `tag_clustering.py` → `app/domains/tagging/clustering.py`. The three only used the models, evidence helpers, vocab and the semantic LLM layer; `api/v1/themes.py` and three test modules (including two monkeypatch targets) updated.
- Evidence for the nineteenth move: `lint-imports` 3 kept against both configs; `pytest tests/test_themes.py tests/test_theme_naming.py tests/test_tag_clustering.py tests/test_openapi_snapshot.py` → 31 passed (22.1 s); collection is 628 tests.
- Twentieth move: `studio.py` → `app/domains/studio/service.py` and `signal_studio_store.py` → `app/domains/studio/store.py`. The pair only used the schemas, `platform.llm_prompts` and the models; `api/v1/signals.py` was the only caller.
- Evidence for the twentieth move: `lint-imports` 3 kept against both configs; `pytest tests/test_signal_studio.py tests/test_openapi_snapshot.py tests/test_signals_ingest.py` → 33 passed (29.3 s); collection is 628 tests.
- Twenty-first move: `strategy_funnel.py` → the new `app/domains/strategy/funnel.py`. It only used the models, `platform.audit`, the schemas and `core.identity`; `api/v1/strategy.py` and `api/v1/overview.py` updated.
- Evidence for the twenty-first move: `lint-imports` 3 kept against both configs; `pytest tests/test_strategy.py tests/test_trace_audit_overview.py tests/test_openapi_snapshot.py` → 42 passed (41.0 s); collection is 628 tests.
- Twenty-second move: the ten persisted-agent modules (`agent_contract`, `citations`, `events`, `instructions`, `patches`, `rag`, `runtime`, `tools`, `trace`, `workflow`) → the new `app/domains/agent/` context under short names. They only need the models, schemas, core, platform and the evidence/tagging/semantic domains; `api/v1/agent.py`, `api/v1/documents.py`, the `platform/pydantic_agent` docstring and five test modules updated. `docs/agents.md` and the BE-14 entry now point at the new files.
- Evidence for the twenty-second move: `lint-imports` 3 kept against both configs; `pytest tests/test_agent_workflow.py tests/test_agent_stream_events.py tests/test_agent_runtime_stream_buffer.py tests/test_agent_document_evidence.py tests/test_pydantic_ai_wiring.py tests/test_openapi_snapshot.py` → 32 passed (21.2 s); collection is 628 tests.
- Twenty-third move: `demand_agent.py` → `app/domains/demand/agent.py` and `demand_draft.py` → `app/domains/demand/draft.py`; both only need the models, `evidence.signal_host` and the platform pydantic/LLM layers. `api/v1/demands.py`, `docs/agents.md` and two tests updated. Two `from app.services import …` module-style imports (`demand_agent`, `agent_rag`) were fixed too — dotted string replacement alone does not catch them, and `test_agent_rag_semantic` had been left broken by the agent move.
- Evidence for the twenty-third move: `lint-imports` 3 kept against both configs; `pytest tests/test_demand_assistant.py tests/test_demands.py tests/test_demand_agent_model_name.py tests/test_agent_rag_semantic.py tests/test_openapi_snapshot.py` → 36 passed (30.9 s); collection is 628 tests.
- Twenty-fourth move: the panorama import family (`panorama_workbook`, `panorama_import`, `panorama_import_graph`, `panorama_import_hooks`, `panorama_import_signals`) and `url_list_capture` → `app/domains/capture/` (`url_list.py`). The review-report implementation moved too, but `app/services/panorama_review_report.py` stays as a thin shim so the documented `python -m app.services.panorama_review_report` operator command is unchanged. `api/v1/capture.py`, `api/v1/imports.py`, `domains/capture/ingest.py`, `capture_jobs` and four tests updated (two module-style imports).
- Evidence for the twenty-fourth move: `lint-imports` 3 kept against both configs; `pytest tests/test_panorama_import.py tests/test_panorama_review_gate.py tests/test_panorama_review_integration.py tests/test_url_list_capture.py tests/test_capture.py tests/test_openapi_snapshot.py` → 33 passed (27.6 s); collection is 628 tests.
- Twenty-fifth move: the capture orchestration set — `capture_jobs.py` → `domains/capture/jobs.py`, `capture_job_retention.py` → `retention.py`, `orphan_objects.py` and `orphan_maintenance.py` → `app/domains/capture/`; `capture_tokens.py` → `app/platform/capture_tokens.py` (it only needs `core.identity` and the models). The maintenance module keeps a thin shim at the old path so `python -m app.services.orphan_maintenance` and the Compose ops-profile command keep working; the shim installs the Windows selector policy before importing the domain module. `worker.py`, `main.py`, `api/v1/capture.py`, `api/v1/capture_tokens.py`, `core/capture_identity.py` and seven tests updated.
- Evidence for the twenty-fifth move: `lint-imports` 3 kept against both configs; `pytest tests/test_capture_jobs.py tests/test_capture_job_concurrency.py tests/test_capture_job_retention.py tests/test_capture_entry_idempotency.py tests/test_capture_tokens.py tests/test_orphan_maintenance.py tests/test_capture_unified.py tests/test_panorama_import.py tests/test_openapi_snapshot.py` → 60 passed (45.3 s); the shim dry-run printed `scanned=0 pruned_orphans=0 terminal_jobs_pruned=0`; collection is 628 tests.
- Twenty-sixth move (final module): `skills.py` → `app/domains/skills/service.py` and `skill_eval.py` → `app/domains/skills/eval.py`; `app/services/skill_eval.py` stays as a thin shim, so the documented `python -m app.services.skill_eval` command and existing callers are unchanged. `app/services` now holds only three compatibility entry points (`orphan_maintenance`, `panorama_review_report`, `skill_eval`) plus `__init__.py`; every business implementation lives in `app/platform`, `app/domains` or `app/api`.
- Evidence for the twenty-sixth move: `lint-imports` 3 kept against both configs; `pytest tests/test_skills_eval.py tests/test_signals_ingest.py tests/test_openapi_snapshot.py` → 31 passed (23.5 s); the shim printed a JSON report for `--json`; collection is 628 tests.
- Closure (2026-11-27): after 26 module moves `app/services` holds only three compatibility shims; every business module lives in `app/platform` or `app/domains/*`, and no API module imports `app.services` any more. Full `pytest -q` -> **626 passed, 2 skipped** (309.9 s, 628 collected, exit 0); `lint-imports` 3 kept against both configs. The BE-17 checklist is closed; Linux deployment figures stay with OPS-06.
- Remaining BE-17 work: `app/services` now holds only compatibility shims; still open are API-route orchestration/DTO convergence, `app/schemas` cleanup, the BE-17 checklist (OpenAPI snapshot, migration-order notes) and Linux-side evidence.

### Full backend regression after the BE-17 moves (BE-16 evidence)

- Ran the whole backend suite after the eight layering moves: `pytest -q` → **626 passed, 2 skipped** in 416 s (628 collected; the two skips are the live-gateway cases).
- One failure surfaced and was a stale expectation, not a regression: `test_capture_unified::test_document_file_upload_creates_derived_signal` still asserted the filename stem (`deck`) while commit `34245e0` deliberately prefers the document's own heading. The test now expects `白皮书`.
- Added `tests/test_document_title.py` to pin the rule the stale test got wrong: a scanner-style filename yields to the Markdown heading, a meaningful filename is kept over a noisy cover, a missing filename falls back to the heading, and no title at all falls back to `文档 <sha8>` (4 passed).
- The final full run includes the new file; `lint-imports` stayed at 3 kept through the same tree.

## 2026-11-26

### Deploy to 10.215.35.10 (hzh2admin) + capture-client download page

- Transferred the working tree with `tar`/`scp` (secrets and build caches excluded) over the host's existing copy at `~/projects/eea`; `deploy/.env` and `backend/.env` were preserved (backed up to `/tmp` first).
- `bash deploy/build.sh 10.215.8.87` now completes; containers recreated (api/web healthy, nginx restarted) and every public route returns 200 through the proxy: `/`, `/healthz`, `/readyz`, `/api/v1/overview`, `/docs`, 94 OpenAPI paths. `/readyz` reports `semantic_gateway: degraded` because that host still has no model-gateway key (unchanged from the 11-23 deploy).
- Web image build was failing for two reasons, both fixed in `deploy/Dockerfile.frontend`:
  - compose passed `HTTP_PROXY`/`HTTPS_PROXY` as build args but the Dockerfile never declared them, so `pnpm` connected directly and tarballs timed out;
  - the proxy is a TLS-inspecting mitmproxy whose CA the node image does not carry, so fetches failed with `UnknownIssuer`. The build stage now declares the proxy args, points at `registry.npmmirror.com`, and sets `NODE_TLS_REJECT_UNAUTHORIZED=0` for the build only; package authenticity still comes from `pnpm-lock.yaml` integrity hashes.
- New in-app page `下载采集客户端` (`/downloads`): release table with version/size/SHA-256 and a download button; nginx serves `deploy/downloads/` read-only at `/downloads/`. Windows artifact `capture-v0.1.1-windows-amd64.zip` (5,116,495 B) published; the served file's SHA-256 matches `38ff97c4…f818`.
- Verified: page renders the release row and the `/downloads/capture-v0.1.1-windows-amd64.zip` link; zip returns 200 `application/zip` with the expected hash; `SHA256SUMS` served alongside.
- Not done: macOS client build. Its UI is Fyne-based and needs cgo plus the macOS SDK, so it must be built on a Mac; the page states this instead of offering a dead link. Screenshots of the deployed pages could not be captured (ego-browser stalls on `Page.captureScreenshot` for any page on this host); verification used DOM text plus HTTP responses.

### PDF/document upload 401 on the deployed host (fixed)

- Symptom: the import page sat at `上传 0%` and documents never entered the library.
- Root cause, confirmed by replaying the request: `POST /api/v1/capture/jobs` returned **401 “身份代理未提供有效的操作者身份”**. With `APP_ENV=production` the API accepts an operator only from a trusted peer, and nginx was deliberately clearing `X-EEA-Authenticated-*` because OPS-03 has no identity provider yet — so every audited write was impossible on that host, not just PDFs.
- Fix (interim, OPS-03 still open): nginx now stamps a configured pilot operator from `EEA_PILOT_OPERATOR`/`EEA_PILOT_ROLE` (empty = 401, fail closed), the compose file mounts the conf as an nginx template and passes those values, and `deploy/.env.example` documents them. A second bug surfaced during the fix: nginx drops inherited `proxy_set_header` once a `location` declares any, so the identity headers had to be repeated inside `location /api/`.
- UI: the progress bar tracked only the HTTP upload and sat at `0%` while the worker parsed. It now moves to `100%` as soon as the job is accepted.
- Verified on `10.215.35.10:8090`: PDF upload → `202 queued` → `succeeded` in <6 s → signal created (`3595eaf5…`, `120f1e31…`), both after a full rebuild.
- Documented rule, not a bug: a PDF needs ≥120 characters of extractable text; a scanned PDF fails with “PDF 没有可提取的文本层（可能需要 OCR）；原始文件已保留” and the blob is kept.

## 2026-11-26

### Orphan-maintenance entry runnable on Windows + explicit dry-run/apply (BE-01 slice, walkthrough O-8)

- Problem: the 2026-11-25 seven-step walkthrough (O-8) found `python -m app.services.orphan_maintenance` fails on Windows with psycopg `InterfaceError: Psycopg cannot use the 'ProactorEventLoop'`, because the module entry called `asyncio.run` under the Windows default proactor loop — unlike `dev.py`/`worker.py`, which already install a selector policy. Reproduced before the fix on this machine with the same traceback.
- What changed (`orphan_maintenance.py`, `orphan_objects.py`, `deploy/docker-compose.yml`):
  - The module entry sets `asyncio.WindowsSelectorEventLoopPolicy()` on `win32` before the app imports, the same pattern as `scripts/purge_singleton_tags.py` and `app/worker.py`.
  - The command is now explicit dry-run/apply: default counts only (`prune_resolved_orphans(..., apply=False)`), `--apply` deletes and commits, `--limit` bounds the scan; the Compose `maintenance` ops-profile service passes `--apply` so production semantics are unchanged.
- Evidence: `uv run python -m app.services.orphan_maintenance` on the portable dev PostgreSQL → `orphan_maintenance dry-run: pruned_orphans=0`, exit 0 (matches the walkthrough's cleanup-review baseline); `uv run pytest tests/test_signal_dedup.py tests/test_db_schema.py -q` → 27 passed; `uv run alembic heads` → `0025_capture_client_claim_worker (head)`.
- Not done: Linux/container run of the command remains OPS-side evidence. BE-01 parent stays open (the audit row landed in the next slice).

#### Persistent-edit browser case (FE-12 slice)

- Added `frontend/tests/e2e/persistent-edit.spec.ts` (`pnpm pw:persist`). It creates a scratch signal through the public API, opens `/singal/{id}`, changes 价值链环节 and 信号类型 in the drawer, saves, and asserts the server row (not component state) changed: `value_chain_stage_code=delivery_oem`, `signal_type_code=technology`, and `updated_at` moved.
- The same case pins the two rules that make the edit trustworthy: a PATCH carrying the pre-edit `expected_updated_at` returns 409 (stale saves are refused), and after a reload the drawer shows the stored values plus the 修正记录 table with field, old value, new value, `whoami` subject/role and time. The scratch signal is archived and deleted in `finally`, so the case leaves no rows.
- Checks: `pnpm pw:persist` → 1 passed; `pnpm typecheck` exit 0; `pnpm antd:lint` 0 issues.
- Two defects surfaced while writing it. (1) antd renders two-character primary buttons with an inserted space, so `getByRole('button', { name: '保存' })` never matches; the spec uses `/保\s*存/`. (2) Creating a signal with body text blocked ~26 s — see the ingest-budget slice below.
- Remaining on FE-12: model-failure, async-task and history-version browser cases; 10k-row pagination and first-content timing; Linux same-origin checks.

### Bounded ingest tagging + jieba fallback (BE-04 slice)

- Problem: `POST /api/v1/signals` with body text took ~25.8 s whenever the model gateway was slow. The 8 s per-request timeout is multiplied by the OpenAI-compatible client's retries, and the ingest path makes two model calls (tag suggestion, then the candidate pick). Measured 25.8 s on this machine with `suggest_tags_with_llm` alone.
- Two changes:
  - `signal_record.INGEST_TAGGING_BUDGET_SECONDS = 12` wraps the whole ingest tagging step in one `asyncio.timeout`. On timeout the deterministic skill/jieba result is kept, `classification_basis.auto_tag` still records the candidates, and the jieba pre-tag is written locally so a slow gateway does not leave the signal untagged.
  - `llm.AGENT_BUDGET_SECONDS = 12` additionally caps one agent run, so the suggestion and keyword paths cannot stack retries either.
- Also fixed a regression from `2420ff2`: the confidence gate treated “no rerank service → confidence None” as “below threshold” and dropped the jieba pre-tag, breaking REQ-TAG-05. The gate now applies when confidence is unknown; only a measured, below-threshold score waits for a human.
- Evidence: live `POST /signals` with body text 25.8 s → 14.0 s, tags `['eFuse']` still present; `pytest tests/test_auto_tag_confidence.py tests/test_signals_ingest.py tests/test_llm_tags.py tests/test_tech_tag_pipeline.py -q` → 41 passed (two new cases: a 30 s stub is cancelled and jieba tags still land; a no-rerank signal keeps its jieba pre-tag); document/capture path `pytest tests/test_document_ingest.py tests/test_document_signals.py tests/test_capture.py -q` → 47 passed; `uv run lint-imports` → 3 kept, 0 broken.
- Remaining: BE-04 parent still needs the unified re-classification service, per-candidate explanations and real-gateway acceptance; the 12 s budget is a local measurement, not yet a Linux-intranet figure.

### 10k pagination probe on a scratch database (FE-12 slice)

- Added `backend/scripts/probe_pagination_10k.py`, the evidence-list scale probe that FE-12 asks for. It creates the scratch database `eea_perf`, seeds 10,000 deterministic signals (fixed UUIDs, distinct `created_at`), starts a throwaway API on port 8010 against that database, measures with five runs per case and takes the median, then stops the API and drops the database. It refuses non-local hosts and never touches `eea` or `eea_test` (same pattern as `probe_dedup_scan_cost.py`).
- Measured twice on the Windows dev host with the portable PostgreSQL (2026-11-26; five runs per case, median): first page 24-43 ms, last page at offset 9950 34-49 ms, keyword filter 37-42 ms with X-Total-Count 100, value-chain-stage filter 20-26 ms with 2500, 200 rows at offset 5000 35-48 ms, signal detail first load 17-98 ms. Both runs asserted the boundaries: 50 rows on the first and last page, no overlap, no repeated row, X-Total-Count 10000.
- These are dev-host figures against a local database with no proxy or TLS. FE-12 still needs the Linux intranet numbers and the browser first-screen timing; the list page calls the same `GET /signals` that was measured.

### Model degradation stays visible and non-blocking (FE-12 slice)

- Added `frontend/tests/e2e/degraded-suggestions.spec.ts` (`pnpm pw:degraded`). It creates a scratch signal, asks the server for `GET /signals/{id}/tag-suggestions`, and only proceeds when the response carries `degraded_reason`; a healthy gateway makes the case skip rather than fake a failure.
- When degraded, the drawer must show the server's reason verbatim (the page cannot invent a different explanation), and the manual correction must still save: the case clicks 修正, picks a stage and asserts the server row moved to `realization_consumer` with a new `updated_at`. The scratch signal is archived and deleted in `finally`.
- Evidence: `pnpm pw:degraded` -> 1 passed (58.9 s) against the dev stack, where the chat gateway was returning 'no chat model available' and the endpoint fell back to embedding rerank.
- Remaining on FE-12: the async-task browser case (upload, reload mid-job, resume) and the history-version case; Linux intranet figures.

### Migration chain probe and a fresh-install fix (BE-16 slice)

- Added `backend/scripts/probe_migrations.py` (scratch database `eea_migrate`, dropped afterwards). It runs three gates in subprocesses with a `DB_NAME` override: a fresh `alembic upgrade head`; insert a signal row, `downgrade -3`, upgrade again and assert the row survives; downgrade to `0022_demand_review_baseline`, insert a row there, upgrade to head and assert that row survives too.
- The probe exposed a real defect: a brand-new database could not reach head. `0001_init` builds the schema with `Base.metadata.create_all` from the *current* models, so 0023/0025/0027 then hit `DuplicateColumn` when they re-added columns the fresh schema already had. CI did not catch it because `tests/conftest.py` skips migrations when `eea_test` is already at head.
- Fix: 0023 and 0025 add their columns with `ADD COLUMN IF NOT EXISTS`, 0027 does the same for `progress` and drops the stage check with `DROP CONSTRAINT IF EXISTS`. Databases already at those revisions see no change; only the fresh-install path becomes re-runnable. Downgrades are untouched.
- Evidence: `uv run python scripts/probe_migrations.py` -> fresh upgrade ok (head `0027_capture_job_progress`), downgrade/upgrade ok with the row surviving, upgrade from 0022 with data ok, database dropped. `pytest tests/test_db_schema.py tests/test_capture.py tests/test_capture_jobs.py tests/test_capture_job_concurrency.py -q` -> 27 passed (a stale `_set_stage` stub in `test_capture_jobs.py` was updated for the new `progress` argument, which is what the earlier failure was).
- The CI backend job now runs the probe before the integration slice, so a broken fresh-install chain fails the build instead of only showing up on a new deployment. Remaining: the Linux pre-production upgrade of a real older database is still OPS-06; BE-16 also needs the REQ-to-test mapping.

### REQ to test mapping (BE-16 slice)

- Added `backend/scripts/report_req_coverage.py` and generated `docs/acceptance-records/req-test-map.md`. The script reads the 75 REQ ids from the traceability table, scans `backend/tests`, `frontend/tests` and the Go client for each id, and writes one table per domain plus the list of requirements no test names.
- Result: 51 of 75 REQ are referenced by at least one test file; 24 are not (AGT-01..06, DEM-04/05/07/12, DOC-01..05, MAP-04/07..11, STR-02/03, UI-01). The document states explicitly that a reference is not acceptance: it only shows a test claims the requirement, and some behaviour is exercised under a different id (the landing-point TECH cases, for instance, cover part of the MAP behaviour).
- Measured against the DOC-05 thresholds: the 10k probe above reported 24-43 ms for a page and 17-98 ms for the detail first load, both under the "pagination <=1 s, detail <=0.8 s" wording, on a single dev host with a local database. Linux pre-production still needs the OPS-06 run.
- The same script prints the per-REQ table to stdout, so the mapping can be regenerated whenever ids move. Regenerate with `uv run python scripts/report_req_coverage.py --write ../docs/acceptance-records/req-test-map.md` from `backend/`.
- Remaining: DOC-05 still has to judge each uncovered REQ against its AT case, and the 20-signal / 10-source / real-gateway records stay open.

### Async document import resumes after a reload (FE-12 slice)

- Added `frontend/tests/e2e/async-task.spec.ts` (`pnpm pw:async`). It uploads a generated `.md` on `/newSignal`, waits until the page has written the pending job id into `sessionStorage`, reloads, and asserts the panel keeps the filename, the job keeps running to its terminal state, the result panel appears with 打开信号, and the pending entry is cleared so a later reload does not replay a finished job.
- The case is opt-in (`EEA_PW_DOC_ROWS=1`) because the upload writes a `eea_document` row and the API has no document delete route; the signal it creates is archived and deleted at the end. Documented as disposable-database-only in the e2e README.
- Evidence: `EEA_PW_DOC_ROWS=1 pnpm pw:async` -> 1 passed (26.3 s). The document row and its two object files created by that run were removed afterwards; the dev library is back to its previous 65 signals and no `pw-async-` document.
- Remaining on FE-12: the history-version browser case; Linux intranet figures.

### Strategy history versions in the browser (FE-12 slice)

- Added 'frontend/tests/e2e/history-versions.spec.ts' (pnpm pw:history). It finds the landing point with the most assessment versions, opens /strategy, selects it through the real combobox, and checks the 当前与历史版本 timeline: the newest version carries 当前版本 (or 最近定稿 · 待复核 when the funnel is not complete), every older one carries 历史, each row shows the stored classification, operator and time, and a reload keeps the same version set.
- The case is read-only by default and skips when no landing point has two versions. With EEA_PW_HISTORY_SEED=1 it first calls PATCH /strategy/landing-points/{id}/funnel {finalize:true} to create the second version; that leaves a permanent assessment row, so the flag is for a database that may carry the residue.
- Evidence: ran against the eFuse landing point with two versions -> 1 passed (8.1 s). The extra version created for the run was removed afterwards together with its funnel pointer, so the dev sample is back to a single current v1 with total 20.
- FE-12's local browser cases are now complete: persistent edit, model degradation, async import resume, history versions, plus the earlier trace/chain/report/demands/roles cases. Remaining for FE-12: Linux intranet numbers and the same-origin/SSE checks with OPS.

## Maintenance-run audit row (BE-01 slice)

- Problem: `orphan_maintenance --apply` pruned orphan rows but left no durable record of who ran it, when, or how many rows it scanned/removed, so the BE-01 audit requirement stayed open.
- What changed (`models.py`, migration `0026_maintenance_run`, `orphan_objects.py`, `orphan_maintenance.py`, tests):
  - Added `eea_maintenance_run` (command, scan_limit, scanned, pruned, operator_subject/role, details, started_at/finished_at) as an additive `if_not_exists` migration; the schema inventory and per-test truncate list include it.
  - `--apply` inserts one run row in the same transaction as the deletes; dry-run remains read-only and writes nothing. `prune_resolved_orphans` now returns scanned/pruned plus resolved/missing-blob counts, so the audit details (including the pruned object keys) are measured rather than guessed.
  - Tests cover the counts, the audit row content, dry-run no-write, and the schema inventory.
- Evidence: `pytest tests/test_orphan_maintenance.py tests/test_db_schema.py -q` → 9 passed; `alembic downgrade -1` on `eea_test` → `0025_capture_client_claim_worker` with the table absent, `upgrade head` → `0026_maintenance_run` with the table present; CLI `--apply --limit 5` wrote `orphan_maintenance | system | 5 | 0 | 0 | {"resolved":0,"object_keys":[],"missing_blob":0}` and a following dry-run left the row count at 1.
- Not done: Linux/container run remains OPS-side evidence. BE-01 parent stays open (the retention policy landed in the next slice).

### Terminal capture-job retention (BE-01 slice)

- Problem: terminal capture jobs accumulated forever, and their content-addressed payload blobs were never reclaimed; the plan required a retention window, a cleanup path in the maintenance task, and terminal-cleanup tests.
- What changed (`config.py`, `objectstore.py`, `capture_job_retention.py`, `orphan_maintenance.py`, tests):
  - Added `CAPTURE_JOB_RETENTION_DAYS` (default 30, minimum 1) and `--job-retention-days`; `--limit` bounds each category. `succeeded`/`failed`/`cancelled` jobs older than the cutoff are selected with `FOR UPDATE SKIP LOCKED` using `coalesce(finished_at, updated_at)`.
  - `panorama_import_url.capture_job_id` is nulled before deletion (the live FK is NO ACTION), then the jobs are deleted. A payload blob is unlinked only when no remaining job references the key and the file was not written in the last hour, so a concurrent upload that reused the content-addressed key is not broken.
  - The maintenance audit row now nests `orphans` and `capture_jobs` details (scanned/pruned, payloads deleted/kept, retention days, cutoff); dry-run still writes nothing.
  - Tests cover dry-run, expired-vs-recent/queued selection, shared payload protection, unreferenced payload deletion, panorama URL nulling, and the scan limit.
- Evidence: `pytest tests/test_capture_job_retention.py tests/test_orphan_maintenance.py tests/test_db_schema.py -q` → 13 passed; full backend suite 562 passed, 2 skipped (12:07); CLI `--apply --limit 5 --job-retention-days 30` on `eea_test` wrote one nested audit row (`capture_jobs.scanned=0, pruned=0`), and a following dry-run left the row count at 1.
- Not done: Linux/container run remains OPS-side evidence. BE-01 parent stays open (worker lease-expiry and duplicate-submission concurrency landed in the next slice).

### Worker lease recovery, duplicate-submission race and stale-worker fencing (BE-01 slice)

- Problem: the durable capture queue had no test proving that a crashed worker's job is recovered by another worker without duplicating its signal, that two identical submissions racing on POST /capture/jobs collapse to one job, or that the worker ownership guards actually reject a stale process. The BE-01 acceptance list still counted process interruption and retry as open.
- What changed (backend/tests/test_capture_job_concurrency.py, no production code):
  - Lease recovery: claim with worker A, force the lease into the past (crash simulation), claim with worker B -> the same job is re-claimed (attempt_count 2, owner B) and running it produces exactly one signal.
  - Duplicate submission race: two concurrent posts with one submission_id and identical bytes both return 202 with the same job id; the unique constraint leaves one job row. A throwaway probe confirmed the losing request took the IntegrityError fallback and recorded one orphan object, so the race path is exercised rather than merely serialized.
  - Stale-worker fencing: after B reclaims the lease, A's heartbeat returns false and _mark_succeeded/_mark_failed are no-ops (job stays running, owned by B, no signal_id); B can still complete it.
  - Retry ceiling: a lease that expires at CAPTURE_WORKER_MAX_ATTEMPTS is marked failed with the retry-limit reason at the next claim, which then finds nothing to run.
- Evidence: pytest tests/test_capture_job_concurrency.py -q -> 4 passed (30.7 s); full backend suite after the slice -> 567 passed, 2 skipped (12:03). A temporary probe run printed statuses=202,202 same_id=True jobs=1 orphans=1; the probe file was removed afterwards.
- Not done: BE-01 still needs worker restart/end-to-end evidence on Linux/containers (OPS-side), and the same guarantees across every ingest entry point. The parent task stays open.

### Cross-entry submission idempotency (BE-01 slice)

- Problem: POST /capture computed its submission fingerprint from the raw upload content_type, while POST /capture/jobs and client-submit fingerprinted the normalized MIME. The same .pptx sent as application/octet-stream therefore produced two different fingerprints for one submission_id: the sync entry stored the signal, then the async entry answered 409 "already used for a different capture" (and the reverse order failed the same way). The acceptance item "consistent idempotency across the ingest entries" was not met.
- What changed (backend/app/api/v1/capture.py): normalize filename/mime once before fingerprinting and reuse them for _is_html and ingest, so all capture entries hash the same canonical request. The duplicate normalize block after the fetch branch was removed.
- Tests (backend/tests/test_capture_entry_idempotency.py): sync replay returns the same signal; different bytes on the same id return 409; sync-then-async and async-then-sync reuse the signal; sync while a job is queued returns 409 without creating a signal; .pptx + application/octet-stream works in both directions; two concurrent sync captures leave one signal.
- Evidence: with the old code, test_sync_then_async_document_with_ambiguous_mime_reuses_the_signal failed with 409; after the fix pytest tests/test_capture_entry_idempotency.py -q -> 8 passed. Capture-related nine files (capture, unified, jobs, concurrency, entry idempotency, extension upload, URL list, panorama import, raw documents) plus the OpenAPI snapshot -> 75 passed (53.7 s); full backend suite after the change -> 575 passed, 2 skipped (5:10).
- Not done: the same guarantees on a real Windows client against a deployed API (OPS-side), and the document-upload / URL-paste entries keep their own content-hash and per-URL dedupe contracts rather than a shared submission id. BE-01 parent stays open.

### Multi-URL provenance and theme source counts (BE-05 slice)

- Problem: the signal_sources routes and the theme source_count semantics had no interface tests, so the BE-05 acceptance item (primary plus supplementary URLs, shared-URL dedupe, archived members) was unverified even though the implementation existed.
- What changed: only backend/tests/test_signal_sources.py; no production code.
- Tests: a new signal gets exactly one primary source with provenance=primary; a supplementary URL is deduped on normalize_url (case, trailing slash, query), repeats return the same row, and the primary URL posted as supplementary returns the primary row; an archived signal rejects a new source with 409; a role without permission gets 403; a theme's source_count includes a supplementary URL, counts a URL shared by two member signals once, and still counts sources of archived members while signal_frequency excludes them.
- Evidence: pytest tests/test_signal_sources.py -q -> 5 passed (10.4 s); related theme/clustering/archive files -> 34 passed (21.7 s); full backend suite after the slice -> 580 passed, 2 skipped (4:55).
- Not done: the real 8-signal/16-source case still needs DOC-02 data, and automatic aggregation consistency explanations remain in BE-05. The parent task stays open.

### Structured aggregation basis in the theme preview (BE-05 slice)

- Problem: judgment.py already had aggregation_structured_basis (object / underlying capability / change direction) and structured_basis_consistent, but neither was reachable from the API. The theme-aggregate preview only returned tag overlap and a reason string, so the BE-05 "structured aggregation rationale" item was unmet and the helper was dead code.
- What changed (backend/app/schemas/schemas.py, backend/app/api/v1/signals.py, frontend/lib/api/types.ts): ThemeAggregatePreview gains optional structured_basis and basis_reason. The preview fills structured_basis from the signal's tags and runs the consistency gate for the recommended theme; when the gate fails it clears the recommendation and reports the gate reason. The frontend type mirrors the optional fields; no UI behavior changes.
- Tests (backend/tests/test_aggregation.py): the preview carries all three basis keys with values drawn from the signal's tags and no basis_reason when consistent; a single-tag signal is not auto-assignable, its reason reports the 1-tag overlap, and the basis reports the one available dimension.
- UI: frontend/components/evidence/signal-theme-assign.tsx renders the non-empty dimensions inline in the preview Alert. pnpm typecheck and antd lint pass; pnpm build passed in an isolated D:-drive copy that reused the local pnpm store, leaving the running dev server untouched.
- Evidence: pytest tests/test_aggregation.py -q -> 14 passed; OpenAPI path snapshot -> 1 passed; pnpm typecheck, component antd lint and pnpm build -> passed; full backend suite after the slice -> 582 passed, 2 skipped (5:14).
- Not done: the ordering inside structured_basis is a wave-1 heuristic (longest tag first), not a semantic classifier; real 8/16 data and business sign-off remain with DOC-02. The parent task stays open.

### Missing stored objects fail clearly (BE-02 slice)

- Problem: a document-backed signal's figures endpoint returned 200 [] when the raw document blob was gone, while HTML signals already returned a clear 404. The other read paths had clear 404s but no tests, so the "missing object" acceptance item was unverified.
- What changed (backend/app/api/v1/signals.py): the document figure branch raises 404 for a missing document row, a missing raw object key, or a missing blob instead of falling through to an empty list.
- Tests (backend/tests/test_missing_objects.py): signal body, archive and figures after deleting the stored object; document canonical.md and preview.pdf after deleting their blobs; document-signal figures after deleting the raw blob; a figure row whose image blob is missing returns 404 and recaption marks it needs_review instead of failing.
- Evidence: pytest tests/test_missing_objects.py -q -> 5 passed; related document/signal files -> 47 passed (37.1 s); full backend suite after the service change -> 586 passed, 2 skipped (6:04).
- Note: frontend fetchSignalFigureByIndex already catches figure errors and falls back to archive parsing, so the 404 does not surface as a user-facing error.
- Not done: storage-fault injection on Linux/PostgreSQL. The parent task stays open.

### Signal-list pagination boundaries (BE-02 slice)

- Problem: the list endpoint pins limit 1..200 and offset >= 0, but only limit=500 was tested; an offset past the end and the interaction between filters, the archived default and X-Total-Count were unverified.
- What changed: only backend/tests/test_signals_list.py; no production code.
- Tests: limit 0 and 201 plus a negative offset return 422 while limit=200 succeeds; an offset past the end returns [] with the unchanged total; X-Total-Count follows the active filter (2 for creation_supply), the default window excludes archived signals (3), and the archived filter reports 1.
- Evidence: pytest tests/test_signals_list.py -q -> 15 passed (17.7 s).
- Not done: the plan itself states no formal pagination contract (CONV-API-UNSTATED); these tests pin the implemented behavior only. The parent task stays open.

### Audited landing-point deletion and complete audit responses (BE-08 slice, walkthrough O-7)

- Problem: the seven-step walkthrough found no delete route for landing points, so temporary/sample points were removed with SQL. The audit table has no FK, leaving rows that pointed at a deleted entity with no deletion record. The audit response also hid reason/model/rule/skill/score_source even though the table stores them.
- What changed (backend/app/api/v1/landing_points.py, backend/app/schemas/schemas.py, frontend/lib/api/types.ts): DELETE /landing-points/{id} locks the row, writes a "deleted" audit snapshot (function, name, domain, role, standard/assessment counts) in the same transaction, then deletes it; standards and assessments cascade. AuditOut now exposes reason, model_version, rule_version, skill_version and score_source; the frontend type mirrors them.
- Tests: landing_points.py covers the 204, the 404 afterwards, a cascaded standard row, the deleted snapshot (counts, operator, role, reason) and the surviving created row; test_audit_out.py pins the five response fields via a directly inserted audit row.
- Evidence: pytest tests/test_landing_points.py tests/test_audit_out.py -q -> 14 passed; related demand/trace/standards/strategy/panorama files -> 97 passed (89.2 s).
- Not done: the pre-deletion audit rows still reference the deleted entity by design (the deletion snapshot explains them); a soft-delete/history view is not added. Linux/identity evidence remains OPS-side, and the parent task stays open.

### Concurrent content-addressed writes (BE-01 slice)

- Problem: the full backend suite surfaced a Windows race in the object store. Two identical capture uploads both publish the same content-addressed key; one os.replace raised PermissionError (sharing violation). A second race: Path.resolve during concurrent directory creation returned a Windows short-name path, so a valid key failed the containment check.
- What changed (backend/app/services/objectstore.py): _publish treats an existing same-size destination as a successful concurrent publish, otherwise retries up to five times; _object_path checks containment lexically with abspath/commonpath and rejects absolute or parent-traversal keys without touching the filesystem.
- Tests (backend/tests/test_objectstore_concurrency.py): 32 threads writing one key, a simulated concurrent winner, a transient PermissionError retry, and traversal rejection.
- Evidence: pytest tests/test_objectstore_concurrency.py -q -> 4 passed; pytest tests/test_capture_job_concurrency.py -q -> 4 passed; full backend suite after both fixes -> 597 passed, 2 skipped (7:34).
- Not done: cross-process writers on a shared object directory rely on the same content-addressed retry logic; S3 remains deployment scope. The parent task stays open.

### DOC-03 contract sync for the 2026-11-26 slices

- Problem: the architecture contract table still described the 2026-11-20 state; the cross-entry fingerprint, structured theme-preview fields, audit response fields, landing-point delete and missing-object 404s were absent.
- What changed (docs/ARCHITECTURE-LAYERS.md, docs/TODO.md): four 2026-11-26 contract rows, the object-store concurrency note, the data-model heading date and the DOC-03 sync line.
- Evidence: documentation-only change; the claims match the committed tests and implementations from 6763e60, 6bf9fb3, be78a98, 73c4a74, 3fc075e and cc3ec11.
- Not done: deployment topology, identity/audit state machine and the real 8/16 baseline still depend on OPS-03 and DOC-02.

### Evidence-status transition matrix (BE-02 slice)

- Problem: individual status values were tested, but no test walked the five-state model end to end, and the rejected retained transition / no-op write behavior was unverified.
- What changed: only backend/tests/test_signal_archive_ops.py; no production code.
- Tests: fetching -> fetch_failed -> pending_review -> retained -> archived -> retained, each transition returning 200 and writing one evidence_status_code audit pair; retained without any stored body returns 422, keeps fetching and writes no audit; repeating the same status writes only one audit row.
- Evidence: pytest tests/test_signal_archive_ops.py -q -> 7 passed (18.0 s).
- Not done: the two evolution-node transitions are owned by the capture/ingest paths and are not part of this PATCH matrix. The parent task stays open.

### FE-04 per-signal source list

- Problem: GET/POST /signals/{id}/sources existed and were tested, but the evidence drawer never showed them, so primary and supplementary URLs were indistinguishable in the UI.
- What changed (frontend/lib/api/types.ts, frontend/lib/api/eea-api.ts, frontend/components/evidence/signal-sources.tsx, frontend/views/dashboard/workspace.tsx): the drawer gains a 来源链接 section with 主链接/补充 tags, provenance, and an add form that invalidates the query after POST; archived signals show the read-only hint.
- Evidence: pnpm typecheck passed; component antd lint passed (0 issues); pnpm build passed in an isolated D: copy that reused the local pnpm store. No backend change.
- Browser walkthrough (2026-11-26, ego-browser against the dev stack on :3000/:8000, signal fe665d36 on /singal/{id}):
  - Empty state: 来源链接 renders 暂无补充来源 with the URL / 出处 inputs and a disabled 添加补充来源 button (checked in the DOM and in a rendered page image).
  - Add flow: typing a URL enables the button; clicking it posts, shows the 已添加补充来源 toast, clears both inputs and lists the new row tagged 补充 with its provenance line.
  - Populated state: a signal holding both rows shows 主链接 for the signal URL and 补充 with the provenance beneath it.
  - Archived state: PATCHing the signal to archived replaces the form with 已归档信号不能新增来源。; no inputs and no add button remain.
  - Defect found and fixed in the same pass: the primary row printed its internal provenance value (primary) under the URL; the drawer now hides provenance for the primary row (frontend/components/evidence/signal-sources.tsx).
  - Checks: pnpm typecheck 0, component antd lint 0 issues, isolated pnpm build 0 (D:/dev/eea-fe04-build copy, offline install from the local store, running dev server untouched). Page images came from CDP Page.printToPDF because Page.captureScreenshot timed out in this ego session even on example.com.
- Not done: the direct eFuse 2-source versus theme 8/16 split display. The FE-04 parent stays open.

## 2026-11-24

### Duplicate-signal scan and cleanup on an article URL key (BE-02 slice)

- Problem: grouping duplicates on `url_normalized` drops the whole query string, so two different Baidu/CSDN articles (`/s?id=111` vs `/s?id=222`) were offered as copies of each other — and because the fingerprint's `url` is also query-free, thin rows could be marked `identical` and auto-deleted. The mirror-image bug hid true re-captures: an unknown tracking parameter split one article into two keys while `url_normalized` and the `(重复采集 #n)` title still said "same page".
- What changed (`signal_dedup.py`, commits `e334993` + `83090a8`):
  - `article_url_key` groups on the raw URL, keeping content-bearing query params. Campaign keys (`utm_*`, `spm`) are stripped everywhere; share-wrapper keys (`from`, `scene`, `share*`, …) only on `weixin.qq.com`/`baidu.com`, where they are not content-bearing — a global denylist had `?from=phone` vs `?from=laptop` merging as identical on other hosts. Blank values are kept (`?id=` ≠ the bare URL).
  - Unpairable re-captures (same `url_normalized`, duplicate-marked title, different URL keys) are reported as `kind=url_suspect`, forced `identical=false`, with the raw URLs shown as the difference — a human picks the survivor, never the auto-delete path.
  - Cleanup recomputes groups server-side, refuses to empty a group, skips signals with pending agent patches, skips signals a confirmed demand cites as evidence (`0eff600` fixed the same failure class for tag purge and re-theming; deleting a cited row makes the demand fail `REQ-DEM-03` with no UI way back), and audits every deletion (field `signal_record`, with duplicate group and kept id).
- Honesty note: the first draft of this slice had the global denylist and a regression test whose fake kept the query inside `url_normalized` (so it passed against the old buggy grouping too). Both were caught in review and corrected before commit; the rewritten test asserts both rows share `url_normalized` and then expects no group.
- Evidence: `uv run pytest tests/test_signal_dedup.py tests/test_demands.py tests/test_functions.py -q` → 70 passed (dedup rules, host scoping, suspect fallback, blank values, demand-citation and agent-patch skips, endpoint serialization and cleanup guards); `uv run lint-imports` → 3 kept, 0 broken; `tests/test_openapi_snapshot.py` → 1 passed (path set unchanged, consistent with the kind-only contract change); live dev API `GET /api/v1/signals/duplicates` → 200.
- Scale measured, not estimated (`scripts/probe_dedup_scan_cost.py`, scratch `eea_bench` on the local PostgreSQL, dropped afterwards; 10,400 signals + 10,400 tags, 700 expected groups): before the candidate prefilter `_load_candidates` 1.06 s and `scan_duplicates` 1.66 s loading every row; after prefiltering to duplicate `url_normalized`/`body_sha256` values, 0.15 s / 0.32 s with the same 700 groups (500 url + 200 body). The script refuses to run against a non-local host.
- Known limits (deliberate): `url_suspect` depends on the `(重复采集 #n)` title marker — if a re-capture is renamed, the pair is missed on purpose rather than risk merging different articles; the tracking denylist is name-based, so unknown keys still split re-captures (that is the suspect tier's job). Not yet done: review of real-library scan output (`eea_bench` is synthetic; the dev library has one known group).

## 2026-11-23

### Production Docker deploy on 10.215.35.10 (2026-11-23)

- Host: Ubuntu 22.04.5, Docker 29.1.3, Compose 2.40.3; repo at `~/projects/eea`, external port `8090` (`EEA_HTTP_PORT`); build proxy `10.215.8.87:1000`.
- `bash deploy/build.sh 10.215.8.87` built `eea-backend`/`eea-web` and started postgres, migrate, api, worker, web and nginx; all healthchecks green, `alembic_version = 0022_demand_review_baseline`.
- HTTP from the intranet: `/` 200 (Next.js), `/docs` 200, `/openapi.json` 200, `/api/v1/overview` 200, `/healthz` `{"status":"ok"}`; `/readyz` reports `database`/`object_dir` true and `semantic_gateway: degraded` because no model gateway is configured.
- Build fixes: `uv==0.13.1` pinned; `uv.lock` regenerated against the Tsinghua index declared in `backend/pyproject.toml`; dependency install split from `COPY backend` with a BuildKit uv cache mount; Debian apt sources switched to HTTPS; `postgres:16-alpine`; proxy build args wired through Compose; `.gitattributes` keeps deploy files LF.
- `build.sh` restarts Nginx after `compose up` because recreated api/web containers get new IPs; it then checks `/healthz` through Nginx before reporting success (a stale upstream produced 502 after the first rebuild).
- Fresh-database migrations 0019/0020/0021 made idempotent: `0001_init` runs `Base.metadata.create_all` with current models, so later `ADD COLUMN` / `CREATE TABLE` steps must tolerate existing objects.
- Still open: TLS and trusted identity in front of Nginx, semantic gateway credentials, a backup/restore drill, and Windows capture-client sign-off.

### Deploy hardening after the audit

- Runtime commands no longer use `uv run` (image CMD and compose migrate/worker/maintenance): they call `/app/.venv/bin/python -m ...`, so starting a container needs neither the network nor an environment sync.
- `backup.sh` / `restore.sh` run `tar` inside the already-present `api` image via `docker compose run --rm --no-deps`; an air-gapped host no longer has to pull `alpine:3.20` at backup time.
- `build.sh` fills an empty `DB_PASSWORD` (previously it only generated one when `.env` was missing), so copying `.env.example` by hand still starts.
- `deploy/README.md`: maintenance/status commands run from `deploy/` (Compose < 2.24 does not read `deploy/.env` from the repo root), and the API docs URL is `/docs` (Nginx has no `/api/docs` location).
- `docs/samples/` is git-ignored (customer workbook); `backend/TODO.md` and `backend/DEPLOY.md` no longer point at the removed systemd unit/timer.

Checks: `bash -n` on build/migrate/backup/restore; `build.sh` exercised against a `docker` shim for missing and empty `.env` plus full-URL proxy; compose parses (7 services) and resolves `.venv/bin/python -m ...` commands; no `alpine:3.20` or `"uv", "run"` remains under `deploy/`.

Still open: real `docker compose up` on a Linux/Docker host, empty-DB migration, nginx same-origin routing, and a backup/restore drill.

## 2026-11-20

### W4 attempt 1 (superseded): offline bundle scripts, no Linux host

Scope: everything OPS-02 can deliver without a Linux host. The install-and-run gate on a clean air-gapped machine stays open.

| Gate | Result |
| --- | --- |
| Next ships a self-contained server | PASS - `output: 'standalone'`; build produces `server.js` + traced `node_modules` (18.9 MB), `.next/static` and `public` copied alongside; Dockerfile runtime now runs `node server.js` instead of `pnpm start` |
| Bundle assembles with one command | PASS (layout) - `deploy/scripts/build-offline-bundle.sh` produces backend source + Linux site-packages + web + fonts + deploy templates + Windows client zip + `SHA256SUMS` + `MANIFEST.txt` |
| Install without network or compiler | SCRIPTED - `install-offline.sh` copies the tree, writes `/etc/eea/eea-api.env` once, runs `python3 -m alembic upgrade head`, enables 4 units; systemd units now use `/usr/bin/python3 -m ...` with `PYTHONPATH=/opt/eea/current/backend/site-packages` |
| Integrity gate | PASS - `check_offline_bundle.py` (used by build, verify and install) checks manifest, every checksum, layout, wheelhouse/dependency coverage and CJK font; 5 pytest cases cover pass, missing site-packages, missing font, tampered file, missing manifest |
| Bundle on disk here | PARTIAL - `dist/eea-offline-v0.1.0` assembled: 3,179 files, 53 MB, checksums verify, web standalone complete |
| Linux dependency tree | BLOCKED by network - this host downloads at ~20 KB/s; the ~150 MB Linux cp312 set does not finish. `uv pip install --python-platform x86_64-manylinux_2_28 --target ...` was proven to unpack Linux wheels correctly (fastapi probe), so the build step is expected to work on a connected build machine |
| CJK font | BLOCKED by host - no Noto CJK on Windows; the build script requires `fonts-noto-cjk` and the checker fails the bundle without it |
| Clean-host offline install | NOT RUN - needs the Linux target |

Real defect found and fixed while building the bundle:

- `markitdown[all]` pulled Azure Document Intelligence/content-understanding SDKs plus pandas (multi-GB wheelhouse, and the download never completed). Production only needs local converters, so the dependency is now plain `markitdown` plus explicit `mammoth` (docx), `pdfminer-six` (pdf), `lxml` (html) and `pandas` (xlsx). `tests/test_document_ingest.py` (24 tests: docx, pptx, xlsx, pdf, figures) passes with the narrowed set; the first attempt without pandas failed the xlsx test, which is why pandas is explicit.

Checks: backend `uv run pytest -q` (below), `test_offline_bundle_check.py` 5 passed, `test_document_ingest.py` 24 passed, frontend `pnpm build` with standalone succeeded.

Still open for OPS-02: run `build-offline-bundle.sh` on a connected Linux/CI machine, then `verify-bundle.sh` + `install-offline.sh` on the air-gapped target (empty DB, migrations, service start, PDF with CJK font).

### W4: production deploy is Docker Compose, one script

Decision: production runs on Docker Compose only. The offline site-packages bundle was dropped after it proved worse for a zero-knowledge maintainer: a multi-GB Linux dependency tree that could not be built on this host (~20 KB/s), host-specific CJK fonts, and five extra scripts to keep in sync.

What now exists in `deploy/`:

| File | Purpose |
| --- | --- |
| `build.sh` | The one command: optional proxy host, creates `.env` with a random `DB_PASSWORD` on first run, builds, starts, waits for health, prints next steps; a failed start tails migrate/api/web logs |
| `migrate.sh` / `backup.sh` / `restore.sh` | Deliberate migration re-run, pg_dump + object-store tarball with checksums, full restore with services stopped |
| `docker-compose.yml` | postgres, one-shot migrate, api, worker, web, nginx; `maintenance` behind the `ops` profile; healthchecks on postgres/api/web; migrate gates api/worker; a shared backend anchor so api/worker/migrate/maintenance cannot drift |
| `Dockerfile.backend` | accepts `PIP_INDEX_URL` for an intranet mirror |
| `Dockerfile.frontend` | Next `standalone` build, runs `node server.js` |
| `.env.example` | documented settings only |
| `README.md` | three-step first deploy, proxy rules, keep-it-running table, TLS/identity note, five common failures |

Removed: `deploy/scripts/` (offline bundle build/install/verify and the old compose wrappers) and the five systemd unit/timer templates. Bare metal is no longer a supported production path; history keeps them.

Checks run here (this host has no Docker daemon):

- `bash -n` passes on build/migrate/backup/restore.
- `build.sh` driven end to end against a `docker` shim: a plain run issues `up -d --build --wait`; `10.215.8.74` normalizes to `http://10.215.8.74:1000`; an explicit `http://10.1.2.3:3128` is kept as-is; `--no-cache` becomes `build --no-cache --pull` + `up --no-build`; `.env` is generated with a random password only when missing.
- `docker-compose.yml` parses and resolves the anchor: `api` inherits `APP_ENV`/`OBJECT_DIR`; `web` healthcheck runs `node -e fetch(...)`; migrate/api/worker/maintenance all point at `postgres:5432`.
- Backend suite passes with the narrowed dependency set (below).

Not verified (needs the Linux host): real `docker compose up`, image build behind a proxy, empty-DB migration on a fresh host, nginx same-origin routing, backup/restore drill, 10k performance.

Dependency change carried over from the bundle work: `markitdown[all]` pulled Azure Document Intelligence/content-understanding SDKs and a much larger tree. Now `markitdown` plus explicit `mammoth` (docx), `pdfminer-six` (pdf), `lxml` (html) and `pandas` (xlsx). `tests/test_document_ingest.py` (24 tests) covers docx/pptx/xlsx/pdf/figure extraction; the first attempt without pandas failed the xlsx case, which is why it is explicit.

### W3 queue captures: 10 web + 5 WeChat, honest failures

All captures went through the durable queue (`POST /api/v1/imports/capture-urls` → `awaiting_client` → Windows client `capture upload --drain-server` → server worker). No server-side public fetching.

| Gate | Result |
| --- | --- |
| Web sources with accurate title + readable body | **10 / 10** (3,628–32,883 chars) |
| WeChat sources with accurate title + readable body | **5 / 5** (483–65,337 chars) |
| Honest failures (no signal created) | 27+ jobs: HTTP 403 (nvidia CN? no — sciopen 403), Cloudflare/UNECE challenges, `chrome-error`, SingleFile errors |
| Duplicate submissions reuse the same batch | PASS (same `sha256` → same batch) |
| Queue survives client kill and restart | PASS (killed client, `POST /capture/jobs/{id}/client-release`, next run claimed the remaining jobs) |
| One hanging page no longer blocks the queue | PASS (see fix 1) |

Web set: CCC Digital Key 3.0, book118 固态储能专利文档, eet-china 60GHz 舱内监控, sohu 60GHz, UML TSN, UML AUTOSAR 软件架构, UML AUTOSAR SecOC, 百家号 从单体到芯粒, 百家号 MIPI A-PHY v2.0, zsc L2/L4 章节。微信：EEA 总结报告、技术与标准化、座舱团体标准、AutoE/E 2025、UWB 数字钥匙。

Three real defects found and fixed this wave:

1. **A single hanging page stalled the whole queue.** `importdrain` passed the batch context to `engine.Capture`, so one 9-minute page blocked every remaining job. Added a per-job timeout (`EEA_CAPTURE_JOB_TIMEOUT`, default 3m); a timeout is recorded as a failure instead of being re-queued forever. Test: `TestDrainTimesOutOneHangingJobAndContinues`.
2. **JSON error payloads became evidence.** A blocked Zhihu page returned `{"error":{...}}` with the URL as title; it was archived as “retained”. The page-state probe now treats a JSON error body and server error pages (“An error occurred”, “page you are looking for is currently unavailable”, 404/5xx, Access Denied) under 1,200 chars as unreadable shells, checked before the ready branch. Tests: `TestCaptureRejectsJSONErrorPayload`, `TestCaptureRejectsServerErrorPage`.
3. **`--drain-server` printed `0 ok, 0 failed`.** The summary only counted the local queue, so a run that captured 12 pages looked like a no-op. It now also prints `server drain: N ok, M failed`.

Also removed two false-positive signals (`samr` “Error” pages) that the previous detection let through; their jobs remain failed with a readable reason.

Checks: `go test -short ./...` all packages pass, `go vet ./internal/...`, `gofmt -l internal cmd` clean; backend suite unchanged (run below). Real-browser tests for the three rejection paths pass on Edge 157.

Still open: nvidia.cn blog page never finishes within 9m (needs a visible browser / longer budget), eefocus redirects to a captcha, cnblogs trips a SingleFile JS bug, `std.samr.gov.cn` now returns an error page. WeChat paywalled articles and the 10-page clinical acceptance on a clean business machine remain DOC-02/DOC-05 items.

### W2 document blocks, agent and report gates

**B. 文档图块（真实 eFuse Word，经 API 上传）**

| Check | Result |
| --- | --- |
| 7 张不同图片 / 8 次插入（图 1 插入两次） | PASS |
| 7/7 图注由 qwen3.8-27b-fp8 生成，review_status=ready | PASS |
| 图 1–7 分别落在环节一…环节六的 section_path | PASS |
| 18 个标题路径 chunk，正文可读（每条 13–861 字符） | PASS |
| 7/7 图块图片端点返回 >1 KB 二进制 | PASS |
| /extract-keywords 返回分层关键词与来源 | PASS |
| 扫描型 PDF：ingest_status=failed + OCR 指引；再建信号被 422 拒绝 | PASS |

**A. 产品内 Agent（真实网关 glm-5.3-w4a8-o）**

| Check | Result |
| --- | --- |
| 会话创建绑定信号，按 signal_id 过滤可查 | PASS |
| 真实网关完成回答并回传 served_model | PASS（一次上游 504 被如实记为 turn.failed，重试成功，未伪造回答） |
| 回答携带 doc:id:chunk 引用，可用 | PASS |
| 事件流可重放：turn.started → tool.call → citation → turn.completed | PASS |
| 负例：伪造引用不能生成变更单 | PASS |
| 记忆写入 / 按用户列出 / 删除 | PASS（200 / 204） |
| 变更单确认只应用一次（重复确认 409），审计仅 1 条 | PASS |
| 负例：已人工确认字段禁止自动覆盖 | PASS（409，人工确认保护） |
| 负例：基线变更后过期变更单被拒 | PASS（409） |
| 负例：拒绝变更单后业务数据不变 | PASS |
| 文档研究问答引用真实章节/图块 | PASS |

**R. 链路报告**

| Check | Result |
| --- | --- |
| Markdown 报告含落脚点/功能五步/需求五步/交叉验证/九宫格/战略段落 | PASS |
| PDF 中文可提取（2,415 字符，7.7 KB），含 20 分与实质标准 | PASS |
| 九宫格区分“实质条款 / 未填写 / 明确留空” | PASS |
| 报告与追溯使用同一落脚点与两条真实证据 | PASS |

本轮修复的三个真实缺陷：

1. 报告此前只取主题下第一条信号做“追溯摘要”，第二条直接证据不可见，且不含任何链接。改为新增「## 原始证据」段落，逐条列出标题、URL、渠道、发布主体、发布时间、证据状态与信号 ID，并标注失效引用。
2. GET/POST /reports 不返回 created_at、finished_at、data_snapshot_json，无法追溯生成时间；已补入响应契约。
3. 失效落脚点曾被外键约束打成 500；现于建行前校验目标，返回 404 landing point not found。

回归用例：tests/test_chain_reports.py 新增 3 条（证据链接齐全、失效目标 404、时间戳字段），合计 5 passed；全量 505 passed / 2 skipped，lint-imports 3/3，客户端 go test -short ./...、go vet、gofmt 干净。

仍开放：电气工程师业务签字、Linux 字体容器与网关时延、pw:chain 浏览器用例、真实业务黄金集。
### W1 real eFuse chain: stage-by-stage gate run

Two real captured sources carry the chain (no synthetic evidence): 佐思汽研 report via WeChat (`https://mp.weixin.qq.com/s/E6Q06Gjf2U9B23OmPUd09g`) and EDN 电子技术设计 on NIO ET9 (`https://www.ednchina.com/technews/31623.html`). They differ in URL, channel, publisher and tag set, which the cross-validation gate requires.

| Stage | Check | Result |
| --- | --- | --- |
| S1 证据 | Both sources retained with readable bodies (39,042 B / 4,188 B); different URL and channel | PASS |
| S2 标签与主题 | Publishers set from body/site identity; tag sets differ; theme `低压系统智能化` (creation_supply) with 2 signals / 2 sources | PASS |
| S3 需求 | Rejections: single evidence (422 REQ-DEM-10), conclusion≠通过 (422), four-of-five steps (422), researcher confirm (403 REQ-DEM-13) | PASS |
| S3 需求 | Admin confirmation of the two-source demand → `confirmed` | PASS |
| S4 功能 | Incomplete five-step forward trace refused (422 REQ-MAP-02); full forward + matching reverse coverage published | PASS |
| S5 落脚点 | Landing point on an unpublished function refused (422); `智能保险丝（eFuse）` created in 硬件 | PASS |
| S6 标准 | Two substantive clauses + operations row with NULL text; panorama `standard_count=2` | PASS |
| S7 战略 | No deployment-boundary standard → funnel blocked (422); scoring before Tier1 → 422; score 6 → 422 | PASS |
| S7 战略 | Tier1 reject exits without scores/classification and cannot then be scored (422); pass path scores 4/4/3/4/5 = **20**, classification 产业投资/生态合作, assessment version persisted | PASS |
| S8 追溯 | `complete=true`, all five stages present, reaches both real signals, carries 20/25 + 2 substantive standards, `basis_freshness=fresh`, overview counts match | PASS |

Run: **30/30 checks passed**. Chain ids: theme `e8018dc6…`, demand `低压系统智能化（W1 真实链）`, function `全节点智能配电（W1 真实链）`, landing point `695dac19-29bf-49b8-a021-00fa56f1318c`.

A second landing point `智能保险丝（eFuse，适配拒绝样例）` is kept on purpose: it records the Tier1-reject path (one standard, funnel at `rejected`, no scores). The two negative demands used to prove S3 were deleted after the run.

Known limits: the two direct-evidence sources are real web/WeChat articles, but they are **not** the DOC-02 case-specific pair (网页 2026-06 / 微信公众号 2026-03); that material is still missing. Publishers were completed from the article body (佐思汽研) and site identity (EDN), which is metadata completion, not invented attribution. Business sign-off by an electrical engineer and Linux evidence remain open, so BE-06…BE-11 stay open.

### W0 baseline freeze and DOC-03 sync

- DOC-03 synced with the real schema: migration head `0022_demand_review_baseline`, chain `0001`–`0022`, **31 `eea_*` tables + 2 views** (asserted by `test_db_schema.py`). [ARCHITECTURE-LAYERS.md](../docs/ARCHITECTURE-LAYERS.md) gained a migration/data-model section, the third import-linter contract (`domains` must not import `api`), a recent-contract table, and a new acceptance hook row for `alembic heads` + schema inventory. [docs/TODO.md](../docs/TODO.md) records the same head and the 2026-11-20 interface changes.
- Full matrix on the Windows dev host (portable PostgreSQL): `uv run pytest -q` **502 passed, 2 skipped**; `uv run lint-imports` **3/3 kept**; `alembic downgrade -1` + `upgrade head` back to `0022_demand_review_baseline`; frontend `pnpm typecheck`, `pnpm build`, `pnpm antd:lint` (0 errors, 4 pre-existing deprecation warnings), `node --test tests/*.test.cjs` **22 passed**; Playwright `pw:smoke` **2 passed** and `pw:roles` **3 passed**; client `go test -short ./...`, `go vet ./internal/...`, `gofmt -l internal cmd` clean.
- `pw:chain` was not part of this run: it needs `EEA_PW_SEED_FILE` from `scripts/seed_smoke_chain.py`, and the dev database currently holds the 49 real panorama signals rather than a seeded sample chain. It passed earlier on 2026-11-19 against a seeded chain.
- Scope note: the commit freezes the whole working tree (W0 = freeze current changes), including concurrent backend/client/frontend slices whose tests are green in this run. `docs/samples/` (customer-provided 亿欧 panorama workbook) stays untracked: it is a private source document.

### Panorama sample capture run (real sources)

- Cleared the dev database (`eea`) of business chain data with a `pg_dump` backup first: signals 32 -> 0, themes 5 -> 0, landing points 3 -> 0, demands/functions/documents/capture jobs -> 0; `eea_vocab` (39 rows) and migrations preserved.
- Parsed `docs/samples/【德赛西威-亿欧】EEA技术全景图 1105 (1).xlsx` with the workbook parser: 88 sources, 285 chain rows, 18 difference rows, 32 demand names, 5 domains. The server rejects workbook upload by design, so the 93 unique 「数据来源」 links were imported through `POST /api/v1/imports/capture-urls`.
- Fixed a real routing gap: URL-list jobs were created without `owner_subject`, so a `researcher` client could not list them (`/capture/jobs` filters by subject). Jobs now carry the importing operator; `test_capture_url_list_jobs_belong_to_the_importing_operator` covers it. Re-importing the same list returns the same batch.
- Drained the queue through the Windows client (`capture upload --drain-server --headless`, Edge + SingleFile). Result: **49 signals retained, 23 honest failures** (HTTP 403, refused connections, Cloudflare/UNECE challenges, SingleFile errors), 14 still awaiting, 1 held by a killed client until its 30-minute lease expires.
- Fixed three false-success paths found by this run: (1) challenge pages that ship an `<article>` shell were accepted because detection required `!hasArticle` — a challenge title with a short body now rejects; (2) login walls that leave the URL as the document title now reject as empty shells; (3) documents whose parse failed still produced a retained signal, and PDFs whose only text was the figure section looked readable — parse failure now returns 422 (raw blob kept) and PDFs need 120+ characters of text.
- Fixed thin document summaries: a PDF with no Markdown headings produced a 42-character body even with a 92 KB canonical. The summary now appends a sanitized prose lead (no HTML comments, base64 images, or 「图块语义」) when the heading summary is short; the 5 affected signals were re-written through `PATCH /signals/{id}` with audit rows.
- Quality audit of the 49 signals: 0 suspicious (no URL-as-title, no verification shell, no tiny body); 5 WeChat, 44 web, 5 document-backed.
- Checks: `test_document_ingest`, `test_document_signals`, `test_panorama_import`, `test_url_list_capture`, `test_capture_jobs` **52 passed**; `go test -short ./internal/capture ./internal/importdrain` passed; `gofmt -l` clean; `uv run lint-imports` 3/3.
- Still open: 14 queued URLs were not captured in this run; paywalled/verification sources need a visible logged-in browser; no Linux evidence.

## 2026-11-19

### Baseline matrix and review-baseline slice

- Full local matrix on the Windows dev host (portable PostgreSQL `eea_test`): `uv run pytest -q` **469 passed, 2 skipped**; `uv run lint-imports` **3/3 kept**; `pnpm typecheck`, `pnpm build`, `pnpm antd:lint` (0 issues; 4 pre-existing deprecation warnings), `node --test tests/*.test.cjs` **22 passed**; `go test -short ./...` passed; Playwright **2 trace + 2 seeded chain + 3 role tests passed**; the chain asserts both substantive standards and 20/25. The chain seed ran through a temporary `platform_admin` instance on :8010 because the dev API operator is `researcher`.
- Fixed the stale schema inventory for `0021_signal_studio_artifact`; the backend suite had been red on `test_migration_creates_exactly_the_enumerated_tables_and_views`.
- Added migration `0022_demand_review_baseline`: backfills `confirmed_at = updated_at` for already-confirmed demands without a baseline, removing `unknown_untracked` for legacy rows. Downgrade is a deliberate no-op.
- Trace responses now include `document.figure_indices`; the trace page renders one evidence link per stored figure and falls back to the first figure when an older API omits the field.
- Added a real-source regression test for the supplied eFuse Word: `doc_ingest.extract_figures` returns 7 images and 8 insertions (image1 twice); the test skips when the source file is absent.
- Ran the real eFuse Word through vision ingest on the dev host: **7/7 figures captioned** by qwen3.8-27b-fp8, canonical 9,426 chars. Human semantic review and Linux gateway evidence remain open.
- Scanned PDFs without a text layer now fail explicitly with an OCR hint and keep the raw blob; unit and upload regressions were added in `tests/test_document_ingest.py` (20 passed).
- Declared and locked `pdfplumber` (PDF figure extraction already imported it but it was missing from the lock). The PDF report test now extracts text with pdfplumber and asserts Chinese content (`链路报告`, `智能保险丝（eFuse）`).
- Built the Windows client package `v0.1.0`: `capture.exe`, `capture-v0.1.0-windows-amd64.zip`, and `SHA256SUMS`. After `capture doctor` staged the SingleFile extension, the rebuilt zip has 193 entries including `data/extensions/singlefile/manifest.json`. `doctor` reported Edge, backend, auth, capture, and SingleFile all OK. Real browser capture is covered below; clean-machine acceptance remains open. `gofmt -w` cleaned the pre-existing `internal/capture/extension_resolve.go`.
- Verified a real Windows capture end to end: Edge 157 + SingleFile loaded after adding `DisableLoadExtensionCommandLineSwitch`; `capture upload --url --headless` created server job `68b47471…` (succeeded) and retained signal `c8d9a463…`; archive (387 B) and body (122 B) both return 200. This closes the local-page path only; CAPTCHA/WeChat/queue-restart cases remain open.
- Scheduled the existing orphan cleanup in deployment: Compose `maintenance` profile (`docker compose --profile ops run --rm maintenance`) and `deploy/eea-maintenance.service`/`.timer` for bare metal. It still prunes only resolved blobs; terminal capture-job retention remains open.
- Later full-suite run after the PDF/client slices: **495 passed, 2 skipped, 1 timing-flaky failure** in `test_stream_winner_notifies_the_resolver`; the isolated file rerun passed **11/11**. Concurrent additions to `tests/test_llm_*` landed during this run, so the total is not directly comparable to the 469 baseline. `uv lock --check` passed.
- Still open: real Word human semantic review, Linux and real-business evidence; the figure links are not yet exercised by a Playwright document fixture.



### SingleFile saved-page source URL

- [ingest-source-url.ts](../frontend/lib/ingest-source-url.ts) now reads the URL from the `Page saved with SingleFile` provenance comment first (and the legacy `saved from url=(…)` form), before falling back to `canonical` / `og:url` / `twitter:url`. Tags are parsed attribute-wise, so SingleFile's unquoted rewrite (`<link rel=canonical href=https://…>`, `<meta property=og:url content=…>`) resolves, and `&amp;` is decoded.
- Dragging a saved `.html`/`.htm` onto 导入证据 no longer fails with “HTML 中找不到 http(s) 来源链接” for SingleFile pages. A file with no usable source URL still refuses rather than fabricating one, and a URL pasted in the text box remains the fallback.
- [archive.go](../client/internal/archive/archive.go) applies the same order and unquoted-attribute support, so the Windows GUI drop and `capture upload --html` agree with the web importer.
- Checks: new `frontend/tests/ingest-source-url.test.cjs` 9 passed (`node --test tests/*.test.cjs` → 16 passed); `go test ./internal/archive ./internal/queue` passed; `pnpm typecheck`, `pnpm build` and scoped `antd lint components/import/new-signal-import.tsx` passed. The reported sample (`07ff4a69-bf49-4b62-a928-1e56e82787a8.htm`) resolves to `https://www.eet-china.com/mp/a491751.html` in both the browser and Go parsers.
- Still open: a real Windows run that drops the file into the packaged client, and Linux intranet evidence.

### Dashboard import guidance for client capture

- 导入证据面加入常驻说明：网页采集调用本机 EEA Capture 客户端（需保持客户端在线）；拖入的 HTML 快照与文档由平台直接解析入库。
- 粘贴多条链接时显示“N 条链接由本机 EEA Capture 客户端采集”提示条和「复制链接」按钮，复制后可直接粘贴到客户端窗口；平台排队按钮改名为「排队等待客户端采集」，排队任务仍由在线客户端领取后回传快照。复制使用 Clipboard API，被浏览器拒绝时提示手动复制。
- 侧栏说明和提交提示同步改写，避免把“已排队”误读成“已抓取”。
- Windows GUI ([app.go](../client/internal/ui/app.go)) 补齐后台领取：每 20 秒领取 `awaiting_client` 链接任务，在本机浏览器采集后回传；与本地队列通过 capture ownership 互斥共用浏览器，关闭窗口或取消时交还领取中的任务，完成后在状态行提示成功/失败数。
- [drain_test.go](../client/internal/importdrain/drain_test.go) 覆盖领取→采集→回传顺序、无 URL 跳过、采集失败标记与取消时释放。
- Checks: Playwright (Edge, dev API + worker) confirmed both hints render, `复制链接` puts the two links on the clipboard, and copying issues no `/imports/capture-urls` request; `pnpm typecheck`, `pnpm build`, scoped `antd lint components/import/import-unified-surface.tsx` passed; `node --test tests/*.test.cjs` 16 passed. Client (Windows host): `go test -short ./...` passed including the 4 new importdrain tests, `go build ./...`, `go vet ./internal/ui ./internal/importdrain` and `gofmt -l` clean.
- Still open: the packaged Windows client was not driven against a real queued batch in this slice (unit tests and a Windows build only), and the copy was reviewed on the dev host only.

### Chat model first-byte hedge, progress heartbeat and model disclosure

- Added [hedged_model.py](../backend/app/services/hedged_model.py): `race_first` and `HedgedChatModel` start candidate 1 immediately, start the next only when no first stream event arrives within `CHAT_HEDGE_DELAY_SECONDS` (default 10s), cap parallel candidates at `CHAT_HEDGE_MAX_MODELS` (default 3), and cancel/close every loser once one candidate emits its first event. A candidate that fails before its first event frees its slot immediately.
- `llm_gateway.chat_completion` uses the same race for non-streaming calls; `pydantic_agent.build_hedged_model` wraps the existing model chain for the durable agent, so one configured model keeps the old behavior.
- `agent_runtime` emits `turn.progress` every 5 seconds with elapsed seconds and bounds the whole turn by `AGENT_TURN_TIMEOUT_SECONDS` (default 90s). `POST /agent/sessions/{id}/messages` and the final SSE `message.completed` now return `served_model`, read from the winning provider response.
- The frontend stream keeps the cancel button alive while enforcing a client deadline via `AbortSignal.any` + `AbortSignal.timeout`, and shows the serving model under the answer after a completed turn.
- New env knobs are documented in [backend/.env.example](../backend/.env.example): `CHAT_HEDGE_DELAY_SECONDS`, `CHAT_HEDGE_MAX_MODELS`, `CHAT_REQUEST_TOTAL_TIMEOUT_SECONDS`, `AGENT_TURN_TIMEOUT_SECONDS`.
- Checks (dev host, portable PostgreSQL `eea_test`): targeted `test_hedged_model` + `test_agent_workflow` + `test_agent_runtime_stream_buffer` + `test_llm_gateway_models` **36 passed**, including a streaming first-token winner/loser-cancellation case; full suite **458 passed, 2 skipped** (an early run hit a wall-clock flake in `test_basis_freshness_turns_stale_after_signal_patch`; it passed on isolated rerun and both subsequent full runs); `pnpm typecheck`, `pnpm build`, `pnpm antd:lint` passed (four pre-existing deprecation warnings outside this slice). Live SSE against the real gateway completed with 13 `turn.progress` events, one `text.delta` and `served_model` populated.
- Still open: Linux intranet gateway latency/cancellation timing, and Playwright coverage of the post-answer model line.

### Chat stream carries reasoning and tool events

- `run_agent_turn` now consumes the event stream pydantic-ai 2.x hands to `event_stream_handler` (an async iterable; the old handler took one event at a time, so tool events never fired). [agent_workflow.py](../backend/app/services/agent_workflow.py) translates `ThinkingPart`/`ThinkingPartDelta` into `thinking.delta` and `FunctionToolCallEvent` into `tool.call`; the output tool (`final_result`) stays hidden. Final answers keep streaming as `text.delta` from the validated partial output, with `text.replace` when partial validation rewrites earlier text.
- `agent_runtime` still buffers durable events for replay but no longer writes `text.delta`, `thinking.delta` or `turn.progress` rows per token; the stored assistant message is the transcript.
- The evidence chat renders a muted 思考过程 bubble while the model reasons, names tools by business action (检索证据/检索文档/…), shows a caret on the streaming answer, and follows the message list to the bottom until the reader scrolls up ([dashboard.css](../frontend/app/dashboard.css)).
- Checks (Windows dev host, no PostgreSQL running): `tests/test_agent_stream_events.py` + `tests/test_agent_runtime_stream_buffer.py` **4 passed**; `pytest -m no_db` **107 passed, 1 skipped, 1 failed** — `test_skills_eval_cli_json` fails on a pre-existing console-encoding read of its subprocess (GBK), not on this change. Live probe against the model gateway: reasoning produced 11 `thinking.delta` chunks whose text equals the stored `ThinkingPart`, then 32 `text.delta` chunks, completed in about 8s. `pnpm typecheck`, `pnpm antd:lint` (0 issues) and `pnpm build` passed.
- Not run here: DB-backed `test_agent_workflow`/SSE suite (needs the portable `eea_test` database) and browser verification of the thinking bubble. Still open: Linux intranet latency and a Playwright case for streamed tokens.

### Role-restriction and seven-stage Playwright smoke

- Added backend/scripts/seed_smoke_chain.py: builds one labelled acceptance chain through the public REST API (signal → theme → confirmed demand → published function → landing point → two standards → assessment) and prints the ids. Demand confirmation needs an admin role, so the seed is run against an isolated dev DB with DEV_OPERATOR_ROLE=taxonomy_admin, then the API is restarted with the normal role.
- Added frontend/tests/e2e/role-restrictions.spec.ts (OPS-03):
  - a researcher cannot issue or list capture tokens (403),
  - a caller cannot promote itself by putting role: platform_admin in the request body (403/422),
  - a direct x-eea-authenticated-user / -role header does not become the server identity; whoami keeps the real subject and role, and session ownership stays scoped to it.
- Added frontend/tests/e2e/chain-smoke.spec.ts: walks the seeded chain across /signals, /topics, /trace, /technology and /traceDetail/{lp} and asserts the real titles, theme, relation rows, the two standard texts, and that no /api/v1 request fails. The first test also cross-checks the trace API reaches the seeded signal and that completeness reports all five stages present.
- Added frontend/tests/e2e/README.md documenting the three commands, the seeding prerequisite, and what is deliberately not asserted.
- Playwright config keeps the host Edge channel; scripts pw:smoke (trace), pw:chain (chain), pw:roles (roles).
- Checks: backend full suite 452 passed, 2 skipped; frontend pnpm typecheck and pnpm build passed; Playwright 7 passed in one run (2 trace + 2 chain + 3 role) against the dev API and Next dev server.
- Still open: Linux intranet proxy/TLS evidence; the role matrix covers capture tokens, body-role escalation and identity headers only; real Word figure acceptance and PDF OCR remain open.

### Figure retry authorization (OPS-03 slice) and trace smoke test

- POST /documents/{id}/figures/{n}/recaption now depends on get_operator_identity and rejects roles outside researcher/taxonomy_admin/platform_admin with 403. The role is read from the server identity (trusted proxy headers in production, configured operator in development), never from the request body.
- A successful retry writes a CorrectionAudit row (entity_type document_figure, field caption:{index}, old/new caption, operator subject/role, reason 单图重新识别) in the same transaction as the caption update.
- Added @playwright/test with playwright.config.ts reusing the host Edge/Chrome channel (EEA_PW_CHANNEL overrides it) because the intranet image ships no browser download. pnpm pw:smoke runs only tests/e2e/trace-smoke.spec.ts.
- Trace smoke coverage: /trace renders the server relation rows when the panorama API returns landing points, otherwise the real empty state with no demo rows; no /api/v1 request may fail during load. /traceDetail/{unknown-uuid} asserts the API returns 404 and the page shows 无法打开这条追溯链 plus 该技术落脚点已不存在.
- Checks: backend full suite 452 passed, 2 skipped; test_figure_recaption.py 8 passed (added role-denied 403 and audit-row assertions). Frontend pnpm typecheck and pnpm build passed; pnpm pw:smoke 2 passed against the local API (8000) and Next dev server (3000) using the Edge channel.
- Still open: the smoke test runs against a dev-host Edge, not the Linux intranet; it does not yet seed a landing point, so the relation-row branch is only covered when data exists. Playwright browser download is not bundled.

### Document research: multi-session switching and per-figure retry

- GET /agent/sessions now accepts `signal_id` and filters on `page_context.signal_id`; AgentSessionOut returns page_context so a client can confirm scoping. Filtering stays inside the operator-subject predicate.
- The evidence assistant lists sessions for the current signal, shows a selector once more than one exists, and has a 新建会话 button. The last session id is remembered per signal and restored after reload; switching resets events, citations and the live answer before loading the other conversation.
- POST /documents/{id}/figures/{n}/recaption retries vision recognition for one stored figure only: the image object is reused, the caption marker is rewritten in canonical Markdown, chunks are rebuilt, and a failed model call leaves the text intact with review_status=needs_review plus an explicit reason.
- The document research panel adds 重试识别 per figure and refreshes figures, chunks and document detail after the retry.
- The trace view replaces the generic evidence link with 查看首张图块, which navigates to singal/{id}?doc_figure=1 so the research tab opens focused on figure 1.
- Checks: backend full suite 450 passed, 2 skipped; test_figure_recaption.py 6 passed; test_agent_workflow.py 15 passed; OpenAPI path snapshot refreshed. Frontend typecheck, pnpm build and scoped antd lint (components/evidence, views/trace) passed; tests/document-research.test.cjs 4 passed.
- Browser (dev host, local PostgreSQL, real gateway vision model): opening singal/{id}?doc_figure=4 opened the research tab with figure 4 active; retrying figure 8 in the panel changed it from 待复核 to 已就绪 with a caption; the session selector listed two signal-scoped sessions and switching to the older one loaded its two stored messages; after reload the remembered session was restored.
- Still open: real Word seven-figure/eight-insertion acceptance, PDF OCR and Linux browser evidence. Retry authorization and audit were added in the 2026-11-19 OPS-03 slice above.



### Chat streaming with non-stream fallback

- Added POST /agent/sessions/{id}/messages/stream: SSE that forwards turn.started, tool.call, citation, text.delta and a final message.completed (or message.failed) payload while the existing POST /messages stays the non-stream endpoint.
- run_agent_turn now uses agent.run_stream + stream_output when an event sink exists, emits answer deltas, and keeps agent.run for callers without a sink.
- The frontend streams the answer into the chat bubble; if streaming is unavailable or fails before any text arrives, it falls back to the existing synchronous POST + SSE replay path.
- Checks: backend full suite passed (443 passed, 2 skipped); agent workflow tests passed (14); OpenAPI path snapshot updated; frontend typecheck, build and scoped antd lint passed. Browser smoke showed live incremental text in the assistant bubble; a 22-delta stream completed with status completed.

### Chat model auto-discovery and runtime fallback

- When CHAT_MODEL is empty, resolve_chat_model reads the gateway model list, probes candidates with a content-returning completion, and caches the first model that returns non-empty assistant content. Reasoning-only replies are rejected.
- chat_completion now defaults to multiple model attempts. Empty content, 404 model errors and retryable upstream failures fall through to the next candidate; the successful model replaces the runtime cache when CHAT_MODEL is unset.
- Force resolution clears the cached chat model before probing. Explicit CHAT_MODEL remains the first attempt but fallback candidates are still available.
- Checks: full backend suite passed (443 passed, 2 skipped); test_llm_gateway_models.py passed 14 tests. Live probe with CHAT_MODEL empty resolved glm-5.3-o-anthropic and returned content. Live fallback from a cached empty-content Qwen3.6-35B switched to glm-5.3-o-anthropic and updated the cache.

## 2026-11-18

### Model gateway availability probe

- backend/.env has chat, embedding and rerank credentials; vision uses Qwen3.8-27B, embedding uses Qwen3-Embedding-8B, rerank uses Qwen3-Reranker-8B. CHAT_MODEL stays empty and resolves a content-returning model at runtime.
- Live gateway checks: 17 model ids; Qwen3.8-27B and glm-5.3-o-anthropic return content; Qwen3.6-35B returns reasoning_content with empty content; several other candidates return 503 or timeout.
- Live feature checks passed: structured tag suggestions (llm-rerank-refine), theme naming, excerpt generation, evidence studio report/mindmap/infographic/audio, agent session with document citation, demand assistant with two non-document retained signals, document vision captions, 4096-dimensional embeddings, rerank and semantic RAG citations.
- CHAT_MODEL remains empty. Auto-probe now validates non-empty content and resolves glm-5.3-o-anthropic; the reasoning-only Qwen3.6-35B is skipped. No secret values were printed or recorded.
- Agent skills remain in baseline mode because no approved business skill packs are present. OCR and image-generation models are listed by the gateway, but the application has no OCR or image-generation feature path in this slice.

### FE-11 — document research view

- Added a shared document research panel that groups document chunks by section path, renders canonical section text, lists section keywords, and shows figure thumbnails with ready/needs-review status and review reasons.
- Document sources now expose a research tab in evidence detail. Selection is persisted through doc_chunk and doc_figure query parameters, so refresh restores the active section or figure.
- The assistant now collects citation SSE events and renders citation buttons when an onCitation handler is available; document chunk and figure refs open the research tab and focus the target.
- The document import result now opens the same research panel in a modal; temporary figure/keyword tag lists and duplicate loading buttons were removed.
- Evidence: [research panel](../frontend/components/evidence/document-research-panel.tsx), [helpers](../frontend/lib/document-research.ts), [evidence detail](../frontend/views/dashboard/workspace.tsx), [assistant citations](../frontend/components/evidence/evidence-assistant-chat.tsx), and [tests](../frontend/tests/document-research.test.cjs).
- Checks: node document research tests passed (3); pnpm typecheck passed; pnpm build passed; scoped antd lint zero issues for changed components. Browser smoke with a synthetic PPTX showed 3 section chunks, 2 needs-review figures with reasons, figure image loading, doc_figure=1 URL persistence after reload, and a working document signal research tab.
- The 2026-11-26 walkthrough below covers a real 42-chunk/16-figure document signal and fixed the unbounded keyword model call. The 2026-11-26 import-result walkthrough below closes the modal path. Remaining: live Agent citation E2E still needs a working gateway or a controlled event fixture; Playwright and 320 px responsive acceptance remain open. FE-11 parent stays open.

- 2026-11-26 document research walkthrough and keyword latency fix: the document-source evidence page loaded the 文档研究 tab for a real 42-chunk/16-figure PDF signal; figure images served from /documents/{id}/figures/{n}/image, each with 定位图块 / 重试识别. Found that GET /documents/{id}/keywords called the model inline with no timeout: a slow gateway produced a 30s+ request (and an orphaned earlier dev stack also served stale code). The endpoint now wraps suggest_tech_tags in a 12s wait_for, falls back to alphanumeric jieba terms, and caches the parsed rows for 10 minutes (process-local, keyed by document + canonical object key, bounded to 64 entries). Live check: first call 14.3s with source jieba-frequency, second call 26ms; pytest tests/test_document_ingest.py -> 28 passed (the new test pins timeout fallback and cache). Remaining: the import-result modal path still needs a real upload run.

- 2026-11-26 import-result fix and walkthrough: a successful document upload previously navigated to the evidence detail immediately, so DocumentIngestResult (canonical excerpt, 文档研究, 查看完整 Markdown, 新标签打开, 刷新状态) was never visible. Document results now stay on the import page; web-signal results still auto-navigate. The result receives signalId, shows 打开信号, and hides 保存为信号 so a second signal is not created. Controlled upload of fe11-import-smoke-20261126.md: parsed, 3 chunks, 0 figures, 5 keywords; the preview modal showed the full canonical text; the research modal showed the section tree, keywords and the no-figures message; 打开信号 navigated to /singal/{id}. The test signal, document, capture job and object files were deleted afterwards. pnpm typecheck and pnpm antd:lint passed.

### BE-13 — declarative skill rules and reproducible evaluation

- Skill packs are validated YAML/JSON objects with schema version, pack version, checksum, field rules, match terms, priority and reason. Invalid packs and duplicate name/version are rejected and exposed through the skills status endpoint.
- Approved business rules now run before model/frequency fallbacks for value-chain stage, signal type and technical tags. Conflicts and the winning source are persisted in signal.classification_basis; explicit operator values win.
- The evaluator reads a JSON/YAML gold set, reports overall/stage/type/tag accuracy, failure samples, thresholds and latency, and exits nonzero when non-baseline thresholds fail. Its default 20-item fixture is explicitly synthetic and does not count as business accuracy.
- Evidence: [skills loader](../backend/app/services/skills.py), [evaluator](../backend/app/services/skill_eval.py), [signal integration](../backend/app/domains/evidence/signal_record.py), [migration](../backend/migrations/versions/0020_signal_classification_basis.py), and [tests](../backend/tests/test_skills_eval.py).
- Checks: full backend suite passed (441 passed, 2 skipped); BE-13 unit tests passed (7); signals/agent regression slice passed (36); lint-imports passed; migration upgrade/downgrade/upgrade passed on eea_test; frontend typecheck/build passed.
- Remaining: DOC-02 approved business packs and a real 20-item human-labelled gold set, real model/gateway quality and latency measurements, and business sign-off. BE-13 parent remains open.

### BE-12 — document figure assets and heading-aware chunks

- Added additive migration 0019_document_structure for figure asset metadata and chunk section fields.
- Successful ingest now stores figure bytes in object storage and persists source, page, position, section path, occurrence count, confidence, review status and review reason. Failed reingest rolls back and keeps the previous canonical text and index.
- OOXML reference counting distinguishes seven distinct images from eight insertions; identical bytes share one asset and sum their occurrence count.
- Added document chunks API and figure image endpoint; figure and keyword responses carry section paths and chunk references.
- Evidence: [doc ingest](../backend/app/services/doc_ingest.py), [section parser](../backend/app/services/doc_structure.py), [document API](../backend/app/api/v1/documents.py), and [migration](../backend/migrations/versions/0019_document_structure.py).
- Checks: full backend suite passed (430 passed, 2 skipped); lint-imports passed; frontend pnpm typecheck and build passed. Migration upgrade/downgrade/upgrade passed on eea_test.
- Remaining: real Word seven-image/eight-insertion visual acceptance, PDF missing-text/OCR review case, Linux service and Windows client evidence. The BE-12 parent task remains open.

## 2026-11-17

### BE-14/BE-04 — semantic RAG retrieval

- `search_rag` now keeps exact keyword hits, then falls back to document-chunk embeddings when keywords miss. It cosine-ranks up to 120 chunks and sends the top 32 to the configured rerank model before returning citations.
- Embedding and rerank failures degrade explicitly: rerank failure keeps embedding order; embedding failure returns a semantic-unavailable reason instead of pretending a match.
- Evidence: [RAG service](../backend/app/services/agent_rag.py) and [semantic RAG tests](../backend/tests/test_agent_rag_semantic.py).
- Checks: `uv run pytest -q tests/test_agent_rag_semantic.py` passed (2 tests); `uv run pytest -q tests/test_agent_workflow.py` passed (13 tests).

### BE-04 — strict separate semantic gateway envs

- Chat, embedding and rerank read separate `CHAT_*`, `EMBEDDING_*` and `RERANK_*` URL/key/model variables only. Legacy `LLM_*` and `MAAS_*` names were removed; existing `.env` files must migrate.
- Embedding responses are ordered by their `data[].index` and rejected when indexes are missing, duplicated or incomplete, so returned vectors stay aligned with input order.
- Evidence: [config](../backend/app/core/config.py), [semantic client](../backend/app/services/semantic_api.py), and [tests](../backend/tests/test_llm_gateway_models.py).
- Checks: `uv run pytest -q tests/test_llm_gateway_models.py tests/test_semantic_document_keywords.py tests/test_llm_tags.py tests/test_llm_usage.py tests/test_tech_tag_pipeline.py` passed (31 tests, including the live semantic test). `tests/test_document_ingest.py` passed (13 tests). `uv run pytest -m no_db -q` passed (87 tests). A live probe returned one 4096-dimensional embedding and rerank scores `0.8439` / `0.0759`.


### CC-03 — capture credential storage and verification slice

- Added `GET /api/v1/capture/whoami` on the capture router. It returns the verified subject and role from the existing Bearer-token or trusted-proxy identity path; an unknown or revoked Bearer token returns 401.
- Added `platform.Client.WhoAmI` and wired `capture doctor` to print `auth ok (subject, role)`, `auth rejected` for a 401, or `auth failed` for transport/other errors. Doctor still prints the redacted token source and enterprise CA path.
- Added `auth_token_credential`, Windows Credential Manager read/write/delete, and `capture auth set|clear|status`. `auth set` reads the token from stdin, stores it under the configured target, and writes only the target name to `config.json`. Precedence is env, then Credential Manager, then file.
- Evidence: [capture route](../backend/app/api/v1/capture.py), [identity resolver](../backend/app/core/capture_identity.py), [client method](../client/internal/platform/client.go), [doctor](../client/internal/cli/cli.go), [credential store](../client/internal/credential/credential_windows.go), [config](../client/internal/config/config.go), and [client TODO remainder](../client/TODO.md#cc-03-linux-服务连接与凭据).
- Checks: `go test -short ./...`, `go vet ./internal/...`, and `go test -v ./internal/credential` passed on Windows. `capture auth set/status/clear` passed end to end against a temporary config directory. `uv run pytest -q tests/test_capture_unified.py -m no_db` passed (3 tests: test actor, configured Bearer token, revoked token). The no-DB marker avoids the shared `eea_test` lock because this endpoint has no database dependency.
- Build: `go build -trimpath -ldflags "-s -w -H=windowsgui" -o dist/capture.exe ./cmd/capture` passed; the release binary printed `auth_token credential` with a stored test credential and cleared it afterward.
- Remaining: Linux TLS/reverse-proxy path exercise and acceptance of wrong-CA/wrong-address/proxy-path diagnostics.

### Server-issued capture tokens — CC-03 server slice

- Added `eea_capture_token` with subject, role, label, SHA-256 digest, expiry, and revocation fields; migration `0018_capture_tokens` creates the table additively.
- Added admin `POST/GET /api/v1/capture/tokens` and `POST /api/v1/capture/tokens/{id}/revoke`. The raw token is returned once; only its digest is stored. Audit rows record issue and revoke operations.
- Capture identity now accepts environment static tokens first, then database-issued `eea_` tokens; revoked, expired, or unknown tokens return 401.
- Evidence: [model](../backend/app/models/models.py), [migration](../backend/migrations/versions/0018_capture_tokens.py), [service](../backend/app/services/capture_tokens.py), [router](../backend/app/api/v1/capture_tokens.py), and [identity resolver](../backend/app/core/capture_identity.py).
- Checks: `alembic upgrade head` passed on a disposable `eea_test_cc03` database. ASGI issue → whoami → list → revoke → whoami(401) and expired-token → whoami(401) passed; the stored digest was 64 hex characters and the row was revoked. `uv run pytest -q tests/test_capture_tokens.py` passed (3 tests on shared `eea_test`). `uv run pytest -m no_db -q` passed (81 tests). `alembic check` still reports pre-existing index drift in agent/capture/signal indexes; it did not flag `eea_capture_token`.


### BE-02 — body repair audit and version slice

- `PATCH /api/v1/signals/{id}` with `body_text` now writes a `body_text` correction audit record containing the old and new content-addressed object keys and SHA-256 hashes before replacing the signal body.
- Old bodies remain in the object store by content-addressed key, so the audit record can retrieve the prior text without a separate version table.
- Evidence: [signal update](../backend/app/api/v1/signals.py) and [body repair test](../backend/tests/test_signals_ingest.py).
- Checks: the targeted test passed (`1 passed`, including test-DB migration); it verifies the old body is still readable from the object store.


### BE-06 — low-frequency strong-signal API slice

- Demand create/update/read now expose `low_freq_strong_signal` and `low_freq_strong_signal_reason`. Setting the flag requires a non-empty reason; clearing it clears the reason. Both changes are audited.
- Evidence: [demand API](../backend/app/api/v1/demands.py), [schemas](../backend/app/schemas/schemas.py), and [test](../backend/tests/test_demands.py).
- Checks: targeted test passed (`1 passed`, 162s including test setup/LLM fallback latency); it covers missing-reason rejection, marking, clearing, returned fields, and audit rows.


### BE-03 — theme write identity and audit slice

- Theme create/update/delete now require the server-resolved operator identity. Create records a `created` audit entry; edits record old/new working name and value-chain stage; delete records the removed theme values before unassigning signals.
- Evidence: [themes API](../backend/app/api/v1/themes.py) and [theme tests](../backend/tests/test_themes.py).
- Checks: `uv run pytest -q tests/test_themes.py` passed (16 tests).


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
- Checks: `next build` passed; Ant Design lint passed with zero issues for the workbench and topics page; full backend suite passed **285 tests, 1 skipped**. The 2026-11-26 wiring fix and browser walkthrough below cover the entry point and the confirmed-demand review; Linux role mapping, the create-confirm flow and real business-sample acceptance remain open.

- 2026-11-26 workbench wiring fix and walkthrough: `DemandPointWorkbench` and its drawer existed but were not imported by any view. The demands table now has a 工作台 action; the drawer receives `initialDemandId`, uses width `min(1040px, 92vw)`, and remounts on every open so the same demand can be reopened. Browser check: the confirmed 低压系统智能化（W1 真实链） opened with five steps (two evidence chips each), 交叉验证 通过, 信号频次/来源数 2, 时间序列 and the "confirmed edits go back to review" warning; closing and reopening the same demand loaded it again. Added `frontend/tests/e2e/demand-workbench-smoke.spec.ts` (`pnpm pw:demands`) -> 1 passed (16.9 s, msedge headless). Images came from CDP Page.printToPDF because Page.captureScreenshot times out in this ego session even on example.com.

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
- Checks: `next build` passed; scoped Ant Design lint passed for the editor and workspace; backend function tests passed (21) including missing-step, reverse inconsistency, incomplete coverage, and publish-gate cases. The full backend suite passed **276 tests, 1 skipped**. Ego-browser on macOS verified the live empty state and API-backed technology page, blocked an empty five-step save without creating a function, and saved a completed five-step draft with `published=false`. Temporary records were removed from `eea_test`; its demand/function/audit tables were verified empty afterward. The 2026-11-26 walkthrough below covers the populated eFuse editor, the empty-publish gate and the unresolved-conflict gate; real recommendation-level/target-domain vocabulary and role checks stay open.

- 2026-11-26 eFuse walkthrough (ego-browser, dev stack): the confirmed demand 低压系统智能化（W1 真实链） listed 全节点智能配电（W1 真实链） 已发布, 未发布功能（W1 负例） 草稿, and 座舱多模感知与场景联动 已发布. The eFuse editor loaded the five forward steps, necessity, two coverage rows, conclusion 一致, the human-confirmation checkbox, 建议 / 底盘 / L2+L4 and the reason/difference. Publishing the empty negative sample was blocked client-side by the full 11-item list (necessity, coverage, conclusion, confirmation, recommendation level, automation level, target domain, reason, L2/L4); typing a temporary contradiction added 仍有未解决矛盾，不能发布. 放弃未保存修改 discarded the edit; the DB stayed unchanged (2 published functions; the negative sample reverse_trace is still null). Images came from CDP Page.printToPDF because Page.captureScreenshot times out in this ego session even on example.com.

### FE-07/08 — landing-point and standards grid slice

- Added a live landing-point workbench backed by the functions, landing-points, standards, and domain-vocabulary APIs. It supports viewing/editing points, creates only under published functions, and lets an operator select an existing domain or enter a new one that the server adds to the shared vocabulary.
- Added the 3×3 design/manufacturing/operations grid. Missing rows, `NULL` explicit blanks, and text remain distinct. Saves require an explicit choice, check for concurrent edits before overwriting, and refresh landing-point counts, panorama, vocabulary and trace queries. The technology panorama now renders API-backed associations and no sample graph.
- Evidence: [landing-point workbench](../frontend/components/technology/landing-point-workbench.tsx), [technology view](../frontend/views/dashboard/workspace.tsx), [API client and types](../frontend/lib/api/eea-api.ts), [landing-point API](../backend/app/api/v1/landing_points.py), [standards API](../backend/app/api/v1/standards.py), and [frontend TODO remainder](../frontend/TODO.md#fe-07-技术全景与落脚点).
- Checks: macOS `next build`, `tsc --noEmit`, and scoped Ant Design lint passed. Browser verification against the local API showed the five confirmed domains, landing-point create/view, a user-entered domain persisted to the shared vocabulary, and the missing/NULL/text cell states. A reload retained the new point in the API-backed panorama. Temporary synthetic records were removed from isolated `eea_test`; signal, demand, function, landing-point, and standard counts are zero, with only the five confirmed domain terms restored. The full backend suite passed **285 tests, 1 skipped** on isolated `eea_test`, including landing-point PATCH and standard-cell serialization cases. The full trace-page review, Linux and Windows checks remain open.

- Browser walkthrough (2026-11-26, ego-browser, dev stack): selected the published function 全节点智能配电（W1 真实链） and opened 智能保险丝（eFuse）. The grid header read 服务端已保存 3 / 9 格; 设计/工程化 and 制造/工程化 showed 有文本 ("满足 AEC-Q100…" / "完成保护功能验证"), 运营/工程化 showed 明确留空 with the NULL explanation, and the other six cells showed 尚未填写. The landing-point card read 已保存标准格：2, so the NULL row was not counted as substantive. A reload and reselecting the function and point kept the same count and states. Audit: two eea_correction_audit rows for requirement_text:运营:工程化 (temporary text → NULL, local-development-user / researcher). Page images came from CDP Page.printToPDF because Page.captureScreenshot times out in this ego session even on example.com. Remaining: the full trace-page review.

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
- Remaining: the later BE-11 check covered live database counts and the empty strategy page; the populated eFuse display and the sequential lock are covered by the 2026-11-26 walkthrough below. The rejection branch and re-judgment browser path still need a business sample. Real Tier1/score rationale and eFuse acceptance inputs are outstanding, as are Linux and production identity checks. This is an implementation slice, not full BE-10/FE-09/DOC-05 acceptance.

- 2026-11-26 populated walkthrough (ego-browser, dev stack): the four exclusive counts read 第 1 步 1 / 第 2 步 0 / 第 3 步 0 / 第 4 步 1 / 适配拒绝 0 / 未满足入池条件 0. Selecting 智能保险丝（eFuse） showed 筛选池可进入 / 已完成, four saved stages, the 4/4/3/4/5 dimensions with rationales, 服务端总分 20/25, 产业投资/生态合作, the note, operator local-development-user and the 2026-11-20 version timeline. Selecting the un-scanned 座舱多模融合感知模块 opened only step 1; steps 2–4 showed 等待前序步骤 / 完成前序步骤后开放 and no score inputs or total. No business rows were written. Images came from CDP Page.printToPDF because Page.captureScreenshot times out in this ego session even on example.com.

### BE-11 / FE-01 / FE-10 — real overview and trace slice

- `/overview` now returns database-backed counts for distinct normalized source URLs, exact signal states, open/failed capture jobs, failed document ingestion, substantive standards, and UTC-week additions. Four strategy-stage counts are exclusive by each landing point's current persisted funnel state; step four includes draft-finalization-ready and completed items.
- The landing-point trace includes the present/missing stages, unresolved evidence/document references, theme membership and demand-evidence relationships, persisted archive/body/document references, demand/function review state, and all assessment versions. Archived signal status comes from `evidence_status_code='archived'`.
- The overview and signal screens show source/status/week/failure counts with their count definitions. The trace screen links to a selected landing-point deep link and presents the five-step demand basis, function forward/reverse records, nine deployment-standard cells, evidence, document figure count and strategy history.
- Basis freshness is returned as `unknown_untracked`: DemandPoint has no review timestamp baseline. The UI states that limitation instead of deriving freshness from creation dates. Object-key presence does not prove storage readability; the linked endpoints remain the check.
- Evidence: [overview API](../backend/app/api/v1/overview.py), [trace API](../backend/app/api/v1/trace.py), [trace tests](../backend/tests/test_trace_audit_overview.py), [trace view](../frontend/views/dashboard/workspace.tsx), and [remaining acceptance criteria](../backend/TODO.md#be-11-追溯与真实总览), [FE-01](../frontend/TODO.md#fe-01-页面职责与真实数据), and [FE-10](../frontend/TODO.md#fe-10-全链追溯与导出).
- Checks: macOS isolated `eea_test` trace/overview tests **20 passed**; frontend `next build`, `tsc --noEmit`, and scoped Ant Design lint for the workspace passed. The integrated backend run on the dedicated Mac database passed **300 tests, 1 skipped**. With the local API, the Mac browser displayed the UTC week, pending/failed task totals, all strategy stage counts, the empty trace list and a warning for a missing landing point after reload. The warning action is now labelled “重新选择落脚点”. The previous browser session was unavailable on resuming the action check. Target-platform acceptance stays open; the populated trace, valid-ID refresh, source navigation and report export are covered by the 2026-11-26 walkthrough below.

- 2026-11-26 populated walkthrough (ego-browser, dev stack): `/traceDetail/695dac19…` loaded the eFuse chain with the complete-relations alert, confirmed demand review, 通过 cross-validation, two retained evidence signals (both 主题成员 + 需求直接证据 with 打开证据 / 查看网页存档), the 3×3 standards grid (2 text, 运营/工程化 明确留空, 6 尚未填写), the strategy v1 20/25 产业投资/生态合作 timeline, and the stale-basis warning. 打开证据 navigated to `/singal/4515e3d8…`; the same deep link survived a reload; switching to 座舱多模融合感知模块 changed the URL to `/traceDetail/df9c51fc…` and switching back restored the eFuse chain. On `/report`, Markdown generation previewed the persisted `EEA 链路报告` (standards, strategy, both evidence URLs, limitations); PDF generation downloaded a 7.7 KB PDF whose 2,413 extracted characters contain 链路报告, 智能保险丝, AEC-Q100 and 20. The two test reports were deleted with their objects afterwards. Images came from CDP Page.printToPDF because Page.captureScreenshot times out in this ego session even on example.com.
- Environment note: two `scripts/dev.py` stacks were both bound to :8000 and both stopped answering even `/healthz`; the stale stacks were stopped and one fresh dev API was started before the successful walkthrough.

- 2026-11-26 report playwright case: `frontend/tests/e2e/report-smoke.spec.ts` (new `pnpm pw:report` script and README row) loads `/report`, selects the eFuse landing point from the API-backed list, generates the Markdown report, asserts the `EEA 链路报告` preview with 部署标准九宫格 and 数据快照, requests the PDF and asserts the download toast, and checks that no `/api/v1` request failed. It skips with a clear message when the database has no eFuse landing point. Evidence: `pnpm exec playwright test tests/e2e/report-smoke.spec.ts` -> 1 passed (22.1 s, msedge headless). The two report rows and object files created by the run were deleted afterwards (7 pre-existing reports remain).

### BE-03 / BE-05 / FE-03 / FE-04 — batch 2 signal edit guards slice

- Tag suggestions respect `eea_correction_audit` (`protected_fields`, `degraded_reason`). Mutations accept `expected_updated_at` → **409** when stale. Theme overlap preview + stricter auto-aggregate guards. Embedding/rerank client + config placeholders. Frontend editors send `updated_at` and refetch on conflict.
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
- `/readyz` adds `semantic_gateway` degraded when model gateways are unset; DB/object failures still 503.
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
