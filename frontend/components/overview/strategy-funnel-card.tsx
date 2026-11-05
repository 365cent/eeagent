'use client'

import { CheckCircleFilled } from '@ant-design/icons'
import { Button, Typography } from 'antd'
import { overviewFunnelSteps } from '@/mocks/themes'
import type { FunnelStep } from '@/lib/eea-mappers'
import type { AppRouteOptions } from '@/types/platform'

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

export function StrategyFunnelCard({ onNavigate, steps = overviewFunnelSteps }: StrategyFunnelCardProps) {
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
      <div className="strategy-funnel-footer">
        <Typography.Text type="secondary">
          <CheckCircleFilled className="strategy-funnel-footer-icon" />
          本月完成度
        </Typography.Text>
        <Typography.Text strong className="strategy-funnel-footer-value">
          74%
        </Typography.Text>
      </div>
    </div>
  )
}
