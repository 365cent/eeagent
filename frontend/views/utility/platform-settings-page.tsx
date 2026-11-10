'use client'

import { useEffect, useState } from 'react'
import { ClockCircleOutlined } from '@ant-design/icons'
import {
  App as AntApp,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Switch,
  Tag,
  Typography,
} from 'antd'
import { defaultSettings, loadPlatformSettings, savePlatformSettings, type PlatformSettingsPrefs } from '@/lib/platform-prefs'
import { PageHeader } from '@/components/shared/page-header'
import { flattenMainMenuLeafKeys, mainMenuTree } from '@/config/menu'
import type { UtilityPageConfig } from '@/config/utility-pages'

const { Text } = Typography

const landingOptions = [
  { value: 'overview', label: '工作台总览' },
  ...flattenMainMenuLeafKeys()
    .filter((key) => key !== 'overview')
    .map((key) => {
      const label = mainMenuTree.find((node) => node.key === key)?.title ?? key
      return { value: key, label }
    }),
]

type PlatformSettingsPageProps = {
  config: UtilityPageConfig
}

export function PlatformSettingsPage({ config }: PlatformSettingsPageProps) {
  const { message: messageApi } = AntApp.useApp()
  const [form] = Form.useForm<PlatformSettingsPrefs>()
  const [initialValues, setInitialValues] = useState<PlatformSettingsPrefs>(() => loadPlatformSettings())

  useEffect(() => {
    const loaded = loadPlatformSettings()
    setInitialValues(loaded)
    form.setFieldsValue(loaded)
  }, [form])

  const onSave = async () => {
    const values = await form.validateFields()
    if (savePlatformSettings(values)) {
      messageApi.success('设置已保存到当前浏览器；服务器安全策略未更改')
    } else {
      messageApi.error('浏览器未能保存设置')
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
      <Form form={form} layout="vertical" initialValues={initialValues ?? defaultSettings}>
      <Row gutter={[18, 18]}>
        <Col xs={24} lg={14}>
          <Card className="panel-card" title="工作空间">
            <Form.Item name="workspaceName" label="工作空间名称" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="workspaceDescription" label="描述">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="defaultLanding" label="登录后默认页面">
              <Select options={landingOptions} />
            </Form.Item>
          </Card>

          <Card className="panel-card" title="通知策略" style={{ marginTop: 18 }}>
            <Form.Item name="notifySignalReview" label="信号待人工复核" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="notifyCrawlFailure" label="URL 抓取失败" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="notifyDeductionComplete" label="推导链导出完成" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="notifyWeeklyDigest" label="本周研究提醒摘要" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card className="panel-card" title="会话与安全">
            <Form.Item name="sessionIdleMinutes" label="空闲自动登出（分钟）">
              <Select
                options={[
                  { value: 30, label: '30 分钟' },
                  { value: 60, label: '1 小时' },
                  { value: 120, label: '2 小时' },
                  { value: 480, label: '8 小时' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="requireReauthForExport"
              label="导出报告前再次验证"
              valuePropName="checked"
              extra="适用于 PDF 报告与推导链批量导出"
            >
              <Switch />
            </Form.Item>
          </Card>

          <Card className="panel-card" title="EEA Agent" style={{ marginTop: 18 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              与 Pydantic AI 编排一致；写库变更须确认（REQ-AGT-02、REQ-AGT-04）。
            </Text>
            <Form.Item name="agentMemoryEnabled" label="启用个性化 RAG 记忆" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="agentConfirmPatches" label="应用变更单前人工确认" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Card>

          <Card className="panel-card" title="角色与权限（第一期）" style={{ marginTop: 18 }}>
            <Text type="secondary">当前没有可用的服务端角色与权限查询接口。</Text>
          </Card>

          <Card className="panel-card" title="数据与合规" style={{ marginTop: 18 }}>
            <Tag icon={<ClockCircleOutlined />} color="blue">滚动更新</Tag>
            <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
              平台数据随持续扫描更新；界面为当前快照，历史链路只读保留（REQ-RULE-04）。
            </Text>
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              人工纠偏价值链、信号类型与归集结果须留审计痕迹，操作者绑定平台用户身份（REQ-RULE-02）。
            </Text>
          </Card>

        </Col>
      </Row>
    </Form>
    </>
  )
}
