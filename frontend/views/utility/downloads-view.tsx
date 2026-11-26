'use client'

import { Button, Card, Space, Table, Tag, Typography } from 'antd'
import { WindowsOutlined } from '@ant-design/icons'

const { Text, Paragraph } = Typography

type Release = {
  key: string
  platform: string
  file: string
  version: string
  size: string
  sha256: string
}

/** Windows build published by client/scripts/release.ps1 and copied to deploy/downloads. */
const RELEASES: Release[] = [
  {
    key: 'windows',
    platform: 'Windows 10 / 11（Edge 或 Chrome）',
    file: 'capture-v0.1.1-windows-amd64.zip',
    version: 'v0.1.1',
    size: '4.9 MB',
    sha256: '38ff97c447c5172540b27acdd7cefa8db4abd7f0ba1796aab4ac3e0bc7ebf818',
  },
]

export function DownloadsView() {
  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Card size="small" title="采集客户端">
        <Paragraph type="secondary" style={{ marginTop: 0 }}>
          采集在研究者自己的电脑上完成：客户端用本机浏览器抓取网页，把自包含 HTML 与来源一起提交到平台。
          服务器不访问公网。
        </Paragraph>
        <Table<Release>
          size="small"
          rowKey="key"
          pagination={false}
          dataSource={RELEASES}
          scroll={{ x: 720 }}
          columns={[
            {
              title: '平台',
              dataIndex: 'platform',
              render: (value: string) => (
                <Space size={6}>
                  <WindowsOutlined />
                  <Text>{value}</Text>
                </Space>
              ),
            },
            { title: '版本', dataIndex: 'version', width: 90 },
            { title: '大小', dataIndex: 'size', width: 90 },
            {
              title: '下载',
              key: 'download',
              width: 130,
              render: (_value, row) => (
                <Button type="primary" size="small" href={`/downloads/${row.file}`} download>
                  下载 zip
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Card size="small" title="安装与校验">
        <Paragraph style={{ marginBottom: 8 }}>
          解压后用压缩包内的 <Text code>config.json</Text> 配置 <Text code>api_base</Text>（例如
          <Text code>http://10.215.35.10:8090</Text>），再运行 <Text code>capture.exe doctor</Text>；
          backend / capture / auth 三项为 ok 即可开始采集。
        </Paragraph>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          SHA-256（zip）：
          <Text code copyable>
            {RELEASES[0].sha256}
          </Text>
        </Paragraph>
      </Card>

      <Card size="small" title="macOS">
        <Space orientation="vertical" size={4}>
          <Text>
            <Tag>暂未提供</Tag>
            macOS 版界面使用 Fyne，需要在装有 Xcode 命令行的 Mac 上以 cgo 构建（Windows 上无法交叉编译）。
          </Text>
          <Text type="secondary">
            有 Mac 构建机后运行 <Text code>go build ./cmd/capture</Text> 产出二进制，再放到本页面的发布列表即可。
          </Text>
        </Space>
      </Card>
    </Space>
  )
}
