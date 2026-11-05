'use client'

import { useEffect, useState } from 'react'
import { App as AntApp, Avatar, Button, Card, Col, Form, Input, Row, Select, Space, Table, Tag, Typography } from 'antd'
import { PageHeader } from '@/components/shared/page-header'
import type { UtilityPageConfig } from '@/config/utility-pages'
import type { NavigateFn } from '@/types/platform'
import { fetchAccessHistory } from '@/lib/api/eea-api'
import type { AccessLogOut } from '@/lib/api/types'
import {
  defaultProfile,
  loadProfilePrefs,
  saveProfilePrefs,
  type UserProfilePrefs,
} from '@/lib/platform-prefs'

const { Text } = Typography

const VALUE_CHAIN_OPTIONS = [
  '创造端（供应链）',
  '传递端（主机厂）',
  '兑现端（消费者）',
  '规制端（行业标准/规定）',
].map((v) => ({ value: v, label: v }))

const SIGNAL_TYPE_OPTIONS = ['战略', '技术', '人才', '资本', '标准'].map((v) => ({ value: v, label: v }))

const agentSessions = [
  { key: 's1', name: '48V 配电证据追问', updated: '2026-06-18 14:22' },
  { key: 's2', name: 'eFuse 落脚点澄清', updated: '2026-06-17 09:05' },
]

type ProfilePageProps = {
  config: UtilityPageConfig
  onNavigate: NavigateFn
}

export function ProfilePage({ config, onNavigate }: ProfilePageProps) {
  const { message: messageApi } = AntApp.useApp()
  const [form] = Form.useForm<UserProfilePrefs>()
  const [loading, setLoading] = useState(true)
  const [visits, setVisits] = useState<AccessLogOut[]>([])
  const [visitsLoading, setVisitsLoading] = useState(true)

  useEffect(() => {
    form.setFieldsValue(loadProfilePrefs())
    setLoading(false)
  }, [form])

  useEffect(() => {
    let alive = true
    fetchAccessHistory(20)
      .then((rows) => {
        if (alive) setVisits(rows)
      })
      .catch(() => {
        if (alive) setVisits([])
      })
      .finally(() => {
        if (alive) setVisitsLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const formatVisitTime = (iso: string) =>
    new Date(iso).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

  const onSave = async () => {
    const values = await form.validateFields()
    saveProfilePrefs(values)
    messageApi.success('个人资料与记忆已保存（本地演示）')
  }

  const onResetMemory = () => {
    form.setFieldValue('memoryMarkdown', defaultProfile.memoryMarkdown)
    messageApi.info('已恢复默认记忆模板')
  }

  return (
    <>
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        action={
          <Button type="primary" icon={config.icon} onClick={onSave}>
            {config.action}
          </Button>
        }
      />
      <Row gutter={[18, 18]}>
      <Col xs={24} lg={16}>
        <Card className="panel-card" title="基本信息" loading={loading}>
          <Space align="start" size={20} style={{ marginBottom: 20 }}>
            <Avatar size={72} className="user-profile-avatar">LW</Avatar>
            <div>
              <Text strong style={{ fontSize: 18 }}>{form.getFieldValue('displayName') ?? defaultProfile.displayName}</Text>
              <div>
                <Tag color="blue">{form.getFieldValue('roleTitle') ?? defaultProfile.roleTitle}</Tag>
                <Tag color={form.getFieldValue('platformRole') === 'taxonomy_admin' ? 'purple' : 'default'}>
                  {form.getFieldValue('platformRole') === 'taxonomy_admin' ? '方法论/词表管理员' : '研究者'}
                </Tag>
              </div>
              <Text type="secondary">操作者身份将写入纠偏审计（REQ-RULE-02）</Text>
            </div>
          </Space>
          <Form form={form} layout="vertical" initialValues={defaultProfile}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="displayName" label="显示名称" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="email" label="工作邮箱" rules={[{ type: 'email' }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="roleTitle" label="职务">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="platformRole" label="平台角色">
                  <Select
                    options={[
                      { value: 'researcher', label: '研究者 — 采集与推导' },
                      { value: 'taxonomy_admin', label: '方法论/词表管理员 — 分类复核' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name="researchTags" label="研究关注标签">
                  <Select
                    mode="tags"
                    placeholder="智能配电、区域控制器…"
                    options={['智能汽车', 'EEA', '智能配电', '区域控制器', '功能安全', 'eFuse'].map((t) => ({
                      value: t,
                      label: t,
                    }))}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        <Card className="panel-card" title="默认筛选偏好" style={{ marginTop: 18 }}>
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="defaultValueChain" label="默认价值链环节">
                  <Select options={VALUE_CHAIN_OPTIONS} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="defaultSignalType" label="默认信号类型">
                  <Select options={SIGNAL_TYPE_OPTIONS} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        <Card
          className="panel-card"
          title="Agent 个人记忆"
          extra={<Button type="link" onClick={onResetMemory}>恢复模板</Button>}
          style={{ marginTop: 18 }}
        >
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            用户级短记忆（偏好、常用筛选、澄清结论），与主数据分离；仅采纳高置信度写入（REQ-AGT-03）。
          </Text>
          <Form form={form} layout="vertical">
            <Form.Item name="memoryMarkdown">
              <Input.TextArea rows={8} placeholder="Markdown 格式记忆" />
            </Form.Item>
          </Form>
        </Card>
      </Col>

      <Col xs={24} lg={8}>
        <Card className="panel-card" title="登录历史">
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            按内网 IP 自动识别，无需登录；仅保留浏览器版本与操作系统。
          </Text>
          <Table<AccessLogOut>
            size="small"
            rowKey="id"
            loading={visitsLoading}
            pagination={false}
            dataSource={visits}
            locale={{ emptyText: '暂无访问记录' }}
            columns={[
              {
                title: '时间',
                dataIndex: 'created_at',
                width: 78,
                render: (value: string) => formatVisitTime(value),
              },
              {
                title: '客户端',
                dataIndex: 'ua_browser',
                width: 124,
                render: (_: string, row) => (
                  <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.35 }}>
                    <span>{row.ua_browser}</span>
                    <span style={{ color: 'var(--ant-color-text-secondary, #8c8c8c)' }}>{row.ua_os}</span>
                  </div>
                ),
              },
              { title: 'IP', dataIndex: 'ip', width: 100, ellipsis: true },
            ]}
          />
        </Card>

        <Card className="panel-card" title="Agent 会话" style={{ marginTop: 18 }}>
          {process.env.NODE_ENV === 'development' ? (
            <>
              <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                多会话持久化；每线程一条 conversation_id（REQ-AGT-01，开发预览）。
              </Text>
              <Table
                size="small"
                pagination={false}
                dataSource={agentSessions}
                columns={[
                  { title: '会话', dataIndex: 'name', ellipsis: true },
                  { title: '更新', dataIndex: 'updated', width: 120 },
                ]}
              />
            </>
          ) : (
            <Text type="secondary">多会话 Agent 将在第二阶段（业务 skills 就绪后）接入。</Text>
          )}
        </Card>
      </Col>
    </Row>
    </>
  )
}
