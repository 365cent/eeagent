# EEA 生产部署（Docker Compose）

唯一支持的生产方式：一台 Linux 内网主机，Docker Compose 起全部服务。无需 Python/Node 环境，无需离线依赖包。

| 容器 | 作用 |
| --- | --- |
| postgres | 数据库（卷 `pgdata`） |
| migrate | 一次性：`alembic upgrade head`，每次启动自动执行 |
| api | FastAPI，仅内网监听 |
| worker | 采集任务后台处理（与 api 同一镜像） |
| maintenance | 孤儿对象清理 + 过期终态采集任务清理，按需 `--profile ops` 运行 |
| web | Next.js（standalone），仅内网监听 |
| nginx | 唯一对外入口：页面与 `/api` 同源（卷 `objectstore` 存原始证据） |

## 首次部署（三步）

```bash
git clone <repo> eea && cd eea

# 1）构建并启动；内网需要代理出网时把代理地址放第一个参数
bash deploy/build.sh 10.215.8.74

# 没有代理时：
bash deploy/build.sh
```

脚本会：缺 `deploy/.env` 时从 `.env.example` 生成并写入随机 `DB_PASSWORD` → 构建镜像 → 迁移 → 启动 → 等待健康检查。

打开 `http://<主机IP>:8080/` 即用；`http://<主机IP>:8080/docs` 是接口文档。

## 代理说明

- 代理只在**构建**阶段使用，运行中的容器不带 `HTTP_PROXY`。
- Docker 守护进程本身也要能访问 `docker.io`（主机级 systemd 代理），否则拉基础镜像会失败。
- 默认代理端口 1000，可用 `DEFAULT_PROXY_PORT` 覆盖；pip 默认清华镜像，可用 `PIP_INDEX_URL` 覆盖。

## 日常维护（照着敲，全部在 deploy/ 目录）

| 要做的事 | 命令 |
| --- | --- |
| 看状态 | `cd deploy && docker compose ps` |
| 看日志 | `cd deploy && docker compose logs -f api worker web` |
| 改代码后更新 | `bash deploy/build.sh`（加 `--no-cache` 强制全量重建） |
| 手动迁移 | `bash deploy/migrate.sh` |
| 发布采集客户端 | 把 `capture.exe`（macOS 为 `EEA-Capture-*.dmg`）与 `SHA256SUMS` 放进 `deploy/downloads/`，API 与 nginx 会自动列出并直接下载（不再打包 zip） |
| 备份 | `bash deploy/backup.sh` → `deploy/backups/eea-<时间>.{dump,tar.gz,manifest.txt}` |
| 恢复 | `bash deploy/restore.sh <备份时间戳>` |
| 清理孤立对象与过期终态任务 | `cd deploy && docker compose --profile ops run --rm maintenance`（终态任务默认保留 `CAPTURE_JOB_RETENTION_DAYS=30` 天） |
| 回退版本 | `EEA_VERSION=<旧版本> bash deploy/build.sh`（镜像按 `EEA_VERSION` 打标签） |

## 配置

所有配置在 `deploy/.env`（不要提交）：数据库口令、对外端口 `EEA_HTTP_PORT`、`TRUSTED_PROXY_IPS`（只有这些地址可以带身份头）、`CORS_*`、模型网关 `CHAT_*`/`EMBEDDING_*`/`RERANK_*`/`VISION_*`。生产默认关闭服务端公网抓取（`CAPTURE_SERVER_FETCH_ENABLED=false`），网页由用户侧 EEA Capture 客户端采集后上传。

模型网关这几组键与开发机 `backend/.env` 共用同一份取值：容器只读 `deploy/.env`，把键放错文件会出现 `/readyz` 的 `semantic_gateway: degraded`，标签建议与助手全部不可用。改完 `deploy/.env` 后 `docker compose up -d --no-deps --force-recreate api worker` 并重启 nginx（重建后 upstream IP 会变）。

## TLS 与身份

Nginx 不再透传客户端自带的身份头，而是在模板里按 `EEA_PILOT_OPERATOR`/`EEA_PILOT_ROLE` 注入一个固定操作者（两项为空即不注入，写入仍返回 401）；这只是接入真实身份代理前的过渡，使同一操作者共享化，需在 OPS-03 完成后删除并重新验收越权用例。TLS 与账号体系仍由更外层的企业代理终止，并把 `TRUSTED_PROXY_IPS` 设为该代理地址。证书挂载点见 `nginx/eea-intranet.conf` 注释。

## 常见故障

| 现象 | 处理 |
| --- | --- |
| 构建拉不到基础镜像 / pip 超时 | 确认主机级代理，然后 `bash deploy/build.sh <proxy>` |
| `api` 反复重启 | `docker compose logs api`；多为 `.env` 里 `DB_PASSWORD` 与已有卷不一致 |
| 迁移失败 | 先备份，再 `bash deploy/migrate.sh` 看完整报错；不要手改已发布迁移 |
| 页面 502 | `web` 未就绪：`docker compose logs web`，或 `docker compose up -d --wait` |
| 端口冲突 | 改 `.env` 的 `EEA_HTTP_PORT` 后重跑 `bash deploy/build.sh` |

## 说明

- 旧版 `deploy/scripts/` 离线包与 systemd 单元已移除；生产只用 Compose。历史仍可在 git 中找到。
- 开发机 macOS/Windows 上的构建结果不等于 Linux 主机验收；OPS-06 的空库安装、备份恢复、断网与 10k 性能仍需在目标主机执行。
