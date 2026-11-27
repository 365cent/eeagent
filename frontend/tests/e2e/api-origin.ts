import type { Page } from '@playwright/test'

/**
 * Point the browser's /api/v1 calls at an isolated API instead of the Next
 * rewrite target. The `request` fixture is not affected; set EEA_API_URL for it.
 * Uses route.continue so streamed multipart uploads keep their body.
 */
export async function divertApiOrigin(page: Page, origin: string | undefined) {
  if (!origin) return
  const target = new URL(origin.replace(/\/$/, ''))
  await page.route('**/api/v1/**', async (route) => {
    const url = new URL(route.request().url())
    url.protocol = target.protocol
    url.host = target.host
    await route.continue({ url: url.toString() })
  })
}
