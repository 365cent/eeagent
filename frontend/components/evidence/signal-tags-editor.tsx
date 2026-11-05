'use client'

import { useCallback, useEffect, useState } from 'react'
import { App as AntApp, Button, Input, Space, Spin, Tag, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { fetchSignalTagSuggestions } from '@/lib/api/eea-api'
import { EeaApiError } from '@/lib/api/client'
import { useSignalMutations } from '@/hooks/use-signal-mutations'
import { suggestionSourceLabel } from '@/lib/suggestion-source'
import type { TagSuggestion } from '@/lib/api/types'

const { Text } = Typography

type SignalTagsEditorProps = {
  signalId: string
  tags: string[]
}

function scoreHint(out: TagSuggestion): string {
  const parts: string[] = []
  if (out.freq != null) parts.push(`词频 ${out.freq}`)
  if (out.embed_score != null) parts.push(`语义 ${out.embed_score}`)
  if (out.rerank_score != null) parts.push(`精排 ${out.rerank_score}`)
  return parts.join(' · ')
}

export function SignalTagsEditor({ signalId, tags }: SignalTagsEditorProps) {
  const { message: messageApi } = AntApp.useApp()
  const { setTags } = useSignalMutations(signalId)
  const [draftTags, setDraftTags] = useState<string[]>(tags)
  const [editing, setEditing] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestionSource, setSuggestionSource] = useState<string | null>(null)
  const [scoreNote, setScoreNote] = useState('')
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  useEffect(() => {
    setDraftTags(tags)
  }, [tags])

  const loadSuggestions = useCallback(async () => {
    setLoadingSuggestions(true)
    try {
      const out = await fetchSignalTagSuggestions(signalId)
      setSuggestions(out.suggested_tags.filter((t) => !draftTags.includes(t)))
      setSuggestionSource(out.source)
      setScoreNote(scoreHint(out))
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.warning(detail || '无法加载标签建议')
    } finally {
      setLoadingSuggestions(false)
    }
  }, [signalId, draftTags, messageApi])

  const startEdit = () => {
    setEditing(true)
    void loadSuggestions()
  }

  const addTag = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || draftTags.includes(trimmed)) return
    setDraftTags((prev) => [...prev, trimmed])
    setSuggestions((prev) => prev.filter((t) => t !== trimmed))
    setNewTag('')
  }

  const removeTag = (name: string) => {
    setDraftTags((prev) => prev.filter((t) => t !== name))
  }

  const save = async () => {
    try {
      await setTags.mutateAsync(draftTags)
      messageApi.success('标签已保存')
      setEditing(false)
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(detail || '保存失败')
    }
  }

  const cancel = () => {
    setDraftTags(tags)
    setEditing(false)
    setNewTag('')
    setSuggestions([])
  }

  const displayTags = editing ? draftTags : tags

  return (
    <div className="signal-tags-editor">
      <div className="pane-heading-row" style={{ marginBottom: 8 }}>
        <Text strong>技术方向与预标</Text>
        {!editing ? (
          <Button size="small" type="link" onClick={startEdit}>
            编辑标签
          </Button>
        ) : (
          <Space size={4}>
            <Button size="small" onClick={cancel}>
              取消
            </Button>
            <Button size="small" type="primary" loading={setTags.isPending} onClick={() => void save()}>
              保存
            </Button>
          </Space>
        )}
      </div>
      <Space wrap size={[4, 4]}>
        {displayTags.length === 0 ? (
          <Text type="secondary">暂无技术方向标签</Text>
        ) : (
          displayTags.map((tag) => (
            <Tag
              key={tag}
              className="tech-tag"
              closable={editing}
              onClose={editing ? () => removeTag(tag) : undefined}
            >
              {tag}
            </Tag>
          ))
        )}
      </Space>
      {editing ? (
        <>
          <Space.Compact style={{ marginTop: 10, width: '100%', maxWidth: 360 }}>
            <Input
              placeholder="输入标签名"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onPressEnter={() => addTag(newTag)}
            />
            <Button icon={<PlusOutlined />} onClick={() => addTag(newTag)}>
              添加
            </Button>
          </Space.Compact>
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">
              建议
              {suggestionSource ? `（${suggestionSourceLabel(suggestionSource)}）` : ''}
              {scoreNote ? ` · ${scoreNote}` : ''}
            </Text>
            {loadingSuggestions ? (
              <Spin size="small" style={{ marginLeft: 8 }} />
            ) : (
              <Space wrap size={[4, 4]} style={{ marginTop: 6 }}>
                {suggestions.map((tag) => (
                  <Button key={tag} size="small" onClick={() => addTag(tag)}>
                    + {tag}
                  </Button>
                ))}
              </Space>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
