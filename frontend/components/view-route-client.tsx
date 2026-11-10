'use client'

import DashboardClient from '@/components/dashboard-client'

type ViewRouteClientProps = {
  initialView: string
  signalId?: string
}

/** Client dashboard shell for App Router view pages. */
export function ViewRouteClient({ initialView, signalId }: ViewRouteClientProps) {
  return <DashboardClient initialView={initialView} signalId={signalId} />
}
