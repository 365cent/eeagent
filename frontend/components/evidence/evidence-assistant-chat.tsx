'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { App as AntApp, Button, Card, Collapse, Descriptions, Input, Select, Space, Spin, Tag, Typography } from 'antd'
import { isUuid } from '@/lib/api/api-errors'
import { EeaApiError } from '@/lib/api/client'
import {
  cancelAgentRun,
  confirmAgentPatch,
  createAgentSession,
  deleteAgentMemory,
  fetchAgentSkillsStatus,
  listAgentMemories,
  listAgentSessions,
  listAgentSessionMessages,
  listAgentSessionPatches,
  postAgentSessionMessage,
  rejectAgentPatch,
  postSignalAssistantMessage,
  type AssistantChatTurn,
} from '@/lib/api/eea-api'
import {
  fetchAgentSessionEvents,
  openAgentSessionEventSource,
  type AgentSsePayload,
} from '@/lib/api/agent-events'
import type { AgentMessageRecord, AgentPatchOut } from '@/lib/api/types'
import { ChatMarkdown } from '@/components/shared/chat-markdown'
import { citationLabel } from '@/lib/document-research'
import { streamAgentSessionMessage } from '@/lib/api/agent-stream'

const { Text } = Typography

type EvidenceAssistantChatProps = {
  signalId?: string | null
  onCitation?: (refId: string, kind: string) => void
}

