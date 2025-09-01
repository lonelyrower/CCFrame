import type { Metadata } from 'next'
import { Inter, Noto_Sans_SC } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })
const notoSansSC = Noto_Sans_SC({ 
  subsets: ['latin'], 
  variable: '--font-noto-sans-sc',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CC Frame - 个人创意相册',
  description: 'CC Frame 是一个精美的个人相册网站，记录生活中的美好瞬间。支持照片分类整理、时间线浏览，让每张照片都有属于它的故事。',
  keywords: 'CC Frame, 个人相册, 创意相册, 照片分享, 生活记录, 摄影作品, 个人博客',
  authors: [{ name: 'CC Frame' }],
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    title: 'CC Frame - 个人创意相册',
    description: 'CC Frame 是一个精美的个人相册网站，记录生活中的美好瞬间。支持照片分类整理、时间线浏览，让每张照片都有属于它的故事。',
    siteName: 'CC Frame',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CC Frame - 个人创意相册',
    description: 'CC Frame 是一个精美的个人相册网站，记录生活中的美好瞬间。支持照片分类整理、时间线浏览，让每张照片都有属于它的故事。',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.className} ${notoSansSC.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}