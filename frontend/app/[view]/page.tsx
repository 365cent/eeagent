'use client'

import { useParams } from 'next/navigation'
import DashboardClient from '@/components/dashboard-client-loader'

const viewPattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/

export default function ViewPage() {
  const params = useParams<{ view: string }>()
  const view = params.view ?? ''
  const initialView = viewPattern.test(view) ? view : 'overview'

  return <DashboardClient initialView={initialView} />
}
