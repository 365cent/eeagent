import type { ClusterMemberOut, SignalNeighborOut, SignalOut, ThemeClusterProposal } from '@/lib/api/types'
import type { TagCluster } from '@/lib/topic-clustering'

/** Enough of a signal row for naming, source counts, and theme assignment. */
export function signalFromClusterMember(member: ClusterMemberOut | SignalNeighborOut): SignalOut {
  const host = member.source_host || 'evidence.local'
  // Prefer the member's real URL (document members carry eea://document/<id>)
  // so source counting and dedup use actual provenance, not a synthesized host.
  const url = member.url?.trim() || (
    host.includes('.')
      ? `https://${host}/signals/${member.signal_id}`
      : `https://evidence.local/${encodeURIComponent(host)}/${member.signal_id}`
  )
  return {
    id: member.signal_id,
    title: member.title,
    url,
    url_normalized: url,
    channel_code: 'web',
    publisher: host,
    published_at: null,
    value_chain_stage_code: member.value_chain_stage_code,
    signal_type_code: null,
    evolution_node_code: null,
    evidence_status_code: 'retained',
    tech_theme_id: null,
    source_label: null,
    excerpt: null,
    captured_at: null,
    created_at: member.updated_at,
    updated_at: member.updated_at,
    tags: member.tags,
  }
}

export function proposalToCluster(proposal: ThemeClusterProposal): TagCluster {
  return {
    key: proposal.key,
    label: proposal.shared_tags.slice(0, 3).join(' · ') || '未命名标签组',
    sharedTags: proposal.shared_tags,
    signals: proposal.members.map(signalFromClusterMember),
  }
}
