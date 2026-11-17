'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App as AntApp, Input, Modal, Select } from 'antd'
import { updateTheme } from '@/lib/api/eea-api'
import { eeaErrorMessage } from '@/lib/api/client'
import { eeaQueryKeys, useRefCodeMaps } from '@/hooks/use-eea-queries'
import type { ThemeDetail } from '@/lib/api/types'

type ThemeEditModalProps = {
  theme: ThemeDetail | null
  open: boolean
  onClose: () => void
}

export function ThemeEditModal({ theme, open, onClose }: ThemeEditModalProps) {
  const { message: messageApi } = AntApp.useApp()
  const queryClient = useQueryClient()
  const { maps } = useRefCodeMaps()
  const [name, setName] = useState('')
  const [stage, setStage] = useState<string | undefined>()

  useEffect(() => {
    if (!open || !theme) return
    setName(theme.working_name)
    setStage(theme.value_chain_stage_code ?? undefined)
  }, [open, theme])

  const stageOptions = useMemo(
    () => Object.entries(maps.byDomain.value_chain_stage ?? {}).map(([value, label]) => ({ value, label })),
    [maps],
  )

  const mutation = useMutation({
    mutationFn: () => {
      if (!theme) throw new Error('no theme')
      return updateTheme(theme.id, {
        working_name: name.trim(),
        value_chain_stage_code: stage ?? null,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.themes })
      await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.overview })
      messageApi.success('主题已更新')
      onClose()
    },
    onError: (err) => {
      const detail = eeaErrorMessage(err)
      messageApi.error(detail || '保存失败')
    },
  })

  return (
    <Modal
      title="编辑主题"
      open={open}
      destroyOnHidden
      okText="保存"
      cancelText="取消"
      confirmLoading={mutation.isPending}
      onCancel={onClose}
      onOk={() => {
        if (!name.trim()) {
          messageApi.warning('请输入工作名')
          return
        }
        mutation.mutate()
      }}
    >
      <Input
        style={{ marginBottom: 12 }}
        placeholder="主题工作名"
        value={name}
        maxLength={120}
        showCount
        onChange={(e) => setName(e.target.value)}
      />
      <Select
        allowClear
        style={{ width: '100%' }}
        placeholder="价值链环节（可选）"
        value={stage}
        options={stageOptions}
        onChange={(value) => setStage(value)}
      />
    </Modal>
  )
}
