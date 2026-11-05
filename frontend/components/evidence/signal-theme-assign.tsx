'use client'

import { useMemo } from 'react'
import { App as AntApp, Button, Select, Space, Typography } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { fetchThemes } from '@/lib/api/eea-api'
import { EeaApiError } from '@/lib/api/client'
import { useSignalMutations } from '@/hooks/use-signal-mutations'
import { eeaQueryKeys } from '@/hooks/use-eea-queries'
import { MetricHint } from '@/components/shared/metric-hint'
import { metricsFootnote } from '@/lib/metrics-copy'

const { Text } = Typography

type SignalThemeAssignProps = {
  signalId: string
  themeId: string | null
  themeName: string | null
  isDocumentSource: boolean
}

export function SignalThemeAssign({
  signalId,
  themeId,
  themeName,
  isDocumentSource,
}: SignalThemeAssignProps) {
  const { message: messageApi } = AntApp.useApp()
  const { setTheme, autoAggregate } = useSignalMutations(signalId)
  const themesQuery = useQuery({
    queryKey: eeaQueryKeys.themes,
    queryFn: fetchThemes,
  })

  const options = useMemo(
    () =>
      (themesQuery.data ?? []).map((t) => ({
        value: t.id,
        label: t.working_name,
      })),
    [themesQuery.data],
  )

  const onSelectTheme = async (value: string | null) => {
    try {
      await setTheme.mutateAsync(value)
      messageApi.success(value ? '已指定主题' : '已移出主题')
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(detail || '主题更新失败')
    }
  }

  const onAutoAggregate = async () => {
    try {
      await autoAggregate.mutateAsync()
      messageApi.success('已尝试自动归集')
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(detail || '自动归集不可用')
    }
  }

  return (
    <div className="signal-theme-assign">
      <MetricHint label="向上归集" hint={metricsFootnote} />
      <Space orientation="vertical" size={8} style={{ width: '100%', marginTop: 6 }}>
        <Select
          allowClear
          placeholder="选择技术主题"
          style={{ width: '100%' }}
          value={themeId}
          options={options}
          loading={themesQuery.isLoading}
          onChange={(value) => void onSelectTheme(value ?? null)}
          disabled={setTheme.isPending}
        />
        {themeName ? (
          <Text type="secondary">当前：{themeName}</Text>
        ) : (
          <Text type="secondary">
            {isDocumentSource ? '文档来源信号默认无主题，请人工指定。' : '尚未归集到主题'}
          </Text>
        )}
        <Space wrap>
          <Button size="small" onClick={() => void onSelectTheme(null)} disabled={!themeId || setTheme.isPending}>
            移出主题
          </Button>
          {!isDocumentSource ? (
            <Button
              size="small"
              type="primary"
              ghost
              loading={autoAggregate.isPending}
              onClick={() => void onAutoAggregate()}
            >
              自动归集
            </Button>
          ) : null}
        </Space>
      </Space>
    </div>
  )
}
