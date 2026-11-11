# EEA Backend

FastAPI + PostgreSQL 后端，实现《平台实施计划》第 3–8 节的推导链路：
原始信号 → 技术主题 → 需求点 → 车辆功能 → 技术落脚点 → 部署标准 → 战略研判。

- Schema：`docs/platform-implementation-plan.md` §4.1 基线 + 演进迁移（迁移由 Alembic 管理；0003 文档表、0005 访问留痕、0006 信号↔文档关联、0008 持久采集任务、0009 审计前后值、0010 功能卡与五个技术域词项、0011 需求五步证据链、0012 战略漏斗草稿；当前 head 为 0012_strategy_funnel）
- API 文档（服务启动后）：http://127.0.0.1:8000/ 或 /docs（Swagger UI，deep link）、http://127.0.0.1:8000/openapi.json（OpenAPI schema）
- 本地库：**Windows** 便携 PostgreSQL（`bootstrap.py` → `backend/.pg/`）；**macOS/Linux** 系统 PostgreSQL — 见根目录 [README.md](../README.md)

### 内网访问（LAN）

本地开发 API 默认监听 `0.0.0.0:8000`（`API_HOST` 可覆盖），因此同一内网可用 `http://<本机 IPv4>:8000` 访问；开发前端连接该端口。生产服务单元只绑定 loopback，由 TLS 反向代理同源转发 `/api/`。CORS 放行 localhost 与私有网段（`10.x` / `192.168.x` / `172.16-31.x`）的任意端口。

`POST /session/visit` 的 IP 仅用于访问留痕，不代表用户身份。生产审计写入必须经受信反向代理提供的用户和角色标识；API 只接受来自 `TRUSTED_PROXY_IPS` 的身份头。代理需移除客户端同名头并从已验证会话重设，具体用户/角色映射依部署环境配置。开发环境使用服务端配置的本地操作者。

体积限制（文档）：`DOC_RAW_UPLOAD_MAX_BYTES` 与 `DOC_INGEST_MAX_BYTES` 默认各 **120 MiB**；超过上传上限返回 413，超过解析上限只存 blob（`ingest_status=skipped`）。

## 本地运行

三平台步骤见根目录 **[README.md](../README.md)**。常用命令（在 `backend/`）：

```bash
uv sync --locked
uv run python scripts/bootstrap.py   # 首次 / 重复安全
uv run python scripts/dev.py         # 前台 API + worker；Ctrl+C 结束
# uv run python scripts/start_api.py  # 后台 API → .pg/api.log
# uv run python scripts/stop_api.py
```

`bootstrap` 完成迁移与封闭词表种子，不生成合成业务信号。根路径提供 Swagger UI（`/`、`/docs`）与 `/api/v1`。

## 环境变量（可选）

复制 `.env.example` → `.env`（`LLM_BASE_URL`、`LLM_API_KEY`、各 `*_MODEL`）。

文档摄取相关：
- `LLM_MODEL` 可留空（自动探测网关模型）；`VISION_MODEL` 可留空（自动 Qwen 3.8 → 3.6）
- `DOC_RAW_UPLOAD_MAX_BYTES` / `DOC_INGEST_MAX_BYTES`：原始上传与 MarkItDown 解析上限，默认各 **120 MiB**（`125829120`）；超过解析上限只保留 blob（`ingest_status=skipped`）库端口等见 `app/core/config.py` 默认值（`DB_PORT`、`API_PORT`、`OBJECT_DIR`…）。

## 主要端点（`/api/v1`）

