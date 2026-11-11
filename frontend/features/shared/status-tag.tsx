'use client'

import { Tag } from 'antd'
import type { StatusMeta } from '@/lib/status-registry'

export function StatusTag({ meta, className }: { meta: StatusMeta; className?: string }) {
  return (
    <Tag color={meta.color} className={className}>
      {meta.label}
    </Tag>
  )
}
