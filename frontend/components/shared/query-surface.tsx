'use client'

import type { ReactNode } from 'react'
import { Spin } from 'antd'
import type { QuerySurfaceState } from '@/hooks/use-query-surface'

type QuerySurfaceProps = QuerySurfaceState & {
  children: ReactNode
  /** Shown on first load when there is no cached data */
  initial?: ReactNode
  className?: string
}

/**
 * Renders cached content immediately on navigation; overlays Ant Design's spinner while refetching.
 */
export function QuerySurface({
  children,
  showInitial,
  showRefresh,
  initial,
  className,
}: QuerySurfaceProps) {
  if (showInitial) {
    return <>{initial ?? <Spin />}</>
  }

  return (
    <div className={className ?? 'query-surface'} data-refreshing={showRefresh || undefined}>
      {children}
      {showRefresh ? (
        <div className="query-surface-refresh" aria-live="polite" aria-busy="true">
          <Spin />
        </div>
      ) : null}
    </div>
  )
}
