'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  App as AntApp,
  Alert,
  Button,
  Card,
  Col,
  Image,
  Row,
  Space,
  Spin,
  Tag,
  Tooltip,
  Tree,
  Typography,
} from 'antd'
import {
  FileSearchOutlined,
  ReloadOutlined,
  SyncOutlined,
  TagsOutlined,
} from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import { PlatformEmptyState } from '@/components/shared/empty-state'
import { QueryFailure } from '@/components/shared/query-failure'
import { SignalBodyMarkdown } from '@/components/evidence/signal-body-markdown'
import { useDocumentChunks, useDocumentFigures, useDocumentKeywords } from '@/hooks/use-eea-queries'
import { eeaQueryKeys } from '@/lib/query/eea-query-keys'
import { extractDocumentKeywords, reingestDocument, retryDocumentFigure } from '@/lib/api/eea-api'
import { eeaErrorMessage } from '@/lib/api/client'
import {
  buildDocumentSectionTree,
  formatSectionPath,
  joinChunkMarkdown,
  type DocumentResearchFocus,
  type DocumentSectionNode,
} from '@/lib/document-research'
import type { DocumentDetail, DocumentFigureOut } from '@/lib/api/types'

const { Text, Paragraph } = Typography

type DocumentResearchPanelProps = {
  documentId: string
  focus?: DocumentResearchFocus
  onFocusChange?: (focus: DocumentResearchFocus) => void
  onReingested?: (detail: DocumentDetail) => void
}

type TreeNode = {
  key: string
  title: string
  children?: TreeNode[]
}

function toTreeNodes(nodes: DocumentSectionNode[]): TreeNode[] {
  return nodes.map((node) => ({
    key: node.key,
    title: node.title,
    children: node.children.length ? toTreeNodes(node.children) : undefined,
  }))
}

function firstChunkId(node: DocumentSectionNode): number | undefined {
  if (node.chunkIds.length) return node.chunkIds[0]
  for (const child of node.children) {
    const found = firstChunkId(child)
    if (found) return found
  }
  return undefined
}

function figureStatus(figure: DocumentFigureOut) {
  if (figure.review_status === 'needs_review') {
    return <Tag color="warning">待复核</Tag>
  }
  if (!figure.image_url) {
    return <Tag>图片未留存</Tag>
  }
  return <Tag color="success">已就绪</Tag>
}

