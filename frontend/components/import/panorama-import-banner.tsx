'use client'

import { CloudUploadOutlined } from '@ant-design/icons'
import { Alert } from 'antd'
import type { PanoramaImportBatchOut } from '@/lib/api/types'
import { PANORAMA_IMPORT_STATUS_LABEL, panoramaImportAlertType } from '@/features/evidence/status'
import { CaptureClientDownloads } from '@/components/import/capture-client-downloads'
import { ImportBatchProgressBody } from '@/components/import/import-batch-progress-body'

export function PanoramaImportBanner({
  batch,
  compact,
  variant = 'alert',
}: {
  batch: PanoramaImportBatchOut
  /** Notification center: no outer margin. */
  compact?: boolean
  variant?: 'alert' | 'panel'
}) {
  const type = panoramaImportAlertType(batch.status)
  const showDownload = batch.status !== 'completed'
  const download = (
    <div style={{ marginTop: 8 }}>
      <CaptureClientDownloads lead="没有客户端？" />
    </div>
  )

  if (variant === 'panel') {
    return (
      <div className={compact ? 'panorama-import-banner--compact' : undefined}>
        <ImportBatchProgressBody batch={batch} showTitle />
        {showDownload ? download : null}
      </div>
    )
  }

  return (
    <Alert
      type={type}
      showIcon
      icon={<CloudUploadOutlined />}
      title={`批量链接采集 · ${PANORAMA_IMPORT_STATUS_LABEL[batch.status]}`}
      description={
        <>
          <ImportBatchProgressBody batch={batch} />
          {showDownload ? download : null}
        </>
      }
      style={compact ? undefined : { marginBottom: 16 }}
      className={compact ? 'panorama-import-banner--compact' : undefined}
    />
  )
}