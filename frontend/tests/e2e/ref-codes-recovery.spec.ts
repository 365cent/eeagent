import { expect, test } from '@playwright/test'

const API = process.env.EEA_API_URL ?? 'http://127.0.0.1:8000'

test.setTimeout(120_000)

type SignalDetail = { id: string }

test.describe('dictionary bootstrap (FE-12)', () => {
  test('a failed dictionary load offers a retry and never claims the signal is missing', async ({
    page,
    request,
  }) => {
    const stamp = Date.now()
    const created = await request.post(`${API}/api/v1/signals`, {
      data: {
        title: `PW ref-code retry ${stamp}`,
        url: `https://example.com/pw-ref-codes-${stamp}`,
        channel_code: 'web',
        evidence_status_code: 'pending_review',
      },
    })
    expect(created.status(), 'scratch signal must be created through the public API').toBe(201)
    const signal = (await created.json()) as SignalDetail

    let dictionaryDown = true
    await page.route('**/api/v1/ref-codes*', async (route) => {
      if (!dictionaryDown) return route.continue()
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: '{"detail":"dictionary temporarily unavailable"}',
      })
    })

    try {
      await page.goto(`/singal/${signal.id}`)
      // The detail request waits for the dictionary, so the page must report the
      // bootstrap failure instead of reusing the "missing signal" copy.
      await expect(page.getByText('基础字典加载失败')).toBeVisible({ timeout: 45_000 })
      await expect(page.getByText('信号不存在')).toHaveCount(0)

      dictionaryDown = false
      await page.getByRole('button', { name: /重\s*试/ }).click()
      await expect(page.locator('.signal-classification-editor')).toBeVisible({ timeout: 30_000 })
    } finally {
      await page.unroute('**/api/v1/ref-codes*')
      await request.patch(`${API}/api/v1/signals/${signal.id}`, {
        data: { evidence_status_code: 'archived' },
      })
      await request.delete(`${API}/api/v1/signals/${signal.id}`)
    }
  })
})
