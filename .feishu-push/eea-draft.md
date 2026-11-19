<callout emoji="📌" background-color="light-blue"><p>本文档说明 EEA 平台的业务链路、系统边界与关键设计契约，供产品、架构、研发与验收对齐使用。更新：2026-11-13；代码核对基线：[2149114](https://github.com/365cent/eeagent/commit/2149114fa854f4824ade5bef7b62344d8d301d00)。原有三张概览图保留，运行边界与当前实现以本次补充说明为准。</p><p>**状态口径**：“设计约束”表示必须满足的业务要求；“当前实现”表示已核对的代码；“待验”表示仍需实际环境或业务材料证明。本文更新不关闭任何 BE/FE/CC/DOC/OPS 父任务，也不代表生产验收通过。</p></callout>

## 1. 文档范围

**涵盖内容**

- 七环节业务主线与平台能力映射
- 功能框图、系统架构图、主流程图
- 采集与存证、信号标签化的补充流程图
- Linux 内网拓扑、数据关系与追溯边界
- 关键 API、Agent 确认写回与 SSE 契约、验收门槛索引

**详细规范入口**

- 字段级接口以运行时 `/openapi.json`、Pydantic schema 与 Alembic migration 为准
- 运维步骤、逐项 AT 用例与执行证据分别在部署说明、需求追溯表和交付记录维护，本文给出设计摘要与链接

**读者**：业务分析、架构、前后端与采集客户端负责人。

---

## 2. 业务链路概要

下列为七环节索引，便于对照正文图示；环节要求、方法论与平台功能以第 5 节主流程表为准。

| 环节 | 核心产出 | 平台能力 |
| --- | --- | --- |
| 1 | 可追溯信号与证据快照 | Windows 客户端采集；Web 上传文档/快照与正文补录 |
| 2 | 标签化索引 | 模型预标、人工纠偏、审计留痕 |
| 3 | 主题与需求点 | 推导流水线、交叉验证、主题指标 |
| 4 | 车辆功能映射 | 技术全景、功能卡、正反向验证 |
| 5 | 五域技术落脚点 | 全景协作视图、域内拆解 |
| 6 | 部署标准矩阵 | 三阶段×三约束归档（允许留空） |
| 7 | 战略研判结论 | 四步漏斗、五维评价、版本改判 |

---

## 3. 功能框图

**表示法**：UML 构件图（Component Diagram）。

**读图方式**：矩形为功能构件，package 为分层边界；实线依赖表示工作面 → API → 支撑服务 → 持久化。业务门控与审计属于应用层职责。

**实现边界**：图中的 `eea-doc-ingest`、`eea-agent` 是模块职责，不表示独立微服务；“向量索引”是检索能力示意，不代表已部署独立向量数据库。当前保持模块化单体，以 API、worker、Web 独立进程运行。后端依赖方向为 `api → domains/services → platform`；前端按 `features → views/workspace` 组织；采集端将浏览器、队列与平台上传分离。分层重构仍按 BE-17 / FE-13 / CC-07 持续验收。

![eea-uml-component-functional-blocks.png](@./images/eea-uml-component-functional-blocks.png)

---

## 4. 系统架构

平台以 **EEA** 为中心，分为 **Web**、**Capture**、**API**、**Data** 四栈。

![eea-system-architecture.png](@./images/eea-system-architecture.png)

---

### 4.1 当前技术栈与职责

| 边界 | 当前实现 | 职责 |
| --- | --- | --- |
| Web | Next.js 16、React 19、TypeScript、antd 6、TanStack Query | 证据研究、复核表单、全景与追溯、任务状态、Agent 交互 |
| Capture | Windows Go 客户端、Edge/Chrome CDP、SingleFile | 用户侧浏览器取证、原始 URL/快照、持久队列与恢复；API 凭据与公网下载隔离 |
| API / worker | FastAPI、SQLAlchemy、Alembic、Pydantic AI | 业务校验、身份/审计、摄取任务、文档解析、Agent 工具与报告 |
| Data | PostgreSQL 16、持久对象目录、内网模型网关 | 业务关系与任务状态、原件/派生文件、模型调用；模型输出仍需复核 |

服务端不承担公网浏览器采集；生产 URL-only 抓取被拒绝。Web 的“导入”指上传或补录，不能将其解释为内网服务器访问公网。模型网关不可用时必须显示降级，规则或词频结果不能伪装成模型成功。

依据：[分层架构](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/docs/ARCHITECTURE-LAYERS.md)、[实现边界](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/docs/architecture-boundaries.md)。

---

## 5. 主流程

七环节操作表：环节要求、方法论要点、核心产出、平台功能实现。

![eea-seven-step-workflow.png](@./images/eea-seven-step-workflow.png)

---

### 5.1 七环节进入与退出门槛（设计约束）

| 环节 | 关键门槛与拒绝路径 | 追溯任务 |
| --- | --- | --- |
| 1 采集存证 | 保留原件、原始/最终 URL 与已知日期精度；微信失败可保留 URL 补正文，不能计为自动采集成功 | BE-01/02、CC-01/04、FE-02 |
| 2 标签化 | 4 个价值链环节、5 种信号类型为封闭词表；技术标签开放复用；机器建议不得覆盖人工确认 | BE-03/04、FE-03 |
| 3 主题与需求 | 主题只做归集索引；需求五步完整，独立证据交叉验证通过且人工确认后才能推导功能；转载不算独立共识 | BE-05/06、FE-04/05 |
| 4 需求与功能 | 五步正向推导、反向必要性及全部核心诉求覆盖一致，确认后才能发布；仅覆盖局部能力的功能拒绝发布 | BE-07、FE-06 |
| 5 技术拆解 | 仅已发布功能可进入；五域为软件、硬件、通信、电源与能源管理、工具；各落脚点有角色与依据，无依据的域不自动补齐 | BE-08、FE-07 |
| 6 部署标准 | 设计/制造/运营 × 工程化/经济性/安全合规；区分未填、确认空白与实质正文，数量只计实质条款 | BE-09、FE-08 |
| 7 战略研判 | 行业扫描→适配→评分→分类；不适配保留理由并退出；五维为 1–5 整数，合计由服务端生成，分类不能按总分自动决定 | BE-10、FE-09 |

功能卡补充：推荐等级与车辆/应用目标域分别来自管理员词表；支持 L0–L5 多选，单独记录 L2/L4 差异及推荐依据。车辆/应用目标域与五个技术域不能混用，未提供的词项不自行命名。依据：REQ-MAP-07…11。

---

## 6. 采集与存证流程

采集采用持久异步作业，默认入口为 `POST /api/v1/capture/jobs`。客户端为同一次提交保留稳定 `submission_id`；`202` 仅表示任务已入队，处理成功以任务终态及结果为准。

<whiteboard type="mermaid">
sequenceDiagram
  participant C as Windows Client / Web
  participant A as FastAPI capture/jobs
  participant O as ObjectStore
  participant D as PostgreSQL
  participant W as capture worker
  C->>A: multipart 文件 + submission_id + 来源
  A->>A: 身份、大小、封闭词表、提交指纹校验
  alt 已存在相同 ID 与指纹
    A-->>C: 返回既有任务
  else 相同 ID 不同指纹
    A-->>C: 409 冲突
  else 首次提交
    A->>O: 持久化原始 payload
    A->>D: CaptureJob queued
    A-->>C: 202 + job id
    W->>D: 行锁领取、租约与心跳
    W->>O: 读取原件并保存派生结果
    W->>D: Document / Signal + 终态
  end
  C->>A: GET /api/v1/capture/jobs/{id}
  A-->>C: 状态、阶段、错误或 result
</whiteboard>

| 场景 | 当前契约与恢复方式 |
| --- | --- |
| 正常处理 | `queued → running → succeeded`；失败按可重试性与次数上限回队或进入 `failed` |
| 进程重启/响应丢失 | 数据库任务、对象原件与 submission_id 保留；通过查询或同 ID 重交找回，worker 按租约恢复 |
| 重试/取消 | 仅 `failed` 可调用 retry；排队可取消，运行中记录取消请求并由 worker 协作处理；非法状态返回 409 |
| 工作簿 URL 补采 | `awaiting_client` 表示等待 Windows 端领取、取证和上传；不代表服务端公网抓取 |
| 对象与数据库提交不一致 | 原件保留并登记孤儿对象，交由维护流程处理；不能把对象写入成功等同业务入库成功 |

**业务约束**：证据的五种业务状态与作业状态分开：抓取中、抓取失败、已留存、待人工复核、已归档/停用。job 成功不等于需求确认或功能发布；归档证据不再用于活跃推导，历史链路按只读追溯要求保留。

依据：[采集路由](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/backend/app/api/v1/capture.py)、[worker](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/backend/app/services/capture_jobs.py)。

---

## 7. 信号标签化流程

Next.js 证据工作面调用 `GET /api/v1/signals/{id}/tag-suggestions` 请求建议；用户采纳或修正后，技术标签通过 `PUT /api/v1/signals/{id}/tags` 保存。价值链环节/类型通过信号更新接口保存，各请求以实际 schema 为准。建议响应提供 `protected_fields`、`source` 与 `degraded_reason`，界面需明确呈现保护和降级状态。

- **LaunchDarkly**：在标签建议与保存接口执行服务端门控；关闭时返回 403，SDK 未配置时默认开放。保存成功后上报指标。
- **Pydantic AI**：通过企网 LLM 网关生成结构化标签建议。技术标签与价值链环节/信号类型分别处理，再合并返回；失败时由 jieba 与规则兜底。
- 采集入账与 Agent 工具复用标签能力，但不受此 flag 门控。
- **开关边界**：LaunchDarkly 控制功能可用性，不能充当身份、权限、复核或业务通过的证明；“默认开放”不表示允许匿名写入。
- **保存边界**：提交 `expected_updated_at` 等接口要求的基线，服务端拒绝过期编辑；审计保留旧值、新值、可信操作者与时间。所有入口统一应用这些规则仍是 BE-03 / BE-17 的验收事项。

**表示法**：UML 时序图。

<whiteboard type="mermaid">
sequenceDiagram
  participant UI as SignalTagsEditor
  participant API as signals/id/tag-suggestions
  participant LD as LaunchDarkly SDK
  participant Tag as suggest_tech_tags
  participant PA1 as Pydantic AI candidate_tags
  participant PA2 as Pydantic AI tag_suggestion
  participant GW as LLM gateway

  UI->>API: fetch suggestions
  API->>LD: variation_bool(signal-tagging)
  alt flag Disabled
    LD-->>API: false
    API-->>UI: 403
  else allowed
    API->>Tag: jieba + optional rerank
    Tag->>PA1: pick from pool
    PA1->>GW: chat (≤8s)
    API->>PA2: stage/type structured output
    PA2->>GW: chat (≤8s)
    API-->>UI: TagSuggestion JSON
  end
</whiteboard>

---

## 8. 设计原则

- **证据优先**：信号须可追溯、可核验；发布与发版须能回到原始证据。
- **服务端门控**：权限、复核、审计与业务判定在 API 层强制执行，不依赖前端展示或模拟数据。
- **人工可纠偏**：标签与推导结果支持专家修正；每次变更记录操作者与时间。
- **显式留空**：标准矩阵等允许未填项，系统不自动补写业务内容。
- **来源有层级**：原始 eFuse Word 保持案例事实；已确认流程图和业务规则定义补充要求；代码说明实现状态，不能用于删减需求。
- **版本可核对**：修改依据后需重新复核；战略改判追加版本，历史结论与当时依据可追踪。
- **不虚构输入**：真实信号、客户业务、功能词项及未提供的方法论正文保持缺口标记；合成测试样本必须标注。

---

## 9. Linux 内网部署与信任边界

**当前默认部署**以 `deploy/docker-compose.yml` 为准：单台 Linux 主机上的 PostgreSQL、migrate、API、worker、Next.js、Nginx。systemd 文件保留为不用容器时的替代模板；根 TODO 中较早的 systemd 基线描述需与部署文档同步。这里说明已存在的部署制品，不代表客户环境已验收。

<whiteboard type="mermaid">
flowchart LR
  P["公网网页 / 微信"] --> C["Windows Edge/Chrome 采集"]
  C -->|"快照 + 受限上传凭据"| E["TLS / 身份入口（待接入验证）"]
  U["研究者 Web"] --> E
  E --> N["Nginx 同源入口"]
  subgraph L["Linux 内网主机 / Docker Compose"]
    N -->|"UI"| F["Next.js"]
    N -->|"/api/v1"| A["FastAPI"]
    M["Alembic migrate"] --> D[("PostgreSQL")]
    A --> D
    W["capture worker"] --> D
    A --> O[("持久对象目录")]
    W --> O
  end
  A --> G["内网模型网关"]
  W --> G
</whiteboard>

- `migrate` 成功后启动 API/worker；API 禁用嵌入式采集 worker，独立 worker 消费任务。API/worker 共享对象目录，数据库与对象文件均需备份。
- 浏览器同源访问 `/api/v1`，Nginx 为 SSE 关闭缓冲。模板容器监听 HTTP；TLS、真实认证入口、可信代理地址及角色映射仍需 OPS-03/06 联验。
- 服务端身份来自可信直连代理或采集专用凭据，不能信任调用者自报角色或 IP 身份。研究者、词表管理员、平台管理员的权限由服务端验证。
- `/healthz` 是存活检查；当前 `/readyz` 检查数据库连接和对象目录可写性，模型配置缺失会标记 degraded。配置存在不等于模型调用已经成功，真实可用性与延迟需另测。
- 恢复必须同时核对数据库、原件/派生对象、迁移与配置版本。当前恢复脚本以数据库恢复为主，对象归档需另行恢复；完整恢复、回退与恢复目标仍待演练。

依据：[部署说明](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/deploy/README.md)、[Compose](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/deploy/docker-compose.yml)、[身份边界](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/backend/app/core/identity.py)。

## 10. 数据实体与追溯

以下是当前模型的核心关系，省略字段与辅助表；数据库约束以 migration 为准。

<whiteboard type="mermaid">
erDiagram
  TechTheme o|--o{ Signal : groups
  Signal ||--o{ SignalSource : cites
  Document o|--o{ Signal : supports
  Document ||--o{ DocumentChunk : contains
  Document ||--o{ DocumentFigure : contains
  TechTheme o|--o{ DemandPoint : informs
  DemandPoint ||--o{ VehicleFunction : maps
  VehicleFunction ||--o{ TechLandingPoint : decomposes
  TechLandingPoint ||--o{ DeploymentStandard : constrains
  TechLandingPoint ||--o{ StrategicAssessment : versions
</whiteboard>

**关系规则**

- 信号至多归属一个技术主题；主题与需求点是独立实体，归集不能自动生成已确认需求。
- 信号频次按成员记录计数；来源数按关联 URL 规范化去重，不能用表连接后的行数代替。案例的“8 条成员 / 16 个来源”与“2 条直接证据”是不同验收口径。
- 原件与 HTML/正文等派生文件保存在对象存储，数据库保存对象键、哈希与关联；不另造一个已实现的 EvidenceSnapshot 表。
- 需求的人工确认基线、功能的正反向校验、标准单元格和战略版本逐段关联。每个技术落脚点可有多次战略研判，当前版本唯一；历史版本不直接覆写。

**追溯与更新影响**

技术落脚点 → 功能 → 需求 → 主题/引用信号 → 原始网页或文档块。文档图引用需定位到文件与 `figure_index`；文档标题或非空 JSON 不能替代原件。

当前 `basis_freshness` 提供 `fresh / stale / unconfirmed / unknown_untracked`，依据需求确认时间与上游更新时间、对象可读性比较。它是新鲜度提示，不是完整不可变证据版本证明；当前对象检查最多覆盖 50 条信号，缺基线与超出检查覆盖的情况仍须显式复核。报告与历史链路的版本一致性按 BE-11/15 验收。

依据：[业务模型](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/backend/app/models/models.py)、[Agent/文档模型](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/backend/app/models/agent_models.py)、[新鲜度实现](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/backend/app/domains/trace/freshness.py)。

## 11. 文档研究与 Agent 确认写回

### 11.1 文档证据

原始 Word/PDF、规范化正文、章节块、图块与解析版本应可关联。单图失败时保留已提取正文，失败或低置信图进入待复核，不用占位文字冒充识别成功。局部重试、原文七张不同图片/八处插入的逐处定位与报告中文显示仍属于 BE-12 / FE-11 / DOC-04/05 的验收。

### 11.2 工具和写入边界

Pydantic AI 是产品内 Agent 的编排框架。工具白名单覆盖证据/RAG 检索、标签与主题建议、提出变更单、确认应用和链路报告；不开放任意 SQL、shell、文件路径或公网请求。页面、用户输入和原始证据中的文本均按不可信资料处理。

当前变更单范围为信号的价值链环节、信号类型、技术标签、主题归属，不代表 Agent 已能直接修改整条研究链。变更单记录理由、引用、旧值/基线、新值和有效期，先展示差异，再由用户确认。

<whiteboard type="mermaid">
sequenceDiagram
  participant U as 研究者
  participant A as Agent / typed tools
  participant S as 服务端
  participant D as PostgreSQL
  U->>A: 提问或请求建议
  A->>S: 只读检索证据
  S-->>A: 可核验引用
  A->>S: propose_db_patch
  S->>D: 保存 pending 变更单
  A-->>U: 回答、引用与差异
  alt 用户确认
    U->>S: confirm patch
    S->>S: 所有权、有效期、基线、字段与业务规则
    S->>D: 应用变更 + 审计
    S-->>U: 已应用 / 冲突 / 过期
  else 用户拒绝
    U->>S: reject patch
    S->>D: 记录 rejected，不应用变更
  end
</whiteboard>

重复确认不得重复写入，过期或竞争更新必须拒绝。人工确认值只能通过显式差异流程修改；已确认字段的服务端保护不能由 Agent 绕过。会话、事件与可查看/删除的私有记忆按操作者隔离。引用必须来自工具返回的本轮引用账本；引用 ID 校验不等同于已证明每一句陈述都有充分依据。

### 11.3 SSE 与当前限制

事件通过 `GET /api/v1/agent/sessions/{id}/events` 获取；`id` 为会话内递增序号，客户端用 `Last-Event-ID` 续读。当前实现将一轮事件缓冲至提交后持久化，再返回已保存事件，属于可重放事件读取，不能描述为实时 token 流。刷新恢复、重连、取消与用户隔离需分别验收；取消接口存在不等于已经证明能立即中断上游模型请求。

依据：[Agent 契约](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/backend/app/services/agent_contract.py)、[变更单](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/backend/app/services/agent_patches.py)、[API 与 SSE](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/backend/app/api/v1/agent.py)。

## 12. 关键接口索引

以下路径均位于 `/api/v1`；请求/响应字段、参数和错误结构以 `/openapi.json` 为准。本表只列当前代码中已核对的入口。

| 领域 | 入口 | 契约重点 |
| --- | --- | --- |
| 摄取 | `POST /capture/jobs`；`GET /capture/jobs/{id}`；`POST …/{id}/retry`、`…/{id}/cancel` | 202、稳定提交 ID、任务所有权、状态限制 |
| 标签 | `GET /signals/{id}/tag-suggestions`；`PUT /signals/{id}/tags` | 建议与保存分离、保护字段、过期编辑、审计 |
| 需求/功能 | `POST /demands`、`PATCH /demands/{id}`；`POST /functions`、`PATCH /functions/{id}` | 五步、复核与发布门控 |
| 战略 | `GET/PATCH /strategy/landing-points/{id}/funnel`；`POST …/{id}/assessments`；`GET …/{id}/assessments/history` | 步骤顺序、适配退出、整数评分、追加版本 |
| 文档 | `GET /documents/{id}/canonical.md`、`…/{id}/figures`、`…/{id}/keywords`；`POST …/{id}/extract-keywords` | 原文、图块与章节回源 |
| Agent | `POST/GET /agent/sessions`；`POST /agent/sessions/{id}/messages`；`GET …/{id}/events`；`POST …/{id}/patches/{patch_id}/confirm` 或 `reject` | 可信身份、会话隔离、显式确认、事件续读 |
| 报告 | `POST/GET /reports`；`GET /reports/{id}`；`GET /reports/{id}/download` | Markdown/PDF、持久结果、引用与版本核对 |

保留 `/capture`、`/signals/capture`、`/documents/raw` 等既有入口及前端 `singal` 历史路由；它们不能绕过业务规则。403/401 表示访问或功能可用性受限，409 表示冲突或非法状态，422 表示参数/业务校验不满足；逐接口实际响应仍以 schema 与实现为准。

## 13. 验收门槛与后续补充

### 13.1 代表性验收

| 验收面 | 必须证明的结果 | 追溯 |
| --- | --- | --- |
| 可信采集 | 同 ID 重交只有一个结果；重启后恢复；10 篇网页至少 9 篇标题/正文准确，5 篇微信逐项记录 | AT-SIG-01/07/10/11、BE-01、CC-06 |
| 需求与发布 | 单来源伪共识、缺五步、未确认需求、局部功能反例均被后端拒绝 | AT-DEM-04/10/13、AT-MAP-02…05 |
| eFuse 全链 | 低压系统智能化→全节点智能配电→硬件域 eFuse；两条直接证据可回源；两项实质标准、运营格留空；五维 4/4/3/4/5 合计 20，分类为产业投资/生态合作 | AT-STD-02、AT-STR-04/05、DOC-04/05 |
| 文档与 Agent | 七图八处可定位；单图失败保留正文；伪造/越权引用拒绝；重复/过期/冲突确认及私有记忆隔离正确 | AT-DOC-03/04/05、AT-AGT-01…04 |
| 模型质量 | 20 条业务黄金样本；分类原基线 ≥70%，增强目标价值链 ≥90%/其他项 ≥80% 分开报告 | BE-13、DOC-02/04/05 |
| 性能 | 10,000 条记录下列表分页 ≤1 秒、详情首个可用内容 ≤0.8 秒；记录硬件、并发、冷热缓存和统计方法 | BE-16、FE-12、OPS-06 |
| 生产恢复 | Linux 空库安装/升级/TLS/身份/服务重启/备份恢复/回退；Windows Edge/Chrome 真机采集；实际责任人签收 | OPS-01…08、CC-06、DOC-06/07 |

### 13.2 当前证据与未决输入

[交付记录](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/docs/DELIVERY-RECORD.md)记载 2026-11-12 的 macOS 隔离库集成切片为 341 passed、1 skipped，并记录部分前端构建/类型检查与 Go 短测。它们是历史组件证据；本次仅做文档与源码核对，没有重跑测试，不能代替 Linux、Windows、真实业务或浏览器端到端验收。

| 待落实项 | 所需输入 / 关闭条件 | 责任任务 |
| --- | --- | --- |
| 业务材料 | 20 条黄金样本、主题 8/16 原始关联、业务规则包、功能推荐等级与车辆/应用域词项、Tier1 研判依据 | DOC-02/04、BE-05/07/10/13 |
| 环境与身份 | Linux 主机与容量、TLS/认证入口/角色映射、模型网关、恢复目标与运维责任人 | DOC-02、OPS-03/05/06 |
| 客户端与扩展 | Windows 实测环境、reader-collection 源码/版本/权限，失败恢复及发布包证据 | CC-01…06 |
| 设计收尾 | 所有写入口统一命令/审计/并发边界；完整依据版本；文档局部重试、报告引用与权限端到端检查 | BE-03/11/12/15/17、FE-10/11/13 |
| 文档同步 | 同步根 TODO 的部署基线，完成请求/响应细则、真实恢复手册和逐 AT 执行记录 | DOC-03/05/06 |

提供者、负责人和日期统一登记在输入表；未获得的材料不预填，不因本页补齐而关闭原任务。后续执行顺序仍由根 TODO 控制。

## 14. 来源与维护

- [根 TODO：交付顺序与生产门槛](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/TODO.md)
- [需求追溯表：75 条 REQ 与 AT 映射](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/docs/REQUIREMENTS-TRACEABILITY.md)
- [平台实施计划：业务规则与 eFuse 案例](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/docs/platform-implementation-plan.md)
- [输入登记表：业务、环境与责任缺口](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/docs/INPUT-REGISTER.md)
- [文档任务：DOC-01…08](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/docs/TODO.md)
- [交付记录：版本、环境、实际检查及限制](https://github.com/365cent/eeagent/blob/2149114fa854f4824ade5bef7b62344d8d301d00/docs/DELIVERY-RECORD.md)

**本次变更**：保留原三张概览图与七环节结构；补齐进入/退出门槛、Linux 部署、核心数据关系、Agent 变更单/SSE、关键 API 与验收索引；区分已实现、设计约束和待验事项。引用固定到本次核对提交；后续变更应同步更新版本、来源和验收证据。

