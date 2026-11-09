'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import { AppRouteSkeleton } from './app-route-skeleton'

const DashboardClient = dynamic(() => import('./dashboard-client'), {
  ssr: false,
  loading: () => <AppRouteSkeleton />,
})

type DashboardClientLoaderProps = ComponentProps<typeof DashboardClient>

export default function DashboardClientLoader(props: DashboardClientLoaderProps) {
  return <DashboardClient {...props} />
}
