# 走查记录：七环节链路复验（开发机 / 本地 PostgreSQL）

本文件是一次**走查**的执行记录，按[验收执行记录模板](../ACCEPTANCE-EXECUTION-RECORD-TEMPLATE.md)的字段组织。它**不是 DOC-05 的验收签收**：没有业务签字，没有 Linux 预生产，也没有干净的 Windows 业务机证据。判定使用模板口径：通过 / 失败 / 受阻 / 未运行。

## 本记录的适用规则

- **环境**：Windows 开发机 + 本机便携 PostgreSQL 的 `eea` 库；API 由 `scripts/dev.py` 启动。任何结论不得外推到 Linux 预生产/生产服务行为。
- **样本**：库内既有的 eFuse 链（两条真实公开来源）加合成反例 ID；不重新推导业务结论，只复核已有结论与门控是否成立。
- **能证明**：七环节的数据链路可走通、三个门控（改主题 409、伪造证据 422、缺步发布 422）确实生效且无部分写入、链路报告中文可提取。
- **不能证明**：业务准确率、Tier1 评分依据、真实身份与权限、并发与恢复、Windows 干净机采集、报告可对外汇报。
- **不代签**：`basis_freshness=stale` 的重新确认属于业务判断，本记录只归因、不代签（见 S8 与 O-1）。
- **可重跑性**：开发库会被并行会话改动（本次即发生，见 O-3），重现结论须用隔离库与固定提交。

## 追溯与范围

- 记录 ID：WALK-2026-11-25-七环节
- 关联任务：BE-02、BE-05…BE-11、BE-12、BE-14、BE-15、FE-10/11（组件级）
- 本次验证范围：在开发机上按「采集 → 信号 → 主题 → 需求 → 车辆功能 → 技术落脚点 → 标准九宫格 → 战略四步 → 链路报告」的顺序，逐环节复验既有 eFuse 链的真实数据与门控，并检查文档研究与 Agent 两条支线
- 不在本次范围内：真实业务准确率、Tier1 评分依据的业务复核、Linux 服务行为、Windows 业务机采集与 GUI、报告的业务可用性签字

## 来源与样本

- 来源类型：获准真实业务样本（链路内 2 条公开网页/微信来源已在库中留存）＋ 合成测试夹具（仅用于门控的反例）
- 样本标识：
  - 信号 `64d539c6-dd2c-415c-8a9b-31b5ba9ddc34`：微信公众号「佐思汽研」，URL `https://mp.weixin.qq.com/s/E6Q06Gjf2U9B23OmPUd09g`，归档 13,322,117 字节，正文 39,042 字符
  - 信号 `4515e3d8-04f3-44e6-8627-c32c9841a618`：EDN 电子技术设计，URL `https://www.ednchina.com/technews/31623.html`，归档 2,782,567 字节，正文 4,188 字符
  - 需求 `5f2f967f-2eef-4b56-9def-a21a366c273a`「低压系统智能化（W1 真实链）」
  - 文档 `1daa3ffd-6916-441e-809f-cb47834e5d56`：德赛西威 EEA 关键技术落脚点推导链路逐环节图文对照说明（eFuse）
- 合成成分：门控反例使用伪造/缺失的 ID 触发拒绝，不含虚构业务结论；主题 8/16 口径未在本次复验（库内为 2 条真实来源）

## 被测版本

- 仓库提交：`3d80f30`（执行时 HEAD），工作区含未提交改动（signal_dedup 候选预筛、cleanup 需求引用守卫、若干文档同步）
- 数据库：本地便携 PostgreSQL 16，数据库 `eea`，执行时迁移头 `0025_capture_client_claim_worker`（并行会话在本次走查期间把 head 从 0022 推进到 0025）
- 应用：`uv run python scripts/dev.py` 启动的 API（`127.0.0.1:8000`），Windows 开发机
- 模型网关：`CHAT_*` 指向内网网关；`/llm/status` 显示 attempt_budget=30、hedge 4.0s/4 路

## 执行目标与工具

