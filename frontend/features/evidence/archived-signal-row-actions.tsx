'use client'

import { DeleteOutlined, FileSearchOutlined, RollbackOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import type { Signal } from '@/types/platform'

type ArchivedSignalRowActionsProps = {
  record: Signal
  onView: (signalId: string) => void
  onRestore: (record: Signal) => void
  onDelete: (record: Signal) => void
}

export function ArchivedSignalRowActions({ record, onView, onRestore, onDelete }: ArchivedSignalRowActionsProps) {
  return (
    <div className="archived-signal-row-actions" role="group" aria-label={`${record.title} 操作`}>
      <Button
        type="link"
        size="small"
        className="archived-signal-row-action"
        icon={<FileSearchOutlined />}
        onClick={() => onView(record.key)}
      >
        查看
      </Button>
      <span className="archived-signal-row-actions-sep" aria-hidden="true" />
      <Button
        type="link"
        size="small"
        className="archived-signal-row-action"
        icon={<RollbackOutlined />}
        onClick={() => onRestore(record)}
      >
        恢复
      </Button>
      <span className="archived-signal-row-actions-sep" aria-hidden="true" />
      <Button
        type="link"
        size="small"
        danger
        className="archived-signal-row-action archived-signal-row-action-danger"
        icon={<DeleteOutlined />}
        onClick={() => onDelete(record)}
      >
        删除
      </Button>
    </div>
  )
}