export function EvidenceAssistantChat({ signalId, onCitation }: EvidenceAssistantChatProps) {
  const { message: messageApi } = AntApp.useApp()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AgentMessageRecord[]>([])
  const [patches, setPatches] = useState<AgentPatchOut[]>([])
  const [legacyTurns, setLegacyTurns] = useState<AssistantChatTurn[]>([])
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [streamNote, setStreamNote] = useState<string | null>(null)
  const [citations, setCitations] = useState<{ refId: string; kind: string }[]>([])
  const [liveAnswer, setLiveAnswer] = useState('' )
  const streamAbortRef = useRef<AbortController | null>(null)
  const lastEventSeqRef = useRef(0)
  const eventSourceRef = useRef<EventSource | null>(null)

  const apiSignalId = signalId && isUuid(signalId) ? signalId : null
  const sessionStorageKey = apiSignalId ? `eea-agent-session:${apiSignalId}` : null

  const sessionsQuery = useQuery({
    queryKey: ['eea', 'agent', 'sessions', apiSignalId],
    queryFn: () => listAgentSessions(apiSignalId ?? undefined),
    enabled: Boolean(apiSignalId),
  })

  const skillsQuery = useQuery({
    queryKey: ['eea', 'agent', 'skills-status'],
    queryFn: fetchAgentSkillsStatus,
  })

  const memoriesQuery = useQuery({
    queryKey: ['eea', 'agent', 'memories'],
    queryFn: listAgentMemories,
  })

  const closeEventSource = useCallback(() => {
    eventSourceRef.current?.close()
    eventSourceRef.current = null
  }, [])

  const noteFromEvent = useCallback((payload: AgentSsePayload) => {
    if (payload.type === 'turn.started') return '运行已开始…'
    if (payload.type === 'turn.completed') return '运行已完成'
    if (payload.type === 'turn.failed') return `运行失败：${payload.error ?? '未知错误'}`
    if (payload.type === 'turn.cancelled') return '运行已取消'
    if (payload.type === 'approval.required') return '待确认工具调用'
    return null
  }, [])

  const recordCitation = useCallback((payload: AgentSsePayload) => {
    if (payload.type !== 'citation') return
    const refId = typeof payload.ref_id === 'string' ? payload.ref_id : null
    if (!refId) return
    const kind = typeof payload.kind === 'string' ? payload.kind : 'unknown'
    setCitations((prev) =>
      prev.some((item) => item.refId === refId) ? prev : [...prev, { refId, kind }],
    )
  }, [])

  const rememberSession = useCallback(
    (sid: string) => {
      setSessionId(sid)
      if (sessionStorageKey && typeof window !== 'undefined') {
        window.sessionStorage.setItem(sessionStorageKey, sid)
      }
    },
    [sessionStorageKey],
  )

  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId
    if (sessionStorageKey && typeof window !== 'undefined') {
      const stored = window.sessionStorage.getItem(sessionStorageKey)
      const known = stored && sessionsQuery.data?.some((row) => row.id === stored) ? stored : null
      if (known) {
        setSessionId(known)
        return known
      }
    }
    const listed = sessionsQuery.data?.[0]?.id
    if (listed) {
      rememberSession(listed)
      return listed
    }
    const created = await createAgentSession({
      title: apiSignalId ? `信号助手 ${apiSignalId.slice(0, 8)}` : '证据助手',
      page_context: apiSignalId ? { signal_id: apiSignalId } : undefined,
    })
    rememberSession(created.id)
    void sessionsQuery.refetch()
    return created.id
  }, [apiSignalId, rememberSession, sessionId, sessionStorageKey, sessionsQuery])

  const switchSession = useCallback(
    (sid: string) => {
      if (sid === sessionId) return
      closeEventSource()
      streamAbortRef.current?.abort()
      lastEventSeqRef.current = 0
      setMessages([])
      setPatches([])
      setCitations([])
      setLiveAnswer('')
      setStreamNote(null)
      rememberSession(sid)
    },
    [closeEventSource, rememberSession, sessionId],
  )

  const startNewSession = useCallback(async () => {
    try {
      const created = await createAgentSession({
        title: apiSignalId ? `信号助手 ${apiSignalId.slice(0, 8)}` : '证据助手',
        page_context: apiSignalId ? { signal_id: apiSignalId } : undefined,
      })
      setMessages([])
      setPatches([])
      setCitations([])
      setLiveAnswer('')
      rememberSession(created.id)
      void sessionsQuery.refetch()
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(detail || '新建会话失败')
    }
  }, [apiSignalId, messageApi, rememberSession, sessionsQuery])

  const refreshConversation = useCallback(async (sid: string) => {
    const [msgs, pcs] = await Promise.all([listAgentSessionMessages(sid), listAgentSessionPatches(sid)])
    setMessages(msgs)
    setPatches(pcs)
  }, [])

  useEffect(() => {
    if (!sessionId) return
    void refreshConversation(sessionId)
  }, [refreshConversation, sessionId])

  useEffect(() => () => {
    closeEventSource()
    streamAbortRef.current?.abort()
  }, [closeEventSource])

  useEffect(() => {
    setCitations([])
  }, [apiSignalId])

  useEffect(() => {
    if (!sessionStorageKey || typeof window === 'undefined') return
    const stored = window.sessionStorage.getItem(sessionStorageKey)
    if (stored) setSessionId(stored)
  }, [sessionStorageKey])

  const send = useCallback(async () => {
    const text = draft.trim()
    if (!text || busy) return
    if (!apiSignalId) {
      messageApi.warning('请从证据库打开已入库的信号后再向助手提问。')
      return
    }
    setDraft('')
    setBusy(true)
    setStreamNote(null)
    setActiveRunId(null)
    setCitations([])
    setLiveAnswer('')
    let streamedText = false
    try {
      const sid = await ensureSession()
      closeEventSource()
      try {
        const controller = new AbortController()
        streamAbortRef.current = controller
        try {
          const streamed = await streamAgentSessionMessage(sid, text, {
            signal: controller.signal,
            onEvent: (event) => {
              if (event.type === 'text.delta' && typeof event.delta === 'string') {
                streamedText = true
                setLiveAnswer((prev) => prev + event.delta)
              }
              if (event.type === 'tool.call' && typeof event.tool === 'string') {
                setStreamNote('正在调用工具：' + event.tool)
              }
              if (event.type === 'citation') {
                recordCitation(event as never)
              }
              if (event.type === 'turn.started' && typeof event.run_id === 'string') {
                setActiveRunId(event.run_id)
              }
            },
          })
          setActiveRunId(streamed.run_id)
          await refreshConversation(sid)
          if (streamed.status === 'failed' && streamed.error) {
            messageApi.warning(streamed.error)
          }
          return
        } finally {
          streamAbortRef.current = null
          setLiveAnswer('')
        }
      } catch (streamErr) {
        if (streamedText) {
          messageApi.error(streamErr instanceof Error ? streamErr.message : '流式响应中断')
          return
        }
      }
      closeEventSource()
      const es = openAgentSessionEventSource(sid, {
        lastEventId: String(lastEventSeqRef.current),
        onEvent: (payload, eventId) => {
          const parsed = Number.parseInt(eventId, 10)
          if (!Number.isNaN(parsed)) lastEventSeqRef.current = Math.max(lastEventSeqRef.current, parsed)
          recordCitation(payload)
          const note = noteFromEvent(payload)
          if (note) setStreamNote(note)
          if (payload.run_id && typeof payload.run_id === 'string') setActiveRunId(payload.run_id)
        },
      })
      eventSourceRef.current = es
      const result = await postAgentSessionMessage(sid, text)
      setActiveRunId(result.run_id)
      closeEventSource()
      const replay = await fetchAgentSessionEvents(sid, String(lastEventSeqRef.current))
      lastEventSeqRef.current = replay.lastSeq
      replay.payloads.forEach(recordCitation)
      const terminal = replay.payloads.find((p) =>
        ['turn.completed', 'turn.failed', 'turn.cancelled', 'approval.required'].includes(p.type),
      )
      if (terminal) setStreamNote(noteFromEvent(terminal))
      await refreshConversation(sid)
      if (result.status === 'failed' && result.error) {
        messageApi.warning(result.error)
      }
    } catch (agentErr) {
      closeEventSource()
      const history = [...legacyTurns]
      setLegacyTurns((prev) => [...prev, { role: 'user', content: text }])
      try {
        const out = await postSignalAssistantMessage(apiSignalId, text, history)
        setLegacyTurns((prev) => [...prev, { role: 'assistant', content: out.reply }])
      } catch (err) {
        const detail = err instanceof EeaApiError ? err.message : String(agentErr)
        messageApi.error(detail || '助手请求失败')
        setDraft(text)
      }
    } finally {
      setActiveRunId(null)
      setBusy(false)
    }
  }, [
    apiSignalId,
    busy,
    closeEventSource,
    draft,
    ensureSession,
    legacyTurns,
    messageApi,
    noteFromEvent,
    recordCitation,
    refreshConversation,
  ])

  const cancelRun = useCallback(async () => {
    if (!sessionId || !activeRunId || !busy) return
    try {
      await cancelAgentRun(sessionId, activeRunId)
      setStreamNote('已请求取消运行…')
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(detail || '取消失败')
    }
  }, [activeRunId, busy, messageApi, sessionId])

  const patchAction = async (patchId: string, action: 'confirm' | 'reject') => {
    if (!sessionId) return
    setBusy(true)
    try {
      if (action === 'confirm') await confirmAgentPatch(sessionId, patchId)
      else await rejectAgentPatch(sessionId, patchId)
      await refreshConversation(sessionId)
      messageApi.success(action === 'confirm' ? '变更已应用' : '已拒绝变更')
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(detail || '操作失败')
    } finally {
      setBusy(false)
    }
  }

  const skills = skillsQuery.data
  const sessions = sessionsQuery.data ?? []
  const displayMessages =
    messages.length > 0
      ? messages
      : legacyTurns.map((turn, index) => ({
          id: `legacy-${index}`,
          session_id: '',
          run_id: null,
          role: turn.role,
          content: turn.content,
          created_at: '',
        }))

  return (
    <>
      <Space wrap style={{ marginBottom: 8 }}>
        {skills ? (
          <Tag color={skills.baseline_mode ? 'default' : 'blue'}>
            {skills.baseline_mode
              ? '基线模式（无业务 skill 包）'
              : `Skill 包：${skills.packs.map((p) => p.name).join(', ')}`}
          </Tag>
        ) : null}
        {sessions.length > 1 ? (
          <Select
            size="small"
            style={{ minWidth: 180 }}
            value={sessionId ?? undefined}
            placeholder="选择会话"
            options={sessions.map((row) => ({
              value: row.id,
              label: `${row.title || '会话'} · ${row.id.slice(0, 6)}`,
            }))}
            onChange={(value) => switchSession(value)}
            disabled={busy}
          />
        ) : sessionId ? (
          <Tag>会话 {sessionId.slice(0, 8)}</Tag>
        ) : null}
        <Button size="small" disabled={!apiSignalId || busy} onClick={() => void startNewSession()}>
          新建会话
        </Button>
      </Space>
      <div className="chat-messages">
        {displayMessages.length === 0 && !busy ? (
          <div className="chat-message assistant">
            {!apiSignalId ? (
              <Text type="secondary">打开已入库的证据后，可以在这里追问与主题、需求点或技术落脚点的关系。</Text>
            ) : (
              <Text type="secondary">
                多会话助手支持待确认变更与持久消息；网关未配置时将回退到单轮信号助手。
              </Text>
            )}
          </div>
        ) : null}
        {displayMessages.map((turn) => (
          <div key={turn.id} className={`chat-message ${turn.role}`}>
            {turn.role === 'assistant' ? <ChatMarkdown content={turn.content} /> : turn.content}
          </div>
        ))}
        {liveAnswer ? (
          <div className="chat-message assistant">
            <ChatMarkdown content={liveAnswer} />
          </div>
        ) : null}
        {busy && !liveAnswer ? (
          <div className="chat-message assistant">
            <Spin size="small" />{' '}
            <Text type="secondary"> {streamNote ?? '思考中…'}</Text>
          </div>
        ) : null}
        {streamNote && liveAnswer ? (
          <div className="chat-message assistant">
            <Text type="secondary">{streamNote}</Text>
          </div>
        ) : null}
      </div>

      {patches.length > 0 ? (
        <Collapse
          style={{ marginTop: 12 }}
          items={patches.map((patch) => ({
            key: patch.id,
            label: `待确认变更 · 信号 ${patch.signal_id.slice(0, 8)} · ${patch.status}`,
            children: (
              <Space orientation="vertical" style={{ width: '100%' }}>
                <Descriptions size="small" column={1} bordered>
                  {Object.entries(patch.diff).map(([field, value]) => (
                    <Descriptions.Item key={field} label={field}>
                      {JSON.stringify(patch.baseline_snapshot[field])} → {JSON.stringify(value)}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
                {patch.reason ? <Text type="secondary">{patch.reason}</Text> : null}
                {patch.status === 'pending' ? (
                  <Space>
                    <Button size="small" type="primary" onClick={() => void patchAction(patch.id, 'confirm')}>
                      确认应用
                    </Button>
                    <Button size="small" onClick={() => void patchAction(patch.id, 'reject')}>
                      拒绝
                    </Button>
                  </Space>
                ) : null}
              </Space>
            ),
          }))}
        />
      ) : null}

      {memoriesQuery.data && memoriesQuery.data.length > 0 ? (
        <Card size="small" title="个人记忆" style={{ marginTop: 12 }}>
          <Space orientation="vertical" style={{ width: '100%' }}>
            {memoriesQuery.data.map((memory) => (
              <Space key={memory.id} wrap>
                <Tag>{memory.scope}</Tag>
                <Text strong>{memory.key}</Text>
                <Text type="secondary">{memory.content.slice(0, 120)}</Text>
                <Button
                  size="small"
                  type="link"
                  onClick={() => void deleteAgentMemory(memory.id).then(() => memoriesQuery.refetch())}
                >
                  删除
                </Button>
              </Space>
            ))}
          </Space>
        </Card>
      ) : null}

      {citations.length > 0 && onCitation ? (
        <Space wrap size={[6, 6]} className="agent-citations" style={{ marginTop: 8 }}>
          <Text type="secondary">引用</Text>
          {citations.map((citation) => (
            <Button
              key={citation.refId}
              size="small"
              type="link"
              onClick={() => onCitation(citation.refId, citation.kind)}
            >
              {citationLabel(citation.refId)}
            </Button>
          ))}
        </Space>
      ) : null}

      <Space orientation="vertical" size={8} style={{ width: '100%', marginTop: 8 }} className="chat-composer">
        <Space.Compact block>
          <Input
            value={draft}
            disabled={busy || !apiSignalId}
            onChange={(event) => setDraft(event.target.value)}
            onPressEnter={() => void send()}
            placeholder="输入问题，Enter 发送"
          />
          <Button type="primary" loading={busy} disabled={!apiSignalId} onClick={() => void send()}>
            发送
          </Button>
          {busy && activeRunId ? (
            <Button danger onClick={() => void cancelRun()}>
              取消运行
            </Button>
          ) : null}
        </Space.Compact>
      </Space>
    </>
  )
}