- 目标类别：macOS/Windows 开发机组件走查（非平台验收）
- 主机：Windows 开发机；数据库与服务均在本机
- 工具：`Invoke-WebRequest`、`psql`（便携 PostgreSQL）、`uv run python`（pdfplumber）
- 身份：本地开发操作者 `local-development-user`（开发模式），不是真实代理身份
- 执行日期：2026-11-25（主机时钟）

## 基线快照（操作前）

| 项 | 值 |
| --- | --- |
| `/healthz` | `{"status":"ok","service":"EEA Backend"}` |
| `/readyz` | `ready`，database=true，object_dir=true，semantic_gateway=ok |
| 信号 / 主题 / 需求 / 功能 / 落脚点 | 62 / 5 / 1 / 3 / 3 |
| 标准格 / funnel / 研判 / 链路报告 / 文档 | 13 / 2 / 1 / 5 / 13 |
| 重复扫描 | 0 组（较 11-24 的若干测试组已消失，见「缺陷与观察」O-3） |
| eFuse 追溯 | `completeness.complete=true`，`basis_freshness=stale` |

## 步骤记录

### S1 采集与证据留存（环节一）

- 操作：读取两条链信号的详情、`/archive`、`/body`
- 实际结果：均 `channel` 正确（wechat_mp / web）、`evidence_status_code=retained`、归档与正文可读（字节数见上）；`published_at` 均为空，界面与报告显示「发布时间：未知」，未补成当天
- 证据：上述两条 ID 的 `GET /signals/{id}`、`/archive`、`/body`
- 判定：通过
- 缺陷：无

### S2 重复扫描与清理（环节一附带）

- 操作：`GET /signals/duplicates`；对唯一残留的测试样执行「归档 → 删除」
- 实际结果：扫描返回 0 组（`ZZ测试重复 A/B/C` 已由并行会话清除）；遗留测试行 `清理功能验证样本`（`https://example.com/dedupe-demo-20261119`）因不在任何重复组内，`cleanup` 端点按设计拒绝，改走 `PATCH → archived`（200）＋`DELETE`（204），随后 `GET` 返回 404；两条链信号未受影响
- 证据：删除前三处/后零组；审计行见 `GET /audit?entity_id=…`
- 判定：通过
- 缺陷：观察 O-2（单条非成组的测试样只能走归档删除路径，不是缺陷）

### S3 标签化（环节二）

- 操作：读取链信号的 `GET /audit?entity_id=<signal>`；尝试把被需求引用的信号改到另一主题
- 实际结果：
  - 审计含机器值与人工值对照：`tech_tags` machine `["48V电气架构"]` → human `["48V电气架构","域控"]`，操作者 `local-development-user/researcher`，时间 2026-11-24T11:03:11+08:00
  - 负例：`PUT /signals/{id}/theme` 改主题返回 **409**，消息为「该信号是已确认需求「低压系统智能化（W1 真实链）」的证据，移出主题后该需求无法再推导功能；请先调整需求证据或来源主题」
- 证据：审计 JSON、409 响应体
- 判定：通过
- 缺陷：无

### S4 主题 → 需求（环节三）

- 操作：读取主题指标；读取需求详情；用不存在的证据 ID 尝试 PATCH 需求
- 实际结果：主题 `metrics.signal_frequency=2`、`source_count=2`，`display_tags` 为 4 个开放标签；需求五步齐全、每步引用两条信号、`review_status=confirmed`、交叉验证结论「通过」；负例返回 **422**「需求推导引用了不存在的原始信号（REQ-DEM-03）」
- 证据：主题/需求 JSON、422 响应体
- 判定：通过
- 缺陷：无

### S5 车辆功能（环节四）

- 操作：读取需求下 3 个功能；提交缺步的正向推导并置 `published=true`
- 实际结果：主功能 `866b5aca-6683-4f8f-929b-5420e80d3e58` 已发布（`published=True`），正向 5 步、反向覆盖 2 条核心诉求、necessity 87 字符；负例返回 **422**「正向推导须完整填写五步：核心诉求、能力缺口、车端关键流、系统行为、车辆功能（REQ-MAP-02）」，且复核后仍 `published=True`、steps=5（无部分写入）
- 证据：功能 JSON、422 响应、拒绝后复读
- 判定：通过
- 缺陷：无

