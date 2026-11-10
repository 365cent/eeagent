import type { SignalOut, ThemeDetail } from '@/lib/api/types'

/** Minimum retained evidence rows and distinct origins to nominate a topic (环节三). */
export const TOPIC_MIN_EVIDENCE_COUNT = 2
export const TOPIC_MIN_DISTINCT_SOURCES = 2

const UNRELIABLE_TITLE_RE =
  /安全验证|security\s*verification|captcha|verify\s*you\s*are|访问验证|异常访问|chrome-error|人机验证|滑动验证/i

export function tagsMatch(suggested: string, themeTag: string): boolean {
  return suggested === themeTag || suggested.includes(themeTag) || themeTag.includes(suggested)
}

export function rankThemeOverlaps(
  themeTags: Map<string, Set<string>>,
  suggestedTags: Set<string>,
): Array<{ themeId: string; overlap: number }> {
  if (suggestedTags.size === 0) return []
  const ranked: Array<{ themeId: string; overlap: number }> = []
  for (const [themeId, tags] of themeTags) {
    let matched = 0
    for (const s of suggestedTags) {
      if ([...tags].some((t) => tagsMatch(s, t))) matched++
    }
    if (matched > 0) ranked.push({ themeId, overlap: matched })
  }
  ranked.sort((a, b) => b.overlap - a.overlap || a.themeId.localeCompare(b.themeId))
  return ranked
}

export function selectBestThemeId(
  themeTags: Map<string, Set<string>>,
  tagNames: string[],
): { themeId: string | null; reason: string } {
  const suggested = new Set(tagNames)
  if (suggested.size === 0) {
    return { themeId: null, reason: '信号没有任何技术方向标签，无法按标签归集' }
  }
  const ranked = rankThemeOverlaps(themeTags, suggested)
  if (ranked.length === 0) {
    return { themeId: null, reason: '没有任何主题与该信号的技术方向标签存在重合' }
  }
  const top = ranked[0].overlap
  if (top < 2) {
    return { themeId: null, reason: `与最佳主题仅重合 ${top} 个标签（需 ≥2）` }
  }
  const winners = ranked.filter((r) => r.overlap === top)
  if (winners.length > 1) {
    return { themeId: null, reason: `${winners.length} 个主题并列最高（各 ${top} 个标签）` }
  }
  return { themeId: winners[0].themeId, reason: `唯一匹配，重合 ${top} 个标签` }
}

export type TagCluster = {
  key: string
  label: string
  sharedTags: string[]
  signals: SignalOut[]
}

export type TopicInduction = {
  proposedWorkingName: string
  attributionTags: string[]
  valueChainStageCode: string | null
  signalCount: number
  sourceCount: number
  /** REQ-SIG-08 unique merge target, if any */
  mergeTarget: { themeId: string; reason: string } | null
}

/** Demand abstraction + naming from a tag cluster (环节三：需求抽象与命名). */
export function induceTopicFromCluster(
  cluster: TagCluster,
  themeTags: Map<string, Set<string>>,
): TopicInduction {
  const attributionTags = dedupeTags(
    cluster.sharedTags.length ? cluster.sharedTags : cluster.label.split(' · ').filter(Boolean),
  )

  const members = dedupeSignalsByUrl(cluster.signals.filter(isReliableTopicEvidence))
  const stageCounts = new Map<string, number>()
  const sources = new Set<string>()
  for (const s of members) {
    if (s.value_chain_stage_code) {
      stageCounts.set(s.value_chain_stage_code, (stageCounts.get(s.value_chain_stage_code) ?? 0) + 1)
    }
    sources.add(evidenceSourceKey(s))
  }
  let valueChainStageCode: string | null = null
  let best = 0
  for (const [code, n] of stageCounts) {
    if (n > best) {
      best = n
      valueChainStageCode = code
    }
  }

  const { themeId, reason } = selectBestThemeId(themeTags, attributionTags)
  const proposedWorkingName = proposeNaturalTopicName(members, attributionTags, null)
  return {
    proposedWorkingName: proposedWorkingName.slice(0, 120),
    attributionTags,
    valueChainStageCode,
    signalCount: members.length,
    sourceCount: sources.size,
    mergeTarget: themeId ? { themeId, reason } : null,
  }
}

