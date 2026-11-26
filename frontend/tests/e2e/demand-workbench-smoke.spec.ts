import { expect, test } from '@playwright/test'

const API = process.env.EEA_API_URL ?? 'http://127.0.0.1:8000'
const DEMAND_NAME = '低压系统智能化（W1 真实链）'

test.describe('demand workbench smoke', () => {
  test('opens from the demands table and loads the five-step record', async ({ page, request }) => {
    const res = await request.get(`${API}/api/v1/demands`)
    expect(res.ok(), 'demands API must be reachable').toBeTruthy()
    const demands = (await res.json()) as Array<{ id: string; name: string }>
    test.skip(!demands.some((demand) => demand.name === DEMAND_NAME), `no ${DEMAND_NAME} demand in this database`)

    await page.goto('/demands')
    const row = page.getByRole('row', { name: new RegExp(DEMAND_NAME) }).first()
    await expect(row).toBeVisible()
    await row.getByRole('button', { name: '工作台' }).click()

    const drawer = page.getByRole('dialog', { name: '需求点工作台' })
    await expect(drawer).toBeVisible()
    await expect(drawer.getByText('五步需求推导')).toBeVisible()
    await expect(drawer.getByText(DEMAND_NAME).first()).toBeVisible()
    await expect(drawer.getByText('已关联 2 条有效信号').first()).toBeVisible()
    await expect(drawer.getByText('交叉验证', { exact: true }).first()).toBeVisible()
  })
})
