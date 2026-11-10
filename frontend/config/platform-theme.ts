import type { ThemeConfig } from 'antd'
import { theme as antdTheme } from 'antd'
import { PLATFORM_FONT_FAMILY } from '@/lib/platform-fonts'
import { shellSurfaces, type ShellColorScheme } from '@/config/shell-surfaces'

const platformTokens = {
  colorPrimary: '#2563eb',
  borderRadius: 8,
  fontFamily: PLATFORM_FONT_FAMILY,
} as const

export const platformRootTheme: ThemeConfig = {
  cssVar: { key: 'eea' },
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    ...platformTokens,
    colorBgLayout: shellSurfaces.light.surfaceCanvas,
  },
}

/** Ant Design tokens for the main column; see `docs/SHELL-COLOR-SCHEME.md`. */
export function platformThemeForScheme(scheme: ShellColorScheme): ThemeConfig {
  const surface = shellSurfaces[scheme]
  const isDark = scheme === 'dark'
  return {
    inherit: false,
    cssVar: { key: isDark ? 'eea-dark' : 'eea-light' },
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      ...platformTokens,
      colorBgLayout: surface.surfaceCanvas,
    },
  }
}

/** @deprecated Use `platformThemeForScheme`. */
export function platformThemeForMode(isDark: boolean): ThemeConfig {
  return platformThemeForScheme(isDark ? 'dark' : 'light')
}
