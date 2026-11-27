import { expect, test } from '@playwright/test'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { divertApiOrigin } from './api-origin'

const API = process.env.EEA_API_URL ?? 'http://127.0.0.1:8000'
const PENDING_KEY = 'eea.pending-capture-job'

test.setTimeout(180_000)

type SignalRow = { id: string; title: string; evidence_status_code: string }

test.describe('async import task (FE-12)', () => {
  // The upload writes a document row, and the API has no document delete route.
  // Run it on a disposable database (CI/dev scratch) by setting the flag; the
  // signal it creates is removed again, the document row is documented residue.
  test.skip(!process.env.EEA_PW_DOC_ROWS, 'set EEA_PW_DOC_ROWS=1 to allow the document row this case leaves behind')

  test('a document upload resumes after a reload and still finishes', async ({ page, request }) => {
    await divertApiOrigin(page, process.env.EEA_PW_API_ORIGIN)
    const stamp = Date.now()
    const name = `pw-async-${stamp}.md`
    const dir = mkdtempSync(join(tmpdir(), 'eea-async-'))
    const file = join(dir, name)
    writeFileSync(file, `# PW async ${stamp}\n\nBody for the async import browser case.\n`, 'utf8')

    await page.goto('/newSignal')
    await page.setInputFiles('.import-unified-file-input', file)

    // The page stores the job id before the server finishes: that is the state a
    // reload has to recover from.
    await page.waitForFunction(
      (key) => Boolean(window.sessionStorage.getItem(key)),
      PENDING_KEY,
      { timeout: 60_000 },
    )
    const jobId = await page.evaluate((key) => {
      const raw = window.sessionStorage.getItem(key)
      return raw ? (JSON.parse(raw) as { jobId: string }).jobId : ''
    }, PENDING_KEY)
    expect(jobId, 'the pending job id must be stored').toBeTruthy()

    const jobRes = await request.get(`${API}/api/v1/capture/jobs/${jobId}`)
    expect(jobRes.ok(), 'the job must exist server-side before the reload').toBeTruthy()

    await page.reload()

    // Resumed from session storage: the panel keeps the filename, reaches the
    // terminal state and offers the signal; the pending entry is cleared so a
    // later reload does not replay a finished job.
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('button', { name: '打开信号' })).toBeVisible({ timeout: 150_000 })
    await expect
      .poll(() => page.evaluate((key) => window.sessionStorage.getItem(key), PENDING_KEY), { timeout: 30_000 })
      .toBeNull()

    const listed = await request.get(`${API}/api/v1/signals?keyword=${encodeURIComponent(name.replace('.md', ''))}`)
    expect(listed.ok()).toBeTruthy()
    const rows = (await listed.json()) as SignalRow[]
    for (const row of rows) {
      if (!row.title.includes(name.replace('.md', ''))) continue
      if (row.evidence_status_code !== 'archived') {
        await request.patch(`${API}/api/v1/signals/${row.id}`, { data: { evidence_status_code: 'archived' } })
      }
      await request.delete(`${API}/api/v1/signals/${row.id}`)
    }
  })
})