export function buildThemeTagMap(themes: ThemeDetail[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()
  for (const theme of themes) {
    map.set(theme.id, new Set(theme.display_tags ?? []))
  }
  return map
}

function signalOverlap(a: string[], b: string[]): number {
  let n = 0
  for (const s of a) {
    if (b.some((t) => tagsMatch(s, t))) n++
  }
  return n
}

export function dedupeTags(tags: string[]): string[] {
  const out: string[] = []
  for (const tag of tags) {
    const t = tag.trim()
    if (!t) continue
    if (!out.some((existing) => tagsMatch(existing, t))) out.push(t)
  }
  return out
}

function intersectTags(members: SignalOut[]): string[] {
  if (members.length === 0) return []
  let acc = new Set(members[0].tags ?? [])
  for (const m of members.slice(1)) {
    const tags = m.tags ?? []
    acc = new Set([...acc].filter((t) => tags.some((x) => tagsMatch(t, x))))
  }
  return dedupeTags([...acc]).slice(0, 8)
}

export function cleanSignalTitle(title: string): string {
  return title
    .replace(/^【[^】]+】\s*/, '')
    .replace(/\s*[-|｜—].*$/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function titleDedupKey(title: string): string {
  return cleanSignalTitle(title).toLowerCase().replace(/\s/g, '')
}

/** One signal per normalized URL (newest wins). */
export function evidenceSourceKey(signal: SignalOut): string {
  const raw = signal.url_normalized?.trim() || signal.url?.trim()
  if (raw) {
    try {
      const href = raw.startsWith('http') ? raw : `https://${raw}`
      return new URL(href).hostname.toLowerCase()
    } catch {
      /* fall through */
    }
  }
  const publisher = signal.publisher?.trim()
  if (publisher) return publisher.toLowerCase()
  return signal.channel_code?.trim().toLowerCase() || signal.id
}

/** Excludes captcha shells, non-retained rows, and capture-failure titles. */
export function isReliableTopicEvidence(signal: SignalOut): boolean {
  if (signal.document_id) return false
  const status = signal.evidence_status_code?.trim()
  if (status && status !== 'retained') return false
  const title = cleanSignalTitle(signal.title)
  if (title.length < 10) return false
  if (UNRELIABLE_TITLE_RE.test(title) || UNRELIABLE_TITLE_RE.test(signal.title)) return false
  if (/^https?:\/\//i.test(signal.title.trim()) || /^存在\s*https?:/i.test(title)) return false
  if (/^[a-z0-9_-]{6,}$/i.test(title) && title.includes('_')) return false
  return true
}

export function countDistinctEvidenceSources(signals: SignalOut[]): number {
  return new Set(signals.map(evidenceSourceKey)).size
}

export function clusterQualifiesForTopic(cluster: TagCluster): { ok: boolean; reason: string } {
  const reliable = dedupeSignalsByUrl(cluster.signals.filter(isReliableTopicEvidence))
  if (reliable.length < TOPIC_MIN_EVIDENCE_COUNT) {
    return { ok: false, reason: '可靠证据不足（需至少 2 条已留存正文）' }
  }
  const sources = countDistinctEvidenceSources(reliable)
  if (sources < TOPIC_MIN_DISTINCT_SOURCES) {
    return { ok: false, reason: '需至少 2 个不同来源站点' }
  }
  return { ok: true, reason: '' }
}

export function reliableClusterSignals(cluster: TagCluster): SignalOut[] {
  return dedupeSignalsByUrl(cluster.signals.filter(isReliableTopicEvidence))
}

export function dedupeSignalsByUrl(signals: SignalOut[]): SignalOut[] {
  const map = new Map<string, SignalOut>()
  for (const s of signals) {
    const key = (s.url_normalized?.trim() || s.url?.trim() || s.id).toLowerCase()
    const existing = map.get(key)
    if (!existing || s.updated_at > existing.updated_at) map.set(key, s)
  }
  return [...map.values()]
}

export function dedupeEvidenceTitles(signals: SignalOut[], limit = 3): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of signals) {
    const key = titleDedupKey(s.title)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(s.title)
    if (out.length >= limit) break
  }
  return out
}

function clusterMemberFingerprint(cluster: TagCluster): string {
  return dedupeSignalsByUrl(cluster.signals)
    .map((s) => s.id)
    .sort()
    .join(',')
}

function dedupeClusters(clusters: TagCluster[]): TagCluster[] {
  const seen = new Set<string>()
  const out: TagCluster[] = []
  const sorted = [...clusters].sort((a, b) => b.signals.length - a.signals.length)
  for (const cluster of sorted) {
    const members = dedupeSignalsByUrl(cluster.signals)
    if (members.length < 2) continue
    const fp = clusterMemberFingerprint({ ...cluster, signals: members })
    if (seen.has(fp)) continue
    seen.add(fp)
    out.push({
      ...cluster,
      signals: members,
      sharedTags: intersectTags(members),
    })
  }
  return out
}

function representativeEvidenceTitle(signals: SignalOut[], tags: string[]): string | null {
  const ranked = signals
    .map((s) => {
      const text = cleanSignalTitle(s.title)
      const tagHits = tags.filter((tag) => text.includes(tag)).length
      return { text, tagHits, len: text.length }
    })
    .filter((row) => row.text.length >= 6)
  ranked.sort((a, b) => b.tagHits - a.tagHits || a.len - b.len)
  return ranked[0]?.text ?? null
}

/**
 * Demand-style working name (环节三：需求抽象与命名) — not a raw tag join.
 */
export function proposeNaturalTopicName(
  signals: SignalOut[],
  attributionTags: string[],
  valueChainStageLabel: string | null,
): string {
  const tags = dedupeTags(attributionTags)
  const evidenceTitle = representativeEvidenceTitle(signals, tags)
  const stage =
    valueChainStageLabel && valueChainStageLabel !== '待归因' ? valueChainStageLabel : null

  if (evidenceTitle) {
    const concise = evidenceTitle.length <= 44 ? evidenceTitle : `${evidenceTitle.slice(0, 41)}…`
    if (tags.length === 0) return concise
    if (tags.every((tag) => concise.includes(tag)) && concise.length <= 48) return concise
    if (tags.length === 1 && concise.length <= 36) return concise
    if (tags.length >= 2 && tags.filter((tag) => concise.includes(tag)).length >= 2 && concise.length <= 48) {
      return concise
    }
  }

  const focus = tags.slice(0, 3).join('与')
  if (stage) {
    if (tags.length === 1) return `${stage}侧${tags[0]}技术议题`
    return `${stage} · ${focus}相关需求`
  }
  if (tags.length === 1) return `围绕「${tags[0]}」的多源技术议题`
  if (tags.length === 2) return `${focus}相关技术需求`
  return `${focus}等综合技术议题`
}

/** REQ-SIG-08 style similarity clusters among signals not yet in a theme. */
export function clusterUnassignedSignals(signals: SignalOut[], minOverlap = 2): TagCluster[] {
  const pool = dedupeSignalsByUrl(
    signals.filter(
      (s) => !s.tech_theme_id && !s.document_id && (s.tags?.length ?? 0) > 0 && isReliableTopicEvidence(s),
    ),
  )
  const used = new Set<string>()
  const clusters: TagCluster[] = []

  const seeds = [...pool].sort((a, b) => (b.tags?.length ?? 0) - (a.tags?.length ?? 0))
  for (const seed of seeds) {
    if (used.has(seed.id)) continue
    const seedTags = seed.tags ?? []
    const members: SignalOut[] = [seed]
    for (const other of pool) {
      if (other.id === seed.id || used.has(other.id)) continue
      const overlap = signalOverlap(seedTags, other.tags ?? [])
      if (overlap >= minOverlap) members.push(other)
    }
    const membersDeduped = dedupeSignalsByUrl(members)
    if (membersDeduped.length < TOPIC_MIN_EVIDENCE_COUNT) continue
    if (countDistinctEvidenceSources(membersDeduped) < TOPIC_MIN_DISTINCT_SOURCES) continue
    membersDeduped.forEach((m) => used.add(m.id))
    const sharedTags = intersectTags(membersDeduped)
    const label = sharedTags.length
      ? sharedTags.slice(0, 3).join(' · ')
      : seedTags.slice(0, 3).join(' · ')
    const draft: TagCluster = {
      key: seed.id,
      label: label || seed.title.slice(0, 48),
      sharedTags: sharedTags.length ? sharedTags : seedTags.slice(0, 6),
      signals: membersDeduped,
    }
    const { ok } = clusterQualifiesForTopic(draft)
    if (!ok) continue
    clusters.push(draft)
  }
  return dedupeClusters(clusters).sort((a, b) => b.signals.length - a.signals.length)
}

export function eligibleForAutoAggregate(s: SignalOut): boolean {
  return !s.tech_theme_id && !s.document_id && (s.tags?.length ?? 0) > 0
}
