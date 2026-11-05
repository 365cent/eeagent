import { Analytics } from '@vercel/analytics/next'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { AppRouteSkeleton } from '@/components/app-route-skeleton'
import 'antd/dist/reset.css'
import './globals.css'
import './dashboard.css'

export const metadata: Metadata = {
  title: 'EEA 前瞻技术扫描平台 | DESAY SV',
  description: '德赛西威 EEA 前瞻技术扫描平台研究总览与战略研判工作台',
  generator: 'v0.app',
  applicationName: 'EEA 前瞻技术扫描平台',
  formatDetection: { telephone: false },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased" suppressHydrationWarning>
        <AntdRegistry>
          <Suspense fallback={<AppRouteSkeleton />}>
            {children}
          </Suspense>
        </AntdRegistry>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
