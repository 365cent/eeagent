'use client'

import { useEffect, useState } from 'react'
import { App as AntApp, Avatar, Button, Card, Col, Form, Input, Row, Select, Space, Table, Typography } from 'antd'
import { PageHeader } from '@/components/shared/page-header'
import type { UtilityPageConfig } from '@/config/utility-pages'
import { fetchAccessHistory } from '@/lib/api/eea-api'
import type { AccessLogOut } from '@/lib/api/types'
import { defaultProfile, loadProfilePrefs, saveProfilePrefs, type UserProfilePrefs } from '@/lib/platform-prefs'

const { Text } = Typography

const VALUE_CHAIN_OPTIONS = [
  '创造端（供应链）',
  '传递端（主机厂）',
  '兑现端（消费者）',
  '规制端（行业标准/规定）',
].map((v) => ({ value: v, label: v }))

const SIGNAL_TYPE_OPTIONS = ['战略', '技术', '人才', '资本', '标准'].map((v) => ({ value: v, label: v }))

type ProfilePageProps = {
  config: UtilityPageConfig
}

export function ProfilePage({ config }: ProfilePageProps) {
  const { message: messageApi } = AntApp.useApp()
  const [form] = Form.useForm<UserProfilePrefs>()
  const [prefs, setPrefs] = useState<UserProfilePrefs>(() => loadProfilePrefs())
  const [displayName, setDisplayName] = useState(() => loadProfilePrefs().displayName ?? '')
  const [visits, setVisits] = useState<AccessLogOut[]>([])
  const [visitsLoading, setVisitsLoading] = useState(true)
  const [visitsError, setVisitsError] = useState(false)

  useEffect(() => {
    const loaded = loadProfilePrefs()
    setPrefs(loaded)
    setDisplayName(loaded.displayName ?? '')
    form.setFieldsValue(loaded)
  }, [form])

  useEffect(() => {
    let alive = true
    fetchAccessHistory(20)
      .then((rows) => {
        if (alive) setVisits(rows)
      })
      .catch(() => {
        if (alive) {
          setVisits([])
          setVisitsError(true)
        }
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
    if (saveProfilePrefs(values)) {
      messageApi.success('个人偏好已保存到当前浏览器')
    } else {
      messageApi.error('浏览器未能保存个人偏好')
    }
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
      <Form
        form={form}
        layout="vertical"
        initialValues={prefs ?? defaultProfile}
        onValuesChange={(_, allValues) => setDisplayName(allValues.displayName ?? '')}
      >
          <Row gutter={[18, 18]}>
            <Col xs={24} lg={16}>
              <Card className="panel-card" title="基本信息">
                <Space align="start" size={20} style={{ marginBottom: 20 }}>
                  <Avatar size={72} className="user-profile-avatar">
                    {displayName.trim()?.[0] ?? '?'}
                  </Avatar>
                  <div>
                    <Text strong style={{ fontSize: 18 }}>
                      {displayName || '未设置显示名称'}
                    </Text>
                    <Text type="secondary">这些资料仅保存在当前浏览器，不用于权限或审计身份识别。</Text>
                  </div>
                </Space>
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
                  <Col span={24}>
                    <Form.Item name="researchTags" label="研究关注标签">
                      <Select mode="tags" placeholder="输入个人关注标签" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card className="panel-card" title="默认筛选偏好" style={{ marginTop: 18 }}>
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
              </Card>

              <Card className="panel-card" title="Agent 个人记忆" style={{ marginTop: 18 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                  用户级短记忆（偏好、常用筛选、澄清结论），与主数据分离；仅采纳高置信度写入（REQ-AGT-03）。
                </Text>
                <Form.Item name="memoryMarkdown">
                  <Input.TextArea rows={8} placeholder="Markdown 格式记忆" />
                </Form.Item>
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card className="panel-card" title="登录历史">
                <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                  此处展示服务端访问记录；网络地址不是用户身份，也不用于授权。
                </Text>
                <Table<AccessLogOut>
                  size="small"
                  rowKey="id"
                  loading={visitsLoading}
                  pagination={false}
                  dataSource={visits}
                  locale={{ emptyText: visitsError ? '访问记录暂不可用，请检查服务连接。' : '暂无访问记录' }}
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
                <Text type="secondary">当前没有可用的 Agent 会话查询接口。</Text>
              </Card>
            </Col>
          </Row>
        </Form>
    </>
  )
}
