import { ViewRouteClient } from '@/components/view-route-client'
import { resolveInitialView } from '@/lib/resolve-initial-view'

type ViewPageProps = {
  params: Promise<{ view: string }>
}

export default async function ViewPage({ params }: ViewPageProps) {
  const { view } = await params
  return <ViewRouteClient initialView={resolveInitialView(view)} />
}
