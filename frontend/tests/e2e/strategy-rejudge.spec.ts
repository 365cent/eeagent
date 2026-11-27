import { expect, test, type Page } from '@playwright/test'

const API = process.env.EEA_API_URL ?? 'http://127.0.0.1:8000'
// This case writes funnel, audit and assessment rows that have no delete route.
// It only runs when the operator names a disposable landing point.
const TARGET = process.env.EEA_PW_REJUDGE_LP ?? ''

test.setTimeout(180_000)

type Funnel = {
  tech_landing_point_id: string
  current_step: string
  pool_eligible: boolean
  adaptation_decision: string | null
  latest_assessment: { version: number } | null
}

type Assessment = {
  id: string
  version: number
  is_current: boolean
  score_total: number
}

type LandingPoint = { id: string; name: string }

async function pickSelect(page: Page, fieldId: string, optionText: string) {
  const field = page.locator(`.ant-form-item:has(#${fieldId})`)
  await field.locator('.ant-select').click({ timeout: 15_000 })
  const option = page.locator('.ant-select-item-option', { hasText: optionText }).first()
  await expect(option).toBeVisible({ timeout: 10_000 })
  await option.click()
}

test.describe('strategy rejection and re-judgment (FE-09)', () => {
  test('a rejected landing point qualifies for no score, and a revision appends a version', async ({
    page,
    request,
  }) => {
    test.skip(
      !TARGET,
      'set EEA_PW_REJUDGE_LP=<landing point id or name> on a disposable database; the case leaves funnel and assessment rows',
    )

    const lpsRes = await request.get(`${API}/api/v1/landing-points`)
    expect(lpsRes.ok(), 'landing points must be reachable').toBeTruthy()
    const landingPoints = (await lpsRes.json()) as LandingPoint[]
    const target = landingPoints.find((lp) => lp.id === TARGET || lp.name === TARGET)
    test.skip(!target, `no landing point matches EEA_PW_REJUDGE_LP=${TARGET}`)

    const before = await request.get(`${API}/api/v1/strategy/landing-points/${target!.id}/funnel`)
    expect(before.ok(), 'the funnel must be readable').toBeTruthy()
    const funnel = (await before.json()) as Funnel
    test.skip(
      !funnel.pool_eligible || funnel.current_step !== 'industry_scan' || Boolean(funnel.latest_assessment),
      `${target!.name} is not an unscanned, pool-eligible landing point (step=${funnel.current_step})`,
    )

    const failed: string[] = []
    page.on('requestfailed', (req) => {
      const aborted = req.failure()?.errorText?.includes('ABORTED') ?? false
      if (!aborted && req.url().includes('/api/v1/')) failed.push(req.url())
    })

    const stage = (title: string) => page.locator('.panel-card', { hasText: title })
    const history = page.locator('.panel-card', { hasText: '当前与历史版本' })

    await page.goto('/strategy')
    await expect(page.getByRole('heading', { name: '创新组合' })).toBeVisible()
    await page.getByRole('combobox').first().click()
    await page.locator('.ant-select-item-option', { hasText: target!.name }).first().click()

    // Step 1 — industry scan.
    await page.locator('#scan_scope').fill('PW 战略走查：座舱多模融合方向的行业全景样本。')
    await page.locator('#scan_sources_text').fill('PW 来源 A\nPW 来源 B')
    await page.getByRole('button', { name: '保存扫描范围与来源' }).click()
    await expect(page.locator('#tier1_current_business_relation')).toBeVisible()

    // Step 2 — reject: the server must close the scoring and classification path.
    await page.locator('#tier1_current_business_relation').fill('PW 当前仅处于预研，未进入量产项目。')
    await page.locator('#tier1_future_business_relation').fill('PW 下一代座舱平台可能导入。')
    await page.locator('#valuable_role').fill('PW 可作为 Tier1 集成与标定角色。')
    await pickSelect(page, 'adaptation_decision', '拒绝，退出且不评分')
    await page.locator('#adaptation_reason').fill('PW 本轮判定不满足量产适配条件，退出漏斗。')
    await page.getByRole('button', { name: '保存适配结论' }).click()

    await expect(page.getByText('该技术已在 Tier1 适配步骤拒绝。')).toBeVisible()
    await expect(
      stage('3. 多维价值与可行性研判').getByText('该项在 Tier1 适配步骤被滤除，未进入评分与策略分类。'),
    ).toBeVisible()
    await expect(page.locator('#score_business')).toHaveCount(0)

    // Revise the decision to pass; the same form stays open and scores unlock.
    await pickSelect(page, 'adaptation_decision', '通过，进入五维研判')
    await page.getByRole('button', { name: '保存适配结论' }).click()
    await expect(page.locator('#score_business')).toBeVisible()

    // Step 3 — five dimensions, 4/4/3/4/5 = 20 from the server.
    const scores: Array<[string, number]> = [
      ['business', 4],
      ['maturity', 4],
      ['moat', 3],
      ['supply_chain', 4],
      ['feasibility', 5],
    ]
    for (const [key, value] of scores) {
      await page.locator(`#score_${key}`).fill(String(value))
      await page.locator(`#rationale_${key}`).fill(`PW ${key} 维度的本次判断依据。`)
    }
    await page.getByRole('button', { name: '保存五维评分与依据' }).click()
    await expect(page.getByText('服务端总分：20 / 25')).toBeVisible()

    // Step 4 — classification and the first finalized version.
    await pickSelect(page, 'classification', '产业投资/生态合作')
    await page.locator('#strategy_note').fill('PW 首版：按产业投资/生态合作配置资源。')
    await page.getByRole('button', { name: '保存分类与策略备注' }).click()
    await page.getByRole('button', { name: '确认并生成新版本' }).click()

    const v1 = history.locator('.ant-timeline-item', { hasText: '版本 v1' })
    await expect(v1).toBeVisible()
    await expect(v1.getByText('当前版本', { exact: true })).toBeVisible()

    // Re-judgment: editing a score clears the classification and the final
    // pointer, so the earlier version drops to "recent, pending review".
    await stage('3. 多维价值与可行性研判').getByRole('button', { name: /修\s*改/ }).click()
    await page.locator('#score_moat').fill('4')
    await page.getByRole('button', { name: '保存五维评分与依据' }).click()
    await expect(page.getByText('上次已生成版本，当前依据待复核')).toBeVisible()
    await expect(v1.getByText('最近定稿 · 待复核')).toBeVisible()

    // The cleared classification must be re-entered before a second finalize.
    await pickSelect(page, 'classification', '产业投资/生态合作')
    await page.locator('#strategy_note').fill('PW 改判：护城河评分由 3 调整为 4。')
    await page.getByRole('button', { name: '保存分类与策略备注' }).click()
    await page.getByRole('button', { name: '确认并生成新版本' }).click()

    const v2 = history.locator('.ant-timeline-item', { hasText: '版本 v2' })
    await expect(v2.getByText('当前版本', { exact: true })).toBeVisible()
    await expect(v1.getByText('历史', { exact: true })).toBeVisible()

    // The append-only server rows are the source of truth for both versions.
    const historyRes = await request.get(
      `${API}/api/v1/strategy/landing-points/${target!.id}/assessments/history`,
    )
    expect(historyRes.ok()).toBeTruthy()
    const rows = (await historyRes.json()) as Assessment[]
    expect(rows.map((row) => row.version)).toEqual([1, 2])
    expect(rows.filter((row) => row.is_current)).toHaveLength(1)
    expect(rows.find((row) => row.version === 1)?.score_total).toBe(20)
    expect(rows.find((row) => row.version === 2)?.score_total).toBe(21)
    expect(rows.find((row) => row.version === 2)?.is_current).toBe(true)

    expect(failed, 'no /api/v1 request may fail during the funnel flow').toEqual([])
  })
})

