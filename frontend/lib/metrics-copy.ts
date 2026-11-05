/** REQ-DEM-14 — 图2-3 主题表计数口径（与 eea_v_tech_theme_metrics 一致）。 */

export const signalFrequencyHint =
  '信号频次：归入该主题的原始信号条数（不含已归档）。每条信号计 1。'

export const sourceCountHint =
  '来源数：该主题下信号主链接经 URL 规范化后的去重个数。无重复链接时，来源数等于信号频次。'

export const metricsFootnote = `${signalFrequencyHint} ${sourceCountHint}`
