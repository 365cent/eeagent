'use client'

import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { Button, Typography } from 'antd'
import { HeaderToolbar } from '@/components/layout/header-toolbar'
import type { NavigateFn } from '@/types/platform'

const { Text, Title } = Typography

type PlatformPageHeaderProps = {
  pageTitle: string
  isDark: boolean
  siderCollapsed: boolean
  isMobile: boolean
  onToggleDark: () => void
  onNavigate: NavigateFn
  onOpenSearch: () => void
  onOpenMobileNav: () => void
  onCollapseSider: () => void
}

export function PlatformPageHeader({
  pageTitle,
  isDark,
  siderCollapsed,
  isMobile,
  onToggleDark,
  onNavigate,
  onOpenSearch,
  onOpenMobileNav,
  onCollapseSider,
}: PlatformPageHeaderProps) {
  return (
    <header className="platform-page-header">
      <div className="topbar-left">
        {isMobile ? (
          <Button
            className="mobile-nav-toggle"
            type="text"
            icon={<MenuUnfoldOutlined />}
            onClick={onOpenMobileNav}
            aria-label="打开导航"
          />
        ) : (
          !siderCollapsed && (
            <Button
              className="sider-nav-toggle"
              type="text"
              icon={<MenuFoldOutlined />}
              onClick={onCollapseSider}
              aria-label="收起侧栏"
            />
          )
        )}
        <div className="topbar-titles">
          <Text className="breadcrumb" type="secondary">
            {pageTitle} / EEA 技术扫描平台
          </Text>
          <Title level={4} className="page-heading">{pageTitle}</Title>
        </div>
      </div>
      <HeaderToolbar
        isDark={isDark}
        onToggleDark={onToggleDark}
        onNavigate={onNavigate}
        onOpenSearch={onOpenSearch}
      />
    </header>
  )
}
