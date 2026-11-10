const SOURCE_LABELS: Record<string, string> = {
  'jieba-frequency': '词频建议',
  llm: '模型建议',
  'embedding-rerank': '语义精排',
}

const PROTECTED_LABELS: Record<string, string> = {
  value_chain_stage_code: '价值链环节',
  signal_type_code: '信号类型',
  tech_tags: '技术标签',
  tech_theme_id: '技术主题',
}

export function suggestionSourceLabel(source: string | null | undefined): string {
  if (!source) return ''
  return SOURCE_LABELS[source] ?? source
}

export function protectedFieldLabels(fields: string[] | undefined): string[] {
  if (!fields?.length) return []
  return fields.map((field) => PROTECTED_LABELS[field] ?? field)
}
