'use client'

import { AppProviders } from '@/components/providers/app-providers'
import { DashboardWorkspace } from '@/views/dashboard/workspace'

type DashboardClientProps = { initialView?: string; signalId?: string }

/** Loaded client-only via `dashboard-client-loader` (dynamic ssr: false). */
export default function DashboardClient({ initialView = 'overview', signalId = '1' }: DashboardClientProps) {
  return (
    <AppProviders>
      <DashboardWorkspace initialView={initialView} signalId={signalId} />
    </AppProviders>
  )
}
