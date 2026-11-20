# Delivery Record

This record keeps evidence for implementation slices removed from the remaining-work TODOs. A slice does not close its parent task; acceptance stays open until the subsystem TODO criteria and required platform evidence pass.

## 2026-11-20

### W4 (offline part): OPS-02 bundle scripts and artifacts, no Linux host

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
- Remaining: the import-result modal was not separately browser-tested because the upload flow auto-created a signal and navigated to evidence detail; live Agent citation E2E still needs a working gateway or a controlled event fixture; Playwright and 320 px responsive acceptance remain open. FE-11 parent stays open.

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
