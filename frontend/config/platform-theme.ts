import type { ThemeConfig } from 'antd'
import { theme as antdTheme } from 'antd'
import { PLATFORM_FONT_FAMILY } from '@/lib/platform-fonts'

/**
 * Stable root theme: one algorithm (light baseline), one cssVar key.
 * Shell dark mode overrides live in CSS on `.platform-main-surface` under `.dark-mode.pro-shell`.
 */
export const platformRootTheme: ThemeConfig = {
  cssVar: { key: 'eea' },
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    colorPrimary: '#2563eb',
    borderRadius: 8,
    fontFamily: PLATFORM_FONT_FAMILY,
    colorBgLayout: '#f5f7fa',
  },
}
