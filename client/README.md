# Capture Client

EEA 前瞻技术扫描平台的**采集客户端**：在本机可见浏览器里打开网页，用 SingleFile 生成一份自包含 HTML，连同 URL 一起上传到平台；文档则原样上传，解析全部在服务端完成。

瘦客户端原则见 [`../docs/platform-implementation-plan.md`](../docs/platform-implementation-plan.md) §7 与 [`TODO.md`](TODO.md)：客户端**不做** HTML→Markdown、不做文档解析、不打包 Chromium、不调用 LLM。

---

## 构建

需要 **Go ≥ 1.24**（`windigo@v0.2.6` 用到 `unicode/utf16.RuneLen`，Go 1.22 编译失败）。企网没有 Go module proxy，依赖已在本机模块缓存；如需新装工具链，可下载便携版并直接用其 `go.exe`（不必写系统 PATH）：

```bash
curl -sSL --ssl-no-revoke -o go.zip https://mirrors.aliyun.com/golang/go1.24.13.windows-amd64.zip
unzip -q go.zip -d .toolchain && rm go.zip
```

开发构建：

```bash
go build -trimpath -ldflags "-s -w -H=windowsgui" -o dist/capture.exe ./cmd/capture
```

发布（二进制 + zip + SHA256SUMS，`dist/` 已 gitignore）：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/release.ps1 -Version v0.1.0
# dist/capture.exe
# dist/capture-v0.1.0-windows-amd64.zip
# dist/SHA256SUMS
```

运行时依赖：本机 Edge 或 Chrome（默认用 Edge），Windows 10/11。

---

## 目录结构

```text
cmd/capture/         入口：无参数 = GUI；upload / doctor / version
internal/cdp/        DevTools WebSocket（stdlib，无第三方依赖）
internal/capture/    启动 Edge/Chrome、注入 SingleFile、取回归档
internal/singlefile/ 内嵌的 SingleFile core（AGPL，见 scripts/vendor-singlefile.sh）
internal/archive/    离线 HTML 的原链接推断
internal/platform/   multipart 上传（capture / documents），绑定内网网卡
internal/queue/      并发、重试、抓取/上传超时
internal/netinfo/    物理网卡选择（跳过 VMnet/Hyper-V）
internal/config/     配置加载与 auto_api 解析
internal/cli/        CLI 子命令
internal/ui/         windigo 小窗（仅 Windows）
scripts/             SingleFile 重新打包、发布脚本
dist/                发布产物（gitignored）
```

---

## 配置

复制 `config.example.json` 为 `config.json`（`config.json` 不入库）：

| 字段 | 说明 |
| --- | --- |
| `api_base` | 平台地址；留空 + `auto_api=true` 时自动取物理网卡 IPv4（如 `http://10.215.8.74:8000`），忽略 VMnet/Hyper-V；`auto_api` 缺省为 true |
| `capture_engine` | `edge` 或 `chrome` |
| `browser_path` | 留空自动探测常见安装路径 |
| `user_data_dir` | 浏览器 profile（公众号登录态保存在这里） |
| `max_parallel` | 并发抓取数 |
| `max_upload_mb` | 单个归档/文件上限（默认 **120 MiB**，与 backend `DOC_RAW_UPLOAD_MAX_BYTES` 一致） |
| `timeout_sec` | 网页抓取超时 |
| `upload_timeout_sec` | 文档/归档上传超时，默认 900 |
| `page_ready_timeout_sec` | 普通页面等待可读正文稳定的上限，默认 25 |
| `interactive_timeout_sec` | 微信/Cloudflare 验证页等待人工完成的上限，默认 180 |
| `min_text_chars` | 判定“有正文”的最少字符数，默认 10；不足则拒绝归档 |
| `headless` | `true` 则无窗口，登录场景应保持 `false` |

环境变量覆盖：`EEA_API_BASE`、`EEA_CLIENT_CONFIG`（指定别的配置文件）。

`doctor` 会打印解析后的地址与网卡 IP：

```text
api_base      http://10.215.8.74:8000
auto_api      true (lan 10.215.8.74)
```

上传出站连接会绑定该网卡（VMnet8 等虚拟网卡被跳过）；文档上传超时独立为 `upload_timeout_sec`（默认 900 秒），上限 `max_upload_mb=120`。

---

## 使用

