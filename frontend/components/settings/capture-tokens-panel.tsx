'use client'

import { CopyOutlined, StopOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App as AntApp, Button, Form, Input, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { EeaApiError, eeaErrorMessage } from '@/lib/api/client'
import { fetchCaptureTokens, issueCaptureToken, revokeCaptureToken } from '@/lib/api/eea-api'
import type { CaptureTokenOut } from '@/lib/api/types'
import { eeaQueryKeys } from '@/lib/query/eea-query-keys'

const { Text, Paragraph } = Typography

type IssueForm = {
  subject: string
  label?: string
}

function formatWhen(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('zh-CN', { hour12: false })
}

export function CaptureTokensPanel() {
  const { message: messageApi, modal: modalApi } = AntApp.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<IssueForm>()
  const tokensQuery = useQuery({
    queryKey: eeaQueryKeys.captureTokens,
    queryFn: fetchCaptureTokens,
    retry: false,
  })

  const issueMutation = useMutation({
    mutationFn: (values: IssueForm) =>
      issueCaptureToken({
        subject: values.subject.trim(),
        label: values.label?.trim() || null,
      }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: eeaQueryKeys.captureTokens })
      form.resetFields()
      modalApi.info({
        title: '采集凭据已签发',
        width: 560,
        content: (
          <Space orientation="vertical" size={8} style={{ width: '100%' }}>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              原始 token 只显示一次。请让研究者在 Windows 客户端执行 <Text code>capture auth set</Text>{' '}
              存入凭据管理器。
            </Paragraph>
            <Input.TextArea readOnly rows={3} value={created.token} />
            <Button
              type="primary"
              icon={<CopyOutlined />}
              onClick={() => {
                void navigator.clipboard
                  .writeText(created.token)
                  .then(() => messageApi.success('已复制'))
                  .catch(() => messageApi.error('复制失败'))
              }}
            >
              复制 token
            </Button>
          </Space>
        ),
      })
    },
    onError: (err) => messageApi.error(eeaErrorMessage(err, '签发失败')),
  })

  const revokeMutation = useMutation({
    mutationFn: revokeCaptureToken,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: eeaQueryKeys.captureTokens })
      messageApi.success('已撤销')
    },
    onError: (err) => messageApi.error(eeaErrorMessage(err, '撤销失败')),
  })

  const confirmRevoke = (row: CaptureTokenOut) => {
    modalApi.confirm({
      title: `撤销「${row.subject}」的采集凭据？`,
      content: '撤销后客户端 Bearer 鉴权立即失效，不能自动从本机凭据管理器移除。',
      okText: '撤销',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => revokeMutation.mutateAsync(row.id),
    })
  }

  const columns: ColumnsType<CaptureTokenOut> = [
    { title: '主体', dataIndex: 'subject', key: 'subject' },
    {
      title: '备注',
      dataIndex: 'label',
      key: 'label',
      render: (value: string | null) => value || '—',
    },
    {
      title: '状态',
      key: 'status',
      render: (_, row) =>
        row.revoked_at ? (
          <Tag color="default">已撤销</Tag>
        ) : row.expires_at && new Date(row.expires_at) < new Date() ? (
          <Tag color="warning">已过期</Tag>
        ) : (
          <Tag color="success">有效</Tag>
        ),
    },
    { title: '签发', dataIndex: 'created_at', key: 'created_at', render: formatWhen },
    { title: '过期', dataIndex: 'expires_at', key: 'expires_at', render: formatWhen },
    {
      title: '操作',
      key: 'actions',
      render: (_, row) =>
        row.revoked_at ? null : (
          <Button
            type="link"
            danger
            size="small"
            icon={<StopOutlined />}
            loading={revokeMutation.isPending}
            onClick={() => confirmRevoke(row)}
          >
            撤销
          </Button>
        ),
    },
  ]

  if (tokensQuery.isLoading) {
    return <Text type="secondary">加载采集凭据…</Text>
  }

  if (tokensQuery.isError) {
    const forbidden = tokensQuery.error instanceof EeaApiError && tokensQuery.error.status === 403
    return (
      <Text type="secondary">
        {forbidden
          ? '仅平台管理员可签发与撤销采集 token；生产环境请通过受信反向代理映射 platform_admin。'
          : eeaErrorMessage(tokensQuery.error, '无法加载采集凭据列表')}
      </Text>
    )
  }

  return (
    <>
      <Form
        form={form}
        layout="inline"
        onFinish={(values) => issueMutation.mutate(values)}
        style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}
      >
        <Form.Item name="subject" rules={[{ required: true, whitespace: true, message: '填写研究者标识' }]}>
          <Input placeholder="研究者主体（如 alice）" style={{ minWidth: 180 }} />
        </Form.Item>
        <Form.Item name="label">
          <Input placeholder="设备备注（可选）" style={{ minWidth: 160 }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={issueMutation.isPending}>
            签发
          </Button>
        </Form.Item>
      </Form>
      <Table
        rowKey="id"
        size="small"
        pagination={false}
        columns={columns}
        dataSource={tokensQuery.data ?? []}
        locale={{ emptyText: '尚无签发记录' }}
      />
    </>
  )
}