import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Inter, Noto_Sans_SC } from 'next/font/google'

import './globals.css'
import { Providers } from './providers'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CC Frame - Creative Camera',
  description: 'CC Frame 是一个聚焦摄影作品展示与资源管理的现代平台。',
  manifest: '/manifest.webmanifest',
  themeColor: '#6366f1',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: '/icons/icon-192.png',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${notoSansSC.variable} bg-background font-sans text-foreground`}
      >
        <Providers>
          <ServiceWorkerRegister />
          <div className="relative flex min-h-screen flex-col">
            <div
              aria-hidden
              className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-accent/10" />
              <div className="absolute left-1/2 top-[12%] h-[480px] w-[680px] -translate-x-1/2 rounded-full bg-glow-primary blur-3xl" />
              <div className="absolute right-[-10%] bottom-[-20%] h-[420px] w-[420px] rounded-full bg-glow-secondary blur-3xl" />
            </div>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
