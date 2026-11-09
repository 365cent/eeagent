import type { ListSignalsParams } from '@/lib/api/types'

const STAGE_CHIP_TO_QUERY: Record<string, string | undefined> = {
  全部环节: undefined,
  创造端: '创造端',
  传递端: '传递端',
  兑现端: '兑现端',
  规制端: '规制端',
}

/** Map dashboard filter chips to GET /signals query params (REQ-SIG-04). */
export function buildListSignalsParams(input: {
  query?: string
  stageChip?: string
  themeId?: string
}): ListSignalsParams {
  const params: ListSignalsParams = { limit: 200 }
  const q = input.query?.trim()
  if (q) params.keyword = q

  const stage = input.stageChip ? STAGE_CHIP_TO_QUERY[input.stageChip] : undefined
  if (stage) params.value_chain_stage = stage

  if (input.themeId) params.theme_id = input.themeId

  return params
}