### S6 技术落脚点（环节五）

- 操作：读取 3 个落脚点与其域；读取 `/panorama`
- 实际结果：eFuse 落点（`695dac19…`，硬件域，角色「执行层硬件」）、适配拒绝样例（硬件域）、座舱多模融合感知模块；全景 `creation_supply` 阶段 demand=1、function=3、landing_point=3，与数据库一致
- 证据：`GET /landing-points`、`GET /panorama`
- 判定：通过
- 缺陷：观察 O-4（未发布功能拒绝建点的负例本次**未运行**：库内 3 个功能均已发布，且无删除接口可回收临时功能）

### S7 标准九宫格（环节六）

- 操作：读取 eFuse 落点九宫格；把「运营 × 工程化」填为临时文本，再恢复为 `NULL`
- 实际结果：初始 3 行——设计×工程化「满足 AEC-Q100，支持过流/过压/过热保护」、制造×工程化「完成保护功能验证」、运营×工程化 `null`（明确留空）；`standard_count=2`；填写后变 **3**，恢复 `null` 后回到 **2**；两次写入均返回 200 并刷新计数
- 证据：`GET /landing-points/{id}/standards`（cells 三条）、落点 `standard_count` 前后值、`/audit?entity_id=<lp>` 20 条
- 判定：通过
- 缺陷：无（填写/恢复是本次验证动作，最终状态与原始一致）

### S8 战略四步与依据新鲜度（环节七）

- 操作：读取 funnel 与研判历史；追查 `basis_freshness=stale` 的原因
- 实际结果：funnel `current_step=complete`、`pool_eligible=true`、适配 `pass`、部署边界证据为两条实质标准格的 ID（`3b0a5657…`、`e80532ed…`，不含留空格）；研判 `score_total=20`、分类「产业投资/生态合作」、`is_current=true`、1 个版本
- stale 归因：两条信号 `updated_at=2026-11-24T10:59:38`，晚于研判创建时间（2026-11-20）；审计显示 11-23 17:23 被移到「蔚来ET9」主题、11-24 10:59 又移回「低压系统智能化」，11-24 11:03 技术标签被改写。系统据此把依据标记为 stale，未静默当作最新
- 处置决定：**保留旧版本并记录缺口**。重新确认 4/4/3/4/5 属于业务判断，本次走查不代为签署；需研究者/业务负责人在界面重新确认后才能解除 stale
- 证据：funnel JSON、研判历史（score=20/current=true）、信号 `updated_at`、10 条审计（主题与标签变更）
- 判定：通过（状态与门控正确）；**业务复核未运行**
- 缺陷：观察 O-1

### S9 链路报告

- 操作：为 eFuse 落点生成 Markdown 与 PDF 报告并下载；用 pdfplumber 提取 PDF 文本
- 实际结果：两条均 `succeeded`——MD `dbbd2fdc-7f5a-4b74-9c24-b9f251e0598f`（4,452 字节）、PDF `2ae20697-6b1a-4852-a1a6-3a3eaf5adc12`（7,743 字节）；PDF 3 页、2,413 字符，可检索到「EEA 链路报告」「智能保险丝（eFuse）」「硬件」「明确留空」「总分 20」「原始证据」，中文不是空白/乱码；MD 内含五步推导、交叉验证、九宫格三态、战略版本与原始证据（两条 URL、发布时间「未知」）
- 证据：报告 ID、字节数、PDF 提取命中表；下载副本临时保存于 `%TEMP%`
- 判定：通过
- 缺陷：无

### B1 文档研究（支线）

