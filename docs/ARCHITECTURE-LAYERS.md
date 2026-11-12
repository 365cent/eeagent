# 分层架构与契约校验 / Layered architecture & contracts

更新：2026-11-11。与 [DOC-03](TODO.md#doc-03-架构数据和接口同步) 同步；实现任务见 [BE-17](../backend/TODO.md#be-17-领域分层与依赖边界)、[FE-13](../frontend/TODO.md#fe-13-领域特性与-workspace-拆分)、[CC-07](../client/TODO.md#cc-07-客户端分层与-http-复用)。运行时契约以 OpenAPI 与数据库 migration 为准，本文描述代码组织与回归门禁，不含凭据或环境秘密。

## 总览 / Overview

| 组件 | 分层要点 | 任务 |
| --- | --- | --- |
| Backend (FastAPI) | `app/platform` 横切 → `app/domains/*` 用例 → `app/api` 编排 | BE-17 |
| Frontend (Next.js) | `features/<domain>` 领域切片 → `views/*` 路由 → `workspace` 壳编排 | FE-13 |
| Capture Client (Go) | `httpx`/`retry` 横切 → `platform` 上传 → `capture`/`queue` 职责拆分 | CC-07 |

HTTP 面统一为 `/api/v1`（见 `GET /openapi.json`）。采集默认 `POST /api/v1/capture/jobs`；`POST /documents/raw` 保留 legacy 别名（DOC-03 摄取切片）。

## Backend — `app/platform` 与 `app/domains`

**目标（BE-17）**：路由层只做编排与 DTO 映射；配置、DB、身份、对象存储、LLM 网关等横切能力在 `app/platform`；按 bounded context 的业务用例逐步迁入 `app/domains/<name>`。过渡期 `app/services` 与 `app/schemas` 仍承载大部分逻辑，迁移按垂直切片推进（采集/证据等已出现 `domains/capture`、`domains/evidence` 等首批模块）。

| 目录 | 职责 |
| --- | --- |
| `app/platform` | DB session、分页、HTTP 辅助、错误形态、仓储抽象、证据/LLM 横切 |
| `app/domains/<ctx>` | 领域实体、用例、与上下文相关的纯业务逻辑 |
| `app/api` / `app/api/v1` | FastAPI 路由、请求/响应 DTO、依赖注入与权限门 |
| `app/services` | 遗留服务层（逐步下沉到 domains 或 platform） |
| `app/schemas` | 共享 Pydantic 模型（待与各领域 DTO 收敛） |

**依赖方向（应遵守）**：`api` → `domains` / `services` → `platform`；`platform` 不得依赖 `api` 或 `domains`；`services` 不得依赖 `api`（消除对 `app.api.v1` 的反向导入是 BE-17 收尾项之一）。

## Frontend — `features` 与 `views`

**目标（FE-13）**：`features/<domain>/` 承载 api 封装、React Query hooks、列定义、状态色板与领域组件；`views/<route-key>/` 对应 [routes.ts](../frontend/config/routes.ts) 的路由视图；`views/dashboard/workspace.tsx` 仅做 shell 与路由切换，不堆业务表与各环节实现。业务请求须经 `lib/api/client.ts`，禁止在业务代码中直接 `fetch`（ESLint 约束）。

计划按 bounded context 拆分：evidence、topics、technology、strategy、import、trace、overview 等；保留 `singal` 等历史深链接与主题 token。

## Capture Client — platform 与出站 HTTP

**目标（CC-07）**：`internal/httpx` 统一出站 `http.Client`（超时、网卡绑定）；`internal/retry` 集中 Retry-After 与可重试状态码；`internal/platform` 对接后端 OpenAPI 路径；`capture` 仅声明采集引擎；`queue` 依赖 `Uploader` 接口而非具体 client。CC-02 幂等语义不变：`submission_id` 幂等，4xx 与不确定 POST 不自动重试。

## Import Linter（Backend）

配置：[backend/pyproject.toml](../backend/pyproject.toml) `[tool.importlinter]`；说明副本 [backend/tests/contracts.ini](../backend/tests/contracts.ini)。

```bash
cd backend && uv run lint-imports
```

当前契约（节选）：

1. **platform-isolation**：`app.platform` 禁止导入 `app.domains`、`app.api`。
2. **services-isolation**：`app.services` 禁止导入 `app.api`。

违反即 CI/本地回归失败；新增契约前须先清现存违规导入（见 BE-17）。

## OpenAPI 路径快照

- 运行时 schema：`GET /openapi.json`；`/` 与 `/docs` 为 Swagger UI（`deepLinking`），无独立 `/llms.txt`。
- 回归门禁：[backend/tests/test_openapi_snapshot.py](../backend/tests/test_openapi_snapshot.py) 对比 [backend/tests/snapshots/openapi_paths.json](../backend/tests/snapshots/openapi_paths.json) 中的 path 键集合。
- 有意变更路由后更新快照：

```bash
cd backend
OPENAPI_UPDATE_SNAPSHOT=1 uv run pytest tests/test_openapi_snapshot.py
```

审阅 diff 后提交快照；与 [BE-16](../backend/TODO.md#be-16-回归迁移与交付) 的前端类型契约检查互补。

## 验收勾连 / Acceptance hooks

| 检查 | 命令/证据 | 任务 |
| --- | --- | --- |
| 后端分层导入 | `uv run lint-imports` | BE-17 |
| OpenAPI 路径面 | `uv run pytest tests/test_openapi_snapshot.py` | BE-17 / BE-16 |
| 前端构建与 lint | `pnpm build`、`pnpm antd:lint` | FE-13 / FE-12 |
| 客户端短测 | `go test -short ./...`（`client/`） | CC-07 |

完整数据关系、身份/审计状态机与运维拓扑仍在 DOC-03 其余条目中补齐；业务行为以 [需求追溯表](REQUIREMENTS-TRACEABILITY.md) 与原始来源为准。
