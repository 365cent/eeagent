/** Single registry of routable view keys (menu + utility). Paths stay compatible with legacy URLs. */
export const PRIMARY_VIEW_KEYS = [
  'overview',
  'signals',
  'archived',
  'topics',
  'traceDetail',
  'technology',
  'trace',
  'strategy',
  'workflow',
] as const

export const UTILITY_VIEW_KEYS = [
  'newSignal',
  'createTopic',
  'report',
  'notifications',
  'search',
  'profile',
  'settings',
  'singal',
  'traceDetail',
  'reminders',
  'knowledge',
  'workflow',
] as const

export type PrimaryViewKey = (typeof PRIMARY_VIEW_KEYS)[number]
export type UtilityViewKey = (typeof UTILITY_VIEW_KEYS)[number]
export type RegisteredViewKey = PrimaryViewKey | UtilityViewKey

export const ALL_VIEW_KEYS: readonly string[] = [...PRIMARY_VIEW_KEYS, ...UTILITY_VIEW_KEYS]

export function isRegisteredView(view: string): boolean {
  return ALL_VIEW_KEYS.includes(view) || view === 'overview'
}

export const ROUTE_PATH = {
  overview: '/',
  signals: '/signals',
  archived: '/archived',
  topics: '/topics',
  trace: '/trace',
  technology: '/technology',
  strategy: '/strategy',
  workflow: '/workflow',
  traceDetail: '/traceDetail',
  knowledge: '/knowledge',
  profile: '/profile',
  settings: '/settings',
} as const
