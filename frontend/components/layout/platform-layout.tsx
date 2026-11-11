'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PlatformSearchModal } from '@/components/search/platform-search-modal'
import { usePlatformSearchShortcut } from '@/hooks/use-platform-search-shortcut'
import { MenuUnfoldOutlined } from '@ant-design/icons'
import { App as AntApp, Button, ConfigProvider, Menu, Tooltip } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import type { ShellColorScheme } from '@/config/shell-surfaces'
import { platformThemeForScheme } from '@/config/platform-theme'
import { ProConfigProvider, ProLayout } from '@ant-design/pro-components'
import type { MenuDataItem } from '@ant-design/pro-components'
import { BrandBlock, WorkspacePill } from '@/components/layout/brand-block'
import { PlatformPageHeader } from '@/components/layout/platform-page-header'
import {
  mainMenuEntries,
  mainMenuTree,
  menuIconForKey,
  primaryMenuLabel,
  siderUtilityMenuItems,
} from '@/config/menu'
import { utilityPageTitle } from '@/config/utility-pages'
import { recordVisit } from '@/lib/api/eea-api'
import type { NavigateFn } from '@/types/platform'
import { useClientReady } from '@/hooks/use-client-ready'
import { LaunchDarklyOnboardingBanner } from '@/components/launchdarkly/onboarding-test-banner'
import { PlatformLayoutFallback } from '@/components/layout/platform-layout-fallback'

type PlatformLayoutProps = {
  activeMenu: string
  collapsed: boolean
  isMobile: boolean
  colorScheme: ShellColorScheme
  layoutReady: boolean
  primaryMenuSelectedKeys: string[]
  siderUtilitySelectedKeys: string[]
  onCollapse: (collapsed: boolean) => void
  onNavigate: NavigateFn
  onToggleColorScheme: () => void
  /** When set (e.g. open signal), replaces the utility/menu title in the top bar. */
  pageTitleOverride?: string
  children: ReactNode
}

function menuDataFromItems(): MenuDataItem[] {
  return mainMenuTree.map((node) => ({
    key: node.key,
    name: node.title,
    path: node.key === 'overview' ? '/' : `/${node.key}`,
  }))
}

export function PlatformLayout({
  activeMenu,
  collapsed,
  isMobile,
  colorScheme,
  layoutReady,
  primaryMenuSelectedKeys,
  siderUtilitySelectedKeys,
  onCollapse,
  onNavigate,
  onToggleColorScheme,
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
    inlineIndent: 12,
  }

  const postMenuData = useMemo(() => {
    const decorate = (menus?: MenuDataItem[]): MenuDataItem[] =>
      (menus ?? []).map((item) => {
        const key = String(item.key ?? item.path ?? '').replace(/^\//, '')
        const node = mainMenuTree.find((n) => n.key === key)
        const entry = mainMenuEntries.find((e) => e.key === key)
        const icon = menuIconForKey(key) ?? node?.icon ?? (entry && 'icon' in entry ? entry.icon : undefined) ?? item.icon
        const children = item.children ? decorate(item.children) : undefined
        return { ...item, icon, children }
      })
    return decorate
  }, [])

  const proLayoutReady = useClientReady()
  const [searchOpen, setSearchOpen] = useState(false)
  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])
  usePlatformSearchShortcut(openSearch)

  /** Mobile: full overlay drawer (collapsed=false). Closed drawer width → globals.css @760px. */
  const proLayoutCollapsed = isMobile ? false : collapsed
  const isDark = colorScheme === 'dark'
  const shellTheme = useMemo(() => platformThemeForScheme(colorScheme), [colorScheme])
  const shellThemeKey = `shell-${colorScheme}`

  const mainSurface = (
    <ConfigProvider key={shellThemeKey} locale={zhCN} theme={shellTheme}>
      <AntApp>
        <div className={`dashboard-content platform-main-surface${layoutReady ? '' : ' layout-pending'}`}>
          <PlatformSearchModal open={searchOpen} onClose={closeSearch} onNavigate={onNavigate} />
          <PlatformPageHeader
            pageTitle={pageTitle}
            isDark={isDark}
            siderCollapsed={collapsed}
            isMobile={isMobile}
            onToggleDark={onToggleColorScheme}
            onNavigate={onNavigate}
            onOpenSearch={openSearch}
            onOpenMobileNav={() => onCollapse(false)}
            onCollapseSider={() => onCollapse(true)}
          />
          <LaunchDarklyOnboardingBanner />
          <div className="dashboard-page-body">{children}</div>
        </div>
      </AntApp>
    </ConfigProvider>
  )

  const proLayoutChrome = (
    <ProLayout
              className="platform-pro-layout"
              layout="side"
              navTheme="realDark"
              postMenuData={postMenuData}
              title={false}
              logo={false}
              fixSiderbar
              disableMobile
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
              contentStyle={{ padding: 0, background: 'var(--eea-surface-main)' }}
            >
              {mainSurface}
            </ProLayout>
  )

  return (
    <ProConfigProvider>
        <div
          className={`app-shell pro-shell pro-layout-side ${isDark ? 'dark-mode' : 'light-mode'} ${layoutReady ? 'layout-ready' : 'layout-pending'} ${isMobile && !collapsed ? 'mobile-nav-open' : ''}${proLayoutReady ? '' : ' pro-shell-fallback-chrome'}`}
          data-color-scheme={colorScheme}
        >
          {isMobile && !collapsed && (
            <button
              type="button"
              className="mobile-nav-backdrop"
              aria-label="关闭导航"
              onClick={() => onCollapse(true)}
            />
          )}
          {proLayoutReady ? (
            proLayoutChrome
          ) : (
            <PlatformLayoutFallback collapsed={collapsed} isMobile={isMobile}>
              {mainSurface}
            </PlatformLayoutFallback>
          )}
        </div>
    </ProConfigProvider>
  )
}
