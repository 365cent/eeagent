/** Parse FastAPI error bodies for UI messages. */
export function formatEeaApiError(status: number, body: string): string {
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
    return (
      '研究助手 API 未注册（404）：请重启 backend，使 OpenAPI 包含 ' +
      'POST /api/v1/signals/{id}/assistant/messages（见 backend/TODO.md W2.5）。'
    )
  }
  if (status === 404 && detail === 'signal not found') {
    return '该信号在数据库中不存在。请从信号列表打开已入库证据（勿使用演示 mock 的 numeric ID）。'
  }
  if (status === 422) {
    return detail || '请求参数无效（信号 ID 须为 UUID）'
  }
  if (status === 503 && detail.includes('LLM')) {
    return detail
  }

  return detail || `请求失败 (${status})`
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
