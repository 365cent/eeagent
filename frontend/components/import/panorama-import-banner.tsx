'use client'

import { CloudUploadOutlined } from '@ant-design/icons'
import { Alert, Typography } from 'antd'
import type { PanoramaImportBatchOut } from '@/lib/api/types'
import { PANORAMA_IMPORT_STATUS_LABEL, panoramaImportAlertType } from '@/features/evidence/status'
import { getCaptureClientDownloadUrl } from '@/lib/api/config'
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
  const active = batch.status === 'capturing' || batch.status === 'structuring'
  const download = (
    <Typography.Link
      href={getCaptureClientDownloadUrl()}
      download
      style={{ display: 'inline-block', marginTop: 8 }}
    >
      没有客户端？下载 EEA Capture（Windows）
    </Typography.Link>
  )

  if (variant === 'panel') {
    return (
      <div className={compact ? 'panorama-import-banner--compact' : undefined}>
        <ImportBatchProgressBody batch={batch} showTitle />
        {active ? download : null}
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
          {active ? download : null}
        </>
      }
      style={compact ? undefined : { marginBottom: 16 }}
      className={compact ? 'panorama-import-banner--compact' : undefined}
    />
  )
}