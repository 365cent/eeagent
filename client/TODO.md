# Capture Client 实施清单

更新：2026-11-27。生产服务端已选 Linux 内网；本目录仍是研究者 Windows 电脑上的 Go 采集程序。公网与登录浏览器留在用户终端。总顺序见 [项目清单](../TODO.md)，原文映射见 [需求追溯表](../docs/REQUIREMENTS-TRACEABILITY.md)。

## 现状和边界

已有 Edge/Chrome + 自写 CDP + SingleFile、GUI/CLI、URL/HTML/文档上传、网卡选择和本地持久队列。网页采集现优先提交至 `POST /api/v1/capture/jobs`，使用稳定 `submission_id` 并轮询服务端终态；旧服务端按 OpenAPI 回退到同步接口。文件队列已改走 `POST /api/v1/capture/jobs`（与网页采集相同的 submission_id / 恢复语义）；`POST /documents/raw` 仅作无 jobs 能力时的服务端回退。本次未运行 Windows 真浏览器测试，旧“完成”记录不等同新发布验收。

保持瘦客户端：上传 URL+自包含 HTML 或原始文件，不做 Markdown 转换、LLM 分类或业务推导，不分发 Chromium。Edge/Chrome 是实际实现，旧 WebView2/Rod 选择表不再指导开发。

## CC-01 浏览器采集与来源

- 2026-11-20 W3：队列采集 10 篇网页 + 5 篇微信标题正文准确；新增拒绝 JSON 错误体与服务错误页（<1200 字符）判定，两条真实用例；知乎拦截体、samr Error 页不再入库。

- [ ] P0 · 部分实现 · 可独立开展；验收依赖 DOC-02 真实材料。
- 来源：Word §2.1、图2-1-1/2-1-2、表A；REQ-SIG-01/02/07/11；WBS 1.3.2。
- 入口：[engine.go](internal/capture/engine.go)、[archive.go](internal/archive/archive.go)、[cdp/](internal/cdp/)。
- 2026-11-20 验证页/空壳判定收紧：页标题命中验证词且正文 <800 字符、或标题为空/等于 URL 且正文 <800 字符时拒绝采集（不再只依赖缺少 article 元素）；新增两个真浏览器用例，真实素材试采中 eefocus/知乎/UNECE 均按失败记录，不再生成“安全验证”类假证据。
- 2026-11-19 Windows 真机切片：Edge 157 需在启动参数加 `DisableLoadExtensionCommandLineSwitch` 才能加载未打包 SingleFile；修复后本地页面采集成功，服务端任务 `68b47471…` succeeded、信号 `c8d9a463…` retained，归档 387B/正文 122B 可读。验证码/微信/崩溃等场景仍未覆盖。
- 普通网页/微信公众号分别识别渠道，等待可读正文稳定；保留用户 URL、最终 URL 和采集时间。
- 识别验证码、登录墙、空正文和错误页；允许可见浏览器人工处理，超时给出具体原因，不能把验证壳上传成成功证据。
- 保存 HTML 先读 SingleFile 头注释（`Page saved with SingleFile` 的 `url:`），再取 canonical/og:url/twitter:url（含 SingleFile 改写后的无引号属性）；没有可靠来源则要求显式输入，不生成虚构公网地址。
- 单例浏览器、多标签任务的关闭/取消不能结束用户其他会话；保护 profile 登录态。
- 验收：静态/延迟渲染/微信验证/无正文/崩溃/取消/无来源 HTML 均有结果；原 URL 与正文一致。

## CC-02 统一 API 与任务恢复

- 2026-11-20 W3：单任务超时（`EEA_CAPTURE_JOB_TIMEOUT`，默认 3m）修复「一条挂起阻塞整队列」；超时记为失败不无限重排；`--drain-server` 现打印 `server drain: N ok, M failed`；客户端被杀后 `client-release` 归还任务、重启继续。

