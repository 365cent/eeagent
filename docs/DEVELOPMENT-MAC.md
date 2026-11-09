# macOS 开发与组件验证

本文面向仓库的 macOS 开发机，按已提交的版本文件和脚本说明组件设置及验证命令。按需运行相应命令；本文不表示任何命令已在本次修改中执行。macOS 结果不能代替 Linux 内网生产验证或 Windows GUI/真浏览器验证。

## 工具版本依据

| 组件 | 仓库依据 | 开发机要求 |
| --- | --- | --- |
| Python | `backend/.python-version` 为 `3.12`；`backend/pyproject.toml` 要求 `>=3.12`；依赖由 `backend/uv.lock` 锁定 | 使用 uv 按仓库版本同步环境。 |
| PostgreSQL | 后端默认 TCP 端口 `54329`；仓库 portable bootstrap 使用 PostgreSQL `16.9`，但脚本依赖 Windows portable binary | macOS 使用本机 PostgreSQL 16 服务；下面将应用连接端口设为 Homebrew 默认的 `5432`。测试必须能连到本地实例。 |
| Node / pnpm | `frontend/package.json` 指定 `pnpm@12.3.4`；依赖快照在 `frontend/pnpm-lock.yaml` | Node 版本未由仓库锁文件固定；选用 Next.js 16 支持的 Node 版本，并通过 Corepack 启动精确 pnpm 版本。 |
| Go | `client/go.mod` 指定 Go `1.24`，GUI 依赖 `windigo@v0.2.6` | macOS 可运行不依赖 Windows GUI/真实浏览器的 Go 包检查；Windows 端检查见下文。 |

## 安装本机工具

安装并启动 Homebrew PostgreSQL 16；此版本与仓库 Windows 开发 bootstrap 的 PostgreSQL 主版本一致：

```bash
brew install uv postgresql@16
brew services start postgresql@16
export PATH="$(brew --prefix postgresql@16)/bin:$PATH"
```

为本地开发建一个隔离角色。若角色已存在，跳过 `createuser`，只执行密码/权限设置。该开发密码仅供本机使用，不要复用线上凭据：

```bash
createuser --createdb eea
psql -d postgres -c "ALTER ROLE eea WITH LOGIN CREATEDB PASSWORD 'eea';"
```

后端代码的默认连接端口是 `54329`，而 Homebrew 服务通常监听 `5432`。在后端 shell 中显式覆盖连接设置：

```bash
cd backend
export DB_HOST=127.0.0.1
export DB_PORT=5432
export DB_USER=eea
export DB_PASSWORD=eea
```

In local development the operator identity comes from server configuration. The default role is `researcher`, which can edit evidence but cannot confirm demand points; set `DEV_OPERATOR_ROLE=taxonomy_admin` only when testing that reviewer path. Do not pass a role from the browser request as proof of identity.

使用项目 Python 版本和锁定依赖安装后端环境：

```bash
uv sync --locked
uv run python --version
```

版本输出应为 Python 3.12.x。`backend/scripts/bootstrap.py`、`dev.py` 和 `start_api.py` 使用 `.pg/pgsql/bin` 下的 Windows portable PostgreSQL 路径；macOS 开发不要用这些脚本启动本机数据库。

## Backend 检查

**pytest 必须连到本地 PostgreSQL，并且只使用专用的 `eea_test` 数据库。** 测试配置会将 `DB_NAME` 改为 `eea_test`、创建数据库（若不存在）、运行 Alembic 迁移，并在每个用例前清空业务表。不要把该测试连接改到 `eea`、验收数据或生产数据库。运行前先启动 PostgreSQL 并确认应用角色可连接及可创建数据库：

```bash
psql "postgresql://eea:eea@127.0.0.1:5432/postgres" \
  -c 'SELECT current_user, current_database();'
```

连接确认后，从 `backend/` 运行：

```bash
uv run pytest -q
```

