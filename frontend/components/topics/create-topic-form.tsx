'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App as AntApp, Button, Card, Col, Input, Row, Select, Space, Typography } from 'antd'
import { BulbOutlined, CheckCircleFilled, ClockCircleOutlined } from '@ant-design/icons'
import { createTheme } from '@/lib/api/eea-api'
import { EeaApiError } from '@/lib/api/client'
import { eeaQueryKeys, useRefCodeMaps } from '@/hooks/use-eea-queries'
import type { NavigateFn } from '@/types/platform'

const { Text } = Typography

export function CreateTopicForm({ onNavigate }: { onNavigate: NavigateFn }) {
  const { message: messageApi } = AntApp.useApp()
  const queryClient = useQueryClient()
  const { maps } = useRefCodeMaps()
  const [name, setName] = useState('')
  const [stage, setStage] = useState<string | undefined>()

  const stageOptions = useMemo(
    () => Object.entries(maps.byDomain.value_chain_stage ?? {}).map(([value, label]) => ({ value, label })),
    [maps],
  )

  const mutation = useMutation({
    mutationFn: () => createTheme({ working_name: name.trim(), value_chain_stage_code: stage ?? null }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.themes })
      await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.overview })
      messageApi.success('主题已创建')
      onNavigate('topics')
    },
    onError: (err) => {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(detail || '创建失败')
    },
  })

  return (
    <Row gutter={[18, 18]}>
      <Col xs={24} lg={16}>
        <Card className="panel-card" title="主题信息">
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Input
              size="large"
              placeholder="输入主题名称，例如：区域供电与智能配电"
              value={name}
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
            <Space>
              <Button
                type="primary"
                disabled={!name.trim()}
                loading={mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                创建主题
              </Button>
              <Button onClick={() => onNavigate('topics')}>取消</Button>
            </Space>
          </Space>
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card className="panel-card" title="创建后将发生什么">
          <div className="timeline-item">
            <CheckCircleFilled />
            <div>
              <Text strong>建立主题</Text>
              <Text type="secondary">写入工作名与价值链环节</Text>
            </div>
          </div>
          <div className="timeline-item">
            <BulbOutlined />
            <div>
              <Text strong>人工归集证据</Text>
              <Text type="secondary">在信号详情中指定该主题</Text>
            </div>
          </div>
          <div className="timeline-item">
            <ClockCircleOutlined />
            <div>
              <Text strong>回看频次与来源</Text>
              <Text type="secondary">主题页按服务端口径统计</Text>
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  )
}
