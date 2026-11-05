# backend/TODO.md

状态：2026-11-02（按「高频词分析 / 标签 / 分类」主线重写）。依据《智能纪要：EEA白皮书agent需求（2026-10-29）》（[`../docs/meetings/2026-10-29-EEA白皮书agent需求-智能纪要.md`](../docs/meetings/2026-10-29-EEA白皮书agent需求-智能纪要.md)，飞书 revision 6，已核对无更新）+ **2026-11-02 网关实测**。

**总原则（会议明确）**：优先保障可交付的核心功能落地，避免发散开发非必要的摆设类功能，聚焦实际痛点需求。

**本轮主线**：把标签与分类从「jieba 词频 + 关键词规则」升级为 **高频词召回 → embedding 语义聚合 → rerank 精排 → 封闭词表落码** 的三段式；分类（主题归集、新分类候选）复用同一套向量与精排能力。会议点名的问题（「标签分类功能未完善」「标签自动聚类」「新分类自动生成」）全部落在这一条线上。

**排期现状**：服务器部署仍未完成（已过会议「本周内」节点，需优先）；邱志光 skills 原定 2026-11-03/04，本周初确认是否到位。

---

## 〇、现状判定（改之前的基线）

| 能力 | 现有实现（代码位置） | 缺口 | 本轮目标 |
| --- | --- | --- | --- |
| 高频词分析 REQ-TAG-05 | `suggest_tags()` jieba `cut_for_search` + 频次排序 Top6（[`app/services/tagging.py`](app/services/tagging.py)）；`GET /vocab/usage` 出全局频次 | 纯词频，无同义合并、无打分；标签之间不做语义聚合 | T1 |
| 价值链环节 / 信号类型 REQ-TAG-04 | `judge_stage()` 关键词计数（[`app/services/judgment.py`](app/services/judgment.py)）；LLM 初判 `LLMTagSuggestion`（[`app/services/llm.py`](app/services/llm.py)，封闭词表校验 + jieba 兜底） | 关键词规则对同义表述不敏感；LLM 在 8s 预算内结果不稳 | T2 |
| 技术方向标签 REQ-TAG-05/06 | jieba + LLM 建议；`PUT /signals/{id}/tags` 人工改；新标签进 `eea_vocab` | 无近义归并（「智能配电」「智能配电系统」各算一个标签）；无相关性打分 | T1 / T2 |
| 主题归集（分类）REQ-SIG-08 | `select_best_theme()`：标签**字面**重合 ≥2 且唯一才归集（[`app/services/judgment.py`](app/services/judgment.py)） | 与 REQ-DEM-03「依据技术对象/底层能力/变化方向，而非关键词相同」直接冲突 | T3 |
| 新分类生成（第二阶段） | 无 | 无聚类、无候选产出 | T4 |
| 文档抽取（T6 前现状） | MarkItDown + 视觉图注 → `canonical_md`；文档信号标签**只靠 LLM**、无词频兜底；章节/图块语义未结构化 | 章节级关键词、层级体系、rerank 精排均缺 | T6 |
| 纠偏留痕 REQ-RULE-02 | `record_correction()` → `eea_correction_audit` | 只存机器值/人工值，机器分与来源未落 | T5 |

---

## 一、T 系列：高频词分析 → 标签 → 分类（主线）

### 方案调研结论（2026-11-02，Context7 文档核实）

