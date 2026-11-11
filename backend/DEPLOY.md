# EEA 平台服务器部署手册（P0-1）

> **开发机（Windows / macOS / Linux）：** 见仓库根目录 [README.md](../README.md)。  
> **Linux 内网生产：** 以 [deploy/README.md](../deploy/README.md) 为准，不复用下文便携 PostgreSQL 流程。

目标（2026-10-29 会议）：本周内把平台部署到内网服务器，脱离开发机，方便后续调整修改。本手册按现有脚本写，**零系统级安装（Windows 便携库路径）**：PostgreSQL 用便携版自动落在 `backend/.pg/`，不需要服务器管理员权限。

组件与端口：

| 组件 | 目录 | 端口 | 说明 |
| --- | --- | --- | --- |
| API + PostgreSQL | `backend/` | 8000（API）/ 54329（PG，仅本机） | FastAPI；监听 `0.0.0.0` |
| 前端 | `frontend/` | 3000 | Next.js `pnpm start`；API 基址按浏览器 hostname 自动推导 |
| Capture Client | `client/` | — | 按需在业务电脑上装（见 `../client/README.md`），服务器不必装 |

## 1. 后端（一次性）

```bash
cd backend
python -m venv .venv                      # 服务器需 Python 3.12+
.venv\Scripts\python -m pip install -U pip
.venv\Scripts\pip install -e .
copy .env.example .env                    # 填 LLM_BASE_URL / LLM_API_KEY（LLM_MODEL 留空自动选）
.venv\Scripts\python scripts\bootstrap.py # 便携 PostgreSQL + 建库 + 迁移 + 种子数据
.venv\Scripts\python scripts\start_api.py # 后台启动，日志 backend/.pg/api.log
```

- 企网装包走镜像：`pip install -i https://pypi.tuna.tsinghua.edu.cn/simple <pkg>`（或持久化 `PIP_INDEX_URL`）。
- Linux 上若仍用便携 bootstrap，把 `.venv\Scripts\...` 换成 `.venv/bin/...`；macOS/Linux 日常开发更常用系统 PostgreSQL，见 README.md。`start_api.py` 在外部库模式下不启动便携 `pg_ctl`。
- Windows 上 `backend/scripts/pytest_slices.sh` 需 **Git Bash** 或 **WSL**，或在 `backend/` 运行 `uv run pytest -q`。
- 验证：`curl http://127.0.0.1:8000/healthz` → `{"status":"ok",...}`；浏览器开 `http://<服务器IP>:8000/docs`。

## 2. 前端（一次性）

```bash
cd frontend
pnpm install
pnpm build
pnpm start        # 默认 3000；跨机器访问时 API 基址自动指向 http://<服务器IP>:8000
```

- 服务器需 Node 20+ / pnpm。无外网时用内网 npm 镜像：`pnpm config set registry <镜像地址>`。
- 验证：浏览器开 `http://<服务器IP>:3000`，总览页能拉到信号数据。

## 3. 常驻运行（重启后自动拉起）

**Windows 服务器（任务计划程序）**——两条开机任务，均「不管用户是否登录都运行」：

```
程序: D:\...\backend\.venv\Scripts\python.exe   参数: scripts\start_api.py   起始于: D:\...\backend
程序: <pnpm 或 node>                            参数: start                 起始于: D:\...\frontend
```

**Linux 服务器（systemd）**——`/etc/systemd/system/eea-api.service`：

```ini
[Unit]
After=network.target
[Service]
WorkingDirectory=/opt/eea/backend
ExecStart=/opt/eea/backend/.venv/bin/python scripts/start_api.py
Restart=always
[Install]
WantedBy=multi-user.target
```

前端同理（`ExecStart=/usr/bin/pnpm start`，`WorkingDirectory=/opt/eea/frontend`），然后 `systemctl enable --now eea-api eea-web`。

## 4. 升级与重启（改代码后必须）

8000 上的旧进程不会自动加载新路由（2026-10-28 教训）：

```bash
cd backend
.venv\Scripts\python scripts\stop_api.py && .venv\Scripts\python scripts\start_api.py
.venv\Scripts\python -m alembic upgrade head   # 有新迁移时（如 0006）
```

前端改动：重新 `pnpm build` 后重启 `pnpm start`。

## 5. 数据与备份

| 数据 | 位置 | 备份方式 |
| --- | --- | --- |
| 数据库 | `backend/.pg/`（便携 PostgreSQL 数据目录） | 停库后整目录拷贝：`scripts\stop_db.py` → copy → `scripts\dev.py` |
| 对象存储（HTML 快照/正文/文档） | `backend/.pg/objects/`（`OBJECT_DIR`） | 随 `.pg/` 一并拷贝 |
| 环境变量 | `backend/.env` | 密钥只在这里；**不**入 git、不截图外发 |

## 6. 部署验收清单

- [ ] `http://<服务器IP>:8000/healthz` 与 `/docs` 可访问
- [ ] `http://<服务器IP>:3000` 总览有数据、证据详情可开
- [ ] 抓取闭环：`capture upload`（或前端拖入 `.html`）→ 正文/`archive` 可回放
- [ ] 文档闭环：上传 PPTX → `ingest_status=parsed`、canonical.md 可看
- [ ] 文档来源信号：`POST /signals` 传 `document_id` → 详情无演示主题、`linked_demand_points` 字段在
- [ ] 服务器重启后两条服务自动起来
