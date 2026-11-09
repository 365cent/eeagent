'use client'

import type { ReactNode } from 'react'
import { Typography } from 'antd'

const { Text, Title } = Typography

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  const headerClass = ['view-header', className].filter(Boolean).join(' ')
  return (
    <div className={headerClass}>
      <div>
        {eyebrow ? <Text className="view-eyebrow">{eyebrow}</Text> : null}
        <Title level={2}>{title}</Title>
        {description ? <Text type="secondary">{description}</Text> : null}
      </div>
      {action}
    </div>
  )
}