- [ ] P0 · 部分实现 · 依赖 BE-01/02、OPS-03。
- 来源：REQ-SIG-01/07/10/11、会议统一采集入口；WBS 1.3.2、1.6.1。
- 入口：[client.go](internal/platform/client.go)、[queue.go](internal/queue/queue.go)、[cli.go](internal/cli/cli.go)。
- 网页异步上传、幂等重试、本地持久队列和 Retry-After 切片已交付；具体实现与检查证据见[交付记录](../docs/DELIVERY-RECORD.md#cc-02--asynchronous-capture-and-durable-client-queue-slice)。CC-02 验收仍未完成。
- 2026-11-19 Windows 真机：`upload --url --headless` 经 `POST /capture/jobs` 完成一次真实采集；服务端终态 succeeded 后才显示成功。跨重启恢复、取消与失败重试仍待。
- 服务端幂等和原子对象写入见 BE-01；部署必须升级到当前 Alembic head（现为 0026_maintenance_run）。旧端点没有幂等键时不自动重试不确定结果。
- 文档文件队列已迁至统一任务（见[交付记录](../docs/DELIVERY-RECORD.md#be-01--fe-02--cc-02--durable-document-and-html-ingest-slice)）；在 Windows 验证已接入的安全重试和本地未开始任务取消；设计终态历史保留与清理；并在 Windows 真机验证客户端队列重启恢复。服务端 worker 已可轮询处理，但只有收到 succeeded 终态后才显示采集完成。
- 分开抓取超时、上传超时和服务器处理超时；上传完成后继续轮询，不能提前显示“入库成功”。
- 明确的 4xx 验证错误不进入自动重试；429/5xx 有限重试并优先采用 `Retry-After`（最多等待 10 分钟）。401/403身份提示仍待身份接入。
- 旧服务端兼容模式通过能力探测显式选择并提示，不因任意错误重复上传两条路径。
- 验收：桩服务验证 multipart/幂等标识；断网重开、worker失败、重试与取消不会重复创建信号。

## CC-03 Linux 服务连接与凭据

- [ ] P0 · 部分实现 · 依赖 OPS-03。
- 已交付凭据诊断与存储切片：后端 `GET /api/v1/capture/whoami` 用现有 Bearer/受信代理身份校验调用者；`capture doctor` 显示 `auth ok (subject, role)`，无效或撤销 token 返回 401 并给出明确提示。企业 CA 与 token env/file 配置已接入；`capture auth set` 将 token 存入 Windows Credential Manager，`config.json` 只保存 target 引用。
- 服务端已新增 `/api/v1/capture/tokens` 签发/列表/撤销，数据库只保存 SHA-256 摘要；capture 身份解析同时支持环境静态令牌和数据库签发令牌。
- 剩余：Linux TLS/反向代理路径实测，以及错误 CA/错误地址/代理路径的操作说明验收。
- 已验证：`tests/test_capture_tokens.py` 3 passed；Windows Credential Manager 写入/读取/删除通过；release 二进制 `auth status` 显示 `credential`；`go test -short ./...` 与 `go vet ./internal/...` 通过。
- 来源：实施计划 §10.1 #4、REQ-RULE-02；WBS 1.6/1.7。
- 入口：[config.go](internal/config/config.go)、[netinfo.go](internal/netinfo/netinfo.go)、[credential](internal/credential/credential_windows.go)、doctor/auth 命令。
- 生产明确配置 HTTPS API 根地址；现有“本机 LAN IP 推断服务器”只保留开发用途，不能误连用户电脑。
- 支持企业 CA 信任和反向代理路径；禁止用关闭证书校验作为部署办法。
- 使用服务器签发的用户级 capture 上传凭据，只允许相应上传/自身任务查询；Windows 凭据存储保存秘密，配置文件只保存引用。
- doctor 检查浏览器、API可达、版本/能力和授权状态，输出脱敏诊断，不打印凭据。
- 验收：Linux TLS API、失效/撤销 token、错误 CA、错误地址、代理路径均有可操作说明。

## CC-04 GUI 和人工恢复

- [ ] P0 · 部分实现 · 依赖 CC-01/02/03、FE-02。
- 来源：Word §2.1；REQ-SIG-10/11；WBS 1.3.2。
- 入口：[ui/](internal/ui/)、[queue.go](internal/queue/queue.go)。
- 已有逐项状态、打开信号、安全重试与本地排队取消。剩余工作为核对 Windows GUI 的状态与真实 API 终态，覆盖多个文件与重启恢复。
- 2026-11-19 Windows 真机：CLI 路径已打通 Edge + SingleFile + 任务轮询；GUI 状态、多个文件与重启恢复仍待真机走查。
- GUI 每 20 秒领取平台导入面排队的 `awaiting_client` 链接任务，在本机浏览器采集后回传；与本地队列互斥共用浏览器，关闭窗口或取消时释放未完成的领取任务。
- Windows 验证一项失败后其他项可继续处理，已被服务器接受的任务保持可追踪。补齐复制脱敏诊断的操作和验收。
- 2026-11-25 移除客户端「微信补录」：微信链接只走普通浏览器采集，验证失败按普通失败处理，不再提供手工粘贴正文入口。
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
- 2026-11-27 Edge 158 复测：`capture_archive=extension`（v0.1.1 已带 `DisableLoadExtensionCommandLineSwitch`）在 Edge `158.0.4370.33` 下 45s 内等不到 SingleFile 扩展 target，`capture.exe upload -url https://example.com` 报 “SingleFile extension did not load”；同页改 `embedded` 成功（5KB，服务端 signal `e8e114d3…`，已归档并删除）。修复：`auto` 模式在扩展加载失败时回退到内嵌 core（此前只在扩展暂存失败时回退），显式 `extension` 仍报错并提示改用 auto/embedded；`config.example.json` 默认改为 `auto`，README 同步。`go test ./internal/capture ./internal/application ./internal/config` → 3 ok；v0.1.1 二进制不含此修复，需 Windows 构建机重打包后用同一页面复测；本机 dist 配置暂设 `embedded` 以便继续使用旧二进制。
- 2026-11-27 验证：用同源代码编译的临时 CLI（`CGO_ENABLED=0`，不含 Fyne UI）在 Edge 158 上以 `capture_archive=auto` 实测：扩展加载失败后自动回退到 embedded，`upload -url https://example.com` 成功（5KB，signal `91684da6…`，已归档删除）。发布包仍需 Windows 构建机重打包后复测。
- 2026-11-27 Windows 构建与升级验证：`dist/capture.exe` 与 v0.1.1 包内 exe 哈希一致（4b8194…b2084ee），`SHA256SUMS` 两项均通过（散装 exe 原为旧构建，已换成发布包内容）；`capture.exe doctor` 显示 backend/capture/auth ok（`local-development-user`/`researcher`）、Edge 与 SingleFile 扩展就绪；升级模拟 v0.1.0→v0.1.1→v0.1.0 均保留 `config.json` 与 `data/capture-queue/pending.json`，版本输出 v0.1.1 / v0.1.0。打包客户端实测 `upload -html`：`ok 6e716479… 825B`，服务端返回标题、来源 URL、摘录、正文与快照对象键，随后归档并删除（DELETE 204→404）。剩余：干净业务机安装与 10 篇网页/5 篇微信真实材料验收仍待 DOC-02/OPS-06。
- 来源：WBS 1.3.2、1.5、1.6、1.7。
- 入口：[release.ps1](scripts/release.ps1)、[vendor-singlefile.sh](scripts/vendor-singlefile.sh)、[README](README.md)。
- 2026-11-19 构建切片：Windows `release.ps1 -Version v0.1.0` 产出 `capture.exe`、`capture-v0.1.0-windows-amd64.zip`、`SHA256SUMS`；zip 193 项，含 README/config/exe 与 SingleFile 扩展（manifest 4452 字节）。`capture doctor` 识别 Edge、后端、凭据与扩展；真浏览器本地页面采集已通过；10 篇网页/5 篇微信与干净业务机验收仍待；`gofmt` 已清理。
- 锁定工具链和 SingleFile 来源/版本；Windows runner 编译 GUI 和 CLI，go test -short ./...，并在 Windows Edge/Chrome 跑真浏览器集成。
- 输出版本化 zip、SHA256SUMS、配置示例、第三方许可证/源码获取说明；SingleFile AGPL 分发处理列入交付记录。
- 文档说明安装/升级/凭据配置、profile、采集失败和正文补救；升级不覆盖用户配置/profile/未完成队列。
- 10 篇网页≥9篇标题正文准确，5 篇微信逐一记录成功/失败；20 条业务样本与服务端信号 ID 对应。
- 验收：干净业务电脑安装可用、升级/回退不丢队列与配置、发布包 hash 可验证；不在 Linux/macOS 上假称 Windows GUI 测试通过。

## CC-07 客户端分层与 HTTP 复用

- [ ] P1 · 部分实现 · 依赖 CC-02 幂等与任务语义不变；与 [BE-17](../backend/TODO.md#be-17-领域分层与依赖边界) 横切/platform 思路对齐，不阻塞 CC-01…06 功能验收。
- 来源：WBS 1.2.3、1.3.2；REQ-SIG-01/10/11；统一采集 Retry-After 与不确定结果不重试契约。
- 入口：[httpx/client.go](internal/httpx/client.go)、[retry/retry.go](internal/retry/retry.go)、[platform/client.go](internal/platform/client.go)、[queue/queue.go](internal/queue/queue.go)、[config/config.go](internal/config/config.go)、[capture/](internal/capture/)、[importdrain/](internal/importdrain/)。
- 已交付：`internal/httpx` 出站 `http.Client` 工厂（网卡绑定、超时）；`internal/retry` 集中 Retry-After 解析与可重试状态码；`platform` 已部分接入上述包。
- 2026-11-11 本地结构切片：CLI 与两种 GUI 通过 `internal/application` 为每份配置复用平台 API、浏览器和公网下载客户端，每批使用独立队列；浏览器关闭等待在途采集，失败可重新启动。macOS Go 1.26.4 的可移植包检查和新增 session 测试通过；Windows 仅交叉编译 UI 包，真实 GUI/浏览器未验证。
- 将仍散落的 `http.Client` 构造统一到 `httpx`；`queue` 与 `platform` 共用 `retry` 策略，保持 CC-02 的 submission_id 幂等与 4xx/不确定 POST 不自动重试语义。
- `capture.Engine` 仅在 `capture` 包声明；`queue` 依赖 `Uploader` 接口而非 concrete `*platform.Client`；`EnsureSingleFileExtension` 迁出 `config`，消除 `config`→`capture` 反向依赖。
- 按职责拆分 `platform/client.go`、`ui/app.go`（dto/jobs/documents/probe、GUI 面板），OpenAPI 路径与行为不变。
- 验收：macOS `go test -short ./...` 通过；桩服务验证 429/5xx 退避与幂等边界；Windows GUI/CLI 端到端仍记在 CC-04/06，不在本机冒充通过。

## 旧计划对照

旧客户端 checklist 的实现作为基础保留：主引擎实际为 CDP + Edge/Chrome；离线 HTML/自动寻址/120 MiB/上传超时仍需按新契约回归。旧 B1–B6 属后端 BE-01/02/12/16，旧 B7 二十条链接验收归 CC-06 与 DOC-02/05。散落 HTTP 客户端与重复 retry 逻辑归 CC-07。