export function DocumentResearchPanel({
  documentId,
  focus,
  onFocusChange,
  onReingested,
}: DocumentResearchPanelProps) {
  const { message: messageApi } = AntApp.useApp()
  const queryClient = useQueryClient()
  const chunksQuery = useDocumentChunks(documentId)
  const figuresQuery = useDocumentFigures(documentId)
  const keywordsQuery = useDocumentKeywords(documentId)
  const [activeSectionKey, setActiveSectionKey] = useState<string | null>(null)
  const [activeFigureIndex, setActiveFigureIndex] = useState<number | null>(null)
  const [reingestBusy, setReingestBusy] = useState(false)
  const [keywordsBusy, setKeywordsBusy] = useState(false)
  const [figureRetry, setFigureRetry] = useState<number | null>(null)

  const chunks = chunksQuery.data ?? []
  const figures = figuresQuery.data ?? []
  const keywords = keywordsQuery.data ?? []
  const tree = useMemo(() => buildDocumentSectionTree(chunks), [chunks])
  const treeData = useMemo(() => toTreeNodes(tree.roots), [tree])
  const figureImageByIndex = useMemo(() => {
    const images: Record<number, string> = {}
    for (const figure of figures) {
      if (figure.image_url) images[figure.figure_index] = figure.image_url
    }
    return images
  }, [figures])

  useEffect(() => {
    if (!tree.roots.length) {
      setActiveSectionKey(null)
      return
    }
    if (focus?.figureIndex) {
      const section = tree.figureToSection.get(focus.figureIndex)
      if (section) {
        setActiveSectionKey(section)
        setActiveFigureIndex(focus.figureIndex)
        return
      }
    }
    if (focus?.chunkId) {
      const section = tree.chunkToSection.get(focus.chunkId)
      if (section) {
        setActiveSectionKey(section)
        setActiveFigureIndex(null)
        return
      }
    }
    setActiveSectionKey((current) => (current && tree.byKey.has(current) ? current : tree.roots[0].key))
  }, [focus?.chunkId, focus?.figureIndex, tree])

  const activeSection = activeSectionKey ? tree.byKey.get(activeSectionKey) : tree.roots[0]
  const activeChunks = activeSection
    ? chunks.filter((chunk) => activeSection.chunkIds.includes(chunk.chunk_id))
    : []
  const activeMarkdown = joinChunkMarkdown(activeChunks.map((chunk) => chunk.text))
  const activeChunkLabel = activeChunks.length
    ? activeChunks.length === 1
      ? '段落 ' + activeChunks[0].chunk_id
      : '段落 ' + activeChunks[0].chunk_id + '–' + activeChunks[activeChunks.length - 1].chunk_id
    : null
  const selectSection = useCallback(
    (key: string) => {
      const node = tree.byKey.get(key)
      if (!node) return
      setActiveSectionKey(key)
      setActiveFigureIndex(null)
      const chunkId = firstChunkId(node)
      onFocusChange?.(chunkId ? { chunkId } : {})
    },
    [onFocusChange, tree.byKey],
  )

  const selectFigure = useCallback(
    (figure: DocumentFigureOut) => {
      const section = tree.figureToSection.get(figure.figure_index)
      if (section) setActiveSectionKey(section)
      setActiveFigureIndex(figure.figure_index)
      onFocusChange?.({ figureIndex: figure.figure_index })
    },
    [onFocusChange, tree.figureToSection],
  )

  const selectKeyword = useCallback(
    (chunkId: number | null) => {
      if (!chunkId) {
        messageApi.info('该关键词没有章节引用')
        return
      }
      const section = tree.chunkToSection.get(chunkId)
      if (!section) {
        messageApi.info('该关键词所在章节尚未建立索引')
        return
      }
      selectSection(section)
    },
    [messageApi, selectSection, tree.chunkToSection],
  )

  const invalidateDocument = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: eeaQueryKeys.documentDetail(documentId) }),
      queryClient.invalidateQueries({ queryKey: eeaQueryKeys.documentFigures(documentId) }),
      queryClient.invalidateQueries({ queryKey: eeaQueryKeys.documentChunks(documentId) }),
      queryClient.invalidateQueries({ queryKey: eeaQueryKeys.documentKeywords(documentId) }),
    ])
  }, [documentId, queryClient])

  const reingest = async () => {
    setReingestBusy(true)
    try {
      const detail = await reingestDocument(documentId)
      await invalidateDocument()
      onReingested?.(detail)
      messageApi.success('文档已重新解析，章节与图块索引已刷新')
    } catch (err) {
      messageApi.error(eeaErrorMessage(err, '重新解析失败'))
    } finally {
      setReingestBusy(false)
    }
  }

  const retryFigure = async (figureIndex: number) => {
    setFigureRetry(figureIndex)
    try {
      await retryDocumentFigure(documentId, figureIndex)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: eeaQueryKeys.documentFigures(documentId) }),
        queryClient.invalidateQueries({ queryKey: eeaQueryKeys.documentChunks(documentId) }),
        queryClient.invalidateQueries({ queryKey: eeaQueryKeys.documentDetail(documentId) }),
      ])
      messageApi.success('图 ' + figureIndex + ' 已重新识别')
    } catch (err) {
      messageApi.error(eeaErrorMessage(err, '图块重新识别失败'))
    } finally {
      setFigureRetry(null)
    }
  }

  const recomputeKeywords = async () => {
    setKeywordsBusy(true)
    try {
      await extractDocumentKeywords(documentId)
      await queryClient.invalidateQueries({ queryKey: eeaQueryKeys.documentKeywords(documentId) })
      messageApi.success('章节关键词已重新抽取')
    } catch (err) {
      messageApi.error(eeaErrorMessage(err, '章节关键词抽取失败'))
    } finally {
      setKeywordsBusy(false)
    }
  }

  const loading = chunksQuery.isLoading && !chunksQuery.data
  const keywordsLoading = keywordsQuery.isLoading && !keywordsQuery.data
  const chunksError = chunksQuery.isError
  const figuresError = figuresQuery.isError
  const keywordsError = keywordsQuery.isError
  const hasContent = chunks.length > 0

  return (
    <div className="document-research">
      <div className="document-research-toolbar">
        <Space wrap>
          <Text strong>文档研究</Text>
          <Tag>{chunks.length} 个章节分块</Tag>
          <Tag color={figures.some((figure) => figure.review_status === 'needs_review') ? 'warning' : 'default'}>
            {figures.length} 张图块
          </Tag>
          <Tag>{keywordsLoading ? '关键词加载中…' : keywords.length + ' 个关键词'}</Tag>
        </Space>
        <Space wrap>
          <Button size="small" icon={<SyncOutlined />} loading={keywordsBusy} onClick={() => void recomputeKeywords()}>
            重新抽取关键词
          </Button>
          <Button size="small" icon={<ReloadOutlined />} loading={reingestBusy} onClick={() => void reingest()}>
            重新解析文档
          </Button>
        </Space>
      </div>

      {chunksError ? (
        <QueryFailure message="章节索引加载失败，请检查服务连接后重试。" onRetry={() => void chunksQuery.refetch()} />
      ) : loading ? (
        <div className="document-research-loading">
          <Spin />
        </div>
      ) : !hasContent ? (
        <PlatformEmptyState
          title="尚无章节索引"
          description="该文档还没有可按标题路径读取的章节；重新解析后会建立章节与图块索引。"
          action={
            <Button size="small" loading={reingestBusy} onClick={() => void reingest()}>
              重新解析文档
            </Button>
          }
        />
      ) : (
        <Row gutter={[16, 16]} className="document-research-grid">
          <Col xs={24} lg={7}>
            <Card size="small" className="document-research-tree-card" title="章节">
              <Tree
                blockNode
                defaultExpandAll
                selectedKeys={activeSectionKey ? [activeSectionKey] : []}
                titleRender={(node) => {
                  const title = typeof node.title === 'string' ? node.title : ''
                  return (
                    <Tooltip title={title} placement="right" mouseEnterDelay={0.3}>
                      <span className="document-research-tree-title">{title}</span>
                    </Tooltip>
                  )
                }}
                treeData={treeData}
                onSelect={(keys) => {
                  const key = String(keys[0] ?? '')
                  if (key) selectSection(key)
                }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={17}>
            <Card
              size="small"
              className="document-research-content-card"
              title={
                <span className="document-research-section-title" title={formatSectionPath(activeSection?.path)}>
                  {formatSectionPath(activeSection?.path)}
                </span>
              }
              extra={
                <Text type="secondary" className="document-research-section-extra">
                  {[...new Set(activeChunks.flatMap((chunk) => chunk.figure_indices ?? []))].length} 张关联图块
                </Text>
              }
            >
              {activeChunks.length ? (
                <div className="document-research-chunk">
                  {activeChunkLabel ? (
                    <Text type="secondary" className="document-research-chunk-meta">
                      {activeChunkLabel}
                    </Text>
                  ) : null}
                  <SignalBodyMarkdown
                    className="document-research-text document-research-markdown"
                    markdown={activeMarkdown}
                    figureByIndex={figureImageByIndex}
                  />
                </div>
              ) : (
                <Text type="secondary">该章节没有正文分块。</Text>
              )}
            </Card>
          </Col>
        </Row>
      )}

      <Card
        size="small"
        className="document-research-keywords-card"
        title={<Space><TagsOutlined /><span>章节关键词</span></Space>}
        extra={keywordsError ? <Button size="small" onClick={() => void keywordsQuery.refetch()}>重试</Button> : null}
      >
        {keywordsLoading ? (
          <Space size={8}>
            <Spin size="small" />
            <Text type="secondary">正在抽取章节关键词…</Text>
          </Space>
        ) : keywords.length ? (
          <Space wrap size={[6, 6]}>
            {keywords.map((keyword) => (
              <Button
                key={keyword.term}
                size="small"
                disabled={!keyword.chunk_id}
                onClick={() => selectKeyword(keyword.chunk_id)}
              >
                {keyword.term}
                {keyword.section_path?.length ? (
                  <Text type="secondary"> {keyword.section_path[keyword.section_path.length - 1]}</Text>
                ) : null}
              </Button>
            ))}
          </Space>
        ) : (
          <Text type="secondary">{keywordsError ? '关键词加载失败。' : '暂无章节关键词。'}</Text>
        )}
      </Card>

      <Card
        size="small"
        className="document-research-figures-card"
        title={<Space><FileSearchOutlined /><span>图块</span></Space>}
        extra={figuresError ? <Button size="small" onClick={() => void figuresQuery.refetch()}>重试</Button> : null}
      >
        {figures.length ? (
          <div className="document-research-figures">
            {figures.map((figure) => (
              <div
                key={figure.figure_index}
                className={[
                  'document-research-figure',
                  activeFigureIndex === figure.figure_index ? 'is-active' : '',
                ].filter(Boolean).join(' ')}
              >
                <div className="document-research-figure-head">
                  <Text strong>图 {figure.figure_index}</Text>
                  {figureStatus(figure)}
                </div>
                {figure.image_url ? (
                  <Image
                    alt={figure.caption || '图 ' + figure.figure_index}
                    className="document-research-figure-image"
                    src={figure.image_url}
                    width="100%"
                  />
                ) : (
                  <div className="document-research-figure-missing">图片未留存，需重新解析文档</div>
                )}
                <Paragraph type="secondary" className="document-research-caption">
                  {figure.caption || '无图注'}
                </Paragraph>
                {figure.review_reason ? <Alert type="warning" showIcon title={figure.review_reason} /> : null}
                <Space wrap size={[4, 4]}>
                  {figure.source ? <Tag>{figure.source}</Tag> : null}
                  {figure.page ? <Tag>第 {figure.page} 页</Tag> : null}
                  {figure.occurrence_count && figure.occurrence_count > 1 ? <Tag>插入 {figure.occurrence_count} 次</Tag> : null}
                  {figure.confidence !== null && figure.confidence !== undefined ? <Tag>置信度 {figure.confidence}</Tag> : null}
                </Space>
                <Space wrap size={[4, 4]}>
                  <Button size="small" type="link" onClick={() => selectFigure(figure)}>
                    定位图块
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    loading={figureRetry === figure.figure_index}
                    disabled={figureRetry !== null}
                    onClick={() => void retryFigure(figure.figure_index)}
                  >
                    重试识别
                  </Button>
                </Space>
              </div>
            ))}
          </div>
        ) : figuresError ? (
          <Text type="secondary">图块加载失败。</Text>
        ) : (
          <Text type="secondary">该文档没有图块。</Text>
        )}
      </Card>

      {figuresError ? (
        <QueryFailure message="图块索引加载失败，请检查服务连接后重试。" onRetry={() => void figuresQuery.refetch()} />
      ) : null}
    </div>
  )
}
