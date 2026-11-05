export const demandPoints = [
  { key: 'd1', name: '低压系统智能化', stage: '传递端', evidence: '跨主体交叉验证通过', signals: 8, sources: 16, functions: 3, status: '已复核' },
  { key: 'd2', name: '中央计算与区域控制', stage: '创造端', evidence: '持续观察，等待更多来源', signals: 12, sources: 21, functions: 4, status: '待复核' },
  { key: 'd3', name: '高压平台安全冗余', stage: '规制端', evidence: '标准与产业信号一致', signals: 6, sources: 11, functions: 2, status: '已复核' },
]

export const landingPoints = [
  { key: 't1', name: '智能保险丝（eFuse）', domain: '硬件', role: '实现区域供电的主动保护与诊断', standards: 6, score: 22, category: '短期可落地' },
  { key: 't2', name: '区域控制器电源管理', domain: '电源', role: '支撑集中式架构下的动态功率分配', standards: 5, score: 19, category: '前瞻布局' },
  { key: 't3', name: '功率半导体健康监测', domain: '软件', role: '建立器件状态预测与降级策略', standards: 3, score: 17, category: '产业投资/生态合作' },
]

export const strategyStageLabels: Record<string, string> = {
  scan: '行业全景扫描',
  filter: '战略适配过滤',
  evaluate: '五维综合研判',
  classify: '落地策略分类',
}
