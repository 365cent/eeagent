import { expect, test } from '@playwright/test'

const API = process.env.EEA_API_URL ?? 'http://127.0.0.1:8000'
const LP_NAME = '智能保险丝（eFuse）'

test.setTimeout(150_000)

test.describe('chain report smoke', () => {
  test('generates, previews and downloads a persisted chain report from the UI', async ({ page, request }) => {
    const rows = await request.get(`${API}/api/v1/landing-points`)
    expect(rows.ok(), 'landing-points API must be reachable').toBeTruthy()
    const landingPoints = (await rows.json()) as Array<{ id: string; name: string; standard_count?: number }>
    const target = landingPoints.find((row) => row.name === LP_NAME)
    test.skip(!target, `no ${LP_NAME} landing point in this database`)

    const failed: string[] = []
    page.on('requestfailed', (req) => {
      if (req.url().includes('/api/v1/')) failed.push(req.url())
    })

    await page.goto('/report')
    await expect(page.getByRole('heading', { name: '链路报告' }).first()).toBeVisible()

    await page.getByRole('combobox').click()
    await page.locator('.ant-select-item-option', { hasText: LP_NAME }).first().click()
    await page.getByRole('button', { name: '生成 Markdown' }).click()
    await expect(page.getByText('链路报告已生成')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText('EEA 链路报告').first()).toBeVisible()
    await expect(page.getByText('部署标准九宫格').first()).toBeVisible()
    await expect(page.getByText('数据快照').first()).toBeVisible()

    await page.getByRole('button', { name: '请求 PDF' }).click()
    await expect(page.getByText('PDF 已下载')).toBeVisible({ timeout: 60_000 })

    expect(failed, 'no /api/v1 request may fail during the report flow').toEqual([])
  })
})