1. **高频词召回**：`jieba.analyse.extract_tags(text, topK, withWeight=True, allowPOS=('n','nz','vn','eng'))` 自带 TF-IDF 权重与词性过滤，`textrank()` 旁证，`set_idf_path()` 可挂自定义 IDF 语料 —— jieba 已是依赖，**零新增**，直接替代手写频次排序。
2. **聚类**：`sklearn.cluster.AgglomerativeClustering(metric="cosine", linkage="average", distance_threshold=θ)` 用距离阈值切树，**无需预设簇数 k**；sklearn 为纯 wheel（无编译），按 `doc_ingest` 里 pdfplumber 的软导入模式接入，缺失时回退 numpy 连通分量。
3. **向量存储**：pgvector Windows 官方只有 MSVC + `nmake /F Makefile.win` 源码编译一条路（无预编译二进制），与「便携版 / 一条命令零知识维护」冲突 —— **确认不装**。备选评估（2026-11-02）：**Qdrant local mode**（`QdrantClient(path=...)` 进程内、SQLite 持久化、纯 Python/numpy、有 Async 客户端、payload 过滤，`pip` 即装无服务进程）为唯一预留升级路径；Redis 需 Redis Stack 服务进程 + RediSearch 模块，redb 为纯 KV 无向量能力，均否决。当前量级（千级以内）用 **JSONB + numpy 余弦** 零新依赖。

### T0 网关双模型基建（其他任务的前置）

- [ ] `app/services/embedding.py`：`embed(texts) -> list[list[float]]`
      `POST {LLM_BASE_URL}/embeddings`，body `{"model": EMBEDDING_MODEL, "input": [...]}`；实测 OpenAI 形状、**4096 维**（`Qwen3-Embedding-8B`）
- [ ] `app/services/rerank.py`：`rerank(query, documents, top_n) -> list[(index, score)]`
      `POST {LLM_BASE_URL}/rerank`，body `{"model": RERANK_MODEL, "query": ..., "documents": [...], "top_n": n}`；实测返回 `{"results":[{"index","relevance_score"}]}`（`Qwen3-Reranker-8B`）
- [ ] 批量与限流：批 ≤ 16 条，串行 + 退避重试（2026-11-02 实测：网关在 3 并发长批下会回空响应，与视觉图注同源）；无 key / 未配置时返回 `[]`，异常不外抛到请求路径
- [ ] 向量缓存表 `eea_embedding`（`owner_kind`, `owner_id`, `model`, `sha256`, `vector JSONB`），Alembic `0007_embedding_cache`
      **便携 PG 16.9-1 不含 pgvector**（`.pg/pgsql/share/extension` 无 vector），因此不引入扩展；千级信号下 numpy 余弦足够（numpy 2.5.4 已在 venv 中）
- [ ] 配置补充：`embedding_model` / `rerank_model` 已有（[`app/core/config.py`](app/core/config.py):29-30），再加 `embedding_batch`、`embedding_timeout`、`rerank_top_n`、`tag_score_threshold`
- [ ] 单测用 `httpx.MockTransport` 打桩，不碰真实网关（写法参照 [`tests/test_llm_tags.py`](tests/test_llm_tags.py)）
- 验收：`embed(["48V 智能配电", "eFuse"])` 两次调用向量稳定；`rerank` 排序随 query 变化（2026-11-02 已手工验证，本次固化成用例）

### T1 高频词分析（REQ-TAG-05 升级）

- [ ] 召回层升级：`suggest_tags()` 内部改用 `jieba.analyse.extract_tags(text, topK, withWeight=True, allowPOS=('n','nz','vn','eng'))`（TF-IDF），`textrank()` 结果作并集旁证；标题词权重 ×2、正文截断 `min(len, 6000)`；**保留函数签名与 jieba 兜底语义不变**（调用方无感）
- [ ] 聚合层：候选词向量化，与 `eea_vocab`（`kind='tech_tag'`）既有标签向量求余弦，**≥0.85 合并到既有标签**（阈值进配置），避免同义标签碎片化
- [ ] 排序层：先按 `0.5×归一化 TF-IDF 权重 + 0.5×embedding 相似度` 预排（TF-IDF 权重来自 extract_tags 的 withWeight），再交 rerank 精排（query = 标题 + 正文摘要，documents = 候选词）
- [ ] 输出：分数可解释（`freq` / `embed_score` / `rerank_score`），经既有 `GET /signals/{id}/tag-suggestions` 返回，`source` 标 `embedding-rerank`；`TagSuggestion` 只在 `suggested_tags` 之外增可选分数字段（前端旧字段不受影响）
- 验收：20 条真实信号每条 ≥3 个候选词、分数可复算；同义标签不再重复膨胀

