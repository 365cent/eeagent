'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  applyShellColorSchemeToDocument,
  readStoredShellColorSchemePreference,
  resolveShellColorScheme,
  toggleExplicitShellColorScheme,
  writeStoredShellColorSchemePreference,
  type ShellColorScheme,
  type ShellColorSchemePreference,
} from '@/lib/shell-color-scheme'

type UseShellColorSchemeResult = {
  preference: ShellColorSchemePreference
  scheme: ShellColorScheme
  isDark: boolean
  setPreference: (next: ShellColorSchemePreference) => void
  toggleExplicit: () => void
}

export function useShellColorScheme(): UseShellColorSchemeResult {
  const [preference, setPreferenceState] = useState<ShellColorSchemePreference>(() =>
    readStoredShellColorSchemePreference(),
  )
  const [prefersDark, setPrefersDark] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)').matches : false,
  )

  const scheme = resolveShellColorScheme(preference, prefersDark)

  useEffect(() => {
    writeStoredShellColorSchemePreference(preference)
  }, [preference])

  useEffect(() => {
    applyShellColorSchemeToDocument(scheme)
  }, [scheme])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => setPrefersDark(event.matches)
    setPrefersDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const setPreference = useCallback((next: ShellColorSchemePreference) => {
    setPreferenceState(next)
  }, [])

  const toggleExplicit = useCallback(() => {
    setPreferenceState((current) => toggleExplicitShellColorScheme(current))
  }, [])

  return {
    preference,
    scheme,
    isDark: scheme === 'dark',
    setPreference,
    toggleExplicit,
  }
}
