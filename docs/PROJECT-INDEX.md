# EEA 项目索引

更新：2026-11-09。此页是代码、来源资料和执行计划的导航。全项目交付顺序以[根 TODO](../TODO.md)为准；各目录 TODO 规定任务验收条件；业务需求对照原始 Word、用户 2026-11-09 提供的七阶段流程图及[需求追溯表](REQUIREMENTS-TRACEABILITY.md)核对。流程图为七阶段工作流及本轮明确确认项的权威来源；原始 Word 保持原样，其案例事实继续有效。状态文字用于交接，不能替代构建、测试、平台验证或业务签收证据。

## 先读什么

1. [根 TODO](../TODO.md)：从当前状态到 Linux 内网生产的剩余阶段、依赖和发布门槛。
2. [需求追溯表](REQUIREMENTS-TRACEABILITY.md)：75 条 REQ 与来源、WBS、任务 ID 和待执行 AT 验收项的映射。AT 编号是验收计划，不表示测试已通过。
3. [eFuse 原始案例 Word](reference/德赛西威EEA关键技术落脚点推导链路逐环节图文对照说明-以「智能保险丝（eFuse）」为案例-1009.docx)：业务推导原文、案例表和截图。作为业务来源保持不变。
4. [平台实施计划](platform-implementation-plan.md)：需求解释、数据模型、流程与技术提案；第 7 节及后续工程方案不应误认为原始 Word 的要求。
5. [WBS 正文](wbs/EEA-WBS-001-WBS文档.md)及[工作簿](wbs/EEA-WBS-工作清单.xlsx)：范围、工作包、职责、估时和历史里程碑。Markdown 是当前追溯主线；工作簿的单元格核对仍列为 DOC-01 工作。
6. [会议纪要](meetings/2026-10-29-EEA白皮书agent需求-智能纪要.md)：业务讨论、真实信号/skills 等输入和部署线索；纪要中的旧技术描述须以当前代码核实。
7. [Docs TODO](TODO.md)：业务输入、文档维护、验收证据、安装手册、发布包和交接。
8. [业务与环境输入登记表](INPUT-REGISTER.md)：已收到与仍待提供的材料、责任方、版本/许可和受影响验收项。
9. 本地开发：仓库根 [README.md](../README.md)；Linux 生产见 [deploy/README.md](../deploy/README.md)。

## 来源与参考材料

| 路径 | 用途与权威范围 |
| --- | --- |
| [reference/](reference/) | 原始 Word 等外部来源；业务规则以来源文件为准，不在此改写原件。 |
| [platform-implementation-plan.md](platform-implementation-plan.md) | 需求条文、业务规则、Agent/文档能力、图表语义及实施提案。 |
| [wbs/](wbs/) | WBS 正文和工作簿；估时及历史排期用于范围管理，不构成当前发布日期承诺。 |
| [meetings/](meetings/) | 会议记录与图片；核实后的决定由根计划/追溯表索引。 |
| [enterprise-ui-study.md](enterprise-ui-study.md) | 公开产品页面与界面交互参考；仅作行为研究，截图不作为本项目素材。 |
| [research/](research/) | 专项调研结论，例如采集端替代方案。 |
| [figures.md](figures.md)、[images/](images/) | 报告流程图源码和来源截图。改图以 Mermaid 源码为准。 |
| [合订 PDF](EEA-Platform-Plan-and-UI-Study.pdf) | 只读快照；若与 Markdown 不同，以 Markdown 为准。 |

## 七环节业务链

1. **原始信息采集与证据留存**：采集信号，保存来源、原始证据和可核验时间信息。
2. **信号标签化**：建议并人工修正价值链环节、信号类型、技术方向。
3. **需求提取与证据核验**：主题归集并回溯原证据，完成五步需求推导、交叉验证及共识判断。
4. **需求与功能映射**：完成正向五步推导和反向验证；不完整或正反结论不一致不得发布。
5. **功能与关键技术拆解**：按软件、硬件、通信、电源与能源管理、工具五域录入有据可查的技术落脚点。
6. **部署标准构建**：维护设计/制造/运营 × 工程化/经济性/安全合规九宫格；无内容处保持空白。
7. **战略四步漏斗**：求广→求准→求实→分类。

- 信号的价值链环节、信号类型和技术方向由模型建议并允许人工下拉修正；前两者沿用既定封闭词表，技术方向沿用开放词表。每次人工修正须留下原值、新值、可信操作者和时间。
- 五个技术域已确认：软件、硬件、通信、电源与能源管理、工具。功能卡的推荐等级及车辆/应用目标域分别使用管理员维护词表；具体词项尚待配置，不预设名称。自动化等级 L0–L5 可多选，并独立记录 L2 与 L4 功能差异及推荐原因。
- 主题只作技术对象/能力/变化的索引，不自动合并需求或排序。需求结论要有独立来源交叉验证、利益相关方归因和人工确认。
- 统计口径：信号频次为主题下活跃（未归档）成员数；来源数为主题历史关联信号的去重 URL 数，含归档来源；独立发布主体数另行统计。重复转载不代表多个独立主体共识。
- 需求按事实识别→频率与共识→相似性聚类→利益相关方归因→系统级命名五步推导，并核验交叉证据、反证、事件时间及成熟度。
- 功能按核心诉求→技术能力与缺口→车端关键流→系统行为→车辆功能五步推导；反向必要性、全部核心诉求覆盖及冲突检查均通过且人工确认后才能发布。
- 一个已发布功能可关联五域技术落脚点。标准按设计/制造/运营 × 工程化/经济性/安全合规记录；未填写、明确留空与实质条款分别保存，系统不补写空格。
- 战略按求广→求准→求实→分类四步推进，对应行业扫描、业务适配、五维评价、策略分类；不适配项退出而不造分，改判保留版本。
- eFuse 直接案例为 2 条信号；主题图中的 8 条成员/16 个来源是另一验收口径。原案例结论为低压系统智能化 → 全节点智能配电 → 硬件域 eFuse；标准两项实质内容、运营留空，评分 4/4/3/4/5，总分 20。

