export type StatusTagColor = 'success' | 'processing' | 'error' | 'warning' | 'default'

export type StatusMeta = {
  label: string
  color: StatusTagColor
}

const INGEST_STATUS_REGISTRY: Record<string, StatusMeta> = {
  parsed: { label: '已解析', color: 'success' },
  failed: { label: '解析失败', color: 'error' },
  skipped: { label: '跳过解析', color: 'warning' },
  stored: { label: '已存储', color: 'default' },
}

export function statusMetaFromRegistry(
  registry: Record<string, StatusMeta>,
  status: string,
): StatusMeta {
  return registry[status] ?? { label: status, color: 'default' }
}

export function ingestStatusMeta(status: string): StatusMeta {
  return statusMetaFromRegistry(INGEST_STATUS_REGISTRY, status)
}
