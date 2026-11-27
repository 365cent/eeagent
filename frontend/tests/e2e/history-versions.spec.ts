import { expect, test } from '@playwright/test'

import { divertApiOrigin } from './api-origin'

const API = process.env.EEA_API_URL ?? 'http://127.0.0.1:8000'

test.setTimeout(120_000)

type Assessment = {
  id: string
  version: number
  is_current: boolean
  classification: string | null
  strategy_note: string | null
  operator_subject: string | null
}

type LandingPoint = { id: string; name: string }

async function historyOf(request: import('@playwright/test').APIRequestContext, lpId: string) {
  const res = await request.get(`${API}/api/v1/strategy/landing-points/${lpId}/assessments/history`)
  return res.ok() ? ((await res.json()) as Assessment[]) : []
}

test.describe('strategy history versions (FE-12)', () => {
  test('the strategy page shows the current version and the older ones as history', async ({ page, request }) => {
    await divertApiOrigin(page, process.env.EEA_PW_API_ORIGIN)
    const lpsRes = await request.get(`${API}/api/v1/landing-points`)
    expect(lpsRes.ok(), 'landing points must be reachable').toBeTruthy()
    const landingPoints = (await lpsRes.json()) as LandingPoint[]

    // Pick the landing point with the most versions. Creating one leaves a
    // permanent assessment row, so seeding only happens behind the opt-in flag.
    let target: LandingPoint | null = null
    let history: Assessment[] = []
    for (const lp of landingPoints) {
      const rows = await historyOf(request, lp.id)
      if (rows.length > history.length) {
        target = lp
        history = rows
      }
      if (rows.length >= 2) break
    }
    if (target && history.length < 2 && process.env.EEA_PW_HISTORY_SEED === '1') {
      const seeded = await request.patch(`${API}/api/v1/strategy/landing-points/${target.id}/funnel`, {
        data: { finalize: true },
      })
      expect(seeded.ok(), `seeding a second version failed: ${await seeded.text()}`).toBeTruthy()
      history = await historyOf(request, target.id)
    }
    test.skip(
      !target || history.length < 2,
      'no landing point has two assessment versions; set EEA_PW_HISTORY_SEED=1 to finalize a second one',
    )

    const current = history.filter((row) => row.is_current)
    expect(current.length, 'exactly one version may be current').toBe(1)
    const older = history.filter((row) => !row.is_current)

    const failed: string[] = []
    page.on('requestfailed', (req) => {
      const aborted = req.failure()?.errorText?.includes('ABORTED') ?? false
      if (!aborted && req.url().includes('/api/v1/')) failed.push(req.url())
    })

    await page.goto('/strategy')
    await expect(page.getByRole('heading', { name: '创新组合' })).toBeVisible()

    // Select the landing point through the real control.
    await page.getByRole('combobox').first().click()
    await page.locator('.ant-select-item-option', { hasText: target!.name }).first().click()

    const card = page.locator('.panel-card', { hasText: '当前与历史版本' })
    await expect(card).toBeVisible()

    const currentRow = card.locator('.ant-timeline-item', { hasText: `版本 v${current[0].version}` })
    await expect(currentRow).toBeVisible()
    await expect(currentRow.getByText(/当前版本|最近定稿/)).toBeVisible()
    if (current[0].classification) {
      await expect(currentRow.getByText(current[0].classification)).toBeVisible()
    }

    for (const row of older) {
      const item = card.locator('.ant-timeline-item', { hasText: `版本 v${row.version}` })
      await expect(item).toBeVisible()
      await expect(item.getByText('历史', { exact: true })).toBeVisible()
      if (row.classification) {
        await expect(item.getByText(row.classification)).toBeVisible()
      }
    }

    // Operator and time come from the server row, not a placeholder.
    await expect(currentRow.getByText(/操作者：\S+/)).toBeVisible()
    await expect(currentRow.getByText(/时间：\d{4}-\d{2}-\d{2}/)).toBeVisible()

    // A reload keeps the same version set: history is served, not local state.
    await page.reload()
    await page.getByRole('combobox').first().click()
    await page.locator('.ant-select-item-option', { hasText: target!.name }).first().click()
    await expect(
      page.locator('.panel-card', { hasText: '当前与历史版本' }).getByText(`版本 v${current[0].version}`),
    ).toBeVisible()

    expect(failed, 'no /api/v1 request may fail on the strategy page').toEqual([])
  })
})
