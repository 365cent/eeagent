'use client'

import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { App as AntApp, Button, Card, Collapse, Descriptions, Input, Space, Spin, Tag, Typography } from 'antd'
import { isUuid } from '@/lib/api/api-errors'
import { EeaApiError } from '@/lib/api/client'
import {
  confirmAgentPatch,
  createAgentSession,
  deleteAgentMemory,
  fetchAgentSkillsStatus,
  listAgentMemories,
  listAgentSessionMessages,
  listAgentSessionPatches,
  postAgentSessionMessage,
  rejectAgentPatch,
  postSignalAssistantMessage,
  type AssistantChatTurn,
} from '@/lib/api/eea-api'
import type { AgentMessageRecord, AgentPatchOut } from '@/lib/api/types'
import { ChatMarkdown } from '@/components/shared/chat-markdown'

const { Text } = Typography

type EvidenceAssistantChatProps = {
  signalId?: string | null
}

export function EvidenceAssistantChat({ signalId }: EvidenceAssistantChatProps) {
  const { message: messageApi } = AntApp.useApp()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<AgentMessageRecord[]>([])
  const [patches, setPatches] = useState<AgentPatchOut[]>([])
  const [legacyTurns, setLegacyTurns] = useState<AssistantChatTurn[]>([])

  const apiSignalId = signalId && isUuid(signalId) ? signalId : null

  const skillsQuery = useQuery({
    queryKey: ['eea', 'agent', 'skills-status'],
    queryFn: fetchAgentSkillsStatus,
  })

  const memoriesQuery = useQuery({
    queryKey: ['eea', 'agent', 'memories'],
    queryFn: listAgentMemories,
  })

  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId
    const created = await createAgentSession({
      title: apiSignalId ? `信号助手 ${apiSignalId.slice(0, 8)}` : '证据助手',
      page_context: apiSignalId ? { signal_id: apiSignalId } : undefined,
    })
    setSessionId(created.id)
    return created.id
  }, [apiSignalId, sessionId])

  const refreshConversation = useCallback(async (sid: string) => {
    const [msgs, pcs] = await Promise.all([listAgentSessionMessages(sid), listAgentSessionPatches(sid)])
    setMessages(msgs)
    setPatches(pcs)
  }, [])

  useEffect(() => {
    if (!sessionId) return
    void refreshConversation(sessionId)
  }, [refreshConversation, sessionId])

  const send = useCallback(async () => {
    const text = draft.trim()
    if (!text || busy) return
    if (!apiSignalId) {
      messageApi.warning('请从证据库打开已入库的信号后再向助手提问。')
      return
    }
    setDraft('')
    setBusy(true)
    try {
      const sid = await ensureSession()
      await postAgentSessionMessage(sid, text)
      await refreshConversation(sid)
    } catch (agentErr) {
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
      setBusy(false)
    }
  }, [apiSignalId, busy, draft, ensureSession, legacyTurns, messageApi, refreshConversation])

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
        {sessionId ? <Tag>会话 {sessionId.slice(0, 8)}</Tag> : null}
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
        {busy ? (
          <div className="chat-message assistant">
            <Spin size="small" /> <Text type="secondary"> 思考中…</Text>
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
        </Space.Compact>
      </Space>
    </>
  )
}
