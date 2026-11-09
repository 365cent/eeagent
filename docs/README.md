# EEA 项目文档

本目录集中存放需求来源、项目研究、方法论解释、验收追溯和文档执行清单。项目与子系统的剩余实施计划分别放在仓库根目录及各代码/部署目录，避免把执行状态与来源原文混在一起。

## 项目入口

| 文件 | 说明 |
| --- | --- |
| [PROJECT-INDEX.md](./PROJECT-INDEX.md) | 代码、来源和各执行清单的当前导航；包含业务链与验收口径。 |
| [TODO.md](./TODO.md) | DOC-01…DOC-08：业务输入、需求基线、验收证据、操作手册和发布交接。 |
| [INPUT-REGISTER.md](./INPUT-REGISTER.md) | 已收到与待提供的业务和环境输入、来源责任、版本许可及受影响验收项。 |
| [REQUIREMENTS-TRACEABILITY.md](./REQUIREMENTS-TRACEABILITY.md) | 75 条 REQ 对应的来源、WBS、实施任务与待验收 AT 编号。 |
| [ACCEPTANCE-EXECUTION-RECORD-TEMPLATE.md](./ACCEPTANCE-EXECUTION-RECORD-TEMPLATE.md) | 每个 AT/目标环境执行记录的空白模板；初始状态为未运行，区分 Mac、Windows、Linux 与真实业务验收。 |
| [DEVELOPMENT-MAC.md](./DEVELOPMENT-MAC.md) | macOS 开发环境、锁文件安装与 Backend/Frontend/Go 组件检查命令。 |
| [platform-implementation-plan.md](./platform-implementation-plan.md) | 业务需求、推导规则、数据/页面方案和 Agent 提案。 |
| [enterprise-ui-study.md](./enterprise-ui-study.md) | 闭源前瞻平台 UI/交互对照研究。 |
| [figures.md](./figures.md) | 报告用 Mermaid 图源；维护图请改此文件。 |

全项目生产顺序及发布门槛见[根 TODO](../TODO.md)。Backend、Frontend、Capture Client 和 Linux 部署清单分别见 [backend/TODO.md](../backend/TODO.md)、[frontend/TODO.md](../frontend/TODO.md)、[client/TODO.md](../client/TODO.md)、[deploy/TODO.md](../deploy/TODO.md)。

## 来源与材料

| 路径 | 说明 |
| --- | --- |
| [meetings/](./meetings/) | 会议纪要导出及相关图片。 |
| [wbs/](./wbs/) | WBS 正文、Excel 工作清单和历史计划。 |
| [reference/](./reference/) | 外部原始来源文件（Word/PDF 等），作为原件保存。 |
| [images/](./images/) | 案例图、研究图片和从 `figures.md` 导出的图。 |
| [research/](./research/) | 专项调研结论。 |

合订 PDF 是只读快照：[EEA-Platform-Plan-and-UI-Study.pdf](./EEA-Platform-Plan-and-UI-Study.pdf)。修改需求以来源原件与 Markdown 正文为准。

## 导出 Mermaid 图

```bash
npx -y @mermaid-js/mermaid-cli -i docs/figures.md -o docs/images/mermaid/ -w 1600
```
