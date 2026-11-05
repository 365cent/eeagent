export type UserProfilePrefs = {
  displayName: string
  email: string
  roleTitle: string
  platformRole: 'researcher' | 'taxonomy_admin'
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
  displayName: '刘文',
  email: 'liu.wen@desaysv.com',
  roleTitle: '战略研究员',
  platformRole: 'researcher',
  researchTags: ['智能汽车', 'EEA', '智能配电'],
  defaultValueChain: '创造端（供应链）',
  defaultSignalType: '战略',
  memoryMarkdown:
    '## 研究偏好\n\n- 默认关注低压系统智能化与区域控制器\n- 复核时优先核对价值链环节与信号类型\n',
}

export const defaultSettings: PlatformSettingsPrefs = {
  workspaceName: '技术战略研究组',
  workspaceDescription: '德赛西威 EEA 前瞻技术扫描 — 产业信号到战略研判',
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

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota */
  }
}

export function loadProfilePrefs(): UserProfilePrefs {
  return readJson(PROFILE_KEY, defaultProfile)
}

export function saveProfilePrefs(prefs: UserProfilePrefs) {
  writeJson(PROFILE_KEY, prefs)
}

export function loadPlatformSettings(): PlatformSettingsPrefs {
  return readJson(SETTINGS_KEY, defaultSettings)
}

export function savePlatformSettings(prefs: PlatformSettingsPrefs) {
  writeJson(SETTINGS_KEY, prefs)
}
