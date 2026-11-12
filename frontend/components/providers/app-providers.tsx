'use client'

import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { eeaQueryDefaultOptions } from '@/lib/query/eea-query-options'

type AppProvidersProps = {
  children: ReactNode
}

/** Query client only; theme locale, ConfigProvider and AntApp live in PlatformLayout. */
export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: eeaQueryDefaultOptions,
      }),
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
