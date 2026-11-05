'use client'

import type { ReactNode } from 'react'
import { Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'

export function MetricHint({ label, hint }: { label: ReactNode; hint: string }) {
  return (
    <span>
      {label}{' '}
      <Tooltip title={hint}>
        <QuestionCircleOutlined aria-label={hint} style={{ color: 'var(--ant-color-text-secondary, #64748b)' }} />
      </Tooltip>
    </span>
  )
}
