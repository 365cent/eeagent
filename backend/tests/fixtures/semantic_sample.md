# EEA 语义测试样例（可手动上传）

EEA 前瞻技术扫描平台用于低压系统智能化、eFuse 与区域控制器等方向的前瞻采集。
文档入库后经 MarkItDown 转为规范 Markdown，再参与标签建议与技术主题归集。
关键词提取以正文召回候选，语义精排用于提高技术方向标签的相关性。

## 使用方式

在开发 UI「信号采集·证据库 → 前往入库」拖入本文件，或：

```bash
curl -F "file=@backend/tests/fixtures/semantic_sample.md" \
  http://127.0.0.1:8000/api/v1/documents/raw
```