### T2 三维标签落码（REQ-TAG-04/05/06）

- [ ] **价值链环节**：4 个 code 的 label + `fixture_alias` 全量向量化；信号向量与之做余弦 + rerank（query = 标题 + 正文首段），最高分且 ≥阈值才落 `value_chain_stage_code`；`judge_stage()` 关键词规则降为并列时的裁决与兜底
- [ ] **信号类型**：同上，5 个 code（战略 / 技术 / 人才 / 资本 / 标准）
- [ ] **技术方向**：T1 候选 → rerank 对 `eea_vocab` 全量标签 → top-k 且 ≥阈值写入 `eea_signal_tag`；落码一律经 [`app/services/refcodes.py`](app/services/refcodes.py) 的 `normalize`，**模型输出永不新增 code**（CONV-CLOSED-VOCAB）
- [ ] 调用点收敛：入库预标（[`app/api/v1/signals.py`](app/api/v1/signals.py):219 附近）与 `tag-suggestions` 共用一个服务函数；`suggest_tags_with_llm` 降级为参与打分的一条独立信号，不再无条件优先
- [ ] 新增 `POST /signals/{id}/auto-tag`（形态对齐既有 `POST /{id}/auto-aggregate`）：重算三维标签 + 主题归集，返回打分明细；人工 `PATCH` / `PUT /tags` 仍可覆盖
- 验收：20 条信号三维度都有初版值（可为空，但须带分数与理由）；人工改后有 machine/human 双值审计

### T3 分类：主题归集（REQ-SIG-08 / REQ-DEM-02/03）

- [ ] 主题向量：`eea_tech_theme.working_name` + 该主题下信号标签向量求质心，缓存进 `eea_embedding`
- [ ] 归集判定替换「≥2 标签字面重合」：改为 `cos(信号, 主题) ≥ 阈值` **且**与次优主题的边际 ≥ `delta` 才自动归集；并列则不归集并返回可读理由（保留现有 `reason` 契约）
- [ ] 守住 REQ-DEM-02 / DEM-15：归集阶段只增删信号，不合并主题、不排优先级、不生成需求点
- [ ] `POST /{id}/auto-aggregate` 的 reason 文案改为「语义相似度 x.xx，次优 y.yy」
- [ ] 回归：eFuse harness「低压系统智能化」仍按图2-3 读数复现（信号频次 8 / 来源数 16，见 [`tests/test_aggregation.py`](tests/test_aggregation.py)）
- 验收：语义相近但字面不同的信号能归入同一主题；字面重合但技术对象不同的不被误归集

### T4 聚类与新分类候选（第二阶段，会议点名「标签自动聚类 / 新分类自动生成」）

- [ ] 离线脚本 `scripts/cluster.py`（一条命令、无交互）：读全部信号向量 → 软导入 `sklearn.cluster.AgglomerativeClustering(metric="cosine", linkage="average", distance_threshold=θ)`（**阈值切树，无需预设 k**；sklearn 纯 wheel，按 pdfplumber 的软导入先例接入）→ sklearn 缺失时回退 numpy 阈值图连通分量 → 输出未归集信号的簇清单
- [ ] 每簇产出候选：`候选主题名`（簇内高频词 + rerank 选代表句）、成员信号、平均相似度
- [ ] 写库必须人工确认：默认只打印/写 JSON，`--apply` 才落 `eea_tech_theme` / `eea_vocab`（REQ-DEM-07：命名在聚类与归因之后由人确认）
- [ ] 新标签候选走既有 `POST /vocab`，不开旁路接口
- 验收：20 条信号跑一遍能出 2–4 个可读候选簇；误聚比例不超过人工判断的 1/3

