# deckpeek — 交付源码包（src）

把 `.pptx` 变成一个**可以在浏览器里翻页、点选、复制元素描述**的查看器：每个 PowerPoint 形状都是
真实、可定位的 DOM 元素；再用 `--serve` 起一个本机「选择页」，把 pptx 拖进去就导入。

> **TL;DR** — A single-file Windows tool that turns a `.pptx` into a clickable HTML viewer:
> every shape becomes a real DOM element you can inspect, box-select and copy as a one-line
> descriptor. `--serve` adds a local, drag-and-drop deck library with live re-render.
>
> 本目录是**可直接交付的完整源码**：`deckpeek.py` 单文件即全部逻辑（HTML/CSS/JS 模板内联在代码里），
> 打包不需要任何 `--add-data`。构建与自检见下文「构建」与「交付前自检」。

---

## 1. 环境要求

- **Windows**（底图导出走本机 PowerPoint COM，系统托盘走 Win32）。没有 PowerPoint 时仍可用
  「结构」模式，或用 `--no-render` 复用已有底图；但**正式验收需要本机装有 PowerPoint**。
- **Python 3.9+**（本包在 3.12.0 + python-pptx 1.0.2 + PyInstaller 6.22.3 上验证通过）。

```
pip install -r requirements-dev.txt     # 含运行依赖 + PyInstaller
```

只要运行、不打包时：

```
pip install -r requirements.txt
```

## 2. 快速开始

```
python deckpeek.py deck.pptx -o out      # 生成 out/index.html（+ _render/ + media/）
python deckpeek.py --serve               # 起本机选择页：拖拽导入 + deck 列表（默认 8931 端口）
```

- 直接双击/打开 `out/index.html` 即可（`file://`，不需要服务器、不联网）。
- 用选择页时，把 `.pptx` 拖到页面上即可导入，进度走完后自动跳进查看器。

## 3. 命令行参数

| 参数 | 说明 |
|---|---|
| `pptx` | 源 deck（可选；默认取程序同目录下唯一的 `.pptx`） |
| `-o, --out` | 输出目录（默认 `preview/`） |
| `--render-dir DIR` | 底图 PNG 目录（默认 `<out>/_render/`） |
| `--no-render` | 不调用 PowerPoint，只用 `--render-dir` 里已有的底图 |
| `--force-render` | 即使 PNG 已存在也重新导出 |
| `--size WxH` | 底图像素尺寸（默认 `1600x900`） |
| `--serve` | 起本机选择页（拖拽导入 + deck 列表）；给了 deck 就先构建再起 |
| `--port N` | 选择页端口（默认 `8931`） |
| `--decks-dir DIR` | 选择页里导入的 deck 存放目录（默认 `<程序目录>/decks`） |
| `--tray` | 常驻系统托盘：不起控制台窗口，启动即打开面板 |
| `--no-open` | 托盘启动时不自动打开面板页面 |
| `--watch` | 构建后盯着源 `.pptx`，一变就重新渲染（不带 `--serve` 时是单 deck 观看模式） |
| `--watch-interval S` | 扫描源文件变化的间隔秒数（默认 `10`） |
| `--no-watch` | `--serve`/托盘时不启用自动重渲染 |
| `--open` | 生成后用 `file://` 打开浏览器 |

## 4. 构建（打包 exe）

```
build_exe.cmd            # 正式版：GUI 子系统，双击即常驻托盘、无控制台窗口
build_exe.cmd console    # 调试版：带控制台，能看到 print / 报错
```

- 产物：`dist\deckpeek.exe`（正式版）／`dist\deckpeek-console.exe`（调试版），单文件约 32 MB。
- 脚本会打印 `size` 与 `sha256`，便于交付登记。
- 想用 spec 复现：`python -m PyInstaller --noconfirm --clean deckpeek.spec`（等价于正式版；
  `console=False`）。
- 构建产物目录 `build\`、`dist\` 已在 `.gitignore` 中，**不要**随源码一起交付。

正式版 exe 的行为：

- **双击即常驻系统托盘**（不弹控制台），启动即打开面板页面；
- 右键托盘只有两项：**打开 deckpeek 面板** / **退出**；端口被占会自动往后找可用端口；
- 没有控制台，启动信息（服务地址、deck 目录、自动刷新状态）写在 **exe 同目录的 `deckpeek.log`**；
- 想看命令行进度就用 `console` 版，或直接跑 `python deckpeek.py …`。

## 5. 交付前自检

```
python verify.py            # 源码 + dist\deckpeek.exe，一次跑完
```

它依次检查四件事，任何一项失败都返回非 0：

| # | 检查 | 说明 |
|---|---|---|
| 1 | 环境 | Python ≥ 3.9、`python-pptx` 可导入、`pywin32` 是否在位（缺失只告警） |
| 2 | 源码跑通 | 现场生成一份 3 页样例 deck（文字 / 表格 / 嵌套形状），跑 `deckpeek.py`，校验 HTML：页数、`data-*` 标记、大小 |
| 3 | 产物跑通 | 用 `dist\deckpeek.exe` 在**干净的临时目录**里、从**含空格与中文的路径**跑同一份 deck，校验同样的 HTML 事实 |
| 4 | PE 头 | exe 必须是 GUI 子系统（`Subsystem=2`），否则双击会闪控制台窗口 |

补充说明：

- 检查 2/3 默认**真的调用本机 PowerPoint 导出底图**，并校验底图是 `1600x900`；若本机没有
  PowerPoint / COM 被拦，会自动退化为占位底图（`--no-render`），页面结构仍被严格校验。
- `python verify.py --no-render` 直接跳过 PowerPoint；`--source-only` / `--exe-only` 只跑一半；
  `--deck 你的.pptx` 用真实 deck 代替内置样例。
- 想一条命令走完「源码自检 → 打包 → 产物自检」：`verify_build.cmd`（追加 `console` 打调试版）。

**发布判定**：`verify_build.cmd` 打印「全部通过」且退出码 0，才算可交付。

## 6. 目录清单

```
src\
  deckpeek.py           工具本体（CLI + 查看器生成 + 选择页/导入 + 观看线程），唯一实现文件
  make_icon.py          图标生成器（一份几何 → deckpeek.svg + deckpeek.ico）
  deckpeek.svg          图标源（手写：圆球角色 + 教棒 + 演示板）
  deckpeek.ico          图标成品（7 种尺寸、圆角透明），打包时用
  build_exe.cmd         单文件打包（正式版 / console 调试版）
  deckpeek.spec         PyInstaller 可复现构建配方（等价于正式版）
  requirements.txt      运行依赖（python-pptx、pywin32）
  requirements-dev.txt  构建依赖（+ PyInstaller、Pillow）
  verify.py             交付自检：源码 + 产物 + PE 头
  verify_build.cmd      一站式：源码自检 → 打包 → 产物自检
  .gitignore            忽略 build/ dist/ __pycache__/ 等生成物
  SHA256SUMS.txt        交付清单校验和（sha256sum -c 可校验）
  README.md             本文件
