import type { Signal } from '@/types/platform'

export const signals: Signal[] = [
  { key: '1', title: '中央计算平台下的智能配电架构演进', publisher: '汽车电子观察', channel: '网页', stage: '传递端', type: '技术', status: '已留存', date: '2026-10-17', tags: ['区域控制器', '智能配电'] },
  { key: '2', title: '800V 高压平台与功率半导体的协同设计', publisher: '新能源汽车技术', channel: '微信公众号', stage: '创造端', type: '标准', status: '待人工复核', date: '2026-10-16', tags: ['高压平台', 'SiC'] },
  { key: '3', title: '软件定义汽车时代的电源管理新范式', publisher: '德赛西威研究院', channel: '网页', stage: '传递端', type: '战略', status: '已留存', date: '2026-10-15', tags: ['SDV', '电源管理'] },
  { key: '4', title: '域控架构的功能安全与冗余设计要求', publisher: 'ISO / SAE', channel: '网页', stage: '规制端', type: '标准', status: '已留存', date: '2026-10-13', tags: ['功能安全', '冗余'] },
  { key: '5', title: '下一代汽车电子供应链人才结构变化', publisher: '智能汽车人才网', channel: '微信公众号', stage: '创造端', type: '人才', status: '抓取中', date: '2026-10-12', tags: ['人才', '供应链'] },
]

export const statusColors: Record<string, string> = {
  已留存: 'success',
  待人工复核: 'warning',
  抓取中: 'processing',
  抓取失败: 'error',
}