### T5 校准与验收

- [ ] 黄金集：20 条信号 × 人工期望（环节 / 类型 / 标签 / 主题）落 `tests/golden/tagging.json`
- [ ] 脚本 `scripts/eval_tagging.py`：跑全链路，输出每维度准确率、混淆项、失败样本；阈值靠它调而不是拍脑袋
- [ ] 审计补字段：`machine_value` 里带 `score` 与 `source`（`embedding-rerank` / `llm` / `rule` / `jieba`）
- [ ] 性能：单信号三维标签 ≤ 3s（rerank 一次批量调用，不逐标签请求）；100 条批量脚本 ≤ 3min
- 验收：黄金集准确率 — 价值链 ≥ 90%（封闭 4 选 1）、其余两维 ≥ 80%；报告随交付附上

### T6 文档抽取升级：embedding + 关键词层级 + reranker

> 现状：文档信号（`document_id`）标签只来自 LLM 建议、无 jieba 兜底；canonical Markdown 里章节/图块语义没有结构化利用。服务器无外网意味着文档（用户上传，不走公网）是生产环境里**最稳定**的语义素材，值得做深。

- [ ] **分块抽取**：`canonical_md` 按标题层级分块（H1/H2/H3 路径 = `section_path`）；每块跑 T1 的 TF-IDF 抽词 + 块级 embedding；图块语义（`> 图 N：…`）并入所在章节块
- [ ] **文档级聚合**：rerank（query = 文档标题 + 首段，documents = 各块候选词）→ 文档关键词按 `章节 → 关键词` 的层级树落库，每词带 `tfidf / embed_score / rerank_score`
- [ ] **关键词三层体系**：领域层 = `eea_ref_code`（价值链环节/信号类型）→ 方向层 = `eea_vocab(kind='tech_tag')` → 证据层 = 文档细粒度词（新表 `eea_document_keyword`，Alembic `0008_document_keyword`：`document_id, term, section_path, tfidf, embed_score, rerank_score`）
- [ ] **升格规则（细粒度词 → 方向层标签）**：频率共识（≥ `DOC_TERM_MIN_DOCS` 篇文档出现）+ 与既有 tech_tag embedding 相似 < 合并阈（新词才升格）→ 候选清单 → 人工确认走既有 `POST /vocab`（REQ-TAG-06，不自动写）
- [ ] **文档信号标签改源**：`document_id` 信号的 tech_tags 从层级树的方向层取（rerank 分数 + 阈值），LLM 建议降为参与信号之一 —— 与 T2 网页路径共用同一服务函数
- [ ] 端点：`GET /documents/{id}/keywords`（层级树，给前端文档抽屉做「章节关键词」展示）；`POST /documents/{id}/extract-keywords`（重算，幂等）
- [ ] 单测：桩 embedding / rerank，断言分块路径、层级树形状、升格候选判定；不连真网关
- 验收：QCC deck 重跑后能出章节级关键词树；派生信号标签不再只靠 LLM；升格候选可解释（出现文档数 + 相似度）

---

## 二、并行 P0（不依赖 T 系列，本周继续）

### P0-1 平台部署到服务器（会议逾期项）

- [ ] 服务器环境：Python 3.12 + `.venv` + pip；PostgreSQL（便携版或服务器实例）；`backend/.env`（`LLM_*`、`EMBEDDING_MODEL`、`RERANK_MODEL`、`OBJECT_DIR`、`DOC_*` 上限、`MAX_FIGURES=96`、`VISION_CAPTION_RETRY=3`）
- [ ] **服务器无外网（2026-11-02 确认）**，两条部署约定：
  - `POST /capture` 的服务端抓取（`url_fetch`）在服务器上对公网页面不可用 —— 仅 dev / 内网页面可用；生产采集一律走浏览器扩展（扩展跑在用户终端，用户侧有外网），服务器端点保留但不承诺
  - 内网 LLM 网关（`LLM_BASE_URL` 指向的 `model-api.desaysv.com`）需从服务器可达 —— embedding / rerank / vision 全依赖它，部署时先用 `GET /llm/status` + 一次 embedding 探活确认
