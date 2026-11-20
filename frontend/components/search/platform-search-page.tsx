'use client'

import { useMemo, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { Avatar, Card, Empty, Flex, Input, Listy, Space, Tag, Typography } from 'antd'
import { getPlatformSearchIcon } from '@/lib/platform-search-icons'
import {
  platformSearchKindLabel,
  searchPlatform,
  type PlatformSearchHit,
} from '@/lib/platform-search-index'
import { usePlatformSearchIndex } from '@/hooks/use-platform-search-index'
import type { NavigateFn } from '@/types/platform'

const { Text } = Typography

export function PlatformSearchPage({ onNavigate }: { onNavigate: NavigateFn }) {
  const [query, setQuery] = useState('')
  const searchIndex = usePlatformSearchIndex()
  const results = useMemo(() => searchPlatform(query, searchIndex, 48), [query, searchIndex])

  const openHit = (hit: PlatformSearchHit) => onNavigate(hit.route)

  return (
    <Card className="panel-card platform-search-page" bordered={false}>
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Input
          size="large"
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索信号、主题、需求点、落脚点与页面…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
        />
        {results.length === 0 ? (
          <Empty description="没有匹配项" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Listy<PlatformSearchHit>
            items={results}
            rowKey="id"
            height={Math.min(560, Math.max(280, results.length * 56))}
            group={{
              key: (hit) => platformSearchKindLabel(hit.kind),
              title: (label) => (
                <Text type="secondary" className="platform-search-group-label">
                  {String(label)}
                </Text>
              ),
            }}
            classNames={{
              item: 'platform-search-listy-item',
            }}
            itemRender={(hit) => (
              <Flex
                align="center"
                gap="middle"
                className="platform-search-item"
                style={{ cursor: 'pointer', padding: '8px 4px' }}
                onClick={() => openHit(hit)}
              >
                <Avatar
                  className="platform-search-item-avatar"
                  shape="square"
                  size={32}
                  icon={getPlatformSearchIcon(hit.viewKey, hit.kind)}
                />
                <Flex vertical flex={1} style={{ minWidth: 0 }}>
                  <Text strong>{hit.title}</Text>
                  {hit.subtitle ? (
                    <Text type="secondary" ellipsis>
                      {hit.subtitle}
                    </Text>
                  ) : null}
                </Flex>
                <Tag variant="filled" className="platform-search-kind-tag" style={{ margin: 0 }}>
                  {platformSearchKindLabel(hit.kind)}
                </Tag>
              </Flex>
            )}
          />
        )}
      </Space>
    </Card>
  )
}