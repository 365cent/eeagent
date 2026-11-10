'use client'

import { AppProviders } from '@/components/providers/app-providers'
import { DashboardWorkspace } from '@/views/dashboard/workspace'

type DashboardClientProps = { initialView?: string; signalId?: string }

/** Client dashboard shell; imported from app view routes via ViewRouteClient. */
export default function DashboardClient({ initialView = 'overview', signalId = '1' }: DashboardClientProps) {
  return (
    <AppProviders>
      <DashboardWorkspace initialView={initialView} signalId={signalId} />
    </AppProviders>
  )
}
