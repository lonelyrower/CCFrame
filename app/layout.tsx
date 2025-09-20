import type { Metadata } from 'next'
import { Inter, Noto_Sans_SC } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register'

const inter = Inter({ subsets: ['latin'] })
const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CC Frame - Creative Camera',
  description: 'CC Frame 是一个现代化的相册网站，专注照片展示与管理',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' }
    ],
    apple: '/icons/icon-192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.className} ${notoSansSC.variable} antialiased transition-colors duration-500`}>
        <Providers>
          <ServiceWorkerRegister />
          <div className="relative min-h-screen overflow-x-hidden bg-app-surface">
            <div className="pointer-events-none absolute inset-0 opacity-70">
              <div className="absolute left-1/2 top-[-20%] h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-app-glow blur-3xl" />
              <div className="absolute bottom-[-15%] right-[-10%] h-[360px] w-[360px] rounded-full bg-app-glow-secondary blur-3xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.14),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(76,106,255,0.12),_transparent_55%)]" />
            </div>


            <main className="relative z-10">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
