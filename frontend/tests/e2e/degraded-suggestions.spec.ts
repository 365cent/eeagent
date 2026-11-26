import { expect, test } from '@playwright/test'

const API = process.env.EEA_API_URL ?? 'http://127.0.0.1:8000'

test.setTimeout(120_000)

type SignalDetail = {
  id: string
  updated_at: string
  value_chain_stage_code: string | null
  signal_type_code: string | null
}

type TagSuggestion = {
  degraded_reason: string | null
  source: string
}

test.describe('model degradation (FE-12)', () => {
  test('an unavailable model is reported, and the drawer still saves by hand', async ({ page, request }) => {
    const stamp = Date.now()
    const created = await request.post(`${API}/api/v1/signals`, {
      data: {
        title: `PW degraded suggestions ${stamp}`,
        url: `https://example.com/pw-degraded-${stamp}`,
        channel_code: 'web',
        evidence_status_code: 'pending_review',
      },
    })
    expect(created.status(), 'scratch signal must be created through the public API').toBe(201)
    const signal = (await created.json()) as SignalDetail

    try {
      // The server decides whether the model is unavailable; a healthy gateway
      // has nothing to assert, so the case skips instead of faking a failure.
      const suggestionRes = await request.get(`${API}/api/v1/signals/${signal.id}/tag-suggestions`)
      expect(suggestionRes.ok(), 'the suggestion endpoint must answer').toBeTruthy()
      const suggestion = (await suggestionRes.json()) as TagSuggestion
      test.skip(!suggestion.degraded_reason, 'the model gateway answered; no degradation to show')

      await page.goto(`/singal/${signal.id}`)
      const editor = page.locator('.signal-classification-editor')
      await expect(editor).toBeVisible()
      // The server reason is rendered verbatim, so the page cannot invent a
      // different explanation than the one the API returned.
      await expect(editor.getByText(suggestion.degraded_reason as string)).toBeVisible({ timeout: 30_000 })

      // Degraded must not mean blocked: the manual correction still saves.
      await editor.getByRole('button', { name: /修\s*正/ }).click()
      const selects = editor.locator('.ant-select')
      await selects.nth(0).click()
      await page.locator('.ant-select-item-option', { hasText: '兑现端（消费者）' }).first().click()
      await editor.getByRole('button', { name: /保\s*存/ }).click()
      await expect(page.getByText('分类已保存')).toBeVisible()

      const afterSave = await request.get(`${API}/api/v1/signals/${signal.id}`)
      const saved = (await afterSave.json()) as SignalDetail
      expect(saved.value_chain_stage_code, 'the manual save must persist while the model is down').toBe(
        'realization_consumer',
      )
      expect(saved.updated_at).not.toBe(signal.updated_at)
    } finally {
      await request.patch(`${API}/api/v1/signals/${signal.id}`, {
        data: { evidence_status_code: 'archived' },
      })
      await request.delete(`${API}/api/v1/signals/${signal.id}`)
    }
  })
})
