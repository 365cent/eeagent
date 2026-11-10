'use client'

import { useCallback, useState } from 'react'
import { App as AntApp, Drawer } from 'antd'
import { DemandPointWorkbench } from '@/components/topics/demand-point-workbench'

type DemandPointWorkbenchDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DemandPointWorkbenchDrawer({ open, onOpenChange }: DemandPointWorkbenchDrawerProps) {
  const { modal } = AntApp.useApp()
  const [dirty, setDirty] = useState(false)

  const requestClose = useCallback(() => {
    if (dirty) {
      modal.confirm({
        title: '放弃未保存修改？',
        content: '关闭抽屉将失去当前表单修改。',
        okText: '放弃并关闭',
        okButtonProps: { danger: true },
        cancelText: '继续编辑',
        onOk: () => {
          setDirty(false)
          onOpenChange(false)
        },
      })
      return
    }
    onOpenChange(false)
  }, [dirty, modal, onOpenChange])

  return (
    <Drawer
      className="demand-workbench-drawer"
      title="需求点工作台"
      placement="right"
      size="min(1040px, 92vw)"
      open={open}
      destroyOnHidden={false}
      onClose={requestClose}
      styles={{ body: { padding: '12px 16px 20px' } }}
    >
      <DemandPointWorkbench showCard={false} onDirtyChange={setDirty} />
    </Drawer>
  )
}
