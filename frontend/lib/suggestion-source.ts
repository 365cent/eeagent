const SOURCE_LABELS: Record<string, string> = {
  'jieba-frequency': '词频建议',
  llm: '模型建议',
  'embedding-rerank': '语义精排',
}

export function suggestionSourceLabel(source: string | null | undefined): string {
  if (!source) return ''
  return SOURCE_LABELS[source] ?? source
}
