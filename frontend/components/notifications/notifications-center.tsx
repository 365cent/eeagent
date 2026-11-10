'use client'

import { Button, Card, Space, Typography } from 'antd'
import { PanoramaImportNotificationItem } from '@/components/notifications/panorama-import-notification-item'
import { PlatformEmptyState } from '@/components/shared/empty-state'
import { usePlatformNotifications } from '@/hooks/use-platform-notifications'
import { isPanoramaBatchUnread } from '@/lib/platform-notifications'

const { Text } = Typography

export function NotificationsCenter() {
  const { items, isLoading, isError, refetch, markAllRead, markRead } = usePlatformNotifications()

  const hasUnread = items.some((item) => item.kind === 'panorama_import' && isPanoramaBatchUnread(item.batch))

  return (
    <Card className="panel-card view-card notifications-center-card">
      <div className="notifications-center-head">
        <Text type="secondary">采集批次、复核提醒与协作动态将集中在此。</Text>
        <Space wrap>
          <Button size="small" onClick={() => void refetch()} disabled={isLoading}>
            刷新
          </Button>
          <Button size="small" disabled={!hasUnread} onClick={markAllRead}>
            全部标记已读
          </Button>
        </Space>
      </div>
      {isError ? (
        <PlatformEmptyState
          title="通知加载失败"
          description="请检查与后端的连接后重试。"
          action={
            <Button size="small" onClick={() => void refetch()}>
              重试
            </Button>
          }
        />
      ) : null}
      {!isError && !isLoading && items.length === 0 ? (
        <PlatformEmptyState title="暂无通知" description="进行中的采集或已完成的批量任务会出现在这里。" />
      ) : null}
      {items.length > 0 ? (
        <ul className="notifications-center-list">
          {items.map((item) =>
            item.kind === 'panorama_import' ? (
              <PanoramaImportNotificationItem
                key={item.id}
                batch={item.batch}
                unread={isPanoramaBatchUnread(item.batch)}
                onMarkRead={() => markRead(item.id)}
              />
            ) : null,
          )}
        </ul>
      ) : null}
    </Card>
  )
}
