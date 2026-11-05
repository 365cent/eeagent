'use client'

import { useSearchParams } from 'next/navigation'
import DashboardClient from '@/components/dashboard-client-loader'

const viewPattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/

export default function Page() {
  const searchParams = useSearchParams()
  const view = searchParams.get('view') ?? ''
  const initialView = viewPattern.test(view) ? view : 'overview'

  return <DashboardClient initialView={initialView} />
}
