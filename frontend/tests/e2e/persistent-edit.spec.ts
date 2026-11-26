import { expect, test } from '@playwright/test'

const API = process.env.EEA_API_URL ?? 'http://127.0.0.1:8000'
const STAGE_LABEL = '传递端（主机厂）'
const TYPE_LABEL = '技术'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

test.setTimeout(120_000)

type SignalDetail = {
  id: string
  updated_at: string
  value_chain_stage_code: string | null
  signal_type_code: string | null
}

test.describe('persistent edits (FE-12)', () => {
  test('a classification correction survives a reload and is audited by the server', async ({ page, request }) => {
    const stamp = Date.now()
    // No body text: the ingest tag suggestions would otherwise call the model and
    // make this case depend on gateway latency. The drawer edits the same row.
    const created = await request.post(`${API}/api/v1/signals`, {
      data: {
        title: `PW persistent edit ${stamp}`,
        url: `https://example.com/pw-persistent-${stamp}`,
        channel_code: 'web',
        evidence_status_code: 'pending_review',
      },
    })
    expect(created.status(), 'scratch signal must be created through the public API').toBe(201)
    const signal = (await created.json()) as SignalDetail
    const whoami = await request.get(`${API}/api/v1/capture/whoami`)
    expect(whoami.ok(), 'whoami must report the serving operator').toBeTruthy()
    const actor = (await whoami.json()) as { subject: string }

    try {
      const failed: string[] = []
      page.on('requestfailed', (req) => {
        // A reload cancels the in-flight suggestion query; that is navigation,
        // not a failing API contract.
        const aborted = req.failure()?.errorText?.includes('ABORTED') ?? false
        if (!aborted && req.url().includes('/api/v1/')) failed.push(req.url())
      })

      await page.goto(`/singal/${signal.id}`)
      expect(signal.value_chain_stage_code, 'the scratch signal starts unclassified').toBeNull()
      const editor = page.locator('.signal-classification-editor')
      await expect(editor).toBeVisible()

      await editor.getByRole('button', { name: /修\s*正/ }).click()
      const selects = editor.locator('.ant-select')
      await selects.nth(0).click()
      await page.locator('.ant-select-item-option', { hasText: STAGE_LABEL }).first().click()
      await selects.nth(1).click()
      await page.locator('.ant-select-item-option', { hasText: TYPE_LABEL }).first().click()
      await editor.getByRole('button', { name: /保\s*存/ }).click()
      await expect(page.getByText('分类已保存')).toBeVisible()

      const afterPatch = await request.get(`${API}/api/v1/signals/${signal.id}`)
      expect(afterPatch.ok()).toBeTruthy()
      const patched = (await afterPatch.json()) as SignalDetail
      expect(patched.value_chain_stage_code, 'stage must be persisted server-side').toBe('delivery_oem')
      expect(patched.signal_type_code, 'type must be persisted server-side').toBe('technology')
      expect(patched.updated_at, 'an accepted correction must move the revision').not.toBe(signal.updated_at)

      const stale = await request.patch(`${API}/api/v1/signals/${signal.id}`, {
        data: { signal_type_code: 'capital', expected_updated_at: signal.updated_at },
      })
      expect(stale.status(), 'a save against an old revision must be a 409').toBe(409)

      await page.reload()
      await expect(editor.getByText(STAGE_LABEL)).toBeVisible()
      await expect(editor.getByText(TYPE_LABEL).first()).toBeVisible()

      // the drawer shows the server-side audit: old -> new, actor and time
      await page.getByRole('button', { name: /修正记录/ }).click()
      const stageRow = page.getByRole('row', { name: new RegExp('价值链环节.*' + escapeRegExp(STAGE_LABEL) + '.*' + escapeRegExp(actor.subject)) })
      await expect(stageRow).toBeVisible()
      await expect(stageRow).toContainText('—')
      const typeRow = page.getByRole('row', { name: new RegExp('信号类型.*' + escapeRegExp(TYPE_LABEL) + '.*' + escapeRegExp(actor.subject)) })
      await expect(typeRow).toBeVisible()

      expect(failed, 'no /api/v1 request may fail during the edit flow').toEqual([])
    } finally {
      await request.patch(`${API}/api/v1/signals/${signal.id}`, {
        data: { evidence_status_code: 'archived' },
      })
      await request.delete(`${API}/api/v1/signals/${signal.id}`)
    }
  })
})
