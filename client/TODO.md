# Capture Client 实施清单

更新：2026-11-09。生产服务端已选 Linux 内网；本目录仍是研究者 Windows 电脑上的 Go 采集程序。公网与登录浏览器留在用户终端。总顺序见 [项目清单](../TODO.md)，原文映射见 [需求追溯表](../docs/REQUIREMENTS-TRACEABILITY.md)。

## 现状和边界

已有 Edge/Chrome + 自写 CDP + SingleFile、GUI/CLI、URL/HTML/文档上传、网卡选择和本地持久队列。网页采集现优先提交至 `POST /api/v1/capture/jobs`，使用稳定 `submission_id` 并轮询服务端终态；旧服务端按 OpenAPI 回退到同步接口。文档上传仍调用 `/documents/raw`。本次未运行 Windows 真浏览器测试，旧“完成”记录不等同新发布验收。

保持瘦客户端：上传 URL+自包含 HTML 或原始文件，不做 Markdown 转换、LLM 分类或业务推导，不分发 Chromium。Edge/Chrome 是实际实现，旧 WebView2/Rod 选择表不再指导开发。

## CC-01 浏览器采集与来源

- [ ] P0 · 部分实现 · 可独立开展；验收依赖 DOC-02 真实材料。
- 来源：Word §2.1、图2-1-1/2-1-2、表A；REQ-SIG-01/02/07/11；WBS 1.3.2。
- 入口：[engine.go](internal/capture/engine.go)、[archive.go](internal/archive/archive.go)、[cdp/](internal/cdp/)。
- 普通网页/微信公众号分别识别渠道，等待可读正文稳定；保留用户 URL、最终 URL 和采集时间。
- 识别验证码、登录墙、空正文和错误页；允许可见浏览器人工处理，超时给出具体原因，不能把验证壳上传成成功证据。
- 保存 HTML 从 canonical/og:url/twitter:url 推断来源；没有可靠来源则要求显式输入，不生成虚构公网地址。
- 单例浏览器、多标签任务的关闭/取消不能结束用户其他会话；保护 profile 登录态。
- 验收：静态/延迟渲染/微信验证/无正文/崩溃/取消/无来源 HTML 均有结果；原 URL 与正文一致。

## CC-02 统一 API 与任务恢复