完整条款及验收编号见[需求追溯表](REQUIREMENTS-TRACEABILITY.md)；不得凭截图、演示数据或非空 JSON 宣称业务门控通过。

## 当前代码导航

| 部分 | 代码入口与职责 |
| --- | --- |
| Backend 应用 | [backend/app/main.py](../backend/app/main.py)：FastAPI 路由装配、健康端点与 API 文档入口；[backend/app/worker.py](../backend/app/worker.py)：独立持久采集 worker 入口；[models.py](../backend/app/models/models.py)：SQLAlchemy 数据模型；[migrations/](../backend/migrations/)：Alembic 历史迁移（新增 schema 继续增量迁移）。 |
| Backend API | [backend/app/api/v1/](../backend/app/api/v1/)：包括同步/异步 capture、signals、documents、themes、demands、functions、landing points、standards、strategy、trace、overview 等接口。 |
| Backend services | [backend/app/services/](../backend/app/services/)：文档摄取、HTML 快照、对象存储、[capture_jobs.py](../backend/app/services/capture_jobs.py) 持久队列、标签/判断、LLM 网关、审计与 Agent 服务。业务门控和操作者身份必须由后端强制。 |
| Backend checks | [backend/tests/](../backend/tests/)；测试配置在 `backend/tests/conftest.py`，使用专用 PostgreSQL `eea_test`，不可指向含验收/生产数据的库。 |
| Frontend | [frontend/app/](../frontend/app/) 路由与布局；[frontend/views/](../frontend/views/) 页面；[frontend/components/](../frontend/components/) 交互组件；[frontend/lib/api/](../frontend/lib/api/) API 契约和客户端；[frontend/config/](../frontend/config/) 路由与主题。遵循 [frontend/AGENTS.md](../frontend/AGENTS.md)。 |
| Capture Client | [client/cmd/capture/](../client/cmd/capture/) 命令入口；[client/internal/capture/](../client/internal/capture/) Edge/Chrome CDP 采集；[client/internal/singlefile/](../client/internal/singlefile/) 内嵌 SingleFile；[client/internal/platform/](../client/internal/platform/) 上传；[client/internal/queue/](../client/internal/queue/) 队列；[client/internal/ui/](../client/internal/ui/) Windows GUI。 |
| Linux deployment | [deploy/](../deploy/) 部署执行 TODO 与 API/Next/worker systemd 模板；[backend/DEPLOY.md](../backend/DEPLOY.md) 是既有开发部署参考，不能当作已验证 Linux 生产手册。 |

实际栈为 FastAPI / SQLAlchemy / Alembic / PostgreSQL、Next.js 16 / React 19 / antd 6 / React Query，以及 Go Windows 客户端（Edge/Chrome CDP）。生产目标为 Linux 内网。实施计划中的 Vite 等旧技术提案不取代仓库现状。

## 执行计划与验收入口

| 清单 | 任务 | 主要范围 |
| --- | --- | --- |
| [根 TODO](../TODO.md) | 阶段 A–E | 从当前工作到生产候选、发布与运维交接的总顺序和完成门槛。 |
| [backend/TODO.md](../backend/TODO.md) | BE-01…BE-16 | 证据摄取、规则门控、业务推导、Agent/文档/报告、后端契约与 Linux 验证。 |
| [frontend/TODO.md](../frontend/TODO.md) | FE-01…FE-12 | 真实数据工作流、人工复核、全链追溯、导出与浏览器验证。 |
| [client/TODO.md](../client/TODO.md) | CC-01…CC-06 | Windows 浏览器采集、上传队列、身份连接、发布包和真浏览器检查。 |
| [docs/TODO.md](TODO.md) | DOC-01…DOC-08 | 输入、业务资料、验收证据、文档、发布包和交接。 |
| [deploy/TODO.md](../deploy/TODO.md) | OPS-01…OPS-08 | Linux 构建、身份/TLS、服务、备份恢复、预生产和生产发布。 |
| [frontend 验收走查](../frontend/docs/ACCEPTANCE-WALKTHROUGH.md) | 页面端到端步骤 | 与真实 API、空库、导入、编辑和追溯逐步核对。 |

任务状态与依赖以各 TODO 为准；完成项从剩余清单移除，验收证据保留在追溯/交付记录。当前文档不声明本机测试、Windows 真浏览器或 Linux 生产验证已经通过。发布前需在 Linux 预生产完成部署、迁移、权限、恢复与端到端演练；Windows GUI 和真 Edge/Chrome 采集需在 Windows 执行。

本次已交付切片及实际检查记录见[交付记录](DELIVERY-RECORD.md)。
