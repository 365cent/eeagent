export const themes = [
  { name: '低压系统智能化', note: '多源信号持续指向智能配电与功率管理', count: 8, sources: 16, progress: 82, color: '#2563eb' },
  { name: '中央计算与区域控制', note: '电子电气架构向集中式演进', count: 12, sources: 21, progress: 67, color: '#0f766e' },
  { name: '高压平台安全冗余', note: '800V 电气系统的安全合规边界', count: 6, sources: 11, progress: 51, color: '#d97706' },
]

export const signalTrendBars = [
  { heightPercent: 32, week: '1', emphasis: false },
  { heightPercent: 47, week: '2', emphasis: false },
  { heightPercent: 40, week: '3', emphasis: false },
  { heightPercent: 65, week: '4', emphasis: false },
  { heightPercent: 55, week: '5', emphasis: false },
  { heightPercent: 75, week: '6', emphasis: false },
  { heightPercent: 68, week: '7', emphasis: false },
  { heightPercent: 91, week: '8', emphasis: true },
  { heightPercent: 100, week: '9', emphasis: true },
] as const

export const overviewFunnelSteps = [
  { id: 'scan', stepClass: 'step-one', label: '01 · 行业全景扫描', value: '248', view: 'signals', query: { funnel: 'scan' }, hash: 'pool-scan' },
  { id: 'filter', stepClass: 'step-two', label: '02 · 战略适配过滤', value: '76', view: 'strategy', query: { funnel: 'filter' }, hash: 'stage-filter' },
  { id: 'evaluate', stepClass: 'step-three', label: '03 · 五维综合研判', value: '32', view: 'strategy', query: { funnel: 'evaluate' }, hash: 'stage-evaluate' },
  { id: 'classify', stepClass: 'step-four', label: '04 · 落地策略分类', value: '12', view: 'strategy', query: { funnel: 'classify' }, hash: 'stage-classify' },
] as const

export const overviewTraceMetrics = [
  { label: '原始信号', value: '248' },
  { label: '需求点', value: '18' },
  { label: '车辆功能', value: '26' },
  { label: '技术落脚点', value: '41' },
] as const
