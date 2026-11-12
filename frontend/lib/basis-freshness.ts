import type { TraceChain } from '@/lib/api/types'

type Freshness = TraceChain['basis_freshness']

const META: Record<
  Freshness,
  { color: string; title: string; description: string }
> = {
  fresh: {
    color: 'green',
    title: '依据与复核基线一致',
    description: '自需求确认以来，关联信号与文档未见更新。',
  },
  stale: {
    color: 'orange',
    title: '上游证据已更新',
    description: '主题成员或交叉验证信号在需求确认后有过修改，建议重新复核。',
  },
  unconfirmed: {
    color: 'default',
    title: '需求尚未确认',
    description: '需求点未通过人工确认，不能作为稳定依据基线。',
  },
  unknown_untracked: {
    color: 'default',
    title: '无法比较依据基线',
    description: '缺少 confirmed_at 或链路不完整，服务端不能判断依据是否过期。',
  },
}

export function basisFreshnessMeta(value: Freshness | undefined) {
  if (!value) return META.unknown_untracked
  return META[value] ?? META.unknown_untracked
}
