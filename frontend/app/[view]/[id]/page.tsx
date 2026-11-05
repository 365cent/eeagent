'use client'

import { useParams } from 'next/navigation'
import DashboardClient from '@/components/dashboard-client-loader'

const viewPattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/

export default function ViewDetailPage() {
  const params = useParams<{ view: string; id: string }>()
  const view = params.view ?? ''
  const id = params.id ?? '1'
  const initialView = viewPattern.test(view) ? view : 'overview'

  return <DashboardClient initialView={initialView} signalId={id} />
}
