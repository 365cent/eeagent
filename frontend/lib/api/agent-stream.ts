import { getEeaApiBase } from '@/lib/api/config'
import { EeaApiError } from '@/lib/api/client'
import type { AgentMessageResponse } from '@/lib/api/types'

export type AgentStreamEvent = {
  type: string
  [key: string]: unknown
}

type StreamOptions = {
  signal?: AbortSignal
  onEvent?: (event: AgentStreamEvent) => void
  /** Client-side ceiling; the server also ends the turn on its own timeout. */
  timeoutMs?: number
}

const DEFAULT_STREAM_TIMEOUT_MS = 120_000

function parseBlock(block: string): { eventType: string; payload: AgentStreamEvent } | null {
  let eventType = ''
  let data = ''
  for (const line of block.split('\n')) {
    if (line.startsWith('event: ')) eventType = line.slice(7).trim()
    if (line.startsWith('data: ')) data = line.slice(6)
  }
  if (!data) return null
  try {
    const payload = JSON.parse(data) as AgentStreamEvent
    return { eventType: eventType || String(payload.type || 'message'), payload }
  } catch {
    return null
  }
}

export async function streamAgentSessionMessage(
  sessionId: string,
  message: string,
  { signal: userSignal, onEvent, timeoutMs = DEFAULT_STREAM_TIMEOUT_MS }: StreamOptions = {},
): Promise<AgentMessageResponse> {
  // AbortSignal.timeout ends a stalled read; AbortSignal.any keeps the user's
  // cancel button working alongside that deadline.
  const deadline = AbortSignal.timeout(timeoutMs)
  const signal = userSignal ? AbortSignal.any([userSignal, deadline]) : deadline

  const response = await fetch(
    getEeaApiBase() +
      '/agent/sessions/' +
      encodeURIComponent(sessionId) +
      '/messages/stream',
    {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
      signal,
    },
  )
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new EeaApiError(response.status, body || 'agent stream request failed')
  }
  if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream')) {
    throw new Error('agent streaming is unavailable')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let final: AgentMessageResponse | null = null

  const consume = (block: string) => {
    const parsed = parseBlock(block)
    if (!parsed) return
    onEvent?.(parsed.payload)
    if (parsed.eventType === 'message.failed') {
      throw new Error(String(parsed.payload.error || 'agent stream failed'))
    }
    if (parsed.eventType === 'message.completed') {
      final = {
        session_id: String(parsed.payload.session_id || sessionId),
        run_id: String(parsed.payload.run_id || ''),
        status: parsed.payload.status as AgentMessageResponse['status'],
        output: (parsed.payload.output ?? null) as Record<string, unknown> | null,
        error: (parsed.payload.error ?? null) as string | null,
        served_model: (parsed.payload.served_model ?? null) as string | null,
      }
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      let boundary = buffer.indexOf('\n\n')
      while (boundary >= 0) {
        const block = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        consume(block)
        boundary = buffer.indexOf('\n\n')
      }
    }
    buffer += decoder.decode()
    if (buffer.trim()) consume(buffer)
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new Error('模型响应超过 ' + Math.round(timeoutMs / 1000) + ' 秒，已停止等待', {
        cause: err,
      })
    }
    throw err
  } finally {
    reader.releaseLock()
  }

  if (!final) throw new Error('agent stream ended without a completion event')
  return final
}
