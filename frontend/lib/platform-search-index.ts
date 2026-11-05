import MiniSearch from 'minisearch'
import { mainMenuEntries } from '@/config/menu'
import { utilityPages } from '@/config/utility-pages'
import { demandPoints, landingPoints } from '@/mocks/demands'
import { getLivePlatformSearchData } from '@/lib/live-platform-data'
import { signals } from '@/mocks/signals'
import { themes } from '@/mocks/themes'
import type { AppRouteOptions } from '@/types/platform'

export type PlatformSearchKind = 'nav' | 'signal' | 'theme' | 'demand' | 'landing' | 'action'

export type PlatformSearchDocument = {
  id: string
  kind: PlatformSearchKind
  /** Route view key — used to pick the same icon as the sider menu. */
  viewKey: string
  title: string
  subtitle: string
  body: string
  route: AppRouteOptions
}

export type PlatformSearchHit = PlatformSearchDocument & {
  score: number
}

const kindLabels: Record<PlatformSearchKind, string> = {
  nav: '工作台导航',
  signal: '信号与证据',
  theme: '技术主题',
  demand: '需求点',
  landing: '技术落脚点',
  action: '快捷操作',
}

export function platformSearchKindLabel(kind: PlatformSearchKind): string {
  return kindLabels[kind]
}

function buildDocuments(): PlatformSearchDocument[] {
  const live = getLivePlatformSearchData()
  const signalSource = live?.signals?.length ? live.signals : signals
  const themeSource: { id: string; name: string; note: string; count: number; sources: number }[] =
    live?.themes?.length
      ? live.themes.map((theme) => ({
          id: theme.id,
          name: theme.name,
          note: theme.note,
          count: theme.count,
          sources: theme.sources,
        }))
      : themes.map((theme, index) => ({
          id: `mock-${index}`,
          name: theme.name,
          note: theme.note,
          count: theme.count,
          sources: theme.sources,
        }))
  const demandSource = live?.demands?.length ? live.demands : demandPoints
  const landingSource = live?.landings?.length ? live.landings : landingPoints

  const docs: PlatformSearchDocument[] = []

  for (const entry of mainMenuEntries) {
    docs.push({
      id: `nav-${entry.key}`,
      kind: 'nav',
      viewKey: entry.key,
      title: entry.title,
      subtitle: '打开工作台页面',
      body: entry.key,
      route: { view: entry.key },
    })
  }

  for (const [key, page] of Object.entries(utilityPages)) {
    if (key === 'search' || key === 'singal') continue
    docs.push({
      id: `action-${key}`,
      kind: 'action',
      viewKey: key,
      title: page.title,
      subtitle: page.description,
      body: `${page.eyebrow} ${key}`,
      route: { view: key },
    })
  }

  for (const signal of signalSource) {
    docs.push({
      id: `signal-${signal.key}`,
      kind: 'signal',
      viewKey: 'signals',
      title: signal.title,
      subtitle: `${signal.publisher} · ${signal.stage} · ${signal.status}`,
      body: [signal.publisher, signal.channel, signal.type, signal.stage, ...signal.tags].join(' '),
      route: { view: 'singal', id: signal.key },
    })
  }

  for (const theme of themeSource) {
    docs.push({
      id: `theme-${theme.id}`,
      kind: 'theme',
      viewKey: 'topics',
      title: theme.name,
      subtitle: theme.note,
      body: `${theme.count} 信号 ${theme.sources} 来源`,
      route: { view: 'topics' },
    })
  }

  for (const demand of demandSource) {
    docs.push({
      id: `demand-${demand.key}`,
      kind: 'demand',
      viewKey: 'topics',
      title: demand.name,
      subtitle: `${demand.stage} · ${demand.status}`,
      body: demand.evidence,
      route: { view: 'topics' },
    })
  }

  for (const landing of landingSource) {
    docs.push({
      id: `landing-${landing.key}`,
      kind: 'landing',
      viewKey: 'technology',
      title: landing.name,
      subtitle: `${landing.domain} · ${landing.category}`,
      body: `${landing.role} ${landing.standards}`,
      route: { view: 'technology' },
    })
  }

  return docs
}

let cachedIndex: MiniSearch<PlatformSearchDocument> | null = null
let cachedDocs: PlatformSearchDocument[] | null = null

export function resetPlatformSearchIndex() {
  cachedIndex = null
  cachedDocs = null
}

export function getPlatformSearchIndex(): { index: MiniSearch<PlatformSearchDocument>; docs: PlatformSearchDocument[] } {
  if (cachedIndex && cachedDocs) {
    return { index: cachedIndex, docs: cachedDocs }
  }

  const docs = buildDocuments()
  const index = new MiniSearch<PlatformSearchDocument>({
    fields: ['title', 'subtitle', 'body'],
    storeFields: ['id', 'kind', 'viewKey', 'title', 'subtitle', 'route'],
    searchOptions: {
      boost: { title: 3, subtitle: 1.5, body: 1 },
      fuzzy: 0.2,
      prefix: true,
    },
  })

  index.addAll(docs)
  cachedIndex = index
  cachedDocs = docs
  return { index, docs }
}

export function searchPlatform(query: string, limit = 12): PlatformSearchHit[] {
  const trimmed = query.trim()
  const { index, docs } = getPlatformSearchIndex()

  if (!trimmed) {
    return docs
      .filter((doc) => doc.kind === 'nav' || doc.kind === 'action')
      .slice(0, limit)
      .map((doc) => ({ ...doc, score: 0 }))
  }

  const results = index.search(trimmed, { combineWith: 'AND' })
  return results.slice(0, limit).map((result) => {
    const doc = docs.find((item) => item.id === result.id)
    if (!doc) {
      return {
        id: String(result.id),
        kind: 'nav' as const,
        viewKey: 'overview',
        title: String(result.id),
        subtitle: '',
        body: '',
        route: { view: 'overview' },
        score: result.score,
      }
    }
    return { ...doc, score: result.score }
  })
}
