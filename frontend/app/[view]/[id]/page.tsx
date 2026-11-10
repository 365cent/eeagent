import { ViewRouteClient } from '@/components/view-route-client'
import { resolveInitialView } from '@/lib/resolve-initial-view'

type ViewDetailPageProps = {
  params: Promise<{ view: string; id: string }>
}

export default async function ViewDetailPage({ params }: ViewDetailPageProps) {
  const { view, id } = await params
  return <ViewRouteClient initialView={resolveInitialView(view)} signalId={id || '1'} />
}
