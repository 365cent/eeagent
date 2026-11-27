'use client'

import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Typography } from 'antd'
import type { CaptureClientPlatform } from '@/lib/api/types'
import { fetchCaptureClientReleases } from '@/lib/api/eea-api'
import { getCaptureClientDownloadUrl } from '@/lib/api/config'

const { Text, Link } = Typography

const PLATFORMS: { key: CaptureClientPlatform; label: string }[] = [
  { key: 'windows', label: 'Windows · exe' },
  { key: 'macos', label: 'macOS · dmg' },
]

/**
 * Direct client downloads. The server publishes the executable/disk image
 * itself (no zip to unpack), so only the builds it actually holds are linked;
 * a platform that has not been built yet says so instead of offering a dead link.
 */
export function CaptureClientDownloads({ lead }: { lead?: ReactNode }) {
  const releases = useQuery({
    queryKey: ['eea', 'capture', 'client-releases'],
    queryFn: fetchCaptureClientReleases,
    staleTime: 300_000,
    retry: 1,
  })

  if (releases.isLoading) {
    return (
      <Text type="secondary">
        {lead}
        正在检查可下载的客户端…
      </Text>
    )
  }

  if (releases.isError || !releases.data) {
    return <Text type="secondary">{lead}暂时无法读取客户端下载信息，请稍后重试。</Text>
  }

  const published = new Set(releases.data.map((release) => release.platform))

  return (
    <div className="capture-client-downloads">
      {lead ? <Text type="secondary">{lead}</Text> : null}
      {PLATFORMS.filter(({ key }) => published.has(key)).map(({ key, label }) => (
        <Link key={key} href={getCaptureClientDownloadUrl(key)} download>
          下载 EEA Capture 客户端（{label}）
        </Link>
      ))}
      {PLATFORMS.filter(({ key }) => !published.has(key)).map(({ key, label }) => (
        <Text key={key} type="secondary" className="capture-client-downloads-missing">
          {label.split(' · ')[0]} 版暂未发布
        </Text>
      ))}
    </div>
  )
}
