'use client'

import {
  BellOutlined,
  MoonOutlined,
  SearchOutlined,
  SunOutlined,
} from '@ant-design/icons'
import { Button, Input, Space, Tag, Tooltip } from 'antd'
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
  return (
    <Space size="middle" align="center">
      <Input
        readOnly
        allowClear={false}
        className="header-toolbar-search"
        prefix={<SearchOutlined />}
        suffix={
          <Tag variant="filled" style={{ margin: 0, cursor: 'default' }}>
            Ctrl K
          </Tag>
        }
        placeholder="搜索信号、主题、页面…"
        onClick={onOpenSearch}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onOpenSearch()
          }
        }}
        aria-label="打开全局搜索"
      />
      <Tooltip title={isDark ? '切换浅色模式' : '切换深色模式'}>
        <Button
          type="text"
          icon={isDark ? <SunOutlined /> : <MoonOutlined />}
          onClick={onToggleDark}
          aria-label="切换深浅色模式"
        />
      </Tooltip>
      <Tooltip title="通知">
        <Button type="text" icon={<BellOutlined />} onClick={() => onNavigate('notifications')} />
      </Tooltip>
      <UserMenu onNavigate={onNavigate} />
    </Space>
  )
}
