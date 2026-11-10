'use client'

import type { ReactNode } from 'react'

type PlatformLayoutFallbackProps = {
  collapsed: boolean
  isMobile: boolean
  children: ReactNode
}

/** SSR/hydration-safe chrome until ProLayout mounts (no responsive ant classes). */
export function PlatformLayoutFallback({ collapsed, isMobile, children }: PlatformLayoutFallbackProps) {
  const collapsedRail = collapsed && !isMobile
  return (
    <div
      className={`platform-layout-fallback${collapsedRail ? ' platform-layout-fallback--collapsed' : ''}${isMobile ? ' platform-layout-fallback--mobile' : ''}`}
    >
      {isMobile ? null : <aside className="platform-layout-fallback-sider" aria-hidden />}
      <div className="platform-layout-fallback-main">{children}</div>
    </div>
  )
}
