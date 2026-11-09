# Frontend 实施清单

更新：2026-11-09。交付目标：研究者可以使用真实证据走完 Word 七环节并保留每一次人工判断。总顺序见 [项目清单](../TODO.md)，来源见 [需求追溯表](../docs/REQUIREMENTS-TRACEABILITY.md)。

## 当前基础和编辑规则

已存在 Next.js/antd 工作台、信号详情、分类/标签/主题编辑、需求与功能推导、落脚点和标准九宫格等部分真实工作流。完整战略流程、全链追溯仍不完整；战略页部分统计与演示流程待替换为真实状态。页面能打开不能当作工作流已验收。每个完成切片的构建、lint、浏览器结果和限制记入[交付记录](../docs/DELIVERY-RECORD.md)。

改 UI 前遵守 [AGENTS.md](AGENTS.md)，读取本地 Next.js 对应文档和 antd 组件信息；主题 token 优先。沿用 Next.js、React、antd/ProLayout、React Query；不恢复旧 Vite 提案，不增加 GraphQL。URL 包括 singal 拼写必须兼容。

以下均为剩余任务；状态与依赖按 [总清单约定](../TODO.md#执行规则) 更新。

## FE-01 页面职责与真实数据

- [ ] P0 · 部分实现 · 依赖 BE-11（真实计数），可先拆视图。
- overview/technology API-backed empty/error-state slice is delivered; evidence is in the [delivery record](../docs/DELIVERY-RECORD.md#fe-01--api-backed-overview-and-technology-slice). Real weekly/source/failure/funnel totals now come from `/overview`; full view separation and trace browser acceptance remain open.
- 来源：Word 图2-1-1…2-7；REQ-UI-01/02、REQ-RULE-04；WBS 1.3.1/1.3.9。
- 入口：[workspace.tsx](views/dashboard/workspace.tsx)、[routes.ts](config/routes.ts)、[menu.tsx](config/menu.tsx)、[use-eea-queries.ts](hooks/use-eea-queries.ts)。
- 将 signals/topics/demands/functions/technology/standards/strategy/trace 的实现放到对应 views，workspace 只编排路由；保留旧路径别名。
- 所有生产列表、计数、图和成功提示来自 API；空库显示零和下一步动作，API 错误显示错误/重试，不能回退演示。
- 演示仅显式开发模式可启用，并清晰标记；移除正式流程中的金额、虚构置信度、静态图节点和不工作的按钮。
- 总览提供真实计数/待办；流水线只读展示七环节进入/退出产物；方法论页仅映射已提供节号，不补写缺失原文。
- 验收：空库/断网/加载/错误各状态准确，所有导航及旧深链接可用，生产无 mock 冒充真实数据。
- 已实现切片：总览显示 UTC 周新增、来源去重与失败/复核待办；战略阶段数采用服务端独占计数。主题卡片说明频次和来源 URL 的统计口径。

## FE-02 统一导入与证据抽屉

- [ ] P0 · 部分实现 · 依赖 BE-01/02、CC-02、OPS-03。
- 来源：Word §2.1、图2-1-1/2-1-2、表A；REQ-SIG-01…07/09/10/11；WBS 1.3.2。
- 入口：[new-signal-import.tsx](components/import/new-signal-import.tsx)、[document-ingest-result.tsx](components/import/document-ingest-result.tsx)、[eea-api.ts](lib/api/eea-api.ts)。
- 一个导入面覆盖终端采集结果、HTML/文件上传和粘贴补正文；公网 URL 在生产引导本地工具，不能假装服务器已抓取。
- 消费统一 capture/job 契约，展示上传/处理/失败/重试/取消；浏览器刷新后可恢复任务状态；重复点击复用 submission_id。
- HTML 保留来源 URL，文档派生传 document_id 并由服务端生成摘要，禁止再次灌入 canonical 全文。
- 列表使用服务端分页与关键词、来源、渠道、环节、状态筛选；显示所有必需元数据与状态。
- 抽屉上部来源/发布者/时间，中部标签与归集，下部归档/正文/图块；原 URL、采集时间和未知日期表达清楚。
- 归档/恢复/正文修复调用真实 API，过期写入提示重新加载；安全隔离 HTML iframe。
- 验收：三类输入与粘贴恢复、重复/超限/取消、刷新持续处理、真实归档持久化、抽屉信息完整。

## FE-03 标签分类与复核

- [ ] P0 · 部分实现 · 依赖 BE-03/04、OPS-03。
- 三项机器建议（环节、信号类型、技术标签）的显式采纳、词表选项、修正审计显示切片已交付；详见[交付记录](../docs/DELIVERY-RECORD.md#fe-03--tag-review-editor-slice)。仍需完成角色控件、冲突及模型降级验收。
- 来源：Word §2.2、图2-2/2-3；REQ-TAG-01…06、REQ-RULE-01/02/05；WBS 1.3.3。
- 入口：[signal-classification-editor.tsx](components/evidence/signal-classification-editor.tsx)、[signal-tags-editor.tsx](components/evidence/signal-tags-editor.tsx)、[use-signal-mutations.ts](hooks/use-signal-mutations.ts)。
- 列表内增加封闭分类下拉，详情继续可编辑；仅展示服务端词表候选，允许未判定但不允许自创新 code。
- 展示逐候选 tag 证据/分数/来源/降级理由，支持选择采纳与新增开放标签；兼容原 suggested_tags。
- 区分机器初判、待复核、人工确认、与新建议有差异；确认/保存只应用选中改动，机器刷新不覆盖草稿。
- 操作者由会话提供；审计显示原值、新值、人员、时间和来源。失去 reviewer 权限的控件不可伪装可操作。
- 验收：列表修改与详情一致，刷新持久化，开放标签全局复用，过期冲突/权限失败/模型降级可解释。

## FE-04 主题、来源和候选

- [ ] P1 · 部分实现 · 依赖 BE-05、BE-03。
- 来源：Word §2.3、图2-3；REQ-SIG-08、REQ-DEM-02/03/05/08/14/15；WBS 1.3.4。
- 入口：[topics-view.tsx](components/topics/topics-view.tsx)、[signal-theme-assign.tsx](components/evidence/signal-theme-assign.tsx)、[metrics-copy.ts](lib/metrics-copy.ts)。
- 展示技术标签频次、价值链/信号类型筛选、主题成员和去重来源；口径 tooltip 与 BE-05 完全一致。
- 支持主题创建/工作名编辑、人工指派/移出、重算候选与解释；不做主题合并/优先级排名。
- 候选聚类先预览成员/理由，确认后建主题/开放标签；“新分类”不得写封闭词表。
- 来源列表区分主链接/补充链接及归档来源，直接 eFuse 2 条与主题 8/16 分开展示。
- 验收：成员变化刷新指标，候选拒绝零写入，语义并列可人工指定，空主题不回退示例。

## FE-05 需求点工作台

- [ ] P0 · 部分实现 · 依赖 BE-06。
- 已交付真实 API 工作台切片：五步证据推导、主题与留存信号选择、独立来源交叉验证证据、状态/频次/来源数、时间序列及单独确认；见[交付记录](../docs/DELIVERY-RECORD.md#fe-05--demand-point-workbench-slice)。仍需浏览器主流程、业务样本及管理员权限环境验收。
- 来源：Word §2.3、图2-4、表1；REQ-DEM-01/04/06/07/09…13/15；WBS 1.3.4。
- 新增主题→需求的真实编辑入口；五步表单保存事实、共识、相似性、归因与系统级命名。
- 多主体/证据类型/产业视角引用和反证可回到原始信号；事件时间按已知精度展示，各技术路线成熟度单独说明。
- 展示 passed/failed/pending 交叉验证与人工复核；拒绝/待复核时解释为什么不能进入下一环节。
- 已确认内容修改后显示需重新复核和下游依据变化；支持低频强信号标记及理由。
- 验收：需求保存/复核/拒绝/修改全流程，跨价值链不能被引导合并，未知事件日期不伪造。

## FE-06 车辆功能与双向验证

- [ ] P0 · 部分实现 · 依赖 BE-07、FE-05。
- TechnologyView 已接真实需求/功能/推荐等级词表/目标域词表，提供五步表单、逐项反向覆盖、功能卡片、草稿保存和重新验证发布切片；详见[交付记录](../docs/DELIVERY-RECORD.md#fe-06--function-derivation-editor-slice)。macOS 浏览器烟雾检查通过；仍需完整 eFuse 端到端、冲突结论及真实管理员词表验收。
- 来源：Word §2.4、图2-4；REQ-MAP-01…06；WBS 1.3.5。
- 新增需求下功能卡片与五步推导编辑器，编辑能力、缺口、关键流、行为与功能。
- 必要性及每项核心诉求覆盖表可读可改，显示未覆盖项/矛盾/验证结论。
- 保存草稿和发布分离；服务端失败明确指出缺项，前端禁用不能替代后端门控。
- 变更已发布推导触发重新确认，保留历史查看入口。
- 验收：完整案例可发布，三种局部功能反例不能发布；同次补全并发布/冲突保存反馈正确。

## FE-07 技术全景与落脚点

- [ ] P0 · 部分实现 · 依赖 BE-08、FE-06；落脚点工作台与 API 全景切片已交付，验收未关闭（见[交付记录](../docs/DELIVERY-RECORD.md#fe-0708--landing-point-and-standards-grid-slice)）。
- 来源：Word §2.5、图2-5；REQ-TECH-01…04；WBS 1.3.6。
- 已实现切片：从服务端功能/域词表读取数据；只有已发布功能可新增落脚点；可查看/编辑真实名称、技术域、角色；可新增词表域并由服务端写入共享词表；全景移除样例图并展示 API 关联数据。
- 隔离 `eea_test` 的浏览器走查已验证服务端五域显示、落脚点查看/新增、新域共享词表持久化及刷新后全景仍可见。
- 仍需完成：交互式逐级追溯/证据入口、真实业务样本验收、长列表和权限验收；不得用隔离样例代替业务验收。
- 验收：四环节完整、多功能多域、长列表不隐藏节点、空态真实、点击可追溯。

## FE-08 标准九宫格

- [ ] P0 · 部分实现 · 依赖 BE-09、FE-07；九宫格录入切片已交付，eFuse 业务验收及刷新后重开九宫格待验（见[交付记录](../docs/DELIVERY-RECORD.md#fe-0708--landing-point-and-standards-grid-slice)）。
- 来源：Word §2.6、图2-6、表B；REQ-STD-01…03；WBS 1.3.7。
- 已实现切片：落脚点详情提供三阶段×三约束表单；缺行、NULL、正文分别显示；只保存用户明确提交格；服务端保存后刷新数量/全景/追溯，并发修改先阻止覆盖并提供明确操作。
- 隔离样例浏览器走查已看到缺行、NULL 明确留空和正文三种状态；刷新后全景仍显示该落脚点的三格计数。
- 仍需完成：eFuse 两项实质标准与运营空白的业务验收、刷新后重新打开九宫格的持久性/审计走查，以及完整追溯页验证。
- 验收：eFuse 只有两项实质标准，运营格留空，刷新不丢失空白确认。

## FE-09 战略四步与改判

- [ ] P0 · 部分实现（四步可录入、评分可提交、历史版本可查看）· 依赖 BE-10、FE-08。
- 来源：Word §2.7、图2-7、表C；REQ-STR-01…07；WBS 1.3.8。
- 用行业扫描→Tier1适配→五维评分→三类策略替换现有六阶段组合演示。
- 展示扫描范围、适配通过/拒绝理由、业务角色；被过滤项无评分要求。
- 五维 1–5 整数表单、每维依据、服务端总分、三分类与备注；不能按总分自动分类。
- 追加改判版本与时间线，清楚标当前版本、操作者及旧依据待复核状态。
- 验收：不能跳步、拒绝不填虚构分数、4/4/3/4/5=20、三类卡片与四步数量来自数据库。
- 已实现切片：策略页现使用 API-backed 四步工作台，完整记录扫描来源、Tier1 关系/角色/结论、五维评分及依据、人工分类和版本时间线。旧定稿在流程未完成时显示“依据待复核”，不回填为当前草稿。
- 检查：macOS `next build` 通过；新组件与 workspace 的 scoped antd lint 为零问题；scoped `git diff --check` 通过。Mac 浏览器已从总览进入战略页，看到空库四步计数、拒绝数和未入池数。带数据的逐步提交与改判仍待走查。
- 已接通 BE-11 数据库四步独占计数，并在每次漏斗步骤变更后刷新总览缓存。
- 仍需：4/4/3/4/5 样例与真实业务材料复核、浏览器跳步/拒绝/改判走查；旧依据状态和操作者显示须以 API 回传为准。

## FE-10 全链追溯与导出

- [ ] P0 · 部分实现 · 依赖 BE-11、BE-15（报告）。
- 来源：Word 图2-4/2-6、表1；REQ-RULE-03/04；WBS 1.3.9/1.3.12。
- 使用真实 landing-point ID 获取链路，分段展示信号→主题→需求→功能→技术→标准→战略。
- 解释交叉验证、事件时间、必要性/覆盖、技术角色及策略理由；可回源到文档图块。
- 标记归档、缺证据、依据更新与历史评分，不能用静态雷达替代链路。
- 报告选择实际需求/落脚点，显示生成/失败/下载状态，提供 Markdown/PDF。
- 验收：全链点击回源、刷新保持选择、失效 ID/缺链合理提示、导出引用与页面一致。
- 已实现切片：追溯总览可打开指定落脚点深链接；详情展示需求五步/交叉验证、功能正向/反向数据、部署标准九宫格的未填/留空/正文、直接证据与主题成员、文档图块数量、归档引用、缺失链路及战略版本时间线。
- 检查：macOS `next build` 与 `tsc --noEmit` 通过；workspace scoped antd lint 零问题。Mac 浏览器已验证空库追溯总览与失效落脚点深链接提示。有效 ID 刷新、重新选择和回源仍待走查。
- 仍需：API basis freshness 为 `unknown_untracked`，页面明确提示无法确认；图块可从信号详情继续查看，尚未实现页面内图块定位；报告仍依赖 BE-15；真实业务链和 Linux 验收未做。

## FE-11 Agent 与文档研究

- [ ] P1 · 部分实现 · 依赖 BE-12/13/14/15、OPS-03。
- 来源：实施计划 §7.1/7.2 REQ-DOC/AGT；WBS 1.3.10/1.3.11/1.3.12。
- 基于现有助手增加多会话、持久消息、SSE/取消/重连、引用跳转和图块定位。
- 待确认变更显示字段前后值/理由；确认/拒绝/过期/已应用分别展示，重复确认不重复写。
- 记忆按用户/项目分别查看删除；真实技能版本与基线模式可识别。
- 文档显示 canonical、图块识别状态、章节关键词树、局部失败重试；无图注不能显示成功。
- 验收：会话刷新、用户隔离、伪造引用缺失提示、确认写入审计、失败图待复核和重跑。

## FE-12 前端验收与 Linux 接入

- [ ] P0 · 未验证 · 依赖上述逐项完成、BE-16、OPS-03/04。OPS-06 is the combined preproduction gate and depends on FE-12; FE-12's independently runnable frontend/API/browser checks do not depend on OPS-06.
- Browser API base now follows same-origin `/api/v1` in production and port 8000 in local development; build and browser evidence is recorded per delivery slice, not full FE-12 acceptance.
- 来源：WBS 1.2.6、1.5、1.6；[验收走查](docs/ACCEPTANCE-WALKTHROUGH.md)。
- OpenAPI 对应类型检查纳入 CI；统一 API base 支持生产同源 /api/v1 和开发 :8000。
- 对触及组件执行 antd 分文件 lint，类型检查与 pnpm build；无公网字体/分析脚本依赖。
- 添加 Playwright 主流程测试：空库、真实七环节、持久修改、角色限制、模型失败、异步任务、历史版本、报告。
- 基于固定 10,000 条测试数据验证服务端分页；记录详情首个可用内容时间，外链/大型原始归档加载单独说明。
- 更新走查清单和截图证据；不把原先 checked checkbox 当此次验收。
- 验收：构建/契约/浏览器测试记录齐全；Linux TLS 同源、SSE、深链接、空库/断网行为通过。

## 原任务编号迁移

旧 W3/P1 标签编辑 → FE-03/04；文档信号 → FE-02；追溯遗留 → FE-10；旧 P0 部署 → FE-12 与 OPS；旧 P2 → FE-04/09/11。新增分类只允许开放标签/主题候选，旧“入封闭词表”措辞以来源封闭词表要求纠正。
