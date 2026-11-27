'use client'

import { useQuery } from '@tanstack/react-query'
import { Button, Card, Space, Spin, Table, Tag, Typography } from 'antd'
import { AppleOutlined, WindowsOutlined } from '@ant-design/icons'
import type { CaptureClientPlatform, CaptureClientRelease } from '@/lib/api/types'
import { fetchCaptureClientReleases } from '@/lib/api/eea-api'
import { getCaptureClientDownloadUrl } from '@/lib/api/config'

const { Text, Paragraph } = Typography

const PLATFORM_LABEL: Record<CaptureClientPlatform, string> = {
  windows: 'Windows 10 / 11（Edge 或 Chrome）',
  macos: 'macOS 11+（Intel / Apple 芯片）',
}

type ReleaseRow = CaptureClientRelease & { key: CaptureClientPlatform }

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—'
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function releaseRows(releases: CaptureClientRelease[]): ReleaseRow[] {
  const order: CaptureClientPlatform[] = ['windows', 'macos']
  return order
    .map((platform) => releases.find((release) => release.platform === platform))
    .filter((release): release is CaptureClientRelease => Boolean(release))
    .map((release) => ({ ...release, key: release.platform }))
}

/**
 * Release list is server-driven: it shows exactly what is published under
 * deploy/downloads (served uncompressed — an .exe, or a .dmg for macOS), so the
 * page can never point at a build the server does not have.
 */
export function DownloadsView() {
  const releases = useQuery({
    queryKey: ['eea', 'capture', 'client-releases'],
    queryFn: fetchCaptureClientReleases,
    staleTime: 60_000,
  })

  const rows = releaseRows(releases.data ?? [])
  const published = new Set(rows.map((row) => row.key))

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Card size="small" title="采集客户端">
        <Paragraph type="secondary" style={{ marginTop: 0 }}>
          采集在研究者自己的电脑上完成：客户端用本机浏览器抓取网页，把自包含 HTML 与来源一起提交到平台。
          服务器不访问公网。客户端直接下载可执行文件，不再打包成 zip。
        </Paragraph>
        {releases.isLoading ? <Spin /> : null}
        {releases.isError ? (
          <Text type="danger">暂时无法读取发布列表，请检查 API 连接后重试。</Text>
        ) : null}
        {!releases.isLoading && !releases.isError && rows.length === 0 ? (
          <Text type="secondary">服务器上还没有发布任何客户端构建。</Text>
        ) : null}
        {rows.length ? (
          <Table<ReleaseRow>
            size="small"
            rowKey="key"
            pagination={false}
            dataSource={rows}
            scroll={{ x: 720 }}
            columns={[
              {
                title: '平台',
                dataIndex: 'platform',
                render: (value: CaptureClientPlatform) => (
                  <Space size={6}>
                    {value === 'windows' ? <WindowsOutlined /> : <AppleOutlined />}
                    <Text>{PLATFORM_LABEL[value]}</Text>
                  </Space>
                ),
              },
              { title: '文件', dataIndex: 'filename', ellipsis: true },
              {
                title: '大小',
                dataIndex: 'size_bytes',
                width: 100,
                render: (value: number) => formatSize(value),
              },
              {
                title: '下载',
                key: 'download',
                width: 130,
                render: (_value, row) => (
                  <Button
                    type="primary"
                    size="small"
                    href={getCaptureClientDownloadUrl(row.platform)}
                    download
                  >
                    下载 {row.platform === 'windows' ? 'exe' : 'dmg'}
                  </Button>
                ),
              },
            ]}
          />
        ) : null}
      </Card>

      <Card size="small" title="安装与校验">
        <Paragraph style={{ marginBottom: 8 }}>
          直接运行 <Text code>capture.exe</Text>。首次采集前可先执行{' '}
          <Text code>capture.exe doctor</Text>，backend / capture / auth 三项为 ok 即可开始
          （<Text code>auth</Text> 需要先在平台生成客户端凭据）。客户端默认
          <Text code>capture_archive=auto</Text>：身边有 SingleFile 扩展就用扩展，没有则用内置归档内核，
          单文件即可采集。如需固定服务器地址，在同目录的 <Text code>config.json</Text> 写入{' '}
          <Text code>api_base</Text>（例如 <Text code>http://10.215.35.10:8090</Text>）。
        </Paragraph>
        <Space orientation="vertical" size={2}>
          {rows
            .filter((row) => row.sha256)
            .map((row) => (
              <Text key={row.key} type="secondary">
                SHA-256（{row.filename}）：
                <Text code copyable>
                  {row.sha256}
                </Text>
              </Text>
            ))}
        </Space>
      </Card>

      {published.has('macos') ? null : (
        <Card size="small" title="macOS">
          <Space orientation="vertical" size={4}>
            <Text>
              <Tag>暂未提供</Tag>
              macOS 版界面使用 Fyne，需要在装有 Xcode 命令行的 Mac 上以 cgo 构建（Windows 上无法交叉编译）。
            </Text>
            <Text type="secondary">
              构建机产出 <Text code>EEA-Capture-&lt;版本&gt;-macOS.dmg</Text> 后放进{' '}
              <Text code>deploy/downloads/</Text>，本页面会自动列出下载项与校验值。
            </Text>
          </Space>
        </Card>
      )}
    </Space>
  )
}