```

运行期生成物（不随源码交付）：`preview/`（默认输出目录）、`decks/`（选择页导入的 deck）、
`deckpeek.log`（托盘/服务日志）、`build/`、`dist/`。

## 7. 使用说明

### 选择页

拖拽区把 `.pptx` 拖进去（或「从本机选择文件…」）→ 上传 → 本机 PowerPoint 导出底图（有进度）→
生成页面并自动进入。deck 卡片显示首页缩略图、页数与更新时间；顶栏右侧可切浅色/深色。

### 查看器交互

- **切换视图**：顶栏「底图 / 结构」分段控件，或按 `1` / `2`；悬停形状会出现一个**会滑动的方框**
  并弹出提示气泡（名称、类型、z 序、shape id、几何）。
- **选择**：单击 = 单选；`Ctrl/⌘` 点击 = 加入/移出；`Shift` 点击 = 按 z 序连选（锚点＝上次点击）；
  在画布上**按住右键拖动** = 框选（拖框时按 `Ctrl/⌘` 追加）；`Ctrl/⌘ + A` = 全选本页；`Esc` 取消。
- **复制**：右侧「元素描述」里每个选中元素一行、行首编号与画面徽标一致（`#1 …`），点「复制描述」
  即复制全部行（右下角有 toast 反馈）。
- **属性**：右侧「属性」卡片列出该形状的几何、填充、描边、字体/字号/字重/颜色、段落与文本。
- **导航**：`←/→`、`PageUp/PageDown` 翻页，`Home/End` 首末页，顶栏页码框可直输，底部胶片条点击
  切页（当前页高亮并自动滚入视野）；地址栏 `#s43` 可分享定位。
- **其它**：`T` 切浅色/深色，`F` 专注模式（隐藏两侧、画面铺满），左上「←」返回选择页。

### 自动重渲染

每次构建都会在输出目录写一份 `deck.json`（源文件路径、构建时间戳、源文件 size/mtime、渲染中标志，
以及每页底图的版本号 `slide_versions`）。`--serve`/托盘模式下的观看线程**每 10 秒** stat 一次源文件；
一旦发现变化就等它写稳 1.5 秒，然后整份重渲染。页面每 2 秒对一次 `deck.json`，构建时间戳一变就
在保持当前页（`#sNN`）的前提下刷新，渲染期间在顶部显示「源文件已更新，正在重新渲染…」。

底图 URL 带 `?v=<该页版本>`，静态响应统一带 `Cache-Control: no-store`，所以重渲染后的 `sNN.png`
不会被浏览器旧缓存顶掉。顶栏的「刷新本页」按钮（快捷键 `R`）只重新拉取当前页的底图和缩略图，
用于单页缓存出错时手动兜底。

### 描述符格式与 data-*

```
SLIDE 43 | z=4 | name="Table 7" | id=132 | TABLE | L=1.20in T=2.05in W=11.30in H=2.40in | rot=0 | fill=- | line=- | text="统计口径与样本分层"
```

`-` 表示该项不存在；`text` 截断到约 80 字符；`L/T/W/H` 为英寸（与源 deck 的 EMU 值对应）；
`z` 是形状在 `slide.shapes` 里的下标（0 = 最底层）。每个形状元素同时把这些事实写成
`data-*` 属性（`data-slide`、`data-z`、`data-name`、`data-shape-id`、`data-type`、
`data-l/t/w/h`、`data-text`、`data-desc`），用 DevTools「检查元素」即可见。

## 8. 已知近似

- 字色/填充若为未解析的渐变文字填充，按规范回退为黑色（面板显示 `inherit`）。
- 形状外框统一按矩形重建，仅 `roundRect` / `ellipse` / `round2DiagRect` 做圆角近似。
- 项目符号、段落级缩进、阴影/渐变效果不还原；结构模式用于查结构，视觉基准以底图模式为准。
- 底图必须由本机 PowerPoint 导出；`box-select` 与徽标位置按未旋转的外框计算。

## 9. 许可

本包**未附许可证文件**，默认保留所有权利。若要对外分发，请先确定许可证（例如 MIT）并补一份
`LICENSE`，再随源码一起交付。
