import type { DemandRow, LandingRow, OverviewThemeRow } from '@/lib/eea-mappers'
import type { Signal } from '@/types/platform'

export type LivePlatformData = {
  signals: Signal[]
  themes: OverviewThemeRow[]
  demands: DemandRow[]
  landings: LandingRow[]
}
