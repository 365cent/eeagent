'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  isPanoramaBatchUnread,
  markAllPanoramaBatchesRead,
  markPanoramaBatchRead,
  panoramaImportIsActive,
  subscribeNotificationReadState,
  type PlatformNotificationItem,
} from '@/lib/platform-notifications'
import { useOverviewStats } from '@/hooks/use-eea-queries'

export function usePlatformNotifications() {
  const overviewQuery = useOverviewStats()
  const [tick, setTick] = useState(0)

  useEffect(() => subscribeNotificationReadState(() => setTick((n) => n + 1)), [])

  const batch = overviewQuery.data?.panorama_import ?? null

  const items = useMemo((): PlatformNotificationItem[] => {
    if (!batch) return []
    return [{ id: batch.id, kind: 'panorama_import', batch }]
  }, [batch])

  const unreadCount = useMemo(() => {
    void tick
    if (!batch) return 0
    if (isPanoramaBatchUnread(batch)) return 1
    return 0
  }, [batch, tick])

  const markAllRead = () => {
    markAllPanoramaBatchesRead(items.map((item) => item.id))
  }

  const markRead = (batchId: string) => {
    markPanoramaBatchRead(batchId)
  }

  return {
    items,
    unreadCount,
    batch,
    isLoading: overviewQuery.isLoading,
    isError: overviewQuery.isError,
    refetch: overviewQuery.refetch,
    markAllRead,
    markRead,
    showOverviewBanner: Boolean(batch && panoramaImportIsActive(batch)),
  }
}
