'use client'

import { useRef, useState } from 'react'
import { FileAddOutlined, LinkOutlined, PaperClipOutlined } from '@ant-design/icons'
import { Button, Input, Typography } from 'antd'
import type { PasteAnalysis } from '@/lib/import-paste-analysis'
import { importModeHint, primarySubmitLabel } from '@/lib/import-paste-analysis'

const { Text } = Typography

export const IMPORT_FILE_ACCEPT =
  '.html,.htm,.pdf,.doc,.docx,.ppt,.pptx,.md,.txt,.png,.jpg,.jpeg,.xlsx,.xlsm'

type ImportUnifiedSurfaceProps = {
  pasteText: string
  onPasteTextChange: (value: string) => void
  analysis: PasteAnalysis
  pasteHintId: string
  busy: boolean
  uploadInFlight: boolean
  disabled?: boolean
  onSubmit: () => void
  onNavigateSignals: () => void
  onFiles: (files: FileList | File[]) => void
}

export function ImportUnifiedSurface({
  pasteText,
  onPasteTextChange,
  analysis,
  pasteHintId,
  busy,
  uploadInFlight,
  disabled,
  onSubmit,
  onNavigateSignals,
  onFiles,
}: ImportUnifiedSurfaceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const pickFiles = () => {
    fileInputRef.current?.click()
  }

  const forwardFiles = (list: FileList | null) => {
    if (!list?.length) return
    onFiles(list)
  }

  return (
    <form
      className="import-pastebin"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <label className="import-pastebin-label" htmlFor="eea-import-paste">
        粘贴或拖入
      </label>
      <div
        className={
          dragOver
            ? 'import-unified-surface import-unified-surface--dragover'
            : 'import-unified-surface'
        }
        onDragEnter={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
          setDragOver(true)
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return
          setDragOver(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (disabled) return
          forwardFiles(e.dataTransfer.files)
        }}
      >
        <Input.TextArea
          id="eea-import-paste"
          name="import_paste"
          rows={6}
          className="import-pastebin-input import-unified-textarea"
          placeholder="链接、正文，或拖入文件到此处…"
          value={pasteText}
          onChange={(e) => onPasteTextChange(e.target.value)}
          aria-describedby={pasteHintId}
          spellCheck
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || !(e.ctrlKey || e.metaKey)) return
            if (e.nativeEvent.isComposing || e.keyCode === 229) return
            e.preventDefault()
            onSubmit()
          }}
        />
        <div className="import-unified-footer">
          <Text type="secondary" className="import-unified-file-hint">
            拖入或
            <Button
              type="link"
              size="small"
              icon={<PaperClipOutlined />}
              disabled={disabled}
              onClick={pickFiles}
            >
              选择文件
            </Button>
            · PDF / Word / PPT / Markdown / 图片 / HTML
          </Text>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="import-unified-file-input"
          accept={IMPORT_FILE_ACCEPT}
          multiple
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            forwardFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
      <Text id={pasteHintId} type="secondary" className="import-pastebin-hint">
        {importModeHint(analysis)} · Ctrl+Enter 提交
      </Text>
      <div className="import-form-actions import-pastebin-actions">
        <Button
          type="primary"
          size="large"
          htmlType="submit"
          icon={analysis.mode === 'batch-capture' ? <LinkOutlined /> : <FileAddOutlined />}
          loading={busy && !uploadInFlight}
          disabled={(busy && uploadInFlight) || disabled}
        >
          {primarySubmitLabel(analysis, busy && !uploadInFlight)}
        </Button>
        <Button size="large" htmlType="button" onClick={onNavigateSignals}>
          查看证据库
        </Button>
      </div>
    </form>
  )
}