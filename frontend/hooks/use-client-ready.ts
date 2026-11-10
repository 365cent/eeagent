'use client'

import { useSyncExternalStore } from 'react'

/** False on the server and during hydration; true once the client has committed. */
export function useClientReady(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}
