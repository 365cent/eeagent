/**
 * Shell surface tokens for Ant Design `theme.token` and TS logic.
 * Custom CSS should use matching `--eea-*` variables in `app/shell-color-scheme.css`
 * (keep hex values in sync when either side changes).
 */
export const SHELL_COLOR_SCHEME_STORAGE_KEY = 'eea-color-scheme' as const
/** @deprecated Read only for migration from the old light/dark flag. */
export const LEGACY_SHELL_DARK_STORAGE_KEY = 'eea-shell-dark' as const

/** User choice; `system` follows `prefers-color-scheme`. */
export type ShellColorSchemePreference = 'light' | 'dark' | 'system'

/** Resolved appearance used for Ant Design algorithms and `data-color-scheme`. */
export type ShellColorScheme = 'light' | 'dark'

export const shellColorSchemePreferences = [
  'light',
  'dark',
  'system',
] as const satisfies readonly ShellColorSchemePreference[]

export type ShellSurfaceTokens = {
  readonly surfaceMain: string
  readonly surfaceCanvas: string
  readonly surfaceElevated: string
  readonly textPrimary: string
  readonly textSecondary: string
  readonly borderSubtle: string
}

export const shellSurfaces: Record<ShellColorScheme, ShellSurfaceTokens> = {
  light: {
    surfaceMain: '#ffffff',
    surfaceCanvas: '#f5f7fa',
    surfaceElevated: '#ffffff',
    textPrimary: 'rgba(0, 0, 0, 0.88)',
    textSecondary: 'rgba(0, 0, 0, 0.45)',
    borderSubtle: '#eaeaea',
  },
  dark: {
    surfaceMain: '#0a0a0a',
    surfaceCanvas: '#0a0a0a',
    surfaceElevated: '#141416',
    textPrimary: '#f4f4f5',
    textSecondary: '#a1a1aa',
    borderSubtle: '#27272a',
  },
}

export function isShellColorSchemePreference(
  value: string | null | undefined,
): value is ShellColorSchemePreference {
  return shellColorSchemePreferences.includes(value as ShellColorSchemePreference)
}
