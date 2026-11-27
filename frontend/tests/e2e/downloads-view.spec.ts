import { createHash } from 'node:crypto'

import { expect, test } from '@playwright/test'

import { divertApiOrigin } from './api-origin'

const API = (process.env.EEA_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '')
const MISSING = '—'

type Release = {
  platform: 'windows' | 'macos'
  filename: string
  size_bytes: number
  sha256: string
  version?: string | null
  download_url: string
}

function formatSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

test.describe('client downloads (FE-01)', () => {
  test('lists exactly what the API publishes and serves that build', async ({ page, request }) => {
    test.slow()
    await divertApiOrigin(page, process.env.EEA_PW_API_ORIGIN)
    const res = await request.get(`${API}/api/v1/capture/client-releases`)
    expect(res.ok(), 'the release list must be readable').toBeTruthy()
    const releases = (await res.json()) as Release[]

    const failed: string[] = []
    page.on('requestfailed', (req) => {
      const aborted = req.failure()?.errorText?.includes('ABORTED') ?? false
      if (!aborted && req.url().includes('/api/v1/')) failed.push(req.url())
    })

    await page.goto('/downloads')
    const card = page.locator('.ant-card', { hasText: '采集客户端' })
    await expect(card).toBeVisible()
    const rows = card.locator('tbody tr.ant-table-row')

    if (releases.length === 0) {
      await expect(card.getByText('服务器上还没有发布任何客户端构建。')).toBeVisible()
      await expect(rows).toHaveCount(0)
      expect(failed, 'no /api/v1 request may fail on the downloads page').toEqual([])
      return
    }

    // One row per platform: a platform with no build gets no row and no link.
    const platforms = [...new Set(releases.map((release) => release.platform))]
    await expect(rows).toHaveCount(platforms.length)
    await expect(page.getByRole('link', { name: /^下载 (exe|dmg)$/ })).toHaveCount(platforms.length)

    for (const platform of platforms) {
      const release = releases.find((candidate) => candidate.platform === platform)
      expect(release, `${platform} must be in the list`).toBeTruthy()
      const row = rows.filter({ hasText: release!.filename })
      await expect(row).toHaveCount(1)
      await expect(row.getByText(release!.version ?? MISSING, { exact: true })).toBeVisible()
      await expect(row.getByText(formatSize(release!.size_bytes))).toBeVisible()

      const link = row.getByRole('link')
      await expect(link).toHaveAttribute('href', new RegExp(`platform=${platform}`))
      await expect(link).toHaveText(platform === 'windows' ? '下载 exe' : '下载 dmg')

      // The published hash is labelled with the file it belongs to.
      const hashPanel = page.locator('.ant-card', { hasText: '安装与校验' })
      const entry = hashPanel
        .locator('span.ant-typography')
        .filter({ hasText: `SHA-256（${release!.filename}）：` })
      await expect(entry).toHaveCount(1)
      await expect(entry).toContainText(release!.sha256)

      // The advertised link must serve exactly the artifact the API described.
      const download = await request.get(`${API}${release!.download_url}`)
      expect(download.ok(), `${release!.download_url} must be downloadable`).toBeTruthy()
      const body = await download.body()
      expect(body.byteLength, 'served size must equal size_bytes').toBe(release!.size_bytes)
      expect(createHash('sha256').update(body).digest('hex'), 'served bytes must match sha256').toBe(
        release!.sha256,
      )
    }

    if (!platforms.includes('macos')) {
      await expect(page.getByText('暂未提供')).toBeVisible()
      await expect(page.locator('code', { hasText: 'EEA-Capture-<版本>-macOS.dmg' })).toBeVisible()
    }

    expect(failed, 'no /api/v1 request may fail on the downloads page').toEqual([])
  })

  test('an unreachable release list shows the error state, not a fake one', async ({ page }) => {
    await divertApiOrigin(page, process.env.EEA_PW_API_ORIGIN)
    // Registered after divertApiOrigin: Playwright runs the newest matching route first.
    await page.route('**/api/v1/capture/client-releases', (route) => route.abort())

    await page.goto('/downloads')
    const card = page.locator('.ant-card', { hasText: '采集客户端' })
    // React Query retries before it settles on the error branch.
    await expect(card.getByText('暂时无法读取发布列表，请检查 API 连接后重试。')).toBeVisible({
      timeout: 25_000,
    })
    // An error must never be papered over with rows or links.
    await expect(card.locator('tbody tr.ant-table-row')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /^下载 (exe|dmg)$/ })).toHaveCount(0)
  })
})
