'use client'

import { useEffect, useState } from 'react'
import {
  BellOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  List,
  Row,
  Select,
  Space,
  Button,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd'

const { Text, Paragraph } = Typography

const PROFILE_STORAGE_KEY = 'eea-user-profile'
const SETTINGS_STORAGE_KEY = 'eea-platform-settings'

type ProfileForm = {
  displayName: string
  email: string
  role: string
  workspace: string
  interestTags: string[]
  memoryMarkdown: string
  notifyReview: boolean
  notifyCapture: boolean
}

type PlatformSettingsForm = {
  workspaceName: string
  defaultLanding: string
  notifyEmail: boolean
  notifyInApp: boolean
  weeklyDigest: boolean
  sessionHours: number
  agentAutoSuggest: boolean
  agentRequireConfirm: boolean
}

const defaultProfile: ProfileForm = {
  displayName: '',
  email: '',
  role: '',
  workspace: '',
  interestTags: [],
  memoryMarkdown: '',
  notifyReview: false,
  notifyCapture: false,
}

const defaultSettings: PlatformSettingsForm = {
  workspaceName: '',
  defaultLanding: 'overview',
  notifyEmail: true,
  notifyInApp: true,
  weeklyDigest: true,
  sessionHours: 8,
  agentAutoSuggest: true,
  agentRequireConfirm: true,
}

const recentVisits: { key: string; title: string; path: string; time: string }[] = []

const roleMatrix: { role: string; scope: string }[] = []

type ProfileViewProps = {
  onNavigate: (view: string) => void
  onSaved: () => void
}

export function ProfileView({ onNavigate, onSaved }: ProfileViewProps) {
  const [form] = Form.useForm<ProfileForm>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY)
      if (raw) form.setFieldsValue({ ...defaultProfile, ...JSON.parse(raw) })
      else form.setFieldsValue(defaultProfile)
    } catch {
      form.setFieldsValue(defaultProfile)
    }
  }, [form])

  const save = async () => {
    const values = await form.validateFields()
    setLoading(true)
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(values))
      onSaved()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Row gutter={[18, 18]}>
      <Col xs={24} lg={8}>
        <Card className="panel-card" title="账户概览">
          <Space orientation="vertical" size={16} style={{ width: '100%' }} align="center">
            <Avatar size={72} className="user-profile-avatar">{form.getFieldValue('displayName')?.trim()?.[0] ?? '?'}</Avatar>
            <div style={{ textAlign: 'center' }}>
              <Text strong style={{ fontSize: 18 }}>{form.getFieldValue('displayName') || '未设置显示名称'}</Text>
              <br />
              <Text type="secondary">个人资料仅保存在当前浏览器</Text>
            </div>
            <Descriptions column={1} size="small" style={{ width: '100%' }}>
              <Descriptions.Item label="平台角色">未由服务端提供</Descriptions.Item>
              <Descriptions.Item label="Agent 会话">当前没有可用的会话查询接口</Descriptions.Item>
            </Descriptions>
          </Space>
        </Card>
        <Card className="panel-card" title="最近访问" style={{ marginTop: 18 }}>
          <List
            size="small"
            dataSource={recentVisits}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <a key="open" onClick={() => onNavigate(item.path)}>打开</a>,
                ]}
              >
                <List.Item.Meta
                  avatar={<HistoryOutlined />}
                  title={item.title}
                  description={item.time}
                />
              </List.Item>
            )}
          />
        </Card>
      </Col>
      <Col xs={24} lg={16}>
        <Card className="panel-card" title="个人资料与 Agent 记忆">
          <Paragraph type="secondary">
            用户级短记忆与偏好单独存储，可与平台主数据分离、可删除（§7.2 记忆增强 RAG）。
          </Paragraph>
          <Form form={form} layout="vertical" onFinish={save}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="displayName" label="显示名称" rules={[{ required: true }]}>
                  <Input size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="email" label="工作邮箱" rules={[{ type: 'email' }]}>
                  <Input size="large" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="workspace" label="默认工作空间">
              <Select
                options={[
                  { value: '技术战略研究组', label: '技术战略研究组' },
                  { value: '智能配电专题组', label: '智能配电专题组' },
                ]}
              />
            </Form.Item>
            <Form.Item name="interestTags" label="研究兴趣标签">
              <Select
                mode="tags"
                placeholder="用于推荐与 RAG 检索偏好"
                options={['智能汽车', 'EEA', '智能配电', '功能安全', 'eFuse', 'SDV'].map((t) => ({
                  value: t,
                  label: t,
                }))}
              />
            </Form.Item>
            <Form.Item name="memoryMarkdown" label="用户记忆（Markdown）">
              <Input.TextArea
                rows={8}
                placeholder="仅采纳高置信度修改；供 EEA Agent 注入上下文"
              />
            </Form.Item>
            <Divider plain>通知偏好</Divider>
            <Form.Item name="notifyReview" label="待人工复核信号" valuePropName="checked">
              <Switch checkedChildren="开" unCheckedChildren="关" />
            </Form.Item>
            <Form.Item name="notifyCapture" label="采集任务完成" valuePropName="checked">
              <Switch checkedChildren="开" unCheckedChildren="关" />
            </Form.Item>
            <Divider />
            <Space>
              <Button type="primary" loading={loading} onClick={() => form.submit()}>
                保存资料
              </Button>
              <Button onClick={() => onNavigate('settings')}>平台设置</Button>
            </Space>
          </Form>
        </Card>
      </Col>
    </Row>
  )
}