- [ ] `alembic upgrade head`（当前 head = `0006_signal_document_link`；T0 / T6 完成后为 `0007_embedding_cache`、`0008_document_keyword`）；**勿在 eea 库跑 `app.seed`**（演示数据已清零，种子只用于全新库）
- [ ] API 监听 `0.0.0.0:8000`，进程守护（Windows 服务 / systemd，按服务器实际）
- [ ] 前端 `pnpm build` + `pnpm start`，确认 `http://<server>:3000` → `http://<server>:8000` 通
- [ ] 验收：服务器跑通 capture → 正文/archive → 三维标签 → 主题；`/docs`、`/llms.txt` 可访问
- [x] 部署手册：[`DEPLOY.md`](DEPLOY.md)

### P0-2 进度与信号源同步

- [x] 各模块进度说明（提交邱志光）
- [ ] WBS 前四周完成进度整理后同步邱志光
- [ ] 接收 20 条测试信号源（邱志光）→ 逐条入库，作为 T1 / T2 / T5 的输入；网页适配失败样本交采集端
- [x] 演示数据清零（2026-10-29，备份 `backend/.pg/backup-eea-20261029-before-zero.sql`）

### P0-3 Skills 接入（等邱志光 2026-11-03/04）

- [ ] 定义 skill 契约：分类规则 + 标签推导逻辑 + 提示词/示例，带版本号
- [ ] 存放与加载：`SKILLS_DIR`；注入点 = T2 标签打分、T3 归集、助手 system prompt
- [ ] 优先级：**skill 规则 > embedding+rerank > 纯词频**；冲突时记录被覆盖的一方
- [ ] 可追溯：信号记录使用的 skill 名称/版本
- 验收：同一信号有/无 skill 输出可对比，差异可解释

### P0-4 统一采集入口（2026-11-02 重做：一个输入，链接或文件）

**目标 UX**：用户只面对一个输入 —— 粘贴链接或拖入文件，其余全部自动。后端已交付统一入口：

- [x] `POST /api/v1/capture`（multipart，`url` 或 `file` 二选一，自动路由）：
  - HTML（上传文件 / 扩展上传 / 服务端抓取的页面）→ 快照路径（与 `/signals/capture` 共用 `_signal_from_html`，行为与去重语义不变）
  - 文档（docx/pptx/pdf/xlsx/图片，或 URL 直接指向文件）→ 文档路径（与 `/documents/raw` 共用存储+摄取+派生信号）
  - 仅 URL → 服务端抓取（[`app/services/url_fetch.py`](app/services/url_fetch.py)：流式字节上限、桌面 UA、重定向限制）；静态页（新闻、公众号）端到端可用，JS 渲染页返回可读 422（提示改用浏览器扩展）
  - 统一响应 `CaptureResult`（`source` / `via` / `signal` / `document`），前端一套展示
- [x] 旧端点保留（扩展与 API 调用方无感）；单测 8 例（[`tests/test_capture_unified.py`](tests/test_capture_unified.py)），全套 240 passed
- [ ] reader-collection（[`../reader-collection/`](../reader-collection/)）扩展改投 `POST /api/v1/capture`（带 `url` + SingleFile HTML 文件），client 侧；**生产环境唯一采集路径**（服务器无外网，见 P0-1）
- [ ] 前端一个采集对话框：URL 粘贴 + 文件拖放，同一入口（frontend 侧；`CaptureResult` 契约已就绪）
- [ ] Go 抓取客户端（原 [`../client/`](../client/)）降级为人工兜底路径
- 验收：一个入口覆盖 链接（静态页）/ HTML 快照 / 文档 三类输入，全链路 200；JS 页 422 文案可指导用户切换扩展

---

