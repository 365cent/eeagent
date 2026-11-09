'use client'

import { useEffect, useMemo, useState } from 'react'
import { App as AntApp, Button, Select, Space, Typography } from 'antd'
import { EeaApiError } from '@/lib/api/client'
import { useRefCodeMaps, useSignalTagSuggestions } from '@/hooks/use-eea-queries'
import { useSignalMutations } from '@/hooks/use-signal-mutations'
import type { RefCodeMaps } from '@/lib/eea-mappers'

const { Text } = Typography

type SignalClassificationEditorProps = {
  signalId: string
  stageCode: string | null
  typeCode: string | null
}

function domainOptions(maps: RefCodeMaps, domain: string) {
  return Object.entries(maps.byDomain[domain] ?? {}).map(([value, label]) => ({ value, label }))
}

export function SignalClassificationEditor({
  signalId,
  stageCode,
  typeCode,
}: SignalClassificationEditorProps) {
  const { message: messageApi } = AntApp.useApp()
  const { maps, isSuccess } = useRefCodeMaps()
  const { patchClassification } = useSignalMutations(signalId)
  const suggestionsQuery = useSignalTagSuggestions(signalId)
  const [editing, setEditing] = useState(false)
  const [draftStage, setDraftStage] = useState<string | null>(stageCode)
  const [draftType, setDraftType] = useState<string | null>(typeCode)

  useEffect(() => {
    if (!editing) {
      setDraftStage(stageCode)
      setDraftType(typeCode)
    }
  }, [stageCode, typeCode, editing])

  const stageOptions = useMemo(() => domainOptions(maps, 'value_chain_stage'), [maps])
  const typeOptions = useMemo(() => domainOptions(maps, 'signal_type'), [maps])
  const suggestedStage = suggestionsQuery.data?.value_chain_stage_code ?? null
  const suggestedType = suggestionsQuery.data?.signal_type_code ?? null
  const suggestedStageLabel = stageOptions.find((option) => option.value === suggestedStage)?.label
  const suggestedTypeLabel = typeOptions.find((option) => option.value === suggestedType)?.label

  const adoptStageSuggestion = () => {
    if (!suggestedStage || !suggestedStageLabel) return
    setDraftStage(suggestedStage)
    setEditing(true)
  }

  const adoptTypeSuggestion = () => {
    if (!suggestedType || !suggestedTypeLabel) return
    setDraftType(suggestedType)
    setEditing(true)
  }

  const cancel = () => {
    setDraftStage(stageCode)
    setDraftType(typeCode)
    setEditing(false)
  }

  const save = async () => {
    try {
      await patchClassification.mutateAsync({
        value_chain_stage_code: draftStage,
        signal_type_code: draftType,
      })
      messageApi.success('分类已保存')
      setEditing(false)
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(detail || '保存失败')
    }
  }

  const stageLabel = stageOptions.find((o) => o.value === (editing ? draftStage : stageCode))?.label ?? '未判定'
  const typeLabel = typeOptions.find((o) => o.value === (editing ? draftType : typeCode))?.label ?? '未判定'

  return (
    <div className="signal-classification-editor">
      <div className="pane-heading-row" style={{ marginBottom: 8 }}>
        <Text strong>价值链与信号类型</Text>
        {!editing ? (
          <Button size="small" type="link" onClick={() => setEditing(true)} disabled={!isSuccess}>
            修正
          </Button>
        ) : (
          <Space size={4}>
            <Button size="small" onClick={cancel}>
              取消
            </Button>
            <Button size="small" type="primary" loading={patchClassification.isPending} onClick={() => void save()}>
              保存
            </Button>
          </Space>
        )}
      </div>
      <div style={{ marginBottom: 10 }}>
        <Text type="secondary">模型建议（需人工明确采用）</Text>
        {suggestionsQuery.isLoading ? (
          <Text type="secondary" style={{ display: 'block' }}>正在加载建议…</Text>
        ) : suggestionsQuery.isError ? (
          <Space size={6}>
            <Text type="danger">建议加载失败</Text>
            <Button size="small" type="link" onClick={() => void suggestionsQuery.refetch()}>重试</Button>
          </Space>
        ) : (
          <Space wrap size={[6, 4]} style={{ display: 'flex', marginTop: 4 }}>
            <Text>环节：{suggestedStageLabel ?? (suggestedStage ? `未知词表代码（${suggestedStage}）` : '无建议')}</Text>
            <Button size="small" type="link" disabled={!suggestedStageLabel || suggestedStage === (editing ? draftStage : stageCode)} onClick={adoptStageSuggestion}>
              采用环节建议
            </Button>
            <Text>类型：{suggestedTypeLabel ?? (suggestedType ? `未知词表代码（${suggestedType}）` : '无建议')}</Text>
            <Button size="small" type="link" disabled={!suggestedTypeLabel || suggestedType === (editing ? draftType : typeCode)} onClick={adoptTypeSuggestion}>
              采用类型建议
            </Button>
          </Space>
        )}
      </div>
      {editing ? (
        <Space orientation="vertical" size={8} style={{ width: '100%' }}>
          <div>
            <Text type="secondary">价值链环节</Text>
            <Select
              allowClear
              placeholder="选择环节"
              style={{ width: '100%', marginTop: 4 }}
              value={draftStage}
              options={stageOptions}
              onChange={(value) => setDraftStage(value ?? null)}
            />
          </div>
          <div>
            <Text type="secondary">信号类型</Text>
            <Select
              allowClear
              placeholder="选择类型"
              style={{ width: '100%', marginTop: 4 }}
              value={draftType}
              options={typeOptions}
              onChange={(value) => setDraftType(value ?? null)}
            />
          </div>
        </Space>
      ) : (
        <Space wrap size={[4, 4]}>
          <Text type="secondary">环节</Text>
          <Text>{stageLabel}</Text>
          <Text type="secondary">类型</Text>
          <Text>{typeLabel}</Text>
        </Space>
      )}
    </div>
  )
}
