import { expect, test } from '@playwright/test'

const API = process.env.EEA_API_URL ?? 'http://127.0.0.1:8000'
const SEED_FILE = process.env.EEA_PW_SEED_FILE ?? ''
const STAGES = ['信号采集·证据库', '标签与主题归纳', '需求与功能映射', '技术全景图'] as const

test.describe('seven-stage chain smoke', () => {
  test.skip(!SEED_FILE, 'set EEA_PW_SEED_FILE to the JSON printed by scripts/seed_smoke_chain.py')

  test('the seeded chain is visible end to end on the real pages', async ({ page, request }) => {
    const chain = JSON.parse(await (await import('node:fs/promises')).readFile(SEED_FILE, 'utf8')) as {
      signal_id: string
      demand_id: string
      function_id: string
      landing_point_id: string
    }

    const trace = await request.get(`${API}/api/v1/trace/landing-points/${chain.landing_point_id}`)
    expect(trace.ok(), 'seeded landing point must resolve through the trace API').toBeTruthy()
    const body = await trace.json()
    const signalIds: string[] = (body.signals ?? []).map((row: { id: string }) => row.id)
    expect(signalIds, 'trace must reach the seeded signal').toContain(chain.signal_id)

    const failed: string[] = []
    page.on('requestfailed', (req) => {
      if (req.url().includes('/api/v1/')) failed.push(req.url())
    })

    // stage 1: the retained signal is listed with its real title
    await page.goto('/signals')
    await expect(page.getByRole('heading', { name: STAGES[0] }).first()).toBeVisible()
    await expect(page.getByText('48V低压供电网络研究').first()).toBeVisible()

    // stage 2: theme grouping shows the signal under its theme
    await page.goto('/topics')
    await expect(page.getByRole('heading', { name: STAGES[1] }).first()).toBeVisible()
    await expect(page.getByText('低压系统智能化').first()).toBeVisible()

    // stage 3+4: served relations render demand → function → landing point
    await page.goto('/trace')
    await expect(page.getByRole('heading', { name: '链路追溯' })).toBeVisible()
    await expect(page.getByRole('button', { name: '查看完整链路' }).first()).toBeVisible()

    await page.goto('/technology')
    await expect(page.getByRole('heading', { name: STAGES[3] }).first()).toBeVisible()
    await expect(page.getByText('智能保险丝（eFuse）').first()).toBeVisible()

    expect(failed, 'no /api/v1 request may fail while walking the chain').toEqual([])
  })

  test('landing point deep link shows the full chain and standards', async ({ page }) => {
    test.skip(!SEED_FILE, 'seed file missing')
    const chain = JSON.parse(await (await import('node:fs/promises')).readFile(SEED_FILE, 'utf8'))
    await page.goto(`/traceDetail/${chain.landing_point_id}`)
    await expect(page.getByText('智能保险丝（eFuse）').first()).toBeVisible()
    await expect(page.getByText('满足AEC-Q100标准，支持过流/过压/过热保护').first()).toBeVisible()
    await expect(page.getByText('全节点智能配电').first()).toBeVisible()
    await expect(page.getByText('完成保护功能验证').first()).toBeVisible()
    await expect(page.getByText('总分 20/25').first()).toBeVisible()
  })
})