- [ ] P0 · 部分实现 · 依赖 BE-01/02、OPS-03。
- 来源：REQ-SIG-01/07/10/11、会议统一采集入口；WBS 1.3.2、1.6.1。
- 入口：[client.go](internal/platform/client.go)、[queue.go](internal/queue/queue.go)、[cli.go](internal/cli/cli.go)。
- 网页异步上传、幂等重试、本地持久队列和 Retry-After 切片已交付；具体实现与检查证据见[交付记录](../docs/DELIVERY-RECORD.md#cc-02--asynchronous-capture-and-durable-client-queue-slice)。CC-02 验收仍未完成。
- 服务端幂等和原子对象写入见 BE-01；部署必须升级到当前 Alembic head（现为 0011）。旧端点没有幂等键时不自动重试不确定结果。
- 仍需将文档上传迁至统一任务；把 retry/cancel 操作接入 GUI；设计终态历史保留与清理；并在 Windows 真机验证客户端队列重启恢复。服务端 worker 已可轮询处理，但只有收到 succeeded 终态后才显示采集完成。
- 分开抓取超时、上传超时和服务器处理超时；上传完成后继续轮询，不能提前显示“入库成功”。
- 明确的 4xx 验证错误不进入自动重试；429/5xx 有限重试并优先采用 `Retry-After`（最多等待 10 分钟）。401/403身份提示仍待身份接入。
- 旧服务端兼容模式通过能力探测显式选择并提示，不因任意错误重复上传两条路径。
- 验收：桩服务验证 multipart/幂等标识；断网重开、worker失败、重试与取消不会重复创建信号。

## CC-03 Linux 服务连接与凭据

- [ ] P0 · 未开始（现有仅基础地址配置）· 依赖 OPS-03。
- 来源：实施计划 §10.1 #4、REQ-RULE-02；WBS 1.6/1.7。
- 入口：[config.go](internal/config/config.go)、[netinfo.go](internal/netinfo/netinfo.go)、doctor 命令。
- 生产明确配置 HTTPS API 根地址；现有“本机 LAN IP 推断服务器”只保留开发用途，不能误连用户电脑。
- 支持企业 CA 信任和反向代理路径；禁止用关闭证书校验作为部署办法。
- 使用服务器签发的用户级 capture 上传凭据，只允许相应上传/自身任务查询；Windows 凭据存储保存秘密，配置文件只保存引用。
- doctor 检查浏览器、API可达、版本/能力和授权状态，输出脱敏诊断，不打印凭据。
- 验收：Linux TLS API、失效/撤销 token、错误 CA、错误地址、代理路径均有可操作说明。

## CC-04 GUI 和人工恢复

- [ ] P0 · 部分实现 · 依赖 CC-01/02/03、FE-02。
- 来源：Word §2.1；REQ-SIG-10/11；WBS 1.3.2。
- 入口：[ui/](internal/ui/)、[queue.go](internal/queue/queue.go)。
- 保持粘贴/拖放主操作面，显示每项的抓取、上传、解析、待复核、成功、失败，成功带信号打开入口。
- 多文件任务逐项反馈、取消、重试；一项失败不掩盖其他项。复制诊断默认去除敏感信息。
- 微信失败提示在平台保留原 URL 粘贴正文；明确这是补救而非已成功抓取。
- 验收：真实 API 下 GUI/CLI 同等可追溯，操作结果重启后可见；无虚假成功消息。

## CC-05 扩展协同

- [ ] P1 · 外部阻塞 · 依赖外部 reader-collection 源码、BE-01、OPS-03、DOC-02。
- 来源：2026-10-29 会议及后续统一入口约定；WBS 1.3.2。
- 当前仓库/相邻目录未发现 reader-collection；不能在本目录声称其已修改或已发布。
- 发布统一上传、任务、幂等、来源和权限契约供扩展接入；扩展须在用户终端访问公网。
- 核对扩展 token 保存、目标域/来源限制、单击采集到平台结果链；跨项目变更由该项目任务执行。
- 若扩展未交付，已有 Go 客户端保持完整可用路径；是否影响扩展专项验收由 DOC-02 记录，不能据此免除 URL 一键采集。
- 验收：扩展版本与端到端结果可核对；缺少外部产物时状态保持阻塞。

## CC-06 Windows 包与生产验收

- [ ] P0 · 未验证 · 依赖 CC-01…04、BE-16、OPS-03/04、DOC-02；独立 Windows 构建与浏览器证据供 OPS-06 汇总。
- 来源：WBS 1.3.2、1.5、1.6、1.7。
- 入口：[release.ps1](scripts/release.ps1)、[vendor-singlefile.sh](scripts/vendor-singlefile.sh)、[README](README.md)。
- 锁定工具链和 SingleFile 来源/版本；Windows runner 编译 GUI 和 CLI，go test -short ./...，并在 Windows Edge/Chrome 跑真浏览器集成。
- 输出版本化 zip、SHA256SUMS、配置示例、第三方许可证/源码获取说明；SingleFile AGPL 分发处理列入交付记录。
- 文档说明安装/升级/凭据配置、profile、采集失败和正文补救；升级不覆盖用户配置/profile/未完成队列。
- 10 篇网页≥9篇标题正文准确，5 篇微信逐一记录成功/失败；20 条业务样本与服务端信号 ID 对应。
- 验收：干净业务电脑安装可用、升级/回退不丢队列与配置、发布包 hash 可验证；不在 Linux/macOS 上假称 Windows GUI 测试通过。

## 旧计划对照

旧客户端 checklist 的实现作为基础保留：主引擎实际为 CDP + Edge/Chrome；离线 HTML/自动寻址/120 MiB/上传超时仍需按新契约回归。旧 B1–B6 属后端 BE-01/02/12/16，旧 B7 二十条链接验收归 CC-06 与 DOC-02/05。