```bash
capture.exe                       # 图形界面（默认）
capture.exe doctor                # 检查浏览器 / profile / 后端连通性
capture.exe upload --url https://… --headless
capture.exe upload --html saved.html                 # 已保存的 SingleFile HTML
capture.exe upload --html saved.html --html-url https://…   # 显式指定原链接
capture.exe upload --file 报告.pdf
capture.exe version
```

图形界面只有一块「粘贴 / 拖放」面：把链接粘进去后点右下角 **上传**（或 `Ctrl+Enter`）；把 PDF、Word 等文件直接拖进窗口即上传文档，把已保存的 `.html`（SingleFile）拖进去则按网页归档上传。底部一行显示进度与结果（如 `完成 2 · sig-…`、失败原因）。

右上 **设置** 打开高级面板，可改接口地址（含端口）、抓取引擎（Edge / Chrome）、并发、上传上限、超时、无窗口模式；保存后写回 `config.json`。profile 目录只读显示，不建议在界面里改。

**公众号登录**：`headless=false` 时会打开一个独立的 Edge 窗口，用 `user_data_dir` 保存登录态；首次在该窗口里扫码登录，后续抓取自动复用。客户端不接触账号密码。

**等待策略**：`load` 事件之后还会等待正文稳定（连续两次采样文本长度不变且 ≥ `min_text_chars`），因此延迟渲染的文章不会被截成空壳。若落在微信 `wappoc_appmsgcaptcha` 等验证页，可见窗口会最多等 `interactive_timeout_sec` 让人工完成验证后再归档；`headless=true` 时无法人工验证，会在 `page_ready_timeout_sec` 后报错，不再上传空壳证据。

---

## 工作原理

```text
Edge/Chrome (--remote-debugging-port=0, 独立 profile)
   │  CDP over websocket（stdlib 手写，无第三方依赖）
   ├─ Page.navigate → 等 load / readyState=complete
   ├─ Runtime.evaluate 注入 SingleFile core（go:embed，1 MB）
   └─ SingleFile.getPageData({loadDeferredContent:true}) → 自包含 HTML
          │
          └─ POST /api/v1/signals/capture  multipart: url / channel_code / archive_html
```

- 单例浏览器进程，多标签并发抓取；抓完即关标签。
- profile 下的 `DevToolsActivePort` 若指向死端口，会先探测再清理；若同 profile 已有存活浏览器则直接复用。
- `channel_code` 只对明确域名做推断（`mp.weixin.qq.com` → `wechat_mp`），其余交给服务端按 URL 归一，避免客户端猜词表。
- 文档走 `POST /api/v1/documents/raw`，multipart `file`，只传原文件。
- 已保存的网页走同一条 capture 契约，不需要开浏览器：原链接从 `<link rel="canonical">` / `og:url` / `twitter:url` 读取，可用 `--html-url` 覆盖；都没有则拒绝上传，不会伪造来源。

---

## 验证

```bash
go test ./...
```

- `internal/capture`：真 Edge + 本地页面，断言标题、正文、图片/CSS 背景被内联、外链被消除。
- `internal/queue`：抓取→上传全链路（httptest 桩服务端校验 multipart 字段）、已保存 HTML、文档上传、5xx 重试。
- `internal/archive`：canonical / og:url 推断（属性顺序、引号、BOM、相对链接）。
- `internal/platform`：multipart 形状、超限拒绝、错误可重试判定、渠道推断。

`go test -short ./...` 会跳过启动真实浏览器的用例。

---

## 已知限制

- 后端 `POST /api/v1/signals/capture`、`GET /signals/{id}/archive`、`POST /documents/raw` 已在 [`../backend/`](../backend/) 实现；`capture doctor` 与 `upload` 可对接 `http://127.0.0.1:8000`（API 根，勿加 `/api/v1`）。
- 归档体积受 `max_upload_mb` 限制（默认 120 MiB）；图片极多的页面可能仍超限，可在 `config.json` 再调高。
- SingleFile core 为 **AGPL-3.0-or-later**，内部分发前需法务确认；版本与构建命令固定在 [`scripts/vendor-singlefile.sh`](scripts/vendor-singlefile.sh)。
- 动态登录墙、验证码仍需人工在那个可见浏览器窗口里处理。
- 界面只保留「粘贴 / 拖放」一个操作面，没有选择文件按钮；文档走拖入或 `capture upload --file`。
- `.html` 没有 canonical/og:url 时，GUI 会跳过并提示，CLI 需要用 `--html-url`；`.mhtml` 仍按文档上传。
- 仅 Windows；windigo 为 Win32 纯 syscall，无 CGO。