- 操作：读取 eFuse 文档图块与章节；对图 7 触发单图重新识别
- 实际结果：7 张图全部 `review_status=ready`；图 1 `occurrence_count=2`（同一图片插入两次）；章节路径覆盖环节一…环节六；18 个 chunk；重新识别 2.6 秒返回 200，图注由 36 字符变为 104 字符，文档仍 `parsed`、图数仍 7、正文未丢失
- 证据：图块 JSON、chunk 数、recaption 前后图注
- 判定：通过
- 缺陷：观察 O-5——重新识别的新图注描述「策略漏斗数据看板」，而该图位于「环节六：EEA部署标准构建」；技术成功不等于语义正确，需人工语义核对（正是模板禁止用「有内容」代替正确的原因）

### B2 Agent（支线）

- 操作：新建会话并提问，读取 `served_model` 与引用；创建/删除一条项目记忆
- 实际结果：两次回答尝试均**失败**——分别耗时 90.6 s 与 90.2 s，`status=failed`、`served_model=None`，`eea_agent_run.error_message` 为「LLM 上游错误 (504)：模型在限定时间内未返回完整结果」；引用数为 0，无法核验（同库 12:28 的一轮曾在 56 s 内完成）；记忆创建 200、删除 204，删除后列表为 0
- 证据：会话 `866dca2d-dfef-4fc0-8639-29a7e35461b3`、两次 run 的 `error_message`、`/llm/status`（glm-5.3-o-anthropic 43.11 TPS/failures=2，Qwen3.6-35B unavailable）
- 判定：**失败**（上游 504，非应用缺陷）；引用核验与伪造引用拒绝本次**未运行**
- 缺陷：观察 O-6

## 判定汇总

| 步骤 | 判定 | 关键证据 | 缺陷/观察 |
| --- | --- | --- | --- |
| S1 采集与留存 | 通过 | 两条信号归档 13.3 MB / 2.78 MB，正文 39,042 / 4,188 字符 | — |
| S2 重复扫描与清理 | 通过 | 0 组；归档后删除 204，404 复读 | O-2 |
| S3 标签化 | 通过 | 机器/人工值审计；改主题 409 点名需求 | — |
| S4 主题→需求 | 通过 | freq=2 source=2；伪造证据 422 | — |
| S5 车辆功能 | 通过 | published=True；缺步 422 且无部分写入 | — |
| S6 技术落脚点 | 通过 | 3 落点、全景计数一致 | O-4（负例未运行） |
| S7 标准九宫格 | 通过 | 2 实质 + 1 明确留空；填写→3，恢复→2 | — |
| S8 战略四步 | 通过（门控） | 4/4/3/4/5=20；stale 归因到 11-23/24 的主题与标签改动 | O-1 |
| S9 链路报告 | 通过 | MD 4,452 B；PDF 3 页 2,413 字符，中文可提取 | — |
| B1 文档研究 | 通过（技术） | 7 图/图1 插入 2 次/18 chunk；recaption 2.6 s | O-5 |
| B2 Agent | 失败（上游 504） | 两次 90 s 超时、served_model=None；记忆 200/204 | O-6 |

## 缺陷与观察

- **O-1 依据过期未被业务复核**：eFuse 链的依据在 11-23/24 被改动（主题往返、标签改写），研判仍为 11-20 的 v1，`basis_freshness=stale`。系统行为正确（不冒充最新），但需要业务负责人重新确认；本次未代签。
- **O-2 单条测试样无法走重复清理**：`cleanup` 只处理成组信号，单条测试样必须「归档 → 删除」两步；这是设计边界，记录以免误判为缺陷。
- **O-3 开发库被并行会话改动**：11-24 的 `ZZ测试重复 A/B/C` 在本次走查前已消失；行数仍为 62 说明同期有新增。开发库不是稳定基线，验收数据必须用隔离库。
- **O-4 「未发布功能拒绝建点」负例未运行**：库内 3 个功能均已发布，创建临时功能后无删除接口可回收，故不制造残留。
- **O-5 图注语义与章节不符**：重新识别成功但把环节六的图描述为「策略漏斗看板」；技术通过、语义需人工核对。
- **O-6 模型网关当前不可用**：两次 Agent 轮次均 504；同时 Qwen3.6-35B 被标记 unavailable。属外部依赖，不是应用缺陷，但会让「引用可核验」无法在本轮复验。
- **O-7 落点无删除接口**：临时/样例落脚点只能通过 SQL 删除（本次清理即如此），缺一个受审计的删除路径；删除后 `eea_correction_audit` 中仍保留该落点 8 条审计（无外键），形成指向已删实体的历史行。
- **O-8 维护命令在 Windows 默认事件循环下不可用**：直接 `uv run python -m app.services.orphan_maintenance` 报 psycopg「cannot use the ProactorEventLoop」，须先设置 `WindowsSelectorEventLoopPolicy` 才能跑；与 `dev.py` 已有处理不一致，建议脚本入口自行设置。

