'use client'

import { CloudUploadOutlined } from '@ant-design/icons'
import { Progress, Space, Typography } from 'antd'
import type { PanoramaImportBatchOut } from '@/lib/api/types'
import {
  PANORAMA_IMPORT_REVIEW_HINT,
  PANORAMA_IMPORT_STATUS_LABEL,
} from '@/features/evidence/status'

const { Text, Title } = Typography

export function panoramaBatchProgress(batch: PanoramaImportBatchOut) {
  const total = batch.capture_jobs_total || 0
  const pending = batch.capture_jobs_pending || 0
  const done = Math.max(0, total - pending)
  const percent = total > 0 ? Math.round((done / total) * 100) : batch.status === 'completed' ? 100 : 0
  return { total, done, percent }
}

export function ImportBatchProgressBody({
  batch,
  showTitle,
}: {
  batch: PanoramaImportBatchOut
  showTitle?: boolean
}) {
  const { total, done, percent } = panoramaBatchProgress(batch)

  return (
    <Space orientation="vertical" size={10} style={{ width: '100%' }}>
      {showTitle ? (
        <div className="import-batch-progress-heading">
          <CloudUploadOutlined aria-hidden />
          <Title level={5} style={{ margin: 0 }}>
            批量链接采集 · {PANORAMA_IMPORT_STATUS_LABEL[batch.status]}
          </Title>
        </div>
      ) : null}
      <Text type="secondary">
        {batch.filename ?? '链接列表'}
        {batch.status === 'capturing'
          ? ' — 请保持 EEA Capture 客户端运行。'
          : null}
      </Text>
      {total > 0 ? (
        <Progress
          percent={percent}
          status={
            batch.status === 'failed' ? 'exception' : batch.status === 'completed' ? 'success' : 'active'
          }
          format={() => `${done} / ${total} 链接`}
        />
      ) : (
        <Progress percent={batch.status === 'completed' ? 100 : 0} status="active" showInfo={false} />
      )}
      <Text>
        已留存信号 <strong>{batch.signals_retained}</strong>
        {batch.signals_failed ? (
          <>
            {' '}
            · 失败 <strong>{batch.signals_failed}</strong>
          </>
        ) : null}
        {batch.demands_created ? (
          <>
            {' '}
            · 需求点 <strong>{batch.demands_created}</strong>
          </>
        ) : null}
        {batch.functions_published ? (
          <>
            {' '}
            · 已发布功能 <strong>{batch.functions_published}</strong>
          </>
        ) : null}
      </Text>
      {batch.status === 'completed' ? <Text type="secondary">{PANORAMA_IMPORT_REVIEW_HINT}</Text> : null}
      {batch.error ? <Text type="danger">{batch.error}</Text> : null}
    </Space>
  )
}