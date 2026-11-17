'use client'

import { useMemo } from 'react'
import { buildPlatformSearchIndex, type PlatformSearchIndex } from '@/lib/platform-search-index'
import { useDemandRows, useLandingRows, useSignalsList, useThemeRows } from '@/hooks/use-eea-queries'

export function usePlatformSearchIndex(enabled = true): PlatformSearchIndex {
  const { rows: signals } = useSignalsList({ limit: 200 }, enabled)
  const { rows: themes } = useThemeRows(enabled)
  const { rows: demands } = useDemandRows(enabled)
  const { rows: landings } = useLandingRows(enabled)

  return useMemo(
    () => buildPlatformSearchIndex({ signals, themes, demands, landings }),
    [signals, themes, demands, landings],
  )
}