| 分组 | 端点 | 对应需求 |
| --- | --- | --- |
| documents | `POST /documents/raw`（MarkItDown → canonical Markdown + 图块视觉描述）、`GET /documents/{id}`、`GET /documents/{id}/canonical.md`、`POST /documents/{id}/ingest`（重试/换模型重解析） | REQ-DOC-01… |
| signals | `GET/POST /signals`（传 `document_id` 走文档来源路径）、`POST /signals/capture`（multipart 网页/HTML）、`POST /signals/{id}/assistant/messages`（证据 LLM 助手）、`GET /signals/{id}/body`、`GET /signals/{id}/archive`（SingleFile 回放）、`PATCH /signals/{id}`、`PUT /signals/{id}/tags`、`POST /signals/{id}/auto-aggregate`（文档来源信号 409）、`PUT /signals/{id}/theme`；`SignalDetail` 含 `linked_demand_points` | REQ-SIG-01…11 |
| vocab | `GET /ref-codes`、`GET/POST /vocab`、`GET /vocab/usage` | REQ-TAG-01…06 |
| themes | `GET/POST /themes`（含信号频次/来源数指标） | REQ-DEM-02/14/15 |
| demands | `GET/POST/PATCH /demands`（五步逐项引用留存信号；确认要求不同来源主体、渠道及技术标签证据，并仅管理员可确认） | REQ-DEM-01…13 |
| functions | `GET/POST/PATCH /functions`（复核当前需求证据；发布受正向+反向校验门控） | REQ-MAP-01…06 |
| landing-points | `GET/POST/PATCH /landing-points`（更新角色/技术域时写入前后值审计） | REQ-TECH-01…04 |
| panorama | `GET /panorama`（图2-5 技术全景：环节 → 需求点 → 功能 → 落脚点，含域与标准数） | REQ-TECH-04 |
| standards | `GET/PUT /landing-points/{id}/standards`（3×3 网格；缺行=未填写、NULL=明确留空，写入必须显式传文本或 NULL） | REQ-STD-01…03 |
| strategy | `GET /strategy/assessments`、`POST /strategy/landing-points/{id}/assessments`（版本追加）、`.../history` | REQ-STR-01…07 |
| trace | `GET /trace/landing-points/{id}`、`GET /audit` | REQ-RULE-02/03 |
| overview | `GET /overview` | REQ-UI-02 |
| docs（根路径） | `GET /`、`GET /docs`（Swagger UI，`deepLinking`）、`GET /openapi.json` | —（UI 加载 `/openapi.json`；无 `/llms.txt`） |

### POST /api/v1/capture — 统一采集入口（multipart）

生产页面采集由用户侧的 Go/浏览器工具完成网页读取，再上传原始 URL 与 HTML 文件。字段 `url` + `file` 接受 SingleFile 快照，`submission_id` 为可选 UUID；服务端支持此字段时，相同 ID 和请求摘要安全返回既有结果，不同请求复用 ID 返回 409。也支持上传文档文件及 `channel_code`、`publisher`、`source_label` 元数据。响应为 `CaptureResult`（含 `signal`，文档时另含 `document`）。文件大小受 `DOC_RAW_UPLOAD_MAX_BYTES` 限制。

生产模式禁用 URL-only 服务端抓取；只有本机开发设置 `CAPTURE_SERVER_FETCH_ENABLED=true` 才尝试该路径，`APP_ENV=production` 时无条件拒绝。公网 URL 必须通过用户侧浏览器工具上传快照。

异步长任务使用 `POST /api/v1/capture/jobs`（multipart，必填稳定 `submission_id`）立即持久化上传对象和任务并返回 202。客户端用 `GET /api/v1/capture/jobs/{id}` 轮询；失败任务可 `POST .../retry`，尚未领取的任务可 `POST .../cancel`。采集处理由独立进程 `python -m app.worker` 执行；该入口和 systemd 模板尚未完成 Linux 生命周期验收。旧 `POST /capture` 同步接口继续兼容。任务当前尚未按可信用户隔离，权限接入见 OPS-03。

### POST /api/v1/signals/capture — 旧版网页采集端点（multipart）

上传 SingleFile 归档 HTML，服务端落盘快照、抽取正文/元数据并走共用创建管线（预打标签 + 自动归集，`app/api/v1/signals.py:234`）。

- multipart 字段：`url`（必填）、`archive_html`（必填，文件）、`channel_code`（可选；缺省时按 URL host 推断：`mp.weixin.qq.com` → `wechat_mp`，其余 → `web`）
- 空文件 422；抽不出正文（body_md 为空）422 且不落行；`channel_code` 不在封闭词表 422
- 返回 201 + `SignalDetail`（含 `snapshot_html_object_key`），`evidence_status_code` 固定为 `retained`

```bash
curl -X POST http://127.0.0.1:8000/api/v1/signals/capture \
  -F "url=https://example.com/article" \
  -F "archive_html=@snapshot.singlefile.html"
```

### GET /api/v1/signals/{id}/archive — 快照回放

按上传原样（byte-for-byte）回放采集时的 SingleFile HTML 快照（`app/api/v1/signals.py:327`）。无快照引用或对象存储中对象丢失均返回 404；成功返回 `text/html`。

### 文档来源信号（S1-3，2026-10-29 会议）

`POST /signals` 传 `document_id`（替代手填 title/url/body）即走文档来源路径：

