'use client'

import { LinkOutlined } from '@ant-design/icons'
import { Button, Progress, Tag, Typography } from 'antd'
import { formatApiDate } from '@/lib/eea-mappers'
import type { PanoramaImportBatchOut } from '@/lib/api/types'
import {
  PANORAMA_IMPORT_STATUS_LABEL,
  PANORAMA_IMPORT_REVIEW_HINT,
  PANORAMA_IMPORT_STATUS_TAG,
  panoramaImportIsActive,
  panoramaImportStatusIconClass,
} from '@/features/evidence/status'

const { Text, Title } = Typography

export function PanoramaImportNotificationItem({
  batch,
  unread,
  onMarkRead,
}: {
  batch: PanoramaImportBatchOut
  unread?: boolean
  onMarkRead?: () => void
}) {
  const total = batch.capture_jobs_total || 0
  const pending = batch.capture_jobs_pending || 0
  const done = Math.max(0, total - pending)
  const percent =
    total > 0 ? Math.round((done / total) * 100) : batch.status === 'completed' ? 100 : 0
  const active = panoramaImportIsActive(batch.status)
  const tag = PANORAMA_IMPORT_STATUS_TAG[batch.status]
  const when = formatApiDate(batch.structure_finished_at ?? batch.updated_at ?? batch.created_at)

  return (
    <li
      className={`notifications-center-row notifications-center-row--panorama${unread ? ' is-unread' : ''}`}
    >
      <span className={`notifications-center-icon ${panoramaImportStatusIconClass(batch.status)}`} aria-hidden>
        <LinkOutlined />
      </span>
      <div className="notifications-center-body">
        <div className="notifications-center-title-row">
          <div className="notifications-center-title-main">
            <Title level={5} className="notifications-center-title">
              批量链接采集
            </Title>
            <Tag color={tag.color} variant={tag.variant} className="notifications-center-status-tag">
              {PANORAMA_IMPORT_STATUS_LABEL[batch.status]}
            </Tag>
          </div>
          <Text type="secondary" className="notifications-center-time">
            {when}
          </Text>
        </div>
        <Text type="secondary" className="notifications-center-subtitle">
          {batch.filename ?? '链接批量粘贴'}
          {active ? ' · 请在 EEA Capture 客户端保持运行以处理队列' : null}
        </Text>
        {total > 0 ? (
          <div className="notifications-center-progress">
            <Progress
              percent={percent}
              size="small"
              showInfo={false}
              status={
                batch.status === 'failed'
                  ? 'exception'
                  : batch.status === 'completed'
                    ? 'success'
                    : 'active'
              }
            />
            <Text type="secondary" className="notifications-center-progress-label">
              {done}/{total} 链接
            </Text>
          </div>
        ) : null}
        <Text className="notifications-center-stats">
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
        {batch.error ? (
          <Text type="danger" className="notifications-center-error">
            {batch.error}
          </Text>
        ) : null}
      </div>
      {unread && onMarkRead ? (
        <div className="notifications-center-actions">
          <Button type="link" size="small" className="notifications-center-mark-read" onClick={onMarkRead}>
            标记已读
          </Button>
        </div>
      ) : null}
    </li>
  )
}