## 清理记录

执行时间：2026-11-25。均为开发库/开发机清理，未触碰生产环境。

| 对象 | 处理 | 前后 |
| --- | --- | --- |
| 测试信号 `清理功能验证样本`（`example.com/dedupe-demo…`） | 归档（200）→ 删除（204），审计留痕 | 信号 62 → 61 |
| 样例落脚点「智能保险丝（eFuse，适配拒绝样例）」 | SQL 事务删除（无删除接口，见 O-7），级联 1 标准格 + 1 funnel | 落点 3 → 2，标准格 13 → 12，funnel 2 → 1 |
| 走查临时 Agent 会话 `866dca2d…` | SQL 删除，级联 2 个失败 run 与 3 条消息 | 会话数 −1 |
| 走查新生成报告 | **保留**（MD `dbbd2fdc…`、PDF `2ae20697…`），作为本记录证据 | 报告 5 → 7 |
| `frontend/.next` | 删除（构建缓存） | 释放 463 MB |
| `backend/data/browser-profile` | 删除（Edge 采集 profile，可再生） | 释放 536 MB |
| `__pycache__`（1,323 个）、`.pytest_cache`、`frontend/test-results` | 删除 | 计入下方合计 |
| 临时脚本 `_check_pdf.py`、`_walk_read.py`、`_walk_recaption.py`、`_walk_agent*.py` | 删除 | — |
| `%TEMP%` 下的报告副本与 `eea-dev-8000.log*` | 删除 | — |
| 合计释放 | | **1,081 MB** |
| 保留 | `backend/.pg`（2.3 GB，含对象存储，删除即毁开发库）、`backend/data/backup-2026-11-20.sql` 与 `.dump`（43 MB 安全副本）、`backend/scripts/probe_dedup_scan_cost.py`（交付记录引用） | |

清理后复核：重复扫描 0 组（61 条信号）；`orphan_maintenance` 干跑 `pruned_orphans=0`；`alembic heads` = `0025_capture_client_claim_worker`；`pytest tests/test_db_schema.py tests/test_signal_dedup.py` → 27 passed；`http://localhost:3000` 仍 200（Next 已重建缓存）。

未清理、题外：`backend/data` 下两份 11-20 数据库备份（安全副本，建议保留）；开发库内 14 个历史 Agent 会话由其它会话创建，不属于本次范围；`%TEMP%` 下其它早期会话产生的 `eea-*.log`/`*.png`（如 Playwright 截图）未动，避免影响并行会话。

**缓存会回来**：只要 `pnpm dev` 在跑，`frontend/.next` 会立即重建；只要跑 pytest，`__pycache__` 与 `.pytest_cache` 会重新生成。因此「清理」是时点快照，需要彻底清空时得先停开发服务器与测试。

## 限制与说明

- 带截图的汇总版见[项目报告](../FINAL-REPORT.md#6-全流程走查带截图)；本记录保留字段级证据与缺陷编号。

- 本记录支持的结论：在开发机上，七环节的数据、门控与报告链路可用；三个负例门控（改主题 409、伪造证据 422、缺步发布 422）确实生效且无部分写入
- 不支持的结论：业务准确率、Tier1 依据、真实身份与权限、Linux 行为、Windows 干净机采集、报告可用于汇报
- 未覆盖：未发布功能拒绝建点、Agent 引用与伪造引用、主题 8/16 口径、并发与恢复
- 平台限制：Windows 开发机 + 便携 PostgreSQL 的记录不能外推为 Linux 预生产或生产验收
