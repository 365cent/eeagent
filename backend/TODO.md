# Backend 实施清单

更新：2026-11-09。范围：原始 Word 七环节、已决 REQ、文档与 Agent 扩展，直至 Linux 内网生产验收。项目顺序见 [总清单](../TODO.md)，逐条来源与验收见 [需求追溯表](../docs/REQUIREMENTS-TRACEABILITY.md)。

## 执行约定与现状

任务均为剩余工作；“部分实现”不等于通过验收。每次交付更新任务状态及证据链接，完成后从剩余任务移至交付记录。依赖 ID 由总清单统一索引。代码和测试存在可证明实现范围，本次文档整理未运行应用测试，不沿用旧版通过数量。

已存在：FastAPI 路由、SQLAlchemy 实体、0001–0012 迁移（0007 为同步采集幂等键，0008 为持久采集任务，0009 为审计前后值，0010 为功能卡字段及五域词项，0011 为需求五步证据链，0012 为战略漏斗草稿）、Word/PDF 摄取与图像视觉描述、规则和 LLM 建议、人工编辑审计、需求/功能/标准/评分 API。当前代码已包含身份来源校验、需求/功能复核门控、功能正反向发布门控与标准格审计切片；这些仍需各子任务规定的权限、并发、浏览器和目标平台验收。剩余缺口包括语义分类质量、需求/标准/战略页面完整体验、稳定身份代理集成、持久会话/引用、运行任务取消与对象清理、Linux 生产验证。

沿用 Python/FastAPI/PostgreSQL/Pydantic AI。正文与归档使用对象键；新增结构走 Alembic，禁止修改已发布迁移。升级测试须覆盖空库和已有数据。服务端角色与操作者可信来源由 OPS-03 定义，不能信任请求体自报角色。

## BE-01 统一采集与可靠任务

