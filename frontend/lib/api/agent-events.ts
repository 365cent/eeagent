import { getEeaApiBase } from '@/lib/api/config'

export type AgentSsePayload = {
  type: string
  run_id?: string
  status?: string
  error?: string
  [key: string]: unknown
}

export type AgentEventListener = (payload: AgentSsePayload, eventId: string) => void

/** Open same-origin SSE replay for a durable agent session (`Last-Event-ID` on reconnect). */
export function openAgentSessionEventSource(
  sessionId: string,
  options: { lastEventId?: string; onEvent: AgentEventListener; onError?: (err: Event) => void },
): EventSource {
  const base = getEeaApiBase().replace(/\/$/, '')
  const url = `${base}/agent/sessions/${encodeURIComponent(sessionId)}/events`
  const es = new EventSource(url)
  if (options.lastEventId) {
    // EventSource does not set Last-Event-ID on first connect; server replays from 0 when absent.
    // Callers track seq via onEvent and reconnect with a fetch-based replay if needed.
    void options.lastEventId
  }
  es.onmessage = (event) => {
    const eventId = event.lastEventId || '0'
    try {
      const payload = JSON.parse(event.data) as AgentSsePayload
      options.onEvent(payload, eventId)
    } catch {
      options.onEvent({ type: 'parse.error', raw: event.data }, eventId)
    }
  }
  es.addEventListener('turn.started', (event) => {
    const eventId = (event as MessageEvent).lastEventId || '0'
    try {
      const payload = JSON.parse((event as MessageEvent).data) as AgentSsePayload
      options.onEvent({ ...payload, type: 'turn.started' }, eventId)
    } catch {
      /* ignore malformed */
    }
  })
  es.addEventListener('turn.completed', (event) => {
    const eventId = (event as MessageEvent).lastEventId || '0'
    try {
      const payload = JSON.parse((event as MessageEvent).data) as AgentSsePayload
      options.onEvent({ ...payload, type: 'turn.completed' }, eventId)
    } catch {
      /* ignore */
    }
  })
  es.addEventListener('turn.failed', (event) => {
    const eventId = (event as MessageEvent).lastEventId || '0'
    try {
      const payload = JSON.parse((event as MessageEvent).data) as AgentSsePayload
      options.onEvent({ ...payload, type: 'turn.failed' }, eventId)
    } catch {
      /* ignore */
    }
  })
  es.addEventListener('turn.cancelled', (event) => {
    const eventId = (event as MessageEvent).lastEventId || '0'
    try {
      const payload = JSON.parse((event as MessageEvent).data) as AgentSsePayload
      options.onEvent({ ...payload, type: 'turn.cancelled' }, eventId)
    } catch {
      /* ignore */
    }
  })
  if (options.onError) {
    es.onerror = options.onError
  }
  return es
}

/** One-shot SSE replay via fetch (supports `Last-Event-ID`). */
export async function fetchAgentSessionEvents(
  sessionId: string,
  lastEventId = '0',
): Promise<{ payloads: AgentSsePayload[]; lastSeq: number }> {
  const base = getEeaApiBase().replace(/\/$/, '')
  const url = `${base}/agent/sessions/${encodeURIComponent(sessionId)}/events`
  const response = await fetch(url, {
    headers: {
      Accept: 'text/event-stream',
      'Last-Event-ID': lastEventId,
    },
  })
  if (!response.ok) {
    throw new Error(`agent events ${response.status}`)
  }
  const text = await response.text()
  const payloads: AgentSsePayload[] = []
  let lastSeq = Number.parseInt(lastEventId, 10) || 0
  for (const block of text.split('\n\n')) {
    const lines = block.split('\n')
    let idLine: string | undefined
    let dataLine: string | undefined
    for (const line of lines) {
      if (line.startsWith('id: ')) idLine = line.slice(4).trim()
      if (line.startsWith('data: ')) dataLine = line.slice(6)
    }
    if (dataLine) {
      try {
        payloads.push(JSON.parse(dataLine) as AgentSsePayload)
      } catch {
        payloads.push({ type: 'parse.error', raw: dataLine })
      }
    }
    if (idLine) {
      const parsed = Number.parseInt(idLine, 10)
      if (!Number.isNaN(parsed)) lastSeq = Math.max(lastSeq, parsed)
    }
  }
  return { payloads, lastSeq }
}
