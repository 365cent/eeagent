'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PlatformSearchModal } from '@/components/search/platform-search-modal'
import { usePlatformSearchShortcut } from '@/hooks/use-platform-search-shortcut'
import { ArrowRightOutlined, BulbOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { Button, ConfigProvider, Menu, Tooltip } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { platformRootTheme } from '@/config/platform-theme'
import { ProConfigProvider, ProLayout } from '@ant-design/pro-components'
import type { MenuDataItem } from '@ant-design/pro-components'
import { BrandBlock, WorkspacePill } from '@/components/layout/brand-block'
import { PlatformPageHeader } from '@/components/layout/platform-page-header'
import { mainMenuEntries, mainMenuItems, primaryMenuLabel, siderUtilityMenuItems } from '@/config/menu'
import { utilityPageTitle } from '@/config/utility-pages'
import { recordVisit } from '@/lib/api/eea-api'
import type { NavigateFn } from '@/types/platform'

type PlatformLayoutProps = {
  activeMenu: string
  collapsed: boolean
  isMobile: boolean
  isDark: boolean
  layoutReady: boolean
  primaryMenuSelectedKeys: string[]
  siderUtilitySelectedKeys: string[]
  onCollapse: (collapsed: boolean) => void
  onNavigate: NavigateFn
  onToggleDark: () => void
  /** When set (e.g. open signal), replaces the utility/menu title in the top bar. */
  pageTitleOverride?: string
  children: ReactNode
}

function menuDataFromItems(): MenuDataItem[] {
  return (mainMenuItems ?? []).flatMap((item) => {
    if (!item || !('key' in item) || item.type === 'divider') return []
    const key = String(item.key)
    const path = key === 'overview' ? '/' : `/${key}`
    const name = mainMenuEntries.find((entry) => entry.key === key)?.title ?? key
    return [{
      path,
      name,
      key,
      icon: 'icon' in item ? item.icon : undefined,
    }]
  })
}

export function PlatformLayout({
  activeMenu,
  collapsed,
  isMobile,
  isDark,
  layoutReady,
  primaryMenuSelectedKeys,
  siderUtilitySelectedKeys,
  onCollapse,
  onNavigate,
  onToggleDark,
  pageTitleOverride,
  children,
}: PlatformLayoutProps) {
  // IP-based auto identity: one visit record per page per 10 minutes.
  useEffect(() => {
    if (!activeMenu) return
    const key = `eea:visit:${activeMenu}`
    try {
      const last = window.sessionStorage.getItem(key)
      if (last && Date.now() - Number(last) < 10 * 60 * 1000) return
      window.sessionStorage.setItem(key, String(Date.now()))
    } catch {
      /* storage disabled: still record, backend dedupes */
    }
    void recordVisit(`/${activeMenu}`).catch(() => {})
  }, [activeMenu])

  const route = useMemo(() => ({ routes: menuDataFromItems() }), [])
  const pathname = activeMenu === 'overview' ? '/' : `/${activeMenu}`
  const location = useMemo(() => ({ pathname }), [pathname])

  const pageTitle =
    pageTitleOverride ??
    primaryMenuLabel(activeMenu) ??
    utilityPageTitle(activeMenu) ??
    '研究总览'

  const siderMenuProps = {
    theme: 'dark' as const,
    inlineIndent: 16,
  }

  const postMenuData = useMemo(
    () => (menus?: MenuDataItem[]) =>
      (menus ?? []).map((item) => {
        const key = String(item.key ?? item.path ?? '').replace(/^\//, '')
        const entry = mainMenuEntries.find((e) => e.key === key)
        return {
          ...item,
          icon: entry?.icon ?? item.icon,
        }
      }),
    [],
  )

  const [searchOpen, setSearchOpen] = useState(false)
  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])
  usePlatformSearchShortcut(openSearch)

  /** Mobile: full overlay drawer (collapsed=false). Closed drawer width → globals.css @760px. */
  const proLayoutCollapsed = isMobile ? false : collapsed
  const mainSurfaceBackground = isDark ? '#0a0a0a' : '#ffffff'

  return (
    <ConfigProvider locale={zhCN}>
      <ProConfigProvider>
        <div
          className={`app-shell pro-shell pro-layout-side ${isDark ? 'dark-mode' : 'light-mode'} ${layoutReady ? 'layout-ready' : 'layout-pending'} ${isMobile && !collapsed ? 'mobile-nav-open' : ''}`}
        >
          {isMobile && !collapsed && (
            <button
              type="button"
              className="mobile-nav-backdrop"
              aria-label="关闭导航"
              onClick={() => onCollapse(true)}
            />
          )}
          <ProLayout
            className="platform-pro-layout"
            layout="side"
            navTheme="realDark"
            postMenuData={postMenuData}
            title={false}
            logo={false}
            fixSiderbar
            disableMobile
            loading={!layoutReady}
            collapsed={proLayoutCollapsed}
            onCollapse={onCollapse}
            location={location}
            route={route}
            siderWidth={244}
            actionsRender={false}
            avatarProps={false}
            rightContentRender={false}
            headerContentRender={false}
            headerTitleRender={false}
            menuProps={{
              ...siderMenuProps,
              selectedKeys: primaryMenuSelectedKeys,
              onClick: ({ key }) => {
                onNavigate(String(key))
                if (isMobile) onCollapse(true)
              },
            }}
            menuHeaderRender={(_logo, _title, headerProps) => {
              if (headerProps?.collapsed) {
                return (
                  <div className="pro-sider-header pro-sider-header--collapsed">
                    <BrandBlock collapsed />
                  </div>
                )
              }
              return (
                <div className="pro-sider-header">
                  <BrandBlock collapsed={false} />
                  <WorkspacePill collapsed={false} />
                </div>
              )
            }}
            menuFooterRender={() => (
              <div className={`pro-sider-footer${proLayoutCollapsed ? ' pro-sider-footer--collapsed' : ''}`}>
                {proLayoutCollapsed ? (
                  <Tooltip title="本周研究提醒" placement="right">
                    <button
                      type="button"
                      className="sider-collapsed-hit sider-card--collapsed"
                      aria-label="本周研究提醒"
                      onClick={() => onNavigate('reminders')}
                    >
                      <BulbOutlined className="sider-card-icon" aria-hidden />
                    </button>
                  </Tooltip>
                ) : (
                  <div
                    className="sider-card"
                    role="button"
                    tabIndex={0}
                    onClick={() => onNavigate('reminders')}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') onNavigate('reminders')
                    }}
                  >
                    <BulbOutlined className="sider-card-icon" aria-hidden />
                    <div className="sider-card-copy">
                      <span className="sider-card-title">本周研究提醒</span>
                      <small>还有 12 条信号待复核</small>
                    </div>
                    <ArrowRightOutlined className="sider-card-arrow" aria-hidden />
                  </div>
                )}
                {proLayoutCollapsed ? (
                  <div className="sider-collapsed-utility" role="group" aria-label="快捷入口">
                    {(siderUtilityMenuItems ?? []).map((item) => {
                      if (!item || !('key' in item)) return null
                      const key = String(item.key)
                      const label = 'label' in item ? String(item.label ?? key) : key
                      const selected = siderUtilitySelectedKeys.includes(key)
                      return (
                        <Tooltip key={key} title={label} placement="right">
                          <Button
                            type="text"
                            className={`sider-collapsed-hit sider-collapsed-utility-btn${selected ? ' is-selected' : ''}`}
                            icon={'icon' in item ? item.icon : undefined}
                            aria-label={label}
                            aria-current={selected ? 'page' : undefined}
                            onClick={() => {
                              onNavigate(key)
                              if (isMobile) onCollapse(true)
                            }}
                          />
                        </Tooltip>
                      )
                    })}
                  </div>
                ) : (
                  <Menu
                    {...siderMenuProps}
                    mode="inline"
                    selectedKeys={siderUtilitySelectedKeys}
                    items={siderUtilityMenuItems}
                    onClick={({ key }) => {
                      onNavigate(String(key))
                      if (isMobile) onCollapse(true)
                    }}
                  />
                )}
              </div>
            )}
            collapsedButtonRender={(isCollapsed) =>
              isCollapsed ? (
                <Button
                  className="ant-pro-sider-collapsed-button sider-nav-toggle sider-collapsed-toggle"
                  type="text"
                  icon={<MenuUnfoldOutlined />}
                  aria-label="展开侧栏"
                  onClick={() => onCollapse(false)}
                />
              ) : (
                false
              )
            }
            contentStyle={{ padding: 0, background: mainSurfaceBackground }}
          >
            <ConfigProvider theme={platformRootTheme}>
              <div className="dashboard-content platform-main-surface">
                {searchOpen ? (
                  <PlatformSearchModal open onClose={closeSearch} onNavigate={onNavigate} />
                ) : null}
                <PlatformPageHeader
                  pageTitle={pageTitle}
                  isDark={isDark}
                  siderCollapsed={collapsed}
                  isMobile={isMobile}
                  onToggleDark={onToggleDark}
                  onNavigate={onNavigate}
                  onOpenSearch={openSearch}
                  onOpenMobileNav={() => onCollapse(false)}
                  onCollapseSider={() => onCollapse(true)}
                />
                <div className="dashboard-page-body">{children}</div>
              </div>
            </ConfigProvider>
          </ProLayout>
        </div>
      </ProConfigProvider>
    </ConfigProvider>
  )
}
