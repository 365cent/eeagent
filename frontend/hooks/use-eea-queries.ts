'use client'

import { useMemo } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  fetchAssessments,
  fetchCorrectionAudit,
  fetchDemands,
  fetchLandingPoints,
  fetchOverview,
  fetchPanorama,
  fetchRefCodes,
  fetchSignal,
  fetchSignalTagSuggestions,
  fetchSignals,
  fetchThemes,
  fetchTraceFromLandingPoint,
  fetchVocab,
  fetchVocabUsage,
} from '@/lib/api/eea-api'
import {
  buildRefCodeMaps,
  mapDemandRow,
  mapLandingRow,
  mapSignalOut,
  mapThemeToOverviewRow,
  type DemandRow,
  type LandingRow,
  type OverviewThemeRow,
  type RefCodeMaps,
} from '@/lib/eea-mappers'
import type { Signal } from '@/types/platform'
import type { AssessmentOut, ListSignalsParams } from '@/lib/api/types'
import { buildListSignalsParams } from '@/lib/signal-list-filters'
import { eeaQueryKeys } from '@/lib/query/eea-query-keys'

// Compatibility export for existing callers while feature hooks move.
export { eeaQueryKeys } from '@/lib/query/eea-query-keys'

export function useRefCodeMaps(enabled = true) {
  const query = useQuery({
    queryKey: eeaQueryKeys.refCodes,
    queryFn: () => fetchRefCodes(),
    enabled,
  })

  const maps = useMemo<RefCodeMaps>(
    () => (query.data ? buildRefCodeMaps(query.data) : { byDomain: {}, labelToCode: {} }),
    [query.data],
  )

  return { ...query, maps }
}

export function useOverviewStats() {
  return useQuery({
    queryKey: eeaQueryKeys.overview,
    queryFn: fetchOverview,
  })
}

export function useSignalsList(params: ListSignalsParams = { limit: 200 }, enabled = true) {
  const { maps, isSuccess: codesReady } = useRefCodeMaps(enabled)
  const query = useQuery({
    queryKey: eeaQueryKeys.signals(params as Record<string, unknown>),
    queryFn: () => fetchSignals(params),
    enabled: enabled && codesReady,
    placeholderData: keepPreviousData,
  })

  const rows = useMemo<Signal[]>(() => {
    if (!query.data) return []
    return query.data.map((row) => mapSignalOut(row, maps))
  }, [query.data, maps])

  return { ...query, rows, maps }
}

export function useSignalsListFiltered(filters: { query?: string; stageChip?: string; themeId?: string }) {
  const params = useMemo(
    () => buildListSignalsParams({ query: filters.query, stageChip: filters.stageChip, themeId: filters.themeId }),
    [filters.query, filters.stageChip, filters.themeId],
  )
  return useSignalsList(params)
}

export function useVocabUsage(kind = 'tech_tag') {
  return useQuery({
    queryKey: [...eeaQueryKeys.vocabUsage, kind],
    queryFn: () => fetchVocabUsage(kind),
  })
}

export function useVocab(kind: string) {
  return useQuery({
    queryKey: eeaQueryKeys.vocab(kind),
    queryFn: () => fetchVocab(kind),
  })
}

export function useSignalTagSuggestions(signalId: string) {
  return useQuery({
    queryKey: eeaQueryKeys.tagSuggestions(signalId),
    queryFn: () => fetchSignalTagSuggestions(signalId),
    enabled: Boolean(signalId),
  })
}

export function useCorrectionAudit(entityId: string | null | undefined) {
  return useQuery({
    queryKey: eeaQueryKeys.audit(entityId ?? ''),
    queryFn: () => fetchCorrectionAudit(entityId!),
    enabled: Boolean(entityId),
  })
}

export function useSignalDetail(signalId: string) {
  const { maps, isSuccess: codesReady } = useRefCodeMaps()
  const query = useQuery({
    queryKey: eeaQueryKeys.signal(signalId),
    queryFn: () => fetchSignal(signalId),
    enabled: Boolean(signalId) && codesReady,
  })

  const ui = useMemo(() => (query.data ? mapSignalOut(query.data, maps) : null), [query.data, maps])

  return { ...query, signal: ui, detail: query.data }
}

export function useThemeRows(enabled = true) {
  const { maps, isSuccess: codesReady } = useRefCodeMaps(enabled)
  const query = useQuery({
    queryKey: eeaQueryKeys.themes,
    queryFn: fetchThemes,
    enabled: enabled && codesReady,
  })

  const rows = useMemo<OverviewThemeRow[]>(() => {
    if (!query.data) return []
    return query.data.map((theme, index) => mapThemeToOverviewRow(theme, index, maps))
  }, [query.data, maps])

  return { ...query, rows }
}

export function useDemandRows(enabled = true) {
  const { maps, isSuccess: codesReady } = useRefCodeMaps(enabled)
  const query = useQuery({
    queryKey: eeaQueryKeys.demands,
    queryFn: fetchDemands,
    enabled: enabled && codesReady,
  })

  const rows = useMemo<DemandRow[]>(() => {
    if (!query.data) return []
    return query.data.map((row) => mapDemandRow(row, maps))
  }, [query.data, maps])

  return { ...query, rows }
}

export function useLandingRows(enabled = true) {
  const assessments = useQuery({
    queryKey: eeaQueryKeys.assessments,
    queryFn: () => fetchAssessments({ current_only: true }),
    enabled,
  })

  const landingQuery = useQuery({
    queryKey: eeaQueryKeys.landingPoints,
    queryFn: () => fetchLandingPoints(),
    enabled,
  })

  const assessmentByLp = useMemo(() => {
    const map = new Map<string, AssessmentOut>()
    for (const item of assessments.data ?? []) {
      map.set(item.tech_landing_point_id, item)
    }
    return map
  }, [assessments.data])

  const rows = useMemo<LandingRow[]>(() => {
    if (!landingQuery.data) return []
    return landingQuery.data.map((lp) => mapLandingRow(lp, assessmentByLp.get(lp.id)))
  }, [landingQuery.data, assessmentByLp])

  return {
    isLoading: landingQuery.isLoading || assessments.isLoading,
    isFetching: landingQuery.isFetching || assessments.isFetching,
    isError: landingQuery.isError || assessments.isError,
    error: landingQuery.error ?? assessments.error,
    refetch: async () => {
      await Promise.all([landingQuery.refetch(), assessments.refetch()])
    },
    rows,
  }
}

export function usePanoramaStages() {
  return useQuery({
    queryKey: eeaQueryKeys.panorama,
    queryFn: fetchPanorama,
  })
}

export function useTraceChain(lpId: string | undefined) {
  return useQuery({
    queryKey: eeaQueryKeys.trace(lpId ?? ''),
    queryFn: () => fetchTraceFromLandingPoint(lpId!),
    enabled: Boolean(lpId),
  })
}
