'use client'

import { useCallback, useState } from 'react'
import { App as AntApp, Button, Input, Space, Spin, Tag, Typography } from 'antd'
import { RobotOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { postDemandAssistantMessage, proposeDemandDraft, type AssistantChatTurn } from '@/lib/api/eea-api'
import { EeaApiError } from '@/lib/api/client'
import type { DemandDraftProposal } from '@/lib/api/types'
import { ChatMarkdown } from '@/components/shared/chat-markdown'

const { Text } = Typography

type DemandDraftAssistantProps = {
  themeId: string | null
  themeLabel?: string
  compact?: boolean
  selectedSignalIds: string[]
  onApplyDraft: (draft: DemandDraftProposal) => void
}

const QUICK_PROMPTS = [
  '基于当前勾选信号，提出 1 个需求点名称，并按固定五步逐项说明；列出证据不足处。',
  '只改写交叉验证：列出不同来源、共同点、差异点、结论和不确定性；不得新增事实。',
  '按五步列出每一步的目标、需要的证据和当前缺口；不要写入数据库。',
] as const

export function DemandDraftAssistant({
  themeId,
  themeLabel,
  compact,
  selectedSignalIds,
  onApplyDraft,
}: DemandDraftAssistantProps) {
  const { message: messageApi } = AntApp.useApp()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState<'chat' | 'propose' | null>(null)
  const [turns, setTurns] = useState<AssistantChatTurn[]>([])
  const [modelId, setModelId] = useState<string | null>(null)
  const [pendingDraft, setPendingDraft] = useState<DemandDraftProposal | null>(null)

  const canUseBots = Boolean(themeId) && selectedSignalIds.length >= 2

  const runPropose = useCallback(async (hint?: string) => {
    if (!themeId) {
      messageApi.warning('请先选择来源主题')
      return
    }
    if (selectedSignalIds.length < 2) {
      messageApi.warning('请至少在信号编组中勾选 2 条信号')
      return
    }
    setBusy('propose')
    try {
      const proposal = await proposeDemandDraft(themeId, {
        userHint: hint,
        useLlm: Boolean(hint?.trim()),
        selectedSignalIds,
      })
      setPendingDraft(proposal)
      setTurns((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `已根据 ${selectedSignalIds.length} 名信号助手生成草稿「${proposal.name}」。点击下方「应用到表单」核对后保存。${proposal.llm_note ? `（${proposal.llm_note}）` : ''}`,
        },
      ])
      messageApi.success('需求草稿已生成')
    } catch (err) {
      messageApi.error(err instanceof EeaApiError ? err.message : '生成草稿失败')
    } finally {
      setBusy(null)
    }
  }, [messageApi, selectedSignalIds, themeId])

  const send = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? draft).trim()
      if (!text || busy) return
      if (!themeId) {
        messageApi.warning('请先选择来源主题')
        return
      }
      if (selectedSignalIds.length < 2) {
        messageApi.warning('请至少在信号编组中勾选 2 条信号')
        return
      }
      if (!textOverride) setDraft('')
      setBusy('chat')
      const history = [...turns]
      setTurns((prev) => [...prev, { role: 'user', content: text }])
      try {
        const out = await postDemandAssistantMessage(themeId, text, history, selectedSignalIds)
        if (out.model) setModelId(out.model)
        setTurns((prev) => [...prev, { role: 'assistant', content: out.reply }])
        if (out.draft) {
          setPendingDraft(out.draft)
          messageApi.info('助手附带了一份可应用的草稿')
        }
      } catch (err) {
        messageApi.error(err instanceof EeaApiError ? err.message : '助手请求失败')
        setTurns((prev) => prev.slice(0, -1))
        if (!textOverride) setDraft(text)
      } finally {
        setBusy(null)
      }
    },
    [busy, draft, messageApi, selectedSignalIds, themeId, turns],
  )

  return (
    <div className={`demand-assistant-shell evidence-assistant-shell${compact ? ' demand-assistant-shell--compact' : ''}`}>
      <div className="demand-assistant-head evidence-column-head">
        <Space align="center" size={10}>
          <RobotOutlined style={{ fontSize: compact ? 16 : 18 }} />
          <Text strong>需求协调助手</Text>
          {!compact && themeLabel ? (
            <Tag color="blue" className="demand-assistant-theme-tag" title={themeLabel}>
              {themeLabel}
            </Tag>
          ) : null}
        </Space>
      </div>
      <Space wrap className="demand-assistant-actions" size={[8, 8]} style={{ marginBottom: 12 }}>
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          loading={busy === 'propose'}
          disabled={!canUseBots || Boolean(busy)}
          onClick={() => void runPropose()}
        >
          一键生成需求草稿
        </Button>
        {QUICK_PROMPTS.map((prompt) => (
          <Button key={prompt} size="small" disabled={!canUseBots || Boolean(busy)} onClick={() => void send(prompt)}>
            {prompt}
          </Button>
        ))}
      </Space>
      <div className="chat-messages demand-assistant-messages">
        {turns.length === 0 && !busy ? (
          <div className="chat-message assistant">
            {!themeId
              ? '请先在上方选择来源主题。'
              : selectedSignalIds.length < 2
                ? '请勾选至少 2 条信号助手。'
                : `已编入 ${selectedSignalIds.length} 名助手。可一键生成草稿或直接提问。`}
          </div>
        ) : null}
        {turns.map((turn, index) => (
          <div key={`${turn.role}-${index}`} className={`chat-message ${turn.role}`}>
            {turn.role === 'assistant' ? <ChatMarkdown content={turn.content} /> : turn.content}
          </div>
        ))}
        {busy ? (
          <div className="chat-message assistant">
            <Spin size="small" /> <Text type="secondary"> 协调编组中…</Text>
          </div>
        ) : null}
      </div>
      <Space orientation="vertical" size={8} style={{ width: '100%' }} className="chat-composer">
        {modelId && turns.length > 0 ? (
          <Tag variant="filled" color="blue">
            {modelId}
          </Tag>
        ) : null}
        {pendingDraft ? (
          <AlertDraftPreview
            draft={pendingDraft}
            onApply={() => {
              onApplyDraft(pendingDraft)
              messageApi.success('草稿已写入表单，请核对后保存为待复核')
            }}
            onDismiss={() => setPendingDraft(null)}
          />
        ) : null}
        <Space.Compact block>
          <Input
            value={draft}
            disabled={Boolean(busy) || !canUseBots}
            onChange={(event) => setDraft(event.target.value)}
            onPressEnter={() => void send()}
            placeholder="向协调助手提问，或输入「生成草稿」"
          />
          <Button type="primary" loading={busy === 'chat'} disabled={!canUseBots} onClick={() => void send()}>
            发送
          </Button>
        </Space.Compact>
      </Space>
    </div>
  )
}

function AlertDraftPreview({
  draft,
  onApply,
  onDismiss,
}: {
  draft: DemandDraftProposal
  onApply: () => void
  onDismiss: () => void
}) {
  const stepCount = draft.derivation_trace?.steps?.length ?? 0
  const cvIds = Array.isArray(draft.cross_validation?.evidence_signal_ids)
    ? (draft.cross_validation.evidence_signal_ids as string[]).length
    : 0
  return (
    <div className="demand-draft-preview">
      <Text strong>{draft.name}</Text>
      <div>
        <Text type="secondary">五步推导 {stepCount} 步 · 交叉验证证据 {cvIds} 条</Text>
      </div>
      <Space style={{ marginTop: 8 }}>
        <Button size="small" type="primary" onClick={onApply}>
          应用到表单
        </Button>
        <Button size="small" onClick={onDismiss}>
          忽略
        </Button>
      </Space>
    </div>
  )
}
