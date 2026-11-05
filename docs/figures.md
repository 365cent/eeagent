# 报告图源：EEA 平台图集

本文件是报告用图的**唯一图源**。所有图以 mermaid 维护，用 `mmdc` 导出 PNG 贴进报告。**禁止在 PPT 里手绘第二版**——这是降低维护量的硬规则（WBS §9.1 R4）。

导出命令：

```bash
npx -y @mermaid-js/mermaid-cli -i docs/figures.md -o docs/images/mermaid/ -w 1600
```

---

## 图1 功能框图

用途：讲清楚「有哪些工作面、每个工作面靠哪个服务、数据落在哪」。

```mermaid
flowchart TB
  subgraph UI["前端工作面"]
    P0["工作台总览"]
    P1["信号采集·证据库"]
    P2["标签与主题归总"]
    P3["技术全景图"]
    P4["链路追溯验收"]
    P5["战略四步漏斗"]
    P6["推导流水线·方法论映射"]
    PA["EEA Agent 助手"]
  end

  subgraph API["应用层 FastAPI"]
    A1["采集与存证"]
    A2["标签与纠偏"]
    A3["主题归集与指标"]
    A4["需求点与映射"]
    A5["落脚点与标准"]
    A6["战略研判与版本"]
    A7["追溯链读取"]
    A8["总览计数"]
    A9["Agent 会话与变更单"]
  end

  subgraph SVC["支撑服务"]
    S1["eea-doc-ingest"]
    S2["eea-agent"]
    S3["分词与频次"]
    S4["检索"]
  end

  subgraph DATA["数据与存储"]
    D1[("PostgreSQL")]
    D2[("对象存储")]
    D3[("向量索引")]
  end

  P0 --> A8
  P1 --> A1
  P2 --> A2
  P2 --> A3
  P3 --> A4
  P3 --> A5
  P4 --> A7
  P5 --> A6
  PA --> A9
  A1 --> S1
  A3 --> S3
  A9 --> S2
  A7 --> S4
  A1 --> D1
  A1 --> D2
  S1 --> D2
  S4 --> D3
  A5 --> D1
  A6 --> D1
```

---

## 图2 系统架构图

用途：讲清楚企网边界、四个镜像、依赖关系。

```mermaid
flowchart LR
  subgraph USER["研究者侧（企网内）"]
    B["浏览器<br/>React 工作台"]
    C["本地采集工具<br/>网页适配器 + 微信适配器"]
  end

  subgraph DMZ["平台集群"]
    NG["入口 Nginx<br/>TLS · 限流"]
    FE["eea-web"]
    BE["eea-api<br/>FastAPI"]
    ING["eea-doc-ingest<br/>MarkItDown + Vision"]
    AG["eea-agent<br/>Pydantic AI"]
    WG["采集网关<br/>/api/v1/signals"]
  end

  subgraph INFRA["基础设施"]
    PG[("PostgreSQL 16")]
    OBJ[("对象存储")]
    VEC[("pgvector")]
    LOG["日志与指标"]
  end

  subgraph EXT["外部（经内网网关）"]
    LLM["对话 LLM 网关"]
    VIS["Vision 网关"]
  end

  B --> NG
  C --> NG
  NG --> FE
  NG --> BE
  NG --> WG
  WG --> BE
  BE --> PG
  BE --> OBJ
  BE --> VEC
  BE --> ING
  BE --> AG
  ING --> OBJ
  ING --> VIS
  AG --> LLM
  AG --> PG
  AG --> VEC
  BE --> LOG
```

---

## 图3 链路主流程图（七环节）

用途：报告开篇一张图说明业务主线。

```mermaid
flowchart LR
  S["环节一<br/>原始信号<br/>+证据快照"]
  T["环节二<br/>标签化<br/>价值链·类型·技术方向"]
  D["环节三<br/>需求点<br/>交叉验证·时间序列"]
  F["环节四<br/>车辆功能<br/>正向五步·反向验证"]
  L["环节五<br/>技术落脚点<br/>五域拆解"]
  ST["环节六<br/>部署标准<br/>三阶段×三约束"]
  SA["环节七<br/>战略研判<br/>四步漏斗"]

  S --> T --> D --> F --> L --> ST --> SA
  SA -.->|改判追加版本| SA
  D -.->|低频强信号保留| D
```

---

## 图4 信号采集与存证流程

```mermaid
flowchart TD
  A["粘贴 URL"] --> B{"渠道识别"}
  B -->|"微信"| C1["微信适配器"]
  B -->|"其他"| C2["网页适配器"]
  C1 --> D{"抓到正文?"}
  C2 --> D
  D -->|"是"| E["生成快照"]
  D -->|"否"| F["状态=抓取失败"]
  F --> G["Web 粘贴正文<br/>保留原 URL"]
  G --> E
  E --> H{"幂等命中?"}
  H -->|"是"| I["返回既有记录"]
  H -->|"否"| J["写 signal + 对象存储<br/>状态=已留存"]
  J --> K["触发预标"]
  K --> L{"置信度达标?"}
  L -->|"是"| M["等待复核"]
  L -->|"否"| N["状态=待人工复核"]
  M --> O["复核确认 → 审计"]
  N --> O
```

---

## 图5 纠偏与留痕时序

