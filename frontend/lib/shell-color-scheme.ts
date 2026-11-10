import {
  isShellColorSchemePreference,
  LEGACY_SHELL_DARK_STORAGE_KEY,
  SHELL_COLOR_SCHEME_STORAGE_KEY,
  type ShellColorScheme,
  type ShellColorSchemePreference,
} from '@/config/shell-surfaces'

export type { ShellColorScheme, ShellColorSchemePreference }

const MEDIA = '(prefers-color-scheme: dark)'

export function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(MEDIA).matches
}

export function resolveShellColorScheme(
  preference: ShellColorSchemePreference,
  prefersDark: boolean = systemPrefersDark(),
): ShellColorScheme {
  if (preference === 'system') return prefersDark ? 'dark' : 'light'
  return preference
}

export function readStoredShellColorSchemePreference(): ShellColorSchemePreference {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = window.localStorage.getItem(SHELL_COLOR_SCHEME_STORAGE_KEY)
    if (isShellColorSchemePreference(stored)) return stored
    const legacy = window.localStorage.getItem(LEGACY_SHELL_DARK_STORAGE_KEY)
    if (legacy === '1') return 'dark'
    if (legacy === '0') return 'light'
  } catch {
    /* storage disabled */
  }
  return 'light'
}

export function writeStoredShellColorSchemePreference(preference: ShellColorSchemePreference): void {
  try {
    window.localStorage.setItem(SHELL_COLOR_SCHEME_STORAGE_KEY, preference)
    window.localStorage.removeItem(LEGACY_SHELL_DARK_STORAGE_KEY)
  } catch {
    /* storage disabled */
  }
}

/** Toolbar toggle: explicit light ↔ dark (skips system for predictable QA). */
export function toggleExplicitShellColorScheme(
  preference: ShellColorSchemePreference,
): ShellColorSchemePreference {
  const scheme = resolveShellColorScheme(preference)
  return scheme === 'dark' ? 'light' : 'dark'
}

export function applyShellColorSchemeToDocument(scheme: ShellColorScheme): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.colorScheme = scheme
  document.documentElement.style.colorScheme = scheme
}
