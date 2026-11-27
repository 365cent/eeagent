'use client'

import { useCallback, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchSignals,
  fetchThemeClusterReport,
  fetchThemeClusterRunStatus,
  fetchVocabUsage,
  recomputeThemeClusterReport,
} from '@/lib/api/eea-api'
import { eeaQueryKeys, useThemeRows } from '@/hooks/use-eea-queries'
import { buildThemeTagMap, clusterUnassignedSignals } from '@/lib/topic-clustering'

/** Live signals + vocab for topic auto-clustering (tags read from API, not cached suggestions). */
export function useTopicClusterCandidates() {
  const queryClient = useQueryClient()
  const { data: themes } = useThemeRows()

  const signalsQuery = useQuery({
    queryKey: eeaQueryKeys.signals({ limit: 200 }),
    queryFn: () => fetchSignals({ limit: 200 }),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const vocabQuery = useQuery({
    queryKey: [...eeaQueryKeys.vocabUsage, 'tech_tag'],
    queryFn: () => fetchVocabUsage('tech_tag'),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const clusterReportQuery = useQuery({
    queryKey: eeaQueryKeys.themeClusterReport,
    queryFn: fetchThemeClusterReport,
    staleTime: 0,
    refetchOnMount: 'always',
    // A pass queued by a new signal finishes on its own; poll until it does so
    // the graph replaces itself without the operator reloading the page.
    refetchInterval: (query) => (query.state.data?.pending ? 3000 : false),
  })

  const [recomputeBusy, setRecomputeBusy] = useState(false)

  // 重放聚类 used to replay the same cached graph. Now it queues a fresh pass and
  // waits for the Python job to publish it, then refreshes the report.
  const recomputeClustering = useCallback(async () => {
    setRecomputeBusy(true)
    try {
      await recomputeThemeClusterReport()
      for (let attempt = 0; attempt < 40; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 1500))
        const run = await fetchThemeClusterRunStatus()
        if (run.status === 'ready') break
        if (run.status === 'failed') {
          throw new Error(run.error || '聚类计算失败')
        }
      }
      await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.themeClusterReport })
      await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.signalsRoot })
    } finally {
      setRecomputeBusy(false)
    }
  }, [queryClient])

  const signals = signalsQuery.data ?? []
  const themeTagMap = useMemo(() => buildThemeTagMap(themes ?? []), [themes])

  const stats = useMemo(() => {
    const unassigned = signals.filter((s) => !s.tech_theme_id)
    const noTags = signals.filter((s) => !(s.tags?.length ?? 0))
    const candidateTopics =
      clusterReportQuery.data?.clusters.length ?? clusterUnassignedSignals(signals).length
    return {
      total: signals.length,
      unassigned: unassigned.length,
      noTags: noTags.length,
      candidateTopics,
    }
  }, [signals, clusterReportQuery.data])

  const invalidateAll = async () => {
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.signalsRoot })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.themeClusterReport })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.themes })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.overview })
    await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.vocabUsage })
  }

  return {
    signals,
    signalsLoading: signalsQuery.isLoading,
    signalsFetching: signalsQuery.isFetching,
    vocabRows: vocabQuery.data ?? [],
    vocabLoading: vocabQuery.isLoading,
    clusterReport: clusterReportQuery.data,
    clusterReportLoading: clusterReportQuery.isLoading,
    clusterReportError: clusterReportQuery.error,
    recomputeClustering,
    recomputeBusy,
    themes,
    stats,
    themeTagMap,
    invalidateAll,
    refetchSignals: () => signalsQuery.refetch(),
  }
}