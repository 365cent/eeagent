'use client'

import { Button, Card, Col, Row, Space, Table, Tag, Typography } from 'antd'
import { useVocabUsage } from '@/hooks/use-eea-queries'
import { PlatformEmptyState } from '@/components/shared/empty-state'
import type { NavigateFn } from '@/types/platform'

const { Text } = Typography

export function VocabKnowledgePanel({ onNavigate }: { onNavigate: NavigateFn }) {
  const { data, isLoading } = useVocabUsage()
  const rows = data ?? []

  return (
    <Row gutter={[18, 18]}>
      <Col xs={24} lg={15}>
        <Card className="panel-card" title="技术方向词表" extra={<Text type="secondary">GET /vocab/usage</Text>}>
          <Table
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 12 }}
            dataSource={rows}
            locale={{
              emptyText: <PlatformEmptyState title="词表暂无使用记录" description="信号打上技术方向标签后，频次会出现在这里。" />,
            }}
            columns={[
              { title: '词条', dataIndex: 'name' },
              { title: '命中信号', dataIndex: 'frequency', render: (value: number) => <Tag>{value}</Tag> },
              {
                title: '操作',
                render: (_value, record: { name: string }) => (
                  <Button
                    type="link"
                    onClick={() => onNavigate({ view: 'signals', query: { keyword: record.name } })}
                  >
                    查看信号
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      </Col>
      <Col xs={24} lg={9}>
        <Card className="panel-card" title="词表说明">
          <Space orientation="vertical" size={12}>
            <Text type="secondary">
              封闭分类（价值链、信号类型）在证据详情中下拉修正。技术方向可新增，保存后进入全局词表。
            </Text>
            <Button block onClick={() => onNavigate('signals')}>
              打开证据库
            </Button>
            <Button block onClick={() => onNavigate('topics')}>
              打开主题页
            </Button>
          </Space>
        </Card>
      </Col>
    </Row>
  )
}
