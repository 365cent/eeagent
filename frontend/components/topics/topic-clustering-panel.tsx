'use client'

import { Card, Col, Row, Space, Statistic, Typography } from 'antd'
import { ClusterOutlined } from '@ant-design/icons'
import { useTopicClusterCandidates } from '@/hooks/use-topic-cluster-candidates'

const { Paragraph } = Typography

export function TopicClusteringPanel() {
  const { stats, signalsLoading, clusterReportLoading } = useTopicClusterCandidates()
  const loading = signalsLoading || clusterReportLoading

  return (
    <Card
      className="panel-card topic-clustering-card"
      title={
        <Space>
          <ClusterOutlined />
          标签归总 · 归纳主题
        </Space>
      }
    >
      <Paragraph type="secondary" className="topic-clustering-intro">
        环节三：相似标签向上归总 → 需求抽象命名。仅计入<strong>已留存</strong>且非验证页/抓取失败的证据；确立主题需
        <strong> ≥2 条可靠证据</strong>且<strong> ≥2 个不同来源站点</strong>。
      </Paragraph>

      <Row gutter={16} className="summary-row">
        <Col xs={12} sm={6}>
          <Statistic title="样本信号" value={loading ? '—' : stats.total} suffix={loading ? undefined : '/ 200'} />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic title="待归纳" value={loading ? '—' : stats.unassigned} styles={{ content: { color: '#d97706' } }} />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic title="待标标签" value={loading ? '—' : stats.noTags} />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic title="候选主题" value={loading ? '—' : stats.candidateTopics} />
        </Col>
      </Row>
    </Card>
  )
}