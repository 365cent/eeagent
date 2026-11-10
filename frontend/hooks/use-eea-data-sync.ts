'use client'

import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchSyncStamp } from '@/lib/api/eea-api'
import { eeaQueryKeys } from '@/hooks/use-eea-queries'

/**
 * On route / menu changes, fetches `/sync-stamp` and invalidates EEA queries when the fingerprint moves.
 */
export function useEeaDataSync(navigationKey: string) {
  const queryClient = useQueryClient()
  const lastFingerprint = useRef<string | null>(null)

  const stampQuery = useQuery({
    queryKey: eeaQueryKeys.syncStamp,
    queryFn: fetchSyncStamp,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const refetchStamp = stampQuery.refetch
  useEffect(() => {
    void refetchStamp()
  }, [navigationKey, refetchStamp])

  useEffect(() => {
    const fingerprint = stampQuery.data?.fingerprint
    if (!fingerprint) return
    if (lastFingerprint.current !== null && lastFingerprint.current !== fingerprint) {
      void queryClient.invalidateQueries({ queryKey: ['eea'] })
    }
    lastFingerprint.current = fingerprint
  }, [stampQuery.data?.fingerprint, queryClient])
}
