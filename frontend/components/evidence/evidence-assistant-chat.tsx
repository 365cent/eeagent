'use client'

import { useCallback, useState } from 'react'
import { App as AntApp, Button, Input, Space, Spin, Tag, Typography } from 'antd'
import { postSignalAssistantMessage, type AssistantChatTurn } from '@/lib/api/eea-api'
import { isUuid } from '@/lib/api/api-errors'
import { EeaApiError } from '@/lib/api/client'

const { Text } = Typography

type EvidenceAssistantChatProps = {
  /** Backend signal UUID; omit when viewing mock-only evidence rows. */
  signalId?: string | null
}

export function EvidenceAssistantChat({ signalId }: EvidenceAssistantChatProps) {
  const { message: messageApi } = AntApp.useApp()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [turns, setTurns] = useState<AssistantChatTurn[]>([])
  const [modelId, setModelId] = useState<string | null>(null)

  const apiSignalId = signalId && isUuid(signalId) ? signalId : null

  const send = useCallback(async () => {
    const text = draft.trim()
    if (!text || busy) return
    if (!apiSignalId) {
      messageApi.warning('请从证据库打开已入库的信号后再向助手提问。')
      return
    }
    setDraft('')
    setBusy(true)
    const history = [...turns]
    setTurns((prev) => [...prev, { role: 'user', content: text }])
    try {
      const out = await postSignalAssistantMessage(apiSignalId, text, history)
      if (out.model) setModelId(out.model)
      setTurns((prev) => [...prev, { role: 'assistant', content: out.reply }])
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(detail || '助手请求失败')
      setTurns((prev) => prev.slice(0, -1))
      setDraft(text)
    } finally {
      setBusy(false)
    }
  }, [apiSignalId, busy, draft, messageApi, turns])

  return (
    <>
      <div className="chat-messages">
        {turns.length === 0 && !busy ? (
          <div className="chat-message assistant">
            {!apiSignalId ? (
              <Text type="secondary">打开已入库的证据后，可以在这里追问与主题、需求点或技术落脚点的关系。</Text>
            ) : (
              <>
                你好，我可以根据这条证据的正文帮你梳理：它和哪些主题、需求相关，值不值得继续跟进。
                <div style={{ marginTop: 10 }}>
                  <Text type="secondary">例如：「这条信号支持哪个需求点？」「和现有主题怎么关联？」</Text>
                </div>
              </>
            )}
          </div>
        ) : null}
        {turns.map((turn, index) => (
          <div key={`${turn.role}-${index}`} className={`chat-message ${turn.role}`}>
            {turn.content}
          </div>
        ))}
        {busy ? (
          <div className="chat-message assistant">
            <Spin size="small" /> <Text type="secondary"> 思考中…</Text>
          </div>
        ) : null}
      </div>
      <Space orientation="vertical" size={8} style={{ width: '100%' }} className="chat-composer">
        {modelId && turns.length > 0 ? (
          <Tag variant="filled" color="blue">
            {modelId}
          </Tag>
        ) : null}
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