在 PostgreSQL 未运行时，当前 pytest fixture 会调用 `scripts/start_api.py` 自动启动；该脚本也假定 Windows portable `.pg` 布局。因此 macOS 上须先手动启动本机 PostgreSQL，不要依赖 fixture 的自动启动分支。

可选本机 API 冒烟：在已建库 `eea` 并迁移后启动服务，再从另一个终端请求健康端点。首次建库/迁移可用：

```bash
PGPASSWORD="$DB_PASSWORD" createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" eea
uv run alembic upgrade head
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

另一终端：

```bash
curl --fail http://127.0.0.1:8000/healthz
```

若 `eea` 已存在，跳过 `createdb`。`app.seed` 只写入封闭参考词表和五个已确认技术域，不创建合成信号、需求或功能决策；自动化验收样例只进入专用 `eea_test`。该启动方式是本机开发检查，不是 Linux 服务验证。

持久采集任务使用独立 worker。前端「导入证据」的文件拖入与 Windows 客户端文件队列也依赖该 worker 处理 `POST /api/v1/capture/jobs`。升级到当前 Alembic head（现为 0012_strategy_funnel）后，可在另一个 `backend/` 终端用相同数据库/对象目录环境前台观察开发任务：

```bash
uv run python -m app.worker
```

使用 Ctrl-C 让 worker 在当前任务结束后停止。不要把本机 worker 命令当成 systemd 生命周期或进程崩溃恢复验收；生产需按 [部署说明](../deploy/README.md)运行 `eea-worker.service`。

## Frontend 检查

仓库锁定 pnpm `12.3.4`。先确认 Node/Corepack 可用，再使用锁文件安装：

```bash
node --version
corepack --version
cd frontend
corepack pnpm --version
corepack pnpm install --frozen-lockfile
```

Corepack 需要能够取得并安装 package.json 指定的 pnpm。若 Corepack 初始化未完成，可尝试：

```bash
corepack enable
corepack prepare pnpm@12.3.4 --activate
```

**如果 Corepack 安装/下载失败，pnpm 启动器目前可能不可用**；先修复本机 Node/Corepack 安装或包源访问，再执行检查，不要删除/重写 lockfile 或改用未锁定依赖。此仓库没有独立 frontend `test` 脚本。组件构建和 antd lint 命令为：

```bash
corepack pnpm build
corepack pnpm antd:lint
```

`antd:lint` 按 `frontend/package.json` 检查 `components`、`views` 和 `config`。前端改动还需在浏览器人工走查，并按 [验收走查](../frontend/docs/ACCEPTANCE-WALKTHROUGH.md) 对照真实 API；构建成功本身不证明业务链路已验收。

## Go 客户端的 macOS 可执行检查

Go 模块要求 Go 1.24。下列包检查绕开 Windows GUI 包和启动真实 Edge/Chrome 的集成用例；`-short` 会跳过仓库中明确标注的真浏览器用例：

```bash
cd client
go version
go test -short ./internal/archive ./internal/cdp ./internal/capture ./internal/config ./internal/netinfo ./internal/platform ./internal/queue
```

这只能覆盖这些 Go 包的可移植逻辑与模拟服务交互。不要在 macOS 结果中记作 Windows GUI、Edge/Chrome、安装升级或发布包验证。

## 必须在目标系统执行的检查

- **Windows 客户端**：在 Windows runner 执行 `go test -short ./...`、`go test ./...` 和 `scripts/release.ps1`；在 Windows 10/11 上分别用 Edge、Chrome 验证 GUI、登录态、采集和上传。真实浏览器用例必须在可用浏览器的 Windows 环境中记录。
- **Linux 生产候选**：按 [deploy/TODO.md](../deploy/TODO.md) 在 Linux 隔离预生产环境验证系统服务、迁移、反向代理身份/TLS、worker、持久数据、备份恢复、重启与完整端到端链路。macOS 的 PostgreSQL、uvicorn、Next build 或 Go 检查都不构成 Linux 生产验证。

记录每次检查的提交/版本、macOS 与工具版本、数据库目标、命令、结果和失败证据；未运行或因环境缺失跳过的步骤保持“未验证”。
