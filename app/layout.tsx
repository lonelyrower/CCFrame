import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Personal Photo Gallery',
  description: 'A beautiful, private photo gallery with AI-powered features',
  keywords: 'photo gallery, personal photos, AI enhancement, private gallery',
  authors: [{ name: 'Personal Gallery' }],
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Personal Photo Gallery',
    description: 'A beautiful, private photo gallery with AI-powered features',
    siteName: 'Personal Photo Gallery',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Personal Photo Gallery',
    description: 'A beautiful, private photo gallery with AI-powered features',
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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}