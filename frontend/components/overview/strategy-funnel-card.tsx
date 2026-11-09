'use client'

import { Button, Typography } from 'antd'
import type { FunnelStep } from '@/lib/eea-mappers'
import type { AppRouteOptions } from '@/types/platform'

type StrategyFunnelCardProps = {
  onNavigate: (options: AppRouteOptions) => void
  steps?: readonly FunnelStep[]
}

export function StrategyFunnelCard({ onNavigate, steps = [] }: StrategyFunnelCardProps) {
  const maximumValue = Math.max(1, ...steps.map((step) => Number(step.value) || 0))

  return (
    <div className="strategy-funnel-card">
      {steps.map((step, index) => {
        const value = Number(step.value) || 0
        const width = `${Math.max(30, (value / maximumValue) * 100)}%`
        return (
          <Button
            key={step.id}
            type="default"
            className="strategy-funnel-step"
            style={{
              width,
              background: index === 0 ? '#dbeafe' : index === steps.length - 1 ? '#2563eb' : '#bfdbfe',
              color: index === steps.length - 1 ? '#fff' : '#1e40af',
            }}
            onClick={() => onNavigate({ view: step.view, query: step.query, hash: step.hash })}
          >
            <span>{step.label}</span>
            <Typography.Text strong className="strategy-funnel-step-value">
              {step.value}
            </Typography.Text>
          </Button>
        )
      })}
    </div>
  )
}
