'use client'

import { useState } from 'react'
import { App as AntApp, Button, Input, Space, Tag, Typography } from 'antd'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { EeaApiError } from '@/lib/api/client'
import { addSignalSource, fetchSignalSources } from '@/lib/api/eea-api'

const { Text, Link } = Typography

type SignalSourcesProps = {
  signalId: string
  archived?: boolean
}

export function SignalSources({ signalId, archived = false }: SignalSourcesProps) {
  const { message: messageApi } = AntApp.useApp()
  const queryClient = useQueryClient()
  const [url, setUrl] = useState('')
  const [provenance, setProvenance] = useState('')
  const [saving, setSaving] = useState(false)
  const queryKey = ['eea', 'signal-sources', signalId]
  const sourcesQuery = useQuery({
    queryKey,
    queryFn: () => fetchSignalSources(signalId),
  })

  const onAdd = async () => {
    const value = url.trim()
    if (!value) return
    setSaving(true)
    try {
      await addSignalSource(signalId, value, provenance.trim() || undefined)
      setUrl('')
      setProvenance('')
      await queryClient.invalidateQueries({ queryKey })
      messageApi.success('已添加补充来源')
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(detail || '补充来源添加失败')
    } finally {
      setSaving(false)
    }
  }

  const sources = sourcesQuery.data ?? []

  return (
    <div className="signal-sources">
      <Text type="secondary">来源链接</Text>
      <div className="source-list" style={{ marginTop: 8 }}>
        {sourcesQuery.isLoading ? (
          <Text type="secondary">正在加载来源…</Text>
        ) : sources.length === 0 ? (
          <Text type="secondary">暂无补充来源</Text>
        ) : (
          sources.map((source) => (
            <div
              key={source.id}
              className="source-list-item"
              style={{ alignItems: 'flex-start' }}
            >
              <Tag color={source.is_primary ? 'blue' : undefined}>
                {source.is_primary ? '主链接' : '补充'}
              </Tag>
              <div style={{ minWidth: 0, textAlign: 'right' }}>
                <Link
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ overflowWrap: 'anywhere' }}
                >
                  {source.url}
                </Link>
                {source.provenance ? (
                  <div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {source.provenance}
                    </Text>
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
      {archived ? (
        <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
          已归档信号不能新增来源。
        </Text>
      ) : (
        <Space orientation="vertical" size={6} style={{ width: '100%', marginTop: 8 }}>
          <Input
            placeholder="补充来源 URL"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onPressEnter={() => void onAdd()}
            disabled={saving}
          />
          <Input
            placeholder="出处/说明（可选）"
            value={provenance}
            onChange={(event) => setProvenance(event.target.value)}
            disabled={saving}
          />
          <Button
            block
            size="small"
            type="primary"
            ghost
            loading={saving}
            disabled={!url.trim()}
            onClick={() => void onAdd()}
          >
            添加补充来源
          </Button>
        </Space>
      )}
    </div>
  )
}
