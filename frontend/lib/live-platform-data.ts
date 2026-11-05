import type { DemandRow, LandingRow, OverviewThemeRow } from '@/lib/eea-mappers'
import type { Signal } from '@/types/platform'

type LivePlatformData = {
  signals: Signal[]
  themes: OverviewThemeRow[]
  demands: DemandRow[]
  landings: LandingRow[]
}

let live: LivePlatformData | null = null

export function setLivePlatformSearchData(data: LivePlatformData | null) {
  live = data
}

export function getLivePlatformSearchData(): LivePlatformData | null {
  return live
}
