# frontend/TODO.md

状态：2026-11-02。依据《智能纪要：EEA白皮书agent需求（2026-10-29）》（[`../docs/meetings/2026-10-29-EEA白皮书agent需求-智能纪要.md`](../docs/meetings/2026-10-29-EEA白皮书agent需求-智能纪要.md)）重写，与 [`../backend/TODO.md`](../backend/TODO.md)（同日会议版）对齐。

**总原则（会议明确）**：优先保障可交付的核心功能落地，避免发散开发非必要的摆设类功能，聚焦实际痛点需求。

**演示数据已清零（2026-10-29）**：`eea` 库业务表与对象存储已全部清空，仅保留封闭词表与 domain 词表。**总览/列表为空是预期**——等 20 条真实信号（邱志光，近期）。注意：**勿再跑 `bootstrap.py`**（会重播演示种子），日常只跑 `scripts/start_api.py`。

验收走查：[`docs/ACCEPTANCE-WALKTHROUGH.md`](docs/ACCEPTANCE-WALKTHROUGH.md)

---

## 后端已就绪的新契约（2026-10-29 上线，直接接线）

| 契约 | 说明 |
| --- | --- |
| `POST /signals` + `document_id` | 文档来源信号：**不传** title/url/body（服务端默认：文件名 / `eea://document/{id}` / 摘要正文）。**别再把 canonical 全文塞进 body_text**（W4.1 误归集根因） |
| `SignalDetail.document_id` | 文档信号来源链 → `GET /documents/{id}/canonical.md` |
| `SignalDetail.linked_demand_points[]` | 来源栏「关联需求」：信号主题 → 需求点；无主题 `[]` → 显示「未关联」 |
| `SignalDetail.theme = null` | 文档来源信号**预期即无主题**（后端跳过自动归集），人工 `PUT /theme` 指定 |
| `POST /signals/{id}/auto-aggregate` | 文档来源信号返回 **409**（文案：请人工指定主题）— 前端需处理 |
| `PUT /signals/{id}/theme` | 指定/移出主题（传 `null` = 移出，也是误归集纠错入口） |
| `PUT /signals/{id}/tags` | 标签人工增删；`operator_subject` 传当前用户名 |
| `GET /signals/{id}/tag-suggestions` | 编辑时的建议 chips（`source: llm \| jieba-frequency`），一键采纳 |
| 文档图注 | `MAX_FIGURES` 8→16；`ingest_status` / `figure_count` / canonical.md 契约不变 |

类型：[`lib/api/types.ts`](lib/api/types.ts) 已含 `document_id`、`linked_demand_points`、`TagSuggestion`、可变 `SignalCreatePayload`。

---

## W3（2026-11-02–11-06，WBS 1.3）

- [x] 价值链环节 / 信号类型下拉修正：[`components/evidence/signal-classification-editor.tsx`](components/evidence/signal-classification-editor.tsx) → `PATCH /signals/{id}`
- [x] 修正记录：[`components/evidence/signal-correction-audit.tsx`](components/evidence/signal-correction-audit.tsx) → `GET /audit?entity_id=`
- [x] 主题页接真实词表与主题表，可展开回溯信号：[`components/topics/topics-view.tsx`](components/topics/topics-view.tsx)
- [x] 新建主题：[`components/topics/create-topic-form.tsx`](components/topics/create-topic-form.tsx) → `POST /themes`
- [x] 词表页：[`components/topics/vocab-knowledge-panel.tsx`](components/topics/vocab-knowledge-panel.tsx) → `GET /vocab/usage`
- [x] 信号频次 / 来源数口径说明（REQ-DEM-14）：[`lib/metrics-copy.ts`](lib/metrics-copy.ts)
- [x] 技术方向建议兼容 `embedding-rerank` 与可选分数字段（不依赖 tag-suggestions 返回环节/类型）
- [ ] 20 条资料人工核对（1.3.7，电气工程师；到位后按走查清单）

## P0 本周（≤2026-11-01，配合部署）

- [ ] **服务器部署前端**：`pnpm install && pnpm build && pnpm start`（端口 3000）；步骤、常驻与验收清单见 [`../backend/DEPLOY.md`](../backend/DEPLOY.md)；API 基址按浏览器 hostname 自动推导已就绪，无需配置
- [x] **空状态走查**：清库后总览/信号/主题各页空态；**API 可用时永远显示真实数据（含空态），mock 仅在 API 不可用时兜底**
- [ ] 20 条信号到位后的真实数据走查（与 backend P0-2 联动）

## P1 第一阶段：人工编辑闭环（会议点名「暂不支持用户修改操作」）

- [x] **标签编辑入口**：[`components/evidence/signal-tags-editor.tsx`](components/evidence/signal-tags-editor.tsx) → `PUT /tags` + `GET /tag-suggestions`
- [x] **主题指定/移出**：[`components/evidence/signal-theme-assign.tsx`](components/evidence/signal-theme-assign.tsx) → `PUT /theme`；文档来源隐藏「自动归集」
- [x] **来源栏关联需求**：`EvidenceDetailWorkspace` 接 `linked_demand_points`
- [x] **文档→信号**：[`document-ingest-result.tsx`](components/import/document-ingest-result.tsx)「保存为信号」→ `POST /signals { document_id, channel_code: "web" }`
- [ ] 旧遗留：**追溯链抽屉**接 `GET /trace/landing-points/{id}`（`DeductionChainWorkspace` 仍用演示雷达）
- [x] 信号列表**服务端筛选**：`useSignalsListFiltered` + `GET /signals?keyword=&value_chain_stage=`

## P2 第二阶段（会议排期，等后端能力）

- [ ] 平台内对话调优 UI（后端 skills + 个人记忆就绪后；现 [`components/evidence/evidence-assistant-chat.tsx`](components/evidence/evidence-assistant-chat.tsx) 已可用）
- [ ] 标签自动聚类：主题候选列表 + 人工确认落库（后端 T4 / S2 交付后接）
- [ ] 新分类自动生成：候选确认后入封闭词表
- [ ] Agent 产品（REQ-AGT-01…04）：侧栏多会话、SSE 流式、`citations[]`、写库确认 — 维持旧计划
- [ ] 第 7 环节（战略研判）定制 UI — 邱志光深度参与后再动

---

## 约定

- 本地开发 `pnpm dev`；部署/常驻/备份见 [`../backend/DEPLOY.md`](../backend/DEPLOY.md)
- antd lint 分文件跑（`pnpm antd:lint` 多路径参数与 CLI 不兼容）；规范见 [`AGENTS.md`](AGENTS.md) + [`../.agents/skills/ant-design/SKILL.md`](../.agents/skills/ant-design/SKILL.md)
- API 交互文档（服务启动后）：http://127.0.0.1:8000/docs 、http://127.0.0.1:8000/llms.txt
- 后端启动：`cd backend && .venv\Scripts\python scripts\start_api.py`（bootstrap 只用于全新环境，会写入演示种子）

---

交叉引用：[`../backend/TODO.md`](../backend/TODO.md)（backend 同源计划）、[`../client/TODO.md`](../client/TODO.md)（抓取端）、[`../docs/meetings/`](../docs/meetings/)（会议纪要原文）
