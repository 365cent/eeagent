# EEA 项目文档

本目录为规划与调研材料的**唯一存放位置**（勿在仓库根目录再放同名 Markdown 副本）。

## 核心文档

| 文件 | 说明 |
| --- | --- |
| [platform-implementation-plan.md](./platform-implementation-plan.md) | 平台实施计划、需求条文、Agent 排期与 eFuse harness 验收 |
| [enterprise-ui-study.md](./enterprise-ui-study.md) | 闭源前瞻平台 UI/交互对照研究 |
| [figures.md](./figures.md) | 报告用 Mermaid 图源（维护图请改此文件，勿在 PPT 手绘第二版） |

## 子目录

| 路径 | 说明 |
| --- | --- |
| [meetings/](./meetings/) | 飞书会议纪要导出（含原文链接与截图） |
| [wbs/](./wbs/) | WBS 文档（`EEA-WBS-001`）与 Excel 工作清单、六周计划表 |
| [reference/](./reference/) | 外部来源原文（案例 Word 等） |
| [images/](./images/) | harness 截图（`fig-2-*`）、企业 UI 调研图；`mermaid/` 由 figures 导出（可选） |
| [research/](./research/) | 专项调研结论（正文 Markdown；原始探测素材不入库） |

合订 PDF（只读快照）：[`EEA-Platform-Plan-and-UI-Study.pdf`](./EEA-Platform-Plan-and-UI-Study.pdf)（由 `platform-implementation-plan.md` 与 `enterprise-ui-study.md` 导出；改需求以 Markdown 为准）。

## 导出 Mermaid 图

```bash
npx -y @mermaid-js/mermaid-cli -i docs/figures.md -o docs/images/mermaid/ -w 1600
```
