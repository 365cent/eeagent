'use client'

import { useCallback, useMemo, useState } from 'react'
import type { TablePaginationConfig } from 'antd'

export const SIGNAL_TABLE_PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100] as const

const DEFAULT_PAGE_SIZE = 10

/** Controlled pagination so the size changer updates how many rows the table shows. */
export function useSignalTablePagination(): TablePaginationConfig {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [current, setCurrent] = useState(1)

  const onChange = useCallback((page: number, size: number) => {
    setCurrent(page)
    setPageSize(size)
  }, [])

  return useMemo(
    () => ({
      current,
      pageSize,
      showSizeChanger: true,
      pageSizeOptions: [...SIGNAL_TABLE_PAGE_SIZE_OPTIONS],
      showTotal: (total: number, range: [number, number]) => {
        const onPage = Math.max(0, range[1] - range[0] + 1)
        return `每页 ${pageSize} 条 · 本页 ${onPage} 条 · ${range[0]}-${range[1]} / 共 ${total} 条`
      },
      onChange,
    }),
    [current, pageSize, onChange],
  )
}
