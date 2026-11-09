export type UserProfilePrefs = {
  displayName: string
  email: string
  roleTitle: string
  researchTags: string[]
  defaultValueChain: string
  defaultSignalType: string
  memoryMarkdown: string
}

export type PlatformSettingsPrefs = {
  workspaceName: string
  workspaceDescription: string
  defaultLanding: string
  notifySignalReview: boolean
  notifyCrawlFailure: boolean
  notifyDeductionComplete: boolean
  notifyWeeklyDigest: boolean
  sessionIdleMinutes: number
  requireReauthForExport: boolean
  agentMemoryEnabled: boolean
  agentConfirmPatches: boolean
}

const PROFILE_KEY = 'eea-user-profile'
const SETTINGS_KEY = 'eea-platform-settings'

export const defaultProfile: UserProfilePrefs = {
  displayName: '',
  email: '',
  roleTitle: '',
  researchTags: [],
  defaultValueChain: '',
  defaultSignalType: '',
  memoryMarkdown: '',
}

export const defaultSettings: PlatformSettingsPrefs = {
  workspaceName: '',
  workspaceDescription: '',
  defaultLanding: 'overview',
  notifySignalReview: true,
  notifyCrawlFailure: true,
  notifyDeductionComplete: true,
  notifyWeeklyDigest: true,
  sessionIdleMinutes: 120,
  requireReauthForExport: false,
  agentMemoryEnabled: true,
  agentConfirmPatches: true,
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) } as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function loadProfilePrefs(): UserProfilePrefs {
  return readJson(PROFILE_KEY, defaultProfile)
}

export function saveProfilePrefs(prefs: UserProfilePrefs): boolean {
  return writeJson(PROFILE_KEY, prefs)
}

export function loadPlatformSettings(): PlatformSettingsPrefs {
  return readJson(SETTINGS_KEY, defaultSettings)
}

export function savePlatformSettings(prefs: PlatformSettingsPrefs): boolean {
  return writeJson(SETTINGS_KEY, prefs)
}
