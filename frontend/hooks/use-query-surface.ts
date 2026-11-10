'use client'

import type { UseQueryResult } from '@tanstack/react-query'

export type QuerySurfaceState = {
  /** No cached payload yet — show skeleton or full-page spinner */
  showInitial: boolean
  /** Cached payload visible while a refetch is in flight */
  showRefresh: boolean
  hasData: boolean
  isError: boolean
}

export function querySurfaceState<TData>(query: Pick<
  UseQueryResult<TData>,
  'data' | 'isPending' | 'isFetching' | 'isError'
>): QuerySurfaceState {
  const hasData = query.data !== undefined
  return {
    hasData,
    isError: query.isError,
    showInitial: !hasData && (query.isPending || query.isFetching),
    showRefresh: hasData && query.isFetching,
  }
}
