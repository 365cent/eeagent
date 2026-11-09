'use client'

import { useState, type ReactNode } from 'react'
import { App as AntApp } from 'antd'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

type AppProvidersProps = {
  children: ReactNode
}

/** Query + message context; theme/locale ConfigProvider lives in PlatformLayout. */
export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, gcTime: 5 * 60_000, refetchOnWindowFocus: false },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AntApp>{children}</AntApp>
    </QueryClientProvider>
  )
}
