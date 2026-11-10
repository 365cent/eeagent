'use client'

import { Button, Typography } from 'antd'
import type { FunnelStep } from '@/lib/eea-mappers'
import type { AppRouteOptions } from '@/types/platform'

/** Fixed taper + palette from the original overview funnel (git: initial platform shell). */
const stepStyles = [
  { width: '100%', background: '#dbeafe', color: '#1e3a8a' },
  { width: '83%', background: '#bfdbfe', color: '#1e40af' },
  { width: '67%', background: '#60a5fa', color: '#fff' },
  { width: '50%', background: '#2563eb', color: '#fff' },
] as const

type StrategyFunnelCardProps = {
  onNavigate: (options: AppRouteOptions) => void
  steps?: readonly FunnelStep[]
}

export function StrategyFunnelCard({ onNavigate, steps = [] }: StrategyFunnelCardProps) {
  return (
    <div className="strategy-funnel-card">
      {steps.map((step, index) => {
        const style = stepStyles[index] ?? stepStyles[0]
        return (
          <Button
            key={step.id}
            type="default"
            className="strategy-funnel-step"
            style={{
              width: style.width,
              background: style.background,
              color: style.color,
              borderColor: style.background,
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
