import { expect, test } from '@playwright/test'

const API = process.env.EEA_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1'

test.describe('trace page smoke', () => {
  test('trace overview renders server relations or the real empty state', async ({ page, request }) => {
    const response = await request.get(`${API}/panorama`)
    expect(response.ok(), 'panorama API must answer before the page is judged').toBeTruthy()
    const panorama = await response.json()
    const landingRows = panorama.flatMap((stage: { demand_points?: { functions?: { landing_points?: unknown[] }[] }[] }) =>
      (stage.demand_points ?? []).flatMap((demand) =>
        (demand.functions ?? []).flatMap((fn) => fn.landing_points ?? []),
      ),
    )
    const failed: string[] = []
    page.on('requestfailed', (req) => {
      if (req.url().includes('/api/v1/')) failed.push(req.url())
    })

    await page.goto('/trace')
    await expect(page.getByRole('heading', { name: '链路追溯' })).toBeVisible()

    if (landingRows.length === 0) {
      await expect(page.getByText('暂无可追溯链路')).toBeVisible()
      // empty state must be real: no demo relation rows may appear
      await expect(page.getByRole('button', { name: '查看完整链路' })).toHaveCount(0)
    } else {
      await expect(page.getByRole('button', { name: '查看完整链路' }).first()).toBeVisible()
      await expect(page.getByText('暂无可追溯链路')).toHaveCount(0)
    }

    expect(failed, 'no API request may fail while the trace page loads').toEqual([])
  })

  test('invalid landing-point deep link explains the missing chain', async ({ page }) => {
    const missing = '00000000-0000-0000-0000-000000000000'
    const response = await page.request.get(`${API}/trace/landing-points/${missing}`)
    expect(response.status(), 'unknown landing point must be a 404').toBe(404)

    await page.goto(`/traceDetail/${missing}`)
    // The detail view replaces the chain with an explicit missing-record notice.
    await expect(page.getByText('无法打开这条追溯链')).toBeVisible()
    await expect(page.getByText('该技术落脚点已不存在')).toBeVisible()
  })
})
