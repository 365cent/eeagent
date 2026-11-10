'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SearchOutlined } from '@ant-design/icons'
import { getPlatformSearchIcon } from '@/lib/platform-search-icons'
import type { InputRef } from 'antd'
import type { ListyRef } from 'antd/es/listy'
import {
  Avatar,
  Divider,
  Empty,
  Flex,
  Input,
  Listy,
  Modal,
  Space,
  Tag,
  Typography,
} from 'antd'
import {
  platformSearchKindLabel,
  searchPlatform,
  type PlatformSearchHit,
} from '@/lib/platform-search-index'
import type { NavigateFn } from '@/types/platform'

const { Text } = Typography

const RESULTS_HEIGHT = 368

type PlatformSearchModalProps = {
  open: boolean
  onClose: () => void
  onNavigate: NavigateFn
}

export function PlatformSearchModal({ open, onClose, onNavigate }: PlatformSearchModalProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<InputRef>(null)
  const listyRef = useRef<ListyRef>(null)

  const results = useMemo(() => searchPlatform(query), [query])

  const selectHit = useCallback(
    (hit: PlatformSearchHit) => {
      onNavigate(hit.route)
      onClose()
    },
    [onClose, onNavigate],
  )

  useEffect(() => {
    if (!open) {
      setQuery('')
      setActiveIndex(0)
      return
    }
    const timer = window.setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (!open || results.length === 0) return
    const hit = results[activeIndex]
    if (!hit) return
    listyRef.current?.scrollTo({ key: hit.id, align: 'auto' })
  }, [activeIndex, open, results])

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((value) => Math.min(value + 1, results.length - 1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((value) => Math.max(value - 1, 0))
      return
    }
    if (event.key === 'Enter' && results[activeIndex]) {
      event.preventDefault()
      selectHit(results[activeIndex])
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      centered
      width={640}
      destroyOnHidden={false}
      keyboard
      mask={{ closable: true }}
      title={null}
      className="platform-search-modal"
      styles={{
        container: { padding: 0, overflow: 'hidden' },
        body: { padding: 0 },
      }}
      aria-label="全局搜索"
    >
      <div className="platform-search-shell" onKeyDown={onKeyDown}>
        <div className="platform-search-input-row">
          <Input
            ref={inputRef}
            variant="borderless"
            size="large"
            prefix={<SearchOutlined className="platform-search-input-icon" />}
            suffix={
              <Tag style={{ margin: 0 }} variant="filled">
                Esc
              </Tag>
            }
            placeholder="搜索信号、主题、需求点、页面…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="搜索关键词"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <Divider style={{ margin: 0 }} />

        <div className="platform-search-results" role="listbox" aria-label="搜索结果">
          {results.length === 0 ? (
            <Empty
              className="platform-search-empty"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="没有匹配的研究资产，试试更短的关键词或拼音首字母"
            />
          ) : (
            <Listy<PlatformSearchHit>
              ref={listyRef}
              items={results}
              rowKey="id"
              height={RESULTS_HEIGHT}
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
              itemRender={(hit, index) => {
                const isActive = index === activeIndex
                return (
                  <Flex
                    align="center"
                    gap="middle"
                    role="option"
                    aria-selected={isActive}
                    className={`platform-search-item${isActive ? ' is-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectHit(hit)}
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
                    <Tag variant="filled" style={{ margin: 0, flexShrink: 0 }}>
                      {platformSearchKindLabel(hit.kind)}
                    </Tag>
                  </Flex>
                )
              }}
            />
          )}
        </div>

        <Divider style={{ margin: 0 }} />

        <footer className="platform-search-footer">
          <Space
            size="middle"
            separator={<Divider orientation="vertical" style={{ margin: 0, height: 12 }} />}
          >
            <Text type="secondary" className="platform-search-footer-hint">
              <Space size={4}>
                <Tag variant="filled">↑</Tag>
                <Tag variant="filled">↓</Tag>
              </Space>
              {' '}
              选择
            </Text>
            <Text type="secondary" className="platform-search-footer-hint">
              <Tag variant="filled">Enter</Tag>
              {' '}
              打开
            </Text>
            <Text type="secondary" className="platform-search-footer-hint">
              <Tag variant="filled">Ctrl</Tag>
              <Tag variant="filled">K</Tag>
              {' '}
              随时唤起
            </Text>
          </Space>
        </footer>
      </div>
    </Modal>
  )
}
