'use client'

import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchSignals, fetchThemeClusterReport, fetchVocabUsage } from '@/lib/api/eea-api'
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
  })

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
    themes,
    stats,
    themeTagMap,
    invalidateAll,
    refetchSignals: () => signalsQuery.refetch(),
  }
}