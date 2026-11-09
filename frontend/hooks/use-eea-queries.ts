'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
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

export const eeaQueryKeys = {
  refCodes: ['eea', 'ref-codes'] as const,
  overview: ['eea', 'overview'] as const,
  signals: (params?: Record<string, unknown>) => ['eea', 'signals', params ?? {}] as const,
  signal: (id: string) => ['eea', 'signal', id] as const,
  themes: ['eea', 'themes'] as const,
  vocabUsage: ['eea', 'vocab-usage'] as const,
  vocab: (kind: string) => ['eea', 'vocab', kind] as const,
  tagSuggestions: (signalId: string) => ['eea', 'tag-suggestions', signalId] as const,
  audit: (entityId: string) => ['eea', 'audit', entityId] as const,
  demands: ['eea', 'demands'] as const,
  landingPoints: ['eea', 'landing-points'] as const,
  assessments: ['eea', 'assessments'] as const,
  panorama: ['eea', 'panorama'] as const,
  trace: (lpId: string) => ['eea', 'trace', lpId] as const,
}

export function useRefCodeMaps() {
  const query = useQuery({
    queryKey: eeaQueryKeys.refCodes,
    queryFn: () => fetchRefCodes(),
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

export function useSignalsList(params: ListSignalsParams = { limit: 200 }) {
  const { maps, isSuccess: codesReady } = useRefCodeMaps()
  const query = useQuery({
    queryKey: eeaQueryKeys.signals(params as Record<string, unknown>),
    queryFn: () => fetchSignals(params),
    enabled: codesReady,
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

export function useThemeRows() {
  const { maps, isSuccess: codesReady } = useRefCodeMaps()
  const query = useQuery({
    queryKey: eeaQueryKeys.themes,
    queryFn: fetchThemes,
    enabled: codesReady,
  })

  const rows = useMemo<OverviewThemeRow[]>(() => {
    if (!query.data) return []
    return query.data.map((theme, index) => mapThemeToOverviewRow(theme, index, maps))
  }, [query.data, maps])

  return { ...query, rows }
}

export function useDemandRows() {
  const { maps, isSuccess: codesReady } = useRefCodeMaps()
  const query = useQuery({
    queryKey: eeaQueryKeys.demands,
    queryFn: fetchDemands,
    enabled: codesReady,
  })

  const rows = useMemo<DemandRow[]>(() => {
    if (!query.data) return []
    return query.data.map((row) => mapDemandRow(row, maps))
  }, [query.data, maps])

  return { ...query, rows }
}

export function useLandingRows() {
  const assessments = useQuery({
    queryKey: eeaQueryKeys.assessments,
    queryFn: () => fetchAssessments({ current_only: true }),
  })

  const landingQuery = useQuery({
    queryKey: eeaQueryKeys.landingPoints,
    queryFn: () => fetchLandingPoints(),
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