## 三、已完成基线（勿重做）

- 采集与留存：**统一入口 `POST /api/v1/capture`（链接或文件二选一，自动路由：HTML 快照 / 文档摄取 / 服务端抓取）**；`POST /signals/capture`（扩展路径）、`GET .../archive`、`GET .../body`；JSON 粘贴路径保留
- 文档摄取：`POST /documents/raw` + MarkItDown + 视觉图注（**slide rels 文档序对齐、数值序（slide2 < slide10）、layout/master chrome 降级到尾部图块表、`MAX_FIGURES` 可调、重试 + 串行补跑**）；QCC deck **95/95 图注、0 空描述**；`GET .../canonical.md`；失败可重试 `POST /documents/{id}/ingest`
- 文档信号：`document_id` 关联、服务端摘要正文、跳过自动归集、`linked_demand_points`
- 标签/主题：jieba 预标、LLM 建议（封闭词表校验 + jieba 兜底）、`PUT /tags`、`PUT /theme`、`POST /auto-aggregate`、纠正审计
- 助手：`POST /signals/{id}/assistant/messages`（网关自动选模 + vision 解析）
- 访问留痕：`POST /session/visit`、`GET /session/history`（IP 即身份）
- 网关：`/models` 自动选模、vision 动态解析（Qwen 3.8 → 3.6）、`_NON_CHAT` 已把 embed/rerank 排除在 chat 候选外
- 测试：216 passed / 1 skipped（`DB_NAME=eea_test`，**勿并行跑 pytest**）

---

## 四、会议点名缺口对照

| 会议指出的问题 | 现状（2026-11-02） | 归属 | 对应任务 |
| --- | --- | --- | --- |
| 标签分类功能未完善 | jieba 词频 + 关键词规则；embedding / rerank 模型已验证可用但**尚未接入代码** | backend | T0–T3 |
| 标签自动聚类（第二阶段） | 无聚类 | backend | T4 |
| 新分类自动生成（第二阶段） | 无候选产出机制 | backend | T4 |
| 生成内容匹配度不足 | LLM 无业务规则约束 | backend | P0-3、T2 |
| 文件渲染未校准 | **PPTX 图注已修复并实测**；扫描 PDF 无 OCR | backend | 已完成 |
| 部分网页适配异常 | **统一采集入口已交付**（静态页服务端抓取）；JS 渲染页仍走扩展 | backend 已交付 / client 侧 | P0-4 |
| 暂不支持用户修改操作 | API 有；前端入口缺 | frontend | T2（`PATCH` / `PUT /tags` 已就绪） |
| 当前仅为演示数据 | 已清零；等 20 条真实信号 | backend | P0-2 |
| 缺乏业务 skills 支撑 | 等 11-03/04 交付 | 邱志光 → backend | P0-3 |

---

## 五、外部依赖（阻塞项）

| 依赖 | 提供方 | 时间 |
| --- | --- | --- |
| 20 条测试信号源 + 标签推导逻辑 | 邱志光 | 近期（已逾期需催） |
| ChatGPT 生成的业务 skills（7–8 案例） | 邱志光 | 2026-11-03/04（本周初确认） |
| 分类规则 / 标签推导逻辑整理 | 邱志光 | 会后（未收到） |
| 第 7 环节（战略研判 / 链路推导）定制 | 邱志光 | 深度参与 |

> T0 / T1 不依赖上述任何一项，可立即开工；T5 黄金集要等 20 条信号到位才能定稿。

---

## 六、第一阶段验收

- [ ] 20 条信号全部入库：正文、发布时间可查，`GET .../archive` 可回放
- [ ] 每条信号有三维初版标签（价值链 / 类型 / 技术方向），**带分数与理由**，人工可改，改动有审计
- [ ] 主题归集来自语义相似度而非字面重合，理由可读，不误挂无关主题
- [ ] 业务 skills 生效，输出与业务规则一致
- [ ] 平台在服务器运行，内网可访问
- [ ] reader-collection 扩展一键采集全链路可用

