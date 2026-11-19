import { defineConfig } from '@playwright/test'

/**
 * Trace-page smoke test only. Reuses the host Edge/Chrome because the production
 * intranet image ships no browser download; CI must provide one of these paths
 * or set EEA_PW_CHANNEL.
 *
 * Run: pnpm pw:smoke
 * Requires the API on :8000 and the web app on :3000 (see README).
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: process.env.EEA_PW_BASE_URL ?? 'http://127.0.0.1:3000',
    channel: process.env.EEA_PW_CHANNEL ?? 'msedge',
    headless: true,
    trace: 'retain-on-failure',
  },
})
