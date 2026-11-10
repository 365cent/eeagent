'use client'

import { useEffect, useMemo, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { App as AntApp, Button, Input, Select, Space, Spin, Tag, Typography } from 'antd'
import { useSignalTagSuggestions, useVocab } from '@/hooks/use-eea-queries'
import { useSignalMutations } from '@/hooks/use-signal-mutations'
import { EeaApiError } from '@/lib/api/client'
import { suggestionSourceLabel } from '@/lib/suggestion-source'
import { protectedFieldLabels } from '@/lib/suggestion-source'
import type { TagSuggestion } from '@/lib/api/types'

const { Text } = Typography

type SignalTagsEditorProps = {
  signalId: string
  tags: string[]
  updatedAt?: string | null
}

function scoreHint(out: TagSuggestion): string {
  const parts: string[] = []
  if (out.freq != null) parts.push(`词频 ${out.freq}`)
  if (out.embed_score != null) parts.push(`语义 ${out.embed_score}`)
  if (out.rerank_score != null) parts.push(`精排 ${out.rerank_score}`)
  return parts.join(' · ')
}

export function SignalTagsEditor({ signalId, tags, updatedAt }: SignalTagsEditorProps) {
  const { message: messageApi } = AntApp.useApp()
  const { setTags, invalidate } = useSignalMutations(signalId, updatedAt)
  const vocabularyQuery = useVocab('tech_tag')
  const suggestionsQuery = useSignalTagSuggestions(signalId)
  const [draftTags, setDraftTags] = useState<string[]>(tags)
  const [editing, setEditing] = useState(false)
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (!editing) setDraftTags(tags)
  }, [tags, editing])

  const options = useMemo(() => {
    const names = new Set((vocabularyQuery.data ?? []).map((entry) => entry.name))
    for (const name of [...tags, ...draftTags]) names.add(name)
    return [...names].map((name) => ({ value: name, label: name }))
  }, [vocabularyQuery.data, tags, draftTags])

  const addTag = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed || draftTags.includes(trimmed)) return
    setDraftTags((previous) => [...previous, trimmed])
    setNewTag('')
  }

  const adoptSuggestion = (name: string) => {
    setEditing(true)
    addTag(name)
  }

  const save = async () => {
    try {
      await setTags.mutateAsync(draftTags)
      messageApi.success('标签已保存')
      setEditing(false)
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      if (err instanceof EeaApiError && err.status === 409) {
        void invalidate()
      }
      messageApi.error(detail || '保存失败')
    }
  }

  const cancel = () => {
    setDraftTags(tags)
    setEditing(false)
    setNewTag('')
  }

  const displayedTags = editing ? draftTags : tags
  const tagsProtected = suggestionsQuery.data?.protected_fields?.includes('tech_tags')
  const protectedLabels = protectedFieldLabels(suggestionsQuery.data?.protected_fields)
  const suggestions = tagsProtected
    ? []
    : (suggestionsQuery.data?.suggested_tags ?? []).filter((tag) => !displayedTags.includes(tag))

  return (
    <div className="signal-tags-editor">
      <div className="pane-heading-row" style={{ marginBottom: 8 }}>
        <Text strong>技术方向与预标</Text>
        {!editing ? (
          <Button size="small" type="link" onClick={() => setEditing(true)}>
            编辑标签
          </Button>
        ) : (
          <Space size={4}>
            <Button size="small" onClick={cancel}>取消</Button>
            <Button size="small" type="primary" loading={setTags.isPending} onClick={() => void save()}>
              保存
            </Button>
          </Space>
        )}
      </div>

      {editing ? (
        <>
          <Text type="secondary">从服务端技术方向词表选择；也可明确添加新词条。</Text>
          {vocabularyQuery.isError ? (
            <Space size={6} style={{ display: 'flex', marginTop: 4 }}>
              <Text type="danger">技术方向词表加载失败，当前无法选择已有词条。</Text>
              <Button size="small" type="link" onClick={() => void vocabularyQuery.refetch()}>重试</Button>
            </Space>
          ) : null}
          <Select
            mode="multiple"
            allowClear
            showSearch={{ optionFilterProp: 'label' }}
            loading={vocabularyQuery.isLoading}
            disabled={!vocabularyQuery.isSuccess}
            value={draftTags}
            options={options}
            onChange={setDraftTags}
            placeholder="选择技术方向词条"
            style={{ width: '100%', marginTop: 6 }}
          />
          <Space.Compact style={{ marginTop: 8, width: '100%' }}>
            <Input
              placeholder="输入新的开放词表标签"
              value={newTag}
              onChange={(event) => setNewTag(event.target.value)}
              onPressEnter={() => addTag(newTag)}
            />
            <Button icon={<PlusOutlined />} disabled={!newTag.trim()} onClick={() => addTag(newTag)}>
              添加新词条
            </Button>
          </Space.Compact>
          <Text type="secondary">新词条先加入本次修改草稿；点击“保存”后与信号标签一起提交并进入开放词表。</Text>
        </>
      ) : null}

      <Space wrap size={[4, 4]} style={{ marginTop: 8 }}>
        {displayedTags.length === 0 ? (
          <Text type="secondary">暂无技术方向标签</Text>
        ) : (
          displayedTags.map((tag) => (
            <Tag key={tag} className="tech-tag">{tag}</Tag>
          ))
        )}
      </Space>

      <div style={{ marginTop: 12 }}>
        <Text type="secondary">
          模型建议（需人工明确采用）
          {suggestionsQuery.data?.source ? ` · ${suggestionSourceLabel(suggestionsQuery.data.source)}` : ''}
          {suggestionsQuery.data ? ` · ${scoreHint(suggestionsQuery.data)}` : ''}
        </Text>
        {suggestionsQuery.data?.degraded_reason ? (
          <Text type="warning" style={{ display: 'block' }}>
            {suggestionsQuery.data.degraded_reason}
          </Text>
        ) : null}
        {protectedLabels.length ? (
          <Text type="secondary" style={{ display: 'block' }}>
            已人工确认，不再提供建议：{protectedLabels.join('、')}
          </Text>
        ) : null}
        {suggestionsQuery.isLoading ? (
          <Spin size="small" style={{ marginLeft: 8 }} />
        ) : suggestionsQuery.isError ? (
          <Space size={6} style={{ display: 'flex' }}>
            <Text type="danger">标签建议加载失败</Text>
            <Button size="small" type="link" onClick={() => void suggestionsQuery.refetch()}>重试</Button>
          </Space>
        ) : suggestions.length ? (
          <Space wrap size={[4, 4]} style={{ display: 'flex', marginTop: 6 }}>
            {suggestions.map((tag) => (
              <Button key={tag} size="small" disabled={editing && draftTags.includes(tag)} onClick={() => adoptSuggestion(tag)}>
                采用：{tag}
              </Button>
            ))}
          </Space>
        ) : (
          <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>暂无未采用的标签建议。</Text>
        )}
      </div>
    </div>
  )
}
