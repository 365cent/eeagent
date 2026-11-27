import { expect, test } from '@playwright/test'

const API = process.env.EEA_API_URL ?? 'http://127.0.0.1:8000'

test.setTimeout(120_000)

type SignalRow = { id: string; title: string; document_id: string | null }
type Chunk = { chunk_id: number; section_path: string[] | null }
type Figure = { figure_index: number; review_status: string; image_url: string | null }

test.describe('document research (FE-11)', () => {
  test('server counts, figure focus and deep links survive a reload', async ({ page, request }) => {
    const list = await request.get(`${API}/api/v1/signals?limit=200`)
    expect(list.ok(), 'signals must be reachable').toBeTruthy()
    const signals = (await list.json()) as SignalRow[]

    let target: { signal: SignalRow; chunks: Chunk[]; figures: Figure[] } | null = null
    for (const signal of signals) {
      if (!signal.document_id) continue
      const chunksRes = await request.get(`${API}/api/v1/documents/${signal.document_id}/chunks`)
      if (!chunksRes.ok()) continue
      const chunks = (await chunksRes.json()) as Chunk[]
      if (!chunks.length) continue
      const figuresRes = await request.get(`${API}/api/v1/documents/${signal.document_id}/figures`)
      if (!figuresRes.ok()) continue
      const figures = (await figuresRes.json()) as Figure[]
      if (!figures.some((row) => row.image_url)) continue
      target = { signal, chunks, figures }
      break
    }
    test.skip(!target, 'no document signal with chunks and a stored figure in this database')

    const figure = target!.figures.find((row) => row.image_url)!
    const pathChunk = target!.chunks.find((row) => (row.section_path ?? []).length > 0)

    const failed: string[] = []
    page.on('requestfailed', (req) => {
      const aborted = req.failure()?.errorText?.includes('ABORTED') ?? false
      if (!aborted && req.url().includes('/api/v1/')) failed.push(req.url())
    })

    await page.goto(`/singal/${target!.signal.id}`)
    await page.locator('.ant-segmented-item', { hasText: '文档研究' }).click()

    const research = page.locator('.document-research')
    await expect(research).toBeVisible()
    // Counts come from the server payload, not a local guess.
    await expect(research.getByText(`${target!.chunks.length} 个章节分块`)).toBeVisible()
    await expect(research.getByText(`${target!.figures.length} 张图块`)).toBeVisible()
    await expect(research.locator('.document-research-figure')).toHaveCount(target!.figures.length)
    await expect(research.locator('.document-research-chunk-meta')).toContainText('段落')

    const card = research
      .locator('.document-research-figure')
      .filter({ has: page.getByText(`图 ${figure.figure_index}`, { exact: true }) })
      .first()
    await card.getByRole('button', { name: '定位图块' }).click()
    await expect(page).toHaveURL(new RegExp(`doc_figure=${figure.figure_index}`))
    await expect(research.locator('.document-research-figure.is-active')).toHaveCount(1)

    // The image is served from the stored object, not a placeholder.
    const img = card.locator('img')
    await expect(img).toBeVisible()
    await expect
      .poll(async () => img.evaluate((node) => (node as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0)

    // A needs-review figure must say so instead of implying success.
    if (figure.review_status === 'needs_review') {
      await expect(card.getByText('待复核')).toBeVisible()
    }

    // Reloading the deep link restores the same figure instead of dropping it.
    await page.reload()
    await expect(page.locator('.document-research')).toBeVisible()
    await expect(page).toHaveURL(new RegExp(`doc_figure=${figure.figure_index}`))
    await expect(page.locator('.document-research .document-research-figure.is-active')).toHaveCount(1)

    // A sectioned chunk opens directly from the tree and writes its own link.
    if (pathChunk) {
      const title = pathChunk.section_path![pathChunk.section_path!.length - 1]
      await page.locator('.document-research-tree-title', { hasText: title }).click()
      await expect(page).toHaveURL(new RegExp(`doc_chunk=${pathChunk.chunk_id}`))
      await expect(page.locator('.document-research-section-title')).toContainText(title)
    }

    expect(failed, 'no /api/v1 request may fail in the research panel').toEqual([])
  })
})