type PlatformSettingsViewProps = {
  onSaved: () => void
}

export function PlatformSettingsView({ onSaved }: PlatformSettingsViewProps) {
  const [form] = Form.useForm<PlatformSettingsForm>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (raw) form.setFieldsValue({ ...defaultSettings, ...JSON.parse(raw) })
      else form.setFieldsValue(defaultSettings)
    } catch {
      form.setFieldsValue(defaultSettings)
    }
  }, [form])

  const save = async () => {
    const values = await form.validateFields()
    setLoading(true)
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(values))
      onSaved()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Row gutter={[18, 18]}>
      <Col xs={24} lg={14}>
        <Card className="panel-card" title="工作空间">
          <Form form={form} layout="vertical" onFinish={save}>
            <Form.Item name="workspaceName" label="工作空间名称" rules={[{ required: true }]}>
              <Input prefix={<TeamOutlined />} size="large" />
            </Form.Item>
            <Form.Item name="defaultLanding" label="登录后默认页面">
              <Select
                options={[
                  { value: 'overview', label: '工作台总览' },
                  { value: 'signals', label: '信号采集·证据库' },
                  { value: 'topics', label: '标签与主题归纳' },
                ]}
              />
            </Form.Item>
            <Divider plain>通知策略</Divider>
            <Form.Item name="notifyInApp" label="站内通知" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="notifyEmail" label="邮件摘要" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="weeklyDigest" label="每周研究节奏提醒" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Divider plain>会话安全</Divider>
            <Form.Item name="sessionHours" label="空闲自动登出（小时）">
              <Select
                options={[4, 8, 12, 24].map((h) => ({ value: h, label: `${h} 小时` }))}
              />
            </Form.Item>
            <Divider plain>EEA Agent 写回</Divider>
            <Form.Item
              name="agentAutoSuggest"
              label="自动给出标签/归集建议"
              valuePropName="checked"
              extra="对应 search_rag / 工具建议，不直接写库"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="agentRequireConfirm"
              label="数据库变更须人工确认"
              valuePropName="checked"
              extra="apply_confirmed_patch 前必须确认（REQ-AGT-02）"
            >
              <Switch />
            </Form.Item>
            <Button type="primary" loading={loading} onClick={() => form.submit()}>
              保存设置
            </Button>
          </Form>
        </Card>
      </Col>
      <Col xs={24} lg={10}>
        <Card className="panel-card" title="角色与权限（第一期）">
          <Table
            pagination={false}
            size="small"
            dataSource={roleMatrix.map((r, i) => ({ key: i, ...r }))}
            columns={[
              { title: '角色', dataIndex: 'role', width: 140 },
              { title: '能力范围', dataIndex: 'scope' },
            ]}
          />
        </Card>
        <Card className="panel-card" title="数据与合规" style={{ marginTop: 18 }}>
          <Space orientation="vertical" size={12}>
            <Tag icon={<ClockCircleOutlined />} color="blue">滚动更新</Tag>
            <Text type="secondary">
              平台数据随持续扫描更新；界面展示为当前快照，历史链路只读保留（REQ-RULE-04）。
            </Text>
            <Text type="secondary">
              人工纠偏价值链环节、信号类型与归集结果须留审计痕迹，操作者绑定平台用户身份（REQ-RULE-02）。
            </Text>
          </Space>
        </Card>
      </Col>
    </Row>
  )
}
