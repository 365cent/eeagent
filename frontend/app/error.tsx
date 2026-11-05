'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[v0] Route rendering failed', error)
  }, [error])

  return (
    <main className="route-error" role="alert">
      <section className="route-error-card">
        <p className="route-error-eyebrow">工作台暂时不可用</p>
        <h1>页面加载失败</h1>
        <p>请重试一次；如果问题持续存在，之前的页面状态不会受到影响。</p>
        <button type="button" onClick={() => reset()}>重新加载</button>
      </section>
    </main>
  )
}
