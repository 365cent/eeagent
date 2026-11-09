import type { AppRouteOptions } from '@/types/platform'

export function buildAppPath({ view, id, query, hash }: AppRouteOptions) {
  const base = id
    ? `/${encodeURIComponent(view)}/${encodeURIComponent(id)}`
    : view === 'overview' ? '/' : `/${encodeURIComponent(view)}`
  const search = query && Object.keys(query).length > 0 ? `?${new URLSearchParams(query).toString()}` : ''
  const fragment = hash ? `#${hash}` : ''
  return `${base}${search}${fragment}`
}

export function viewPath(view: string, id?: string) {
  return buildAppPath({ view, id })
}