- [ ] P0 · 部分实现 · 依赖 OPS-01（生产初始化）、BE-03（身份接入后收紧权限）。
- 已交付幂等和持久任务首个实现切片；实现与检查证据见[交付记录](../docs/DELIVERY-RECORD.md#be-01--capture-idempotency-and-durable-worker-slice)。BE-01 验收仍未完成。
- 摄取和结果查询迁入共享 evidence 领域；仍需验证完整的事务边界、失败恢复及各入口行为一致性。
- 来源：Word §2.1、表A；REQ-SIG-01/02/07/10/11；WBS 1.3.2。
- 入口：[capture.py](app/api/v1/capture.py)、[signals.py](app/api/v1/signals.py)、[documents.py](app/api/v1/documents.py)、[objectstore.py](app/services/objectstore.py)。
- 把路由之间互调私有函数改为共享摄取服务，统一空文件、MIME/扩展名、大小限制、渠道识别、来源 URL、文档哈希和异常处理。
- 统一入口沿用 multipart 的 url/file；URL + HTML 文件合法。仅 URL 的公网抓取在生产默认禁用，返回终端采集指引；开发/明确内网抓取单独配置。
- `0007` 为同步入口提供可选 `submission_id`；`0008` 为异步入口提供必需 `submission_id`。相同 ID 与相同请求重放既有任务/信号，不同请求复用 ID 返回 409。Capture 现在接受 `channel_code`，`.html/.htm/.xhtml` 扩展名均正确识别。
- 原始证据对象通过同目录临时文件、fsync 与原子替换发布；对象键必须解析在 `OBJECT_DIR` 内。URL-only 服务端抓取需 `CAPTURE_SERVER_FETCH_ENABLED=true`，且 `APP_ENV=production` 时无条件拒绝。
- 异步入口在解析前先将原始字节持久化，再将任务写入 PostgreSQL；独立 `python -m app.worker` 以 `SKIP LOCKED` 领取，租约心跳覆盖长解析，进程中断后过期任务可由另一个 worker 续跑。异步状态属于任务，不新增第六种证据状态。
- `GET /capture/jobs/{id}` 返回当前状态和成功结果；`POST .../retry` 重排失败任务，`POST .../cancel` 仅取消尚未领取的任务。自动重试有次数上限和退避；同一 submission ID 不会重复创建信号。
- 失败保留 URL、时间和原因；恢复后复用任务关联。重复文档复用 blob，信号创建的幂等范围须单独按 submission_id 控制。
- 对象写入采用临时文件加原子替换；阻止对象键路径越界；数据库提交失败后保留可清理孤立对象记录，不能误报成功。
- 剩余：孤立对象与终态任务清理策略（`orphan_maintenance` 仅报告/可选清理入口）；任务暂未绑定可信用户，跨用户查询/操作须等 OPS-03；Linux 数据库迁移、worker 重启及端到端证据未验证。运行中任务协作式取消已实现（`cancel_requested_at` + worker 检查）。
- 剩余验收：URL/HTML/文档/粘贴统一留存；空、超限、错误 MIME、幂等冲突/并发、进程中断和重试；前端与 Go 客户端必须显示真实任务状态和最终结果。生产公网页面必须由用户侧浏览器采集上传，生产环境不调用服务端 `fetch_url()`。

## BE-02 证据生命周期与查询

- [ ] P0 · 部分实现 · 依赖 BE-01。
- 来源：Word §2.1–2.2、图2-1-1/2-1-2/2-2；REQ-SIG-03…11；WBS 1.3.2。
- 入口：[signals.py](app/api/v1/signals.py)、[schemas.py](app/schemas/schemas.py)、[html_snapshot.py](app/services/html_snapshot.py)。
- 统一 metadata、采集时间、实际事件时间与发布时间语义；未知日期不补成当天（`event_date_text`/`event_date_precision` 已在共享 `create_signal_record` 写入）。保留原文、原链接与派生正文；正文修补留版本/审计。
- 在服务端约束五种证据状态及两种演进节点；没有可读且已落盘的快照不能标已留存。待人工复核表示已有证据但分类/归集未确认。
- 完成检索标题、发布主体、摘要与技术标签，以及来源/渠道/环节/状态/主题筛选。保留列表兼容形状，通过响应总数头提供分页总量。
- 归档后禁止新自动推导和自动覆盖，历史链路仍可读；恢复后需要重新复核。补正文后按规则更新状态，禁止仅修改状态制造成功。
- archive 回放使用隔离 iframe 与受限响应策略；文件/图片缺失返回明确错误。
- 验收：各状态转换、分页边界、中文/标签搜索、归档与恢复、失效对象、粘贴修复和回放隔离均有覆盖。

## BE-03 操作者与审计

- [ ] P0 · 部分实现 · 依赖 OPS-03；不阻塞身份接口之外的纯函数开发。
- 来源：Word §2.2–2.4；REQ-RULE-02、REQ-AGT-02/04；WBS 1.3.3、1.7.1。
- 入口：[audit.py](app/services/audit.py)、[session.py](app/api/v1/session.py)、[models.py](app/models/models.py)。
- 统一服务端 operator subject/role；研究者与方法论/词表管理员权限由服务器角色映射决定。IP 访问日志不充当身份认证。
- 对分类、标签、主题、需求复核、映射发布、落脚点角色、标准与战略变更记录原值/新值/人员/时间/理由；保存机器值及模型、规则、skill 版本和分数来源。
- 保存字段级人工确认状态，自动重算只生成差异建议；显式人工提交才覆盖。自动动作也记录来源，禁止 auto-aggregate 无痕覆盖人工主题。
- 对更新使用版本/条件写入检测过期提交，返回 409；审计与业务更新同事务，无变化不重复审计。
- 验收：伪造角色、无权限复核、过期保存、人工值保护、事务失败及全部审计字段可追溯。

## BE-04 语义模型和共享分类服务

- [ ] P1 · 部分实现（入库和建议接口已调用内网模型生成环节、类型和技术标签，仍待统一重算、候选解释、语义精排与真实网关验收）· 依赖 BE-03（持久修改保护）。
- 来源：Word §2.2–2.3；REQ-TAG-04/05/06、REQ-DEM-03；WBS 1.3.3/1.3.4。
- 入口：[tagging.py](app/services/tagging.py)、[judgment.py](app/services/judgment.py)、[llm.py](app/services/llm.py)、[config.py](app/core/config.py)；新增 embedding/rerank 服务。
- 采用已有计划的 TF-IDF + TextRank 召回、标题加权、embedding 近义合并、rerank 精排；保留离线规则/jieba 回退，标签数量随内容变化。
- 网关批量最多 16、限制并发、超时和退避；校验空响应、索引、向量维度和有限数值。无配置时返回不可用状态和降级理由。
- 新增内容哈希+模型版本的 JSONB 向量缓存，numpy 余弦；词表/主题内容变化失效。直接声明所用依赖，不能依赖开发机偶然安装。
- 阈值可配置，0.85 仅作旧方案初始实验值，生产阈值由黄金集确认。保留能力边界，不新增向量服务或 pgvector。
- 入库、建议、auto-tag 共用同一服务。POST /signals/{id}/auto-tag 返回三维建议、分数/理由；已人工确认字段默认不写。
- TagSuggestion 保留 suggested_tags/source，新增逐候选 details，含词频、相似度、精排分与证据；前端旧字段继续可用。
- 价值链与信号类型经 refcodes.normalize 落码；不能将开放标签名称交给封闭 code 验证或让模型创造 code。
- 验收：MockTransport 覆盖排序、超时、畸形响应、缓存失效、同义标签和低置信度；不依赖真实网关完成单元测试。

## BE-05 主题归集与来源计数

- [ ] P1 · 部分实现 · 主题归集/来源计数依赖 BE-03、BE-04；自动建议接入 BE-06，手工维护可先交付。
- 来源：Word §2.3、图2-3、表1；REQ-SIG-08、REQ-DEM-02/03/05/08/14/15；WBS 1.3.4。
- 入口：[themes.py](app/api/v1/themes.py)、[judgment.py](app/services/judgment.py)、主题指标视图迁移、[test_themes.py](tests/test_themes.py)。
- 以技术对象、底层能力、变化方向输出结构化归集依据（wave-1：`aggregation_structured_basis` + 自动归集一致性门控）；相似度和次优差值用于候选筛选，不能替代业务论证。单一信号当前最多一个主题。
- 自动归集仅处理未确认字段且须通过对象/能力/变化方向一致性规则；并列/证据不足返回理由，保留手动指派与移出。文档信号在新抽取能力验收前保持人工指定。
- 新增信号的可追溯来源关联，包含主 URL 与补充 URL、规范化 URL、出处；迁移现有主链接，支持去重，禁止为了计数制造 URL。
- 信号频次统计未归档主题成员；来源数统计主题历史关联成员的全部去重 URL（含归档来源，延续现有 source_count 行为），UI 明示两者口径。活动推导始终排除归档信号。
- 修正计数查询，防多 URL/多标签 join 放大。主题来源更新与失效要可复核；主题不提供需求合并或优先级排序。
- 聚类仅输出候选名称、成员和解释；人工确认后创建主题/开放标签。离线脚本默认只出报告，显式 apply 才写；不创建封闭类目。
- 验收：8 条信号/16 URL 的隔离测试 fixture、共享 URL、归档、重新归集、同词异义/异词同义；真实 8/16 复现等待 DOC-02 数据。

## BE-06 需求点推导与复核

- [ ] P0 · 部分实现 · 依赖 BE-02、BE-03；BE-05 为自动建议前置，手工流程可先实现。
- 全景工作簿导入仅建立待复核需求，不自动填写交叉验证结论或确认；下游功能须经正常人工流程。旧数据可运行 `python -m app.services.panorama_review_report` 输出待人工核查的候选记录；标记仅为启发式，不能证明来源或自动修改历史。
- 已新增五步逐项引用门控；只接受同一来源主题下已留存信号。确认时再次校验至少两条不同 URL、发布主体和渠道的留存信号，且每条有技术标签、标签组合有差异；仅 taxonomy_admin/platform_admin 可确认。下游功能创建/发布与技术落脚点新增/编辑会重新核验当前证据。修改已确认需求会退回复核并撤销下游发布。FE-05 工作台切片已交付；真实时序与业务交叉验证质量验收仍依赖 DOC-04。
- 来源：Word §2.3；REQ-DEM-01/04/06/07/09/10/11/12/13/15；WBS 1.3.4。
- 入口：[demands.py](app/api/v1/demands.py)、[schemas.py](app/schemas/schemas.py)、[test_demands.py](tests/test_demands.py)。
- 用类型化 JSON 保存事实识别、频率共识、相似性分析、利益相关方归因、系统级命名五步及引用；保持主题与需求两表。
- 记录交叉验证 status（pending/passed/failed）、不同主体/证据类型/产业视角、反证和结论；记录人工确认者与时间。
- 时间序列按事件时间排序并记录精度（年/月/日/未知），保留不同路线成熟度差异，不能将同期证据等同成熟量产。
- 通过交叉验证并人工确认才允许进入功能推导；空字典或“有 JSON”不能当通过。被拒需求保留证据和原因。
- 修改已确认推导会使其待复核；已有下游历史保留并提示依据变化，新的发布须重新通过验证。
- 低频强信号提供人工标记与理由，不转化为主题排名。不同价值链的诉求分别建需求。
- 验收：单企业宣传、跨端合并、未命名/未复核、反证、未知日期、修改后复核失效及正确功能数量。

## BE-07 车辆功能与发布门控

- [ ] P0 · 部分实现 · 依赖 BE-06、BE-03。
- 来源：Word §2.4、图2-4；REQ-MAP-01…06；WBS 1.3.5。
- 入口：[functions.py](app/api/v1/functions.py)、函数 schemas、[test_functions.py](tests/test_functions.py)。
- 前向保存核心诉求、缺口、车端关键流、系统行为、车辆功能五步，逐项带解释/证据。
- 反向保存必要性、各项核心诉求覆盖关系、遗漏/冲突及确认结论。五步存在不代表一致性已通过。
- 对合并后的新状态执行校验；同一 PATCH 补全推导并发布应可行，缺项/反向失败/需求未通过应拒绝且零部分写入。
- 只有完整覆盖、必要性成立、正反向一致并人工确认才可发布。更改推导后取消当前发布资格，保留历史版本。
- 需求与价值链一致；候选功能不可伪装成已发布映射。
- 验收：仅远程开关、仅电流采集、仅电子熔断分别失败；完整“感知—判断—控制—保护—恢复”链可通过；并发/旧版本提交不覆盖。

## BE-08 技术落脚点与全景

- [ ] P0 · 部分实现 · 依赖 BE-07、BE-03。
- 来源：Word §2.5、图2-5；REQ-TECH-01…04；WBS 1.3.6、1.4.2。
- 入口：[landing_points.py](app/api/v1/landing_points.py)、[panorama.py](app/api/v1/panorama.py)。
- 创建/编辑落脚点时检查所属功能仍已发布且需求证据仍有效；PATCH 已支持名称、域、角色更新并写入前后值审计。
- 一功能可关联五域多落脚点；2026-11-09 流程图确认软件、硬件、通信、电源与能源管理、工具。通过迁移 0010 初始化五个域词项；域词表继续开放复用，不能封闭为五值。
- 全景完整展开所有需求/功能/落脚点及真实计数，不截取前两个节点；标准数只计实质条款。
- 验收：未发布功能拒绝创建、开放域去重复用、角色修改审计、多分支追溯、空库真实为零。

## BE-09 部署标准矩阵

- [ ] P0 · 部分实现 · 依赖 BE-08、BE-03。
- 来源：Word §2.6、表B、图2-6；REQ-STD-01…03；WBS 1.3.7。
- 入口：[standards.py](app/api/v1/standards.py)、标准 schemas、[test_standards.py](tests/test_standards.py)。
- 保持 3×3 定位：无行=尚未填写，行在且 NULL=明确留空，非空文本=实质要求；API 写入必须显式传文本或 NULL。
- 支持三类约束同等录入；空白不生成默认条款。按格事务锁串行化并发 upsert，修改审计保存前后值。
- 开发 seed 不创建合成业务链；验收 fixture 单独创建两项实质条款，并验证运营空白不被计作第三项标准。
- 验收：eFuse 两条实质要求、运营明确留空、其他未填格可区分；并发同格只有一行，修改可追溯。

## BE-10 战略四步漏斗

- [ ] P0 · 部分实现 · 依赖 BE-08、BE-09、BE-03；定制依据依赖 DOC-02。
- 来源：Word §2.7、表C、图2-7；REQ-STR-01…07；WBS 1.3.8。
- 入口：[strategy.py](app/api/v1/strategy.py)、[models.py](app/models/models.py)、[test_strategy.py](tests/test_strategy.py)。
- 新增独立 funnel 工作记录承载行业扫描、Tier1 适配判断、评分草稿与分类状态；现有 StrategicAssessment 继续保存完整研判版本。
- GET/PATCH /strategy/landing-points/{id}/funnel 暴露当前步骤、理由、证据、是否通过；按顺序推进。第二步 rejected 不写虚构分数和分类。
- 第三步要求五维整数 1–5 及各维理由；第四步必须三类之一且有策略备注。综合分服务端计算，禁止依据分数阈值自动选择分类。
- 行业扫描保留范围/来源；Tier1 判断回答现在/未来业务关联及公司有价值的角色，不将公司假设为器件供给方。
- 入池须有部署边界记录；评分还须适配通过。所有旧创建端点调用相同验证服务，不提供绕过路径。
- 完成或改判时锁定落脚点并追加版本，旧版本保留；一个 current，历史可读。旧评分可展示，不反推伪造适配理由，新增改判需走新流程。
- 验收：跨步失败、过滤失败无评分、0/6/小数/布尔评分拒绝、总分正确、并发改判一致；eFuse 4/4/3/4/5=20 与生态合作理由可回溯。
- 已实现切片：独立漏斗草稿表与 0012 迁移；服务端顺序门控、拒绝退出、逐维理由/服务端总分、显式分类、前后值审计、版本快照和兼容旧创建端点验证。
- 检查：macOS 隔离 `eea_test` 上焦点策略/模式用例 23 passed；全量后端 291 passed、1 skipped。Python AST/`compileall` 与 scoped `git diff --check` 通过。
- 仍需：DOC-02 的 Tier1/评分依据与 eFuse 业务材料、真实 eFuse 4/4/3/4/5 逐项复核、Linux 身份/并发/迁移验收；确认完整应用角色授权规则，不能把 Mac 组件测试外推为生产验收。

## BE-11 追溯与真实总览

- [ ] P0 · 部分实现 · 依赖 BE-05…BE-10。
- 来源：Word 表1、图2-4/2-6/2-7及末尾数据说明；REQ-RULE-03/04、REQ-UI-02；WBS 1.3.9。
- 入口：[trace.py](app/api/v1/trace.py)、[overview.py](app/api/v1/overview.py)。
- 返回真实落脚点→功能→需求→主题→信号/文件/图块，携带验证状态、依据更新提示、归档标记和评分版本。
- 统一信号/来源/功能/实质标准计数，新增真实“本周新增”和四步漏斗计数；绝不写截图常量。
- 概览待办来自未复核/失败任务；缺链显示缺失环节，不补示例。
- 验收：多分支、空库、归档历史、删除/缺失对象及修正后刷新，所有计数与底层记录相符。
- 已实现切片：`/overview` 返回去重来源、信号状态、待复核/失败任务、实质标准、UTC 本周新增与独占四步战略计数；计数口径写入 OpenAPI 描述。追溯返回链路缺项/失效引用、主题成员与需求证据分支、文件/网页存档引用、归档状态及当前/历史战略版本。
- 检查：macOS 隔离 `eea_test` 上 trace/overview 焦点用例 **20 passed**，含空/失效链接、归档、文档引用、每步战略计数、周窗口、失败重试和规范化来源去重。本次集成后全量回归 300 项通过、1 项跳过。
- 仍需：需求/证据修改后是否过期目前为 `unknown_untracked`；`DemandPoint` 没有复核时间基线，不能可靠提示“依据已更新”。对象引用存在不代表存储对象可读；Linux、真实来源、刷新走查与完整图块定位仍待验。

## BE-12 文档图块与章节检索

- [ ] P1 · 部分实现 · 依赖 BE-01、BE-04、BE-03。
- 来源：实施计划 §7.1 REQ-DOC-01…05；Word 七图；WBS 1.3.11、1.4.5。
- 入口：[doc_ingest.py](app/services/doc_ingest.py)、[doc_summary.py](app/services/doc_summary.py)、[documents.py](app/api/v1/documents.py)。
- 保留原始哈希、解析器/模型版本、页数/图数/错误；图块保存原件索引、出现位置、caption/OCR、识别置信度及 review 状态。
- OOXML 按实际文档引用顺序映射图，区别 7 张不同图片和 8 次插入；PPT 正文/notes 与 master 装饰区分；PDF 缺 OCR 时明确失败/待复核。
- PPTX **预览** vendored [`deckpeek`](vendor/deckpeek/deckpeek.py)（[`docs/research/2026-11-10-deckpeek-pptx-preview-reference.md`](../../docs/research/2026-11-10-deckpeek-pptx-preview-reference.md)）：Linux 结构 HTML + 可选 LibreOffice→PDF→PNG 胶片条；Windows 侧 COM 底图仍可选。
- 文字可独立留存，图识别失败不让整份文档丢失；canonical 不保留未解释的 base64 占位，不虚构失败图描述。
- 按标题路径分块，图块并入所属章节；关键词层级、分数与引用可读取/重算。新增 /documents/{id}/keywords、/extract-keywords 与图块读取契约。
- 文档派生信号继续使用摘要及 document_id，不把全文塞回 body；通过分类服务生成建议，主题写入仍需已确认流程。
- 高频细粒度词升格为开放标签前输出候选和出现文档数，人工确认后复用词表 API。
- 验收：原始 Word 的七图都有文本和可定位引用，重复插图不乱号；部分失败/重跑幂等/章节路径/摘要与全文分离。

## BE-13 业务 skills 与评估

- [ ] P1 · 未开始 · 依赖 BE-04、DOC-02（真实材料）。
- 来源：2026-10-29 会议第一/第二阶段；REQ-TAG-04/05、REQ-DEM-03；WBS 1.2.5、1.3.3/1.3.4、1.5。
- 定义声明式版本化 skill 包：适用环节、分类规则、推导步骤、提示词/示例、版本与校验和；由 SKILLS_DIR 加载，不执行任意脚本。
- 明确优先级：批准业务规则 > 语义模型 > 词频规则；记录冲突及被覆盖理由。缺少业务包时显示基线模式，不能声称业务规则已接入。
- 20 条人工标注黄金集记录环节/类型/标签/主题和期望理由，评估脚本输出准确率、失败样本、阈值和版本。
- WBS 自动分类最低 70% 为原验收基线；价值链 90%、其余 80% 为后续目标，分别记录，不能自动降低或混用。生产阈值由业务审核。
- 性能目标沿用旧 T5：单条分类 ≤3s、100 条 ≤3min，记录硬件/缓存/网关条件及实际结果。
- 验收：桩模型可重复测试；真实材料评估报告单独签字；不得用 mock 结果代替业务准确率。

## BE-14 产品内 Agent 与确认写回

- [~] P1 · 后端工作流与验收测试已落地（`POST /api/v1/agent/*`、SSE、变更单、记忆）；FE-11 与网关真机签字仍开放 · 依赖 BE-03/04/12/13。
- 来源：实施计划 §7.2 REQ-AGT-01…06；WBS 1.3.10。
- 入口：[agent_workflow.py](app/services/agent_workflow.py)、[agent_runtime.py](app/services/agent_runtime.py)、[api/v1/agent.py](app/api/v1/agent.py)；遗留 [`/signals/{id}/assistant/messages`](app/api/v1/signals.py) 保持兼容。
- 单一 Pydantic AI 编排；新增 sessions/messages 持久化和 SSE，支持重连、取消、错误结束；使用已安装版本支持的序列化 API。
- 注册 search_evidence/search_rag/suggest_tags/suggest_theme/propose_patch/apply_confirmed_patch/draft_trace_report；不暴露 shell、任意 SQL 或文件路径。
- 引用最少到信号或文档 chunk，图块带 figure_index；验证引用真实存在。检索过滤用户可见范围。
- 变更单保存基准版本、字段差异、理由和待确认状态；确认只应用所展示差异一次，过期需重新生成；拒绝不写业务数据。
- 用户/项目记忆单独存储、可查看删除，不能把主数据更正自动当私人事实；所有会话与记忆检查归属。
- 验收：跨用户隔离、取消/重连、伪造引用、重复确认、过期变更、人工字段保护、日志无密钥。
- **macOS 证据（2026-11-11）**：`uv run pytest -q tests/test_agent_workflow.py tests/test_pydantic_ai_wiring.py` → 18 passed（含 10 步 smoke、SSE、`model_messages_json` 持久化）；可选 `EEA_LLM_INTEGRATION=1 … test_agent_live.py`。

## BE-15 链路报告

- [~] P1 · Markdown + ReportLab PDF 已落地（`chain_report.py` / `chain_report_pdf.py`，`GET …/download?format=pdf`）；黄金集与 Linux 字体容器验收仍开放 · 依赖 BE-11、BE-12、BE-14。
- 来源：WBS 1.3.12；REQ-RULE-03、REQ-AGT-03；Word 表1/A/B/C。
- 按需求点或落脚点生成 Markdown 与 PDF，包含原始证据、方法推导、审查结论、技术角色、空标准格、战略理由/版本、引用和局限。
- 生成可留存/下载的报告任务与元数据，标明生成时间、使用数据版本和模型；无 LLM 时仍可导出确定性链路摘要。
- 单信号导图/信息图/音频功能保持现状，不用其替代链路报告。
- 验收：引用可点击回源、缺数据明确为空、PDF 中文可读、报告由电气工程师确认可用于汇报。

## BE-16 回归、迁移与交付

- [ ] P0 · 未验证 · 依赖代码任务的组件实现、迁移与验证；集成部署/离线包/恢复验收由 OPS-06 在 BE-16 后完成。
- 来源：WBS 1.2.6、1.5.1…1.5.5、1.6、1.7。
- [tests/](tests/) 按需求补负面/并发/持久性测试；pytest 单进程，隔离 eea_test 与临时对象目录，不接真实生产数据。
- 新迁移覆盖来源、review、funnel、缓存、图块、会话等；以当前 0012_strategy_funnel 为 head 按实施顺序分配后续 revision，旧方案中 embedding/document keyword 的编号不可复用为既有迁移证据。
- 完成需求对应的组件级回归、OpenAPI 与前端类型契约检查、迁移升级/降级检查；未知旧 JSON 不自动批准，历史快照与评分保持可读。
- 交付代码仓库层面的依赖锁定、启动/配置契约与组件验证证据；不把 macOS 检查描述为 Linux worker 或生产存储验收。
- Linux 集成、离线 wheel 包、生产升级、备份/恢复及 10,000 条性能报告由 OPS-06 在 BE-16 后统一验收，避免 BE-16 ↔ OPS-02/05 循环依赖。
- 验收：每条 traceability 用例有组件结果；迁移与接口契约检查齐全，严重缺陷清零；部署和恢复签收记录挂接 OPS-06。

## BE-17 领域分层与依赖边界

- [ ] P0 · 未开始 · 依赖无；与 BE-16 的契约检查互补，不阻塞既有路由交付。
- 目标：HTTP 仅编排；平台横切能力归 `app/platform`；业务能力逐步迁入 `app/domains/*`；削减 `app.services` → `app.api` 反向依赖。
- [ ] 约定目录：`app/platform`（配置、DB、身份、对象存储）、`app/domains/<bounded-context>`（用例与实体）、`app/api`（路由与 DTO 映射）；保留 `app/schemas` 直至领域 DTO 收敛。
- [ ] 保持 `uv run lint-imports` 的 platform→domains/API、services→API、domains→API 契约通过（见 [pyproject.toml](pyproject.toml) 与 [tests/contracts.ini](tests/contracts.ini)），继续消除业务写入和路由私有函数互调。
- [ ] OpenAPI 路径快照：[tests/test_openapi_snapshot.py](tests/test_openapi_snapshot.py) + [tests/snapshots/openapi_paths.json](tests/snapshots/openapi_paths.json)；路由变更须同步快照（`OPENAPI_UPDATE_SNAPSHOT=1`）。
- [ ] 迁移顺序建议：`core`/`db`/`models` → `platform`；采集/信号/需求等垂直切片按 WBS 迁入 `domains`；共享摄取逻辑取代 API 私有函数互调（对齐 BE-01）。
- 验收：import-linter 通过；OpenAPI 快照测试通过；无新增 `platform`→`api`/`domains` 违规；领域迁移切片有对应 pytest 证据。

## 原任务编号迁移

旧 T0/T1/T2 → BE-04；T3/T4 → BE-05；T5 → BE-13/16；T6 → BE-12。旧 P0-1 → OPS-01…08；P0-2/P0-3 → DOC-02、BE-13；P0-4 → BE-01、FE-02、CC-02。旧 B1–B6/W2/W4 → BE-01/02/12/16；旧 S1-3 → BE-12、FE-02。旧“§八 工作室生成”已有代码见 services/studio.py 与 tests/test_signal_studio.py；新增完整报告见 BE-15。这些别名仅供旧注释定位，不代表新任务已完成。
