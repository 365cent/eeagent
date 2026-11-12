'use client'

import { useState } from 'react'
import { App as AntApp, Alert, Button, Card, Descriptions, Select, Space, Spin, Tag, Typography } from 'antd'
import { DownloadOutlined, FileMarkdownOutlined, FilePdfOutlined } from '@ant-design/icons'
import { QueryFailure } from '@/components/shared/query-failure'
import { SignalBodyMarkdown } from '@/components/evidence/signal-body-markdown'
import { useLandingRows } from '@/hooks/use-eea-queries'
import { createChainReport, downloadChainReportMarkdown, downloadChainReportPdf, listChainReports } from '@/lib/api/eea-api'
import type { ChainReportOut } from '@/lib/api/types'
import { EeaApiError } from '@/lib/api/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'

const { Text } = Typography

export function ChainReportView({ onNavigate }: { onNavigate: (key: string) => void }) {
  const { message: messageApi } = AntApp.useApp()
  const queryClient = useQueryClient()
  const landingQuery = useLandingRows()
  const [landingPointId, setLandingPointId] = useState<string | undefined>()
  const [previewMd, setPreviewMd] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reportsQuery = useQuery({
    queryKey: ['eea', 'chain-reports'],
    queryFn: listChainReports,
  })

  const generate = async (format: 'md' | 'pdf') => {
    if (!landingPointId) {
      messageApi.warning('请先选择技术落脚点')
      return
    }
    setBusy(true)
    setPreviewMd(null)
    try {
      const report = await createChainReport({ landing_point_id: landingPointId, format })
      await queryClient.invalidateQueries({ queryKey: ['eea', 'chain-reports'] })
      if (report.status === 'failed') {
        messageApi.error(report.error || '报告生成失败')
        return
      }
      if (format === 'pdf') {
        const blob = await downloadChainReportPdf(report.id)
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `eea-chain-report-${report.id.slice(0, 8)}.pdf`
        anchor.click()
        URL.revokeObjectURL(url)
        messageApi.success('PDF 已下载')
        return
      }
      const md = await downloadChainReportMarkdown(report.id)
      setPreviewMd(md)
      messageApi.success('链路报告已生成')
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(detail || '生成失败')
    } finally {
      setBusy(false)
    }
  }

  const openReport = async (report: ChainReportOut) => {
    if (report.status !== 'succeeded') {
      messageApi.warning(`报告状态：${report.status}${report.error ? ` — ${report.error}` : ''}`)
      return
    }
    setBusy(true)
    try {
      const md = await downloadChainReportMarkdown(report.id)
      setPreviewMd(md)
    } catch (err) {
      const detail = err instanceof EeaApiError ? err.message : String(err)
      messageApi.error(detail || '无法加载报告')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Card className="panel-card" title="生成链路报告（BE-15）">
        <Text type="secondary">
          基于已保存的技术落脚点导出确定性 Markdown，内容含需求→功能→标准→战略追溯摘要。
        </Text>
        <Space style={{ marginTop: 12, width: '100%' }} wrap>
          <Select
            allowClear
            showSearch={{ optionFilterProp: 'label' }}
            loading={landingQuery.isLoading}
            style={{ minWidth: 320 }}
            placeholder="选择技术落脚点"
            value={landingPointId}
            onChange={setLandingPointId}
            options={landingQuery.rows.map((row) => ({ value: row.key, label: row.name }))}
          />
          <Button
            type="primary"
            icon={<FileMarkdownOutlined />}
            loading={busy}
            onClick={() => void generate('md')}
          >
            生成 Markdown
          </Button>
          <Button icon={<FilePdfOutlined />} loading={busy} onClick={() => void generate('pdf')}>
            请求 PDF
          </Button>
          {landingPointId ? (
            <Button type="link" onClick={() => onNavigate(`traceDetail/${landingPointId}`)}>
              在追溯页查看同一链
            </Button>
          ) : null}
        </Space>
      </Card>

      <Card className="panel-card" title="最近报告">
        {reportsQuery.isError ? (
          <QueryFailure message="报告列表加载失败。" onRetry={() => void reportsQuery.refetch()} />
        ) : reportsQuery.isLoading ? (
          <Spin />
        ) : (
          <Space orientation="vertical" style={{ width: '100%' }}>
            {(reportsQuery.data ?? []).length === 0 ? (
              <Text type="secondary">尚无已持久化的报告，请先生成一份。</Text>
            ) : (
              (reportsQuery.data ?? []).map((report) => (
                <Card key={report.id} size="small">
                  <Space wrap>
                    <Tag color={report.status === 'succeeded' ? 'green' : report.status === 'failed' ? 'red' : 'default'}>
                      {report.status}
                    </Tag>
                    <Text code>{report.id.slice(0, 8)}</Text>
                    <Button size="small" icon={<DownloadOutlined />} onClick={() => void openReport(report)}>
                      打开 Markdown
                    </Button>
                  </Space>
                </Card>
              ))
            )}
          </Space>
        )}
      </Card>

      {previewMd ? (
        <Card className="panel-card" title="预览">
          <Descriptions size="small" column={1} style={{ marginBottom: 12 }}>
            <Descriptions.Item label="说明">以下为服务端存储的 Markdown 快照，可追溯同一版本证据。</Descriptions.Item>
          </Descriptions>
          <SignalBodyMarkdown markdown={previewMd} className="evidence-markdown-article" />
        </Card>
      ) : (
        <Alert type="info" showIcon title="生成后将在此预览 Markdown，并可通过列表再次打开。" />
      )}
    </Space>
  )
}
