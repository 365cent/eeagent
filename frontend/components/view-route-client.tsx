'use client'

import DashboardClientLoader from '@/components/dashboard-client-loader'

type ViewRouteClientProps = {
  initialView: string
  signalId?: string
}

/** Client dashboard shell for App Router view pages. */
export function ViewRouteClient({ initialView, signalId }: ViewRouteClientProps) {
  return <DashboardClientLoader initialView={initialView} signalId={signalId} />
}