---

## 七、约束与技术事实

- 不改已完成 schema 语义；新增表/字段走 Alembic 迁移（`IF NOT EXISTS`），`eea_embedding` 为新增表
- **向量存储决策（已核实）**：当前 JSONB + numpy（零新依赖、与 `eea_signal` 同库同事务、`pg_dump` 顺带备份）；量级上到万级的预留路径是 **Qdrant local mode**（进程内 `path=` 持久化，无服务进程，非 pgvector 重编译）；Redis（需 Redis Stack 服务）与 redb（纯 KV 无向量）已否决
- 封闭词表只经 `refcodes.normalize` 落码；模型输出永远不能新增 code
- 不做会议未要求的摆设功能；聚类候选必须人工确认才写库
- 企网 API 不出网；密钥只在 `.env`（本文件不记录任何 key）
- 文档与 CI 以 pip + `.venv` 为准；`pytest` 单进程跑

---

## 八、证据工作室生成（2026-11-04 已实现）

证据详情快捷面板的「导图 / 报告 / 信息图」调用本接口；「音频概览」先在浏览器里用已加载的 Markdown 快照做 `speechSynthesis`，不依赖本接口（接口侧 `audio` 供后续客户端口播稿使用）。

- [x] `POST /api/v1/signals/{id}/studio`，位于 [`app/api/v1/signals.py`](app/api/v1/signals.py) 研究助手 `POST /{signal_id}/assistant/messages` 旁边；生成与校验逻辑在 [`app/services/studio.py`](app/services/studio.py)
- [x] 复用 `_signal_context_block` 与 `chat_completion`；503（未配置/无可用模型）与 502（上游）映射与助手一致
- [x] 请求体：`{ "kind": "audio" | "mindmap" | "report" | "infographic" }`（`SignalStudioIn`，非法 kind 由 Pydantic 422）
- [x] `audio` / `mindmap` / `infographic` 返回 JSON（`JSONResponse`）；`report` 返回 `text/markdown`。解析失败重试一次，仍非法则 422
- [x] 不落库；前端按（信号, kind）自行缓存最近一次成功结果
- [x] 形状（与前端 `lib/api/types.ts` 一致，勿改字段名）：
  - **audio**：`{ "segments": [{ "text": "口播句", "quote": "正文短摘录" }] }`，提示词要求 6–10 句；服务端按正文子串校验 `quote`，编造句被剔除，可用句 <4 条即重试/422
  - **mindmap**：`{ "title": "", "children": [{ "label": "", "children": [] }] }`，深度 ≤ 3（超过的层级服务端裁剪）
  - **report**：Markdown 简报（一句话结论、要点、对扫描的含义、局限）
  - **infographic**：`{ "headline": "", "stats": [{ "label": "", "value": "" }], "points": [{ "title": "", "body": "" }] }`，数字只来自信号上下文（提示词约束；`stats` 缺字段的条目被剔除）
- [x] 单测 7 例（[`tests/test_signal_studio.py`](tests/test_signal_studio.py)），全套 **250 passed / 1 skipped**
- [x] 顺带修复：`_prepend_title_heading` 不再把标题里**转义残留的 `<script>` 文本**写进 `body_md`（script/style 连内容一起剥离，标题字段保留原文）——该问题由采集扩展契约测试暴露（`tests/test_capture_extension_upload.py`）

---

交叉引用：[`../reader-collection/`](../reader-collection/)（采集扩展）、[`../frontend/TODO.md`](../frontend/TODO.md)（编辑入口）、[`../docs/platform-implementation-plan.md`](../docs/platform-implementation-plan.md)（REQ 编号与周计划）、[`../docs/meetings/2026-10-29-EEA白皮书agent需求-智能纪要.md`](../docs/meetings/2026-10-29-EEA白皮书agent需求-智能纪要.md)（会议原文）
