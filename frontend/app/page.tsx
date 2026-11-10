import { ViewRouteClient } from '@/components/view-route-client'
import { resolveInitialView } from '@/lib/resolve-initial-view'

type HomePageProps = {
  searchParams: Promise<{ view?: string | string[] }>
}

export default async function Page({ searchParams }: HomePageProps) {
  const sp = await searchParams
  const raw = sp.view
  const view = Array.isArray(raw) ? raw[0] : raw
  return <ViewRouteClient initialView={resolveInitialView(view)} />
}
