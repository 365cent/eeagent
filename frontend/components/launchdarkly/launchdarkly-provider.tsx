'use client'

import type { ReactNode } from 'react'
import { LDProvider } from 'launchdarkly-react-client-sdk'

type LaunchDarklyProviderProps = {
  children: ReactNode
}

/** Browser LaunchDarkly client; skipped when the client-side ID env var is unset. */
export function LaunchDarklyProvider({ children }: LaunchDarklyProviderProps) {
  const clientSideID = process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID?.trim()

  if (!clientSideID) {
    return children
  }

  return (
    <LDProvider
      clientSideID={clientSideID}
      context={{
        kind: 'user',
        key: 'eea-onboarding',
        name: 'EEA onboarding',
      }}
    >
      {children}
    </LDProvider>
  )
}