```mermaid
sequenceDiagram
  participant U as 研究者
  participant W as eea-web
  participant A as eea-api
  participant DB as PostgreSQL

  U->>W: 下拉选择环节 / 类型
  W->>A: PATCH /signals/{id}/labels
  A->>DB: 读当前值 machine_value
  A->>DB: BEGIN
  A->>DB: UPDATE signal
  A->>DB: INSERT correction_audit
  A->>DB: COMMIT
  A-->>W: 200 + 最新记录
  W-->>U: 行内即时更新
```

---

## 图6 主题归集与指标流程

```mermaid
flowchart LR
  S["信号（已留存）"] --> R{"归集方式"}
  R -->|"自动建议"| C["聚类建议<br/>技术对象·底层能力·变化方向"]
  R -->|"人工"| M["手动选择主题"]
  C --> H{"人工确认?"}
  H -->|"否"| X["仅候选，不写库"]
  H -->|"是"| M
  M --> T["写 tech_theme_id<br/>至多一个"]
  T --> V["视图重算<br/>信号频次 / 来源数"]
  V --> P["主题表"]
  P --> L{"低频强信号?"}
  L -->|"是"| K["标记 strong_signal"]
  L -->|"否"| P
```

---

## 图7 Agent 建议到写库

```mermaid
sequenceDiagram
  participant U as 研究者
  participant AG as EEA Agent
  participant A as eea-api
  participant DB as PostgreSQL

  U->>AG: 请求初标
  AG->>A: search_evidence / search_rag
  A-->>AG: 结果 + citations
  AG->>A: suggest_signal_tags
  A-->>AG: 建议（不写库）
  AG-->>U: 建议 + 引用
  U->>AG: 确认应用
  AG->>A: propose_db_patch
  A-->>U: 待确认卡片（字段 diff）
  U->>A: POST /patches/{id}/apply
  A->>DB: BEGIN
  A->>DB: 应用字段变更
  A->>DB: 写 correction_audit
  A->>DB: COMMIT
  A-->>U: 已应用 + 版本号
```

---

## 图8 证据状态机

```mermaid
stateDiagram-v2
  [*] --> 抓取中
  抓取中 --> 已留存: 快照写入成功
  抓取中 --> 抓取失败: 适配器异常
  抓取失败 --> 已留存: 粘贴正文补救
  已留存 --> 待人工复核: 预标低置信 / 图块需复核
  待人工复核 --> 已留存: 复核确认
  已留存 --> 已归档停用: 不再参与推导
  待人工复核 --> 已归档停用
  已归档停用 --> [*]
```

---

## 图9 数据模型（ER）

```mermaid
erDiagram
  REF_CODE ||--o{ SIGNAL : enumerates
  REF_CODE ||--o{ DEMAND_POINT : attributes
  VOCAB ||--o{ SIGNAL_TAG : tag
  VOCAB ||--o{ LANDING_POINT : domain
  TECH_THEME ||--o{ SIGNAL : aggregates
  TECH_THEME ||--o| DEMAND_POINT : sources
  SIGNAL ||--o{ SIGNAL_TAG : tagged
  DEMAND_POINT ||--o{ VEHICLE_FUNCTION : drives
  VEHICLE_FUNCTION ||--o{ LANDING_POINT : decomposes
  LANDING_POINT ||--o{ DEPLOYMENT_STANDARD : standards
  LANDING_POINT ||--o{ STRATEGIC_ASSESSMENT : versions
  SIGNAL ||--o{ CORRECTION_AUDIT : corrected
  DOCUMENT_ARTIFACT ||--o{ SIGNAL : enriches
```

---

## 图10 词表驱动 UI

```mermaid
flowchart LR
  DB[("eea_ref_code<br/>eea_vocab")] --> API["GET /refcodes<br/>GET /vocab"]
  API --> FE["前端缓存<br/>+ etag"]
  FE --> UI["下拉 / 芯片 / 筛选条<br/>文案全来自接口"]
  UI --> EDIT["新增标签 / 域名"]
  EDIT --> DB
```

---

## 图11 排期甘特

```mermaid
gantt
    title EEA 平台六周排期
    dateFormat YYYY-MM-DD
    axisFormat %m/%d

    section W1 底座
    选型与Schema与图     :w1a, 2026-10-19, 7d
    M0 基线              :milestone, m0, 2026-10-25

    section W2 采集
    壳层与通用组件       :w2a, 2026-10-26, 4d
    采集与存证与摄取     :w2b, 2026-10-26, 7d
    M1 壳层与采集        :milestone, m1, 2026-11-01

    section W3 智能管线
    词表驱动与初判       :w3a, 2026-11-02, 5d
    归集与指标           :w3b, 2026-11-04, 5d
    Agent 框架与工具面   :w3c, 2026-11-03, 7d
    M2 智能管线          :milestone, m2, 2026-11-08

    section W4 闭环
    需求点与映射         :w4a, 2026-11-09, 7d
    落脚点与标准         :w4b, 2026-11-11, 7d
    Agent 写库与报告     :w4c, 2026-11-10, 6d
    M3 个性化闭环        :milestone, m3, 2026-11-15

    section W5 稳定
    复盘与缺陷修复       :w5a, 2026-11-16, 7d
    harness 全链路       :w5b, 2026-11-18, 4d
    漏斗与追溯收口       :w5c, 2026-11-17, 6d
    M4 稳定化            :milestone, m4, 2026-11-22

    section W6 交付
    性能与Demo           :w6a, 2026-11-23, 7d
    交接与运营规则       :w6b, 2026-11-25, 5d
    M5 交付展示          :milestone, m5, 2026-11-29
```
