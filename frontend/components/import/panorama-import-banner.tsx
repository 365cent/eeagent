'use client'

import { CloudUploadOutlined } from '@ant-design/icons'
import { Alert, Progress, Space, Typography } from 'antd'
import type { PanoramaImportBatchOut } from '@/lib/api/types'
import {
  PANORAMA_IMPORT_STATUS_LABEL,
  panoramaImportAlertType,
} from '@/features/evidence/status'

const { Text } = Typography

export function PanoramaImportBanner({
  batch,
  compact,
}: {
  batch: PanoramaImportBatchOut
  /** Notification center: no outer margin. */
  compact?: boolean
}) {
  const total = batch.capture_jobs_total || 0
  const pending = batch.capture_jobs_pending || 0
  const done = Math.max(0, total - pending)
  const percent = total > 0 ? Math.round((done / total) * 100) : batch.status === 'completed' ? 100 : 0
  const type = panoramaImportAlertType(batch.status)

  return (
    <Alert
      type={type}
      showIcon
      icon={<CloudUploadOutlined />}
      title={`批量链接采集 · ${PANORAMA_IMPORT_STATUS_LABEL[batch.status]}`}
      description={
        <Space orientation="vertical" size={8} style={{ width: '100%' }}>
          <Text type="secondary">
            {batch.filename ?? '链接列表'}
            {batch.status === 'capturing'
              ? ' — 请在 EEA Capture 客户端保持运行，自动采集队列中的链接。'
              : null}
          </Text>
          {total > 0 ? (
            <Progress
              percent={percent}
              size="small"
              status={batch.status === 'failed' ? 'exception' : batch.status === 'completed' ? 'success' : 'active'}
              format={() => `${done}/${total} 链接`}
            />
          ) : null}
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
          {batch.error ? <Text type="danger">{batch.error}</Text> : null}
        </Space>
      }
      style={compact ? undefined : { marginBottom: 16 }}
      className={compact ? 'panorama-import-banner--compact' : undefined}
    />
  )
}
