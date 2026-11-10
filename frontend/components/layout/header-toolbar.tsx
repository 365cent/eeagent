'use client'

import {
  BellOutlined,
  MoonOutlined,
  SearchOutlined,
  SunOutlined,
} from '@ant-design/icons'
import { Badge, Button, Space, Tag, Tooltip } from 'antd'
import { usePlatformNotifications } from '@/hooks/use-platform-notifications'
import { UserMenu } from '@/components/layout/user-menu'
import type { NavigateFn } from '@/types/platform'

type HeaderToolbarProps = {
  isDark: boolean
  onToggleDark: () => void
  onNavigate: NavigateFn
  onOpenSearch: () => void
}

export function HeaderToolbar({
  isDark,
  onToggleDark,
  onNavigate,
  onOpenSearch,
}: HeaderToolbarProps) {
  const { unreadCount } = usePlatformNotifications()

  return (
    <Space size="small" align="center" className="header-toolbar">
      <Button
        type="default"
        className="header-toolbar-search-btn"
        icon={<SearchOutlined aria-hidden />}
        onClick={onOpenSearch}
        aria-label="打开全局搜索"
      >
        <span className="header-toolbar-search-label">搜索</span>
        <Tag variant="filled" className="header-toolbar-search-kbd">
          Ctrl K
        </Tag>
      </Button>
      <Tooltip title={isDark ? '切换浅色模式' : '切换深色模式'}>
        <Button
          type="text"
          className="header-toolbar-icon-btn"
          icon={isDark ? <SunOutlined /> : <MoonOutlined />}
          onClick={onToggleDark}
          aria-label="切换深浅色模式"
        />
      </Tooltip>
      <Tooltip title="通知">
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <Button
            type="text"
            className="header-toolbar-icon-btn"
            icon={<BellOutlined />}
            onClick={() => onNavigate('notifications')}
            aria-label={unreadCount ? `通知（${unreadCount} 条未读）` : '通知'}
          />
        </Badge>
      </Tooltip>
      <UserMenu onNavigate={onNavigate} />
    </Space>
  )
}
