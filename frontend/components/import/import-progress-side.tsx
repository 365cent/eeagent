'use client'

import { FileOutlined } from '@ant-design/icons'
import { Alert, Button, Progress, Space, Typography } from 'antd'
import type { PanoramaImportBatchOut } from '@/lib/api/types'
import { getCaptureClientDownloadUrl } from '@/lib/api/config'
import { ImportBatchProgressBody } from '@/components/import/import-batch-progress-body'

const { Text, Link } = Typography

function ImportSideNotes() {
  return (
    <div className="import-side-notes">
      <Text type="secondary">拖入 HTML 快照 / 文档 → 平台解析入库</Text>
      <Text type="secondary">多行 http(s) 链接 → EEA Capture 客户端采集（需在线）</Text>
      <Link href={getCaptureClientDownloadUrl()} download>
        下载 EEA Capture 客户端（Windows）
      </Link>
      <Text type="secondary">单链接或正文 → 直接保存信号</Text>
    </div>
  )
}

function IdleProgressHint() {
  return (
    <Text type="secondary" className="import-idle-lead">
      提交后进度显示在上方；刷新页面可继续未完成的文件采集。
    </Text>
  )
}

export type ImportFileJobState = {
  uploadProgress: number | null
  uploadProcessing: boolean
  uploadFileName: string | null
  jobStageLabel: string | null
  jobError: string | null
  activeJobId: string | null
}

type ImportProgressSideProps = {
  panoramaBatch: PanoramaImportBatchOut | null
  fileJob: ImportFileJobState
  onRetryJob: () => void
  onCancelJob: () => void
}

export function ImportProgressSide({
  panoramaBatch,
  fileJob,
  onRetryJob,
  onCancelJob,
}: ImportProgressSideProps) {
  const { uploadProgress, uploadProcessing, uploadFileName, jobStageLabel, jobError, activeJobId } =
    fileJob

  const batchActive =
    panoramaBatch &&
    (panoramaBatch.status === 'capturing' ||
      panoramaBatch.status === 'structuring' ||
      panoramaBatch.status === 'completed' ||
      panoramaBatch.status === 'failed')

  const fileActive = uploadProgress !== null || Boolean(jobError)

  return (
    <div className="import-progress-side">
      {batchActive ? (
        <div className="import-progress-block">
          <ImportBatchProgressBody batch={panoramaBatch} showTitle />
        </div>
      ) : null}

      {fileActive ? (
        <div className="import-progress-block">
          <div className="import-file-job-heading">
            <FileOutlined aria-hidden />
            <Text strong>文件采集</Text>
          </div>
          {uploadFileName ? (
            <Text type="secondary" ellipsis style={{ maxWidth: '100%' }}>
              {uploadFileName}
            </Text>
          ) : null}
          {uploadProgress !== null ? (
            <Progress
              percent={uploadProcessing ? 100 : uploadProgress}
              status={jobError ? 'exception' : uploadProcessing ? 'active' : 'normal'}
              format={() =>
                uploadProcessing ? jobStageLabel ?? '处理中…' : `上传 ${uploadProgress}%`
              }
            />
          ) : null}
          {jobError ? (
            <Alert
              type="error"
              showIcon
              title="采集失败"
              description={jobError}
              action={
                <Space>
                  {activeJobId ? (
                    <Button size="small" onClick={() => void onRetryJob()}>
                      重试
                    </Button>
                  ) : null}
                  <Button size="small" onClick={() => void onCancelJob()}>
                    清除
                  </Button>
                </Space>
              }
            />
          ) : null}
        </div>
      ) : null}

      {!batchActive && !fileActive ? <IdleProgressHint /> : null}

      <ImportSideNotes />
    </div>
  )
}