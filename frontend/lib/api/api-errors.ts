/** Parse FastAPI error bodies for UI messages. */
export function formatEeaApiError(status: number, body: string, requestPath?: string): string {
  let detail = body.trim()
  if (detail.startsWith('{')) {
    try {
      const parsed = JSON.parse(detail) as { detail?: unknown }
      if (typeof parsed.detail === 'string') {
        detail = parsed.detail
      } else if (Array.isArray(parsed.detail)) {
        detail = parsed.detail
          .map((item) => (typeof item === 'object' && item && 'msg' in item ? String((item as { msg: string }).msg) : String(item)))
          .join('; ')
      }
    } catch {
      /* keep raw body */
    }
  }

  if (status === 404 && detail === 'Not Found') {
    const path = requestPath ?? ''
    if (path.includes('/demands/assistant')) {
      return (
        '需求协调助手 API 未注册（404）：请重启 backend，使 OpenAPI 包含 ' +
        'POST /api/v1/demands/assistant/messages 与 /api/v1/demands/assistant/draft。'
      )
    }
    if (path.includes('/signals/') && path.includes('/assistant/')) {
      return (
        '信号研究助手 API 未注册（404）：请重启 backend，使 OpenAPI 包含 ' +
        'POST /api/v1/signals/{id}/assistant/messages（见 backend/TODO.md W2.5）。'
      )
    }
    return `请求的路径不存在（404）${path ? `：${path}` : ''}。若刚拉取代码，请重启 backend。`
  }
  if (status === 404 && detail === 'signal not found') {
    return '该信号在数据库中不存在。请从信号列表打开已入库证据（勿使用演示 mock 的 numeric ID）。'
  }
  if (status === 404 && detail === 'theme not found') {
    return '所选来源主题不存在或已删除，请重新选择主题。'
  }
  if (status === 422) {
    return detail || '请求参数无效（信号 ID 须为 UUID）'
  }
  if (status === 503 && detail.includes('LLM')) {
    return detail
  }
  if (status === 500) {
    if (detail === 'Internal Server Error' || !detail) {
      return '服务端处理失败（500）。若刚更新代码，请重启 backend 后重试。'
    }
    return detail
  }
  if (status === 502) {
    return detail || 'LLM 上游暂时不可用，请稍后重试。'
  }

  return detail || `请求失败 (${status})`
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