- `title` 默认取文档文件名主干；`url` 默认 `eea://document/{id}`；`published_at` 默认文档上传时间（显式传入优先）
- `body_text` 默认为**服务端生成的摘要**（`app/services/doc_summary.py`：文件名 + 章节/幻灯片标题 + 讲稿摘录，≤4000 字），**不**把整份 canonical Markdown 灌入正文
- **跳过自动归集**：`tech_theme_id` 保持 null、不做 jieba 词频兜底打标（LLM 建议标签仍写入）；`POST /signals/{id}/auto-aggregate` 对文档来源信号返回 409
- 主题只能经人工 `PUT /signals/{id}/theme` 指定或移出（`tech_theme_id: null` 即清空误归集，审计留痕）——这是对历史误归集信号的运维修复路径
- `SignalDetail.linked_demand_points`：该信号主题来源的需求点列表（无主题时 `[]`，前端来源栏「关联需求」直接消费）

### 文档摄取（W4，`app/api/v1/documents.py` + `app/services/doc_ingest.py`）

`POST /documents/raw`：原始文件入对象存储（`documents/`，内容寻址）+ 一条 `eea_document` 行，随后**同步**跑 MarkItDown 生成 canonical Markdown，并把文档内图片交给视觉模型描述。解析失败不影响原始 blob（`ingest_status=failed`），可重试。

- multipart 字段：`file`（必填）
- 空文件 422；超过 `DOC_RAW_UPLOAD_MAX_BYTES`（默认 120 MiB）返回 413；解析上限 `DOC_INGEST_MAX_BYTES`（默认 120 MiB，超出标记 `skipped`）
- 幂等：同 sha256 直接复用已有行；`ingest_status=parsed` 不重复解析
- 图片：docx/pptx/xlsx 的 media（按 slide/rels 文档序，非 zip 字典序）、PDF 含图页（pypdfium2 渲染）、图片直传；最多 16 张（`MAX_FIGURES` 可调）、单张 ≤4 MiB、并发 3、空响应自动重试；模型自动 Qwen 3.8 → 3.6；pptx 讲稿以独立 `### Notes:` 段落输出
- 返回 201 + `DocumentRawOut`（`sha256`/`mime`/`size`/`filename`、`ingest_status`、`figure_count`、`vision_model`、`markitdown_version`、`canonical_md_excerpt`）

配套端点：

| 端点 | 作用 |
| --- | --- |
| `GET /documents/{id}` | 摄取元数据 + 600 字摘录 |
| `GET /documents/{id}/canonical.md` | 完整 canonical Markdown（`text/markdown`） |
| `POST /documents/{id}/ingest` | 重新解析（失败重试 / 换视觉模型） |

```bash
curl -X POST http://127.0.0.1:8000/api/v1/documents/raw \
  -F "file=@report.pdf"
```

## 接口测试（backend/tests/）

```bash
cd backend
uv run pytest -q
# 快检：./scripts/pytest_slices.sh unit  或  uv run pytest -m no_db -q
# 切片：./scripts/pytest_slices.sh capture  （Windows 用 Git Bash/WSL）
# 默认 EEA_PYTEST_LOCK=fail — 勿并行抢占 eea_test
```

macOS/Linux 须先启动本机 PostgreSQL；见根目录 [README.md](../README.md)。

- 测试通过 httpx `AsyncClient` + `ASGITransport` 直连 `app.main.app`（FastAPI 官方异步测试模式，anyio pytest 插件）。
- 测试跑在**专用数据库 `eea_test`** 上（同一 PostgreSQL 实例），绝不触碰存放验收种子数据的 `eea` 库；`tests/conftest.py` 在首次导入 app 前设置 `DB_NAME=eea_test`（settings 经 `lru_cache` 缓存、引擎在导入期创建，覆盖必须先行），库不存在时自动创建并执行 Alembic 迁移。外部 PostgreSQL（`use-external-db`）环境下须自行启动数据库；仅 Windows 便携库布局可能在 PG 未就绪时尝试 `start_api.py`。
- 每个用例前清空全部业务表并仅重播封闭词表种子（`eea_ref_code`），保证确定性与隔离；快照正文写入临时 `OBJECT_DIR`，会话结束自动清理。
- 用例覆盖需求验收点：封闭词表校验（422 且零写入）、信号采集/筛选/详情/快照正文、标签词表与频次、主题归集与指标口径（排除已归档）、需求点交叉验证/人工复核门控、功能发布门控（正向+反向）、标准 3×3 网格与「明确留空」、战略研判版本链与筛选池准入、追溯链、审计留痕、总览计数，以及迁移产出的精确表/视图清单与存储级约束（部分唯一索引、生成列、复合主键）；另覆盖 OpenAPI 文档面（`/`、`/docs`、`/openapi.json` 与路径快照测试）。
