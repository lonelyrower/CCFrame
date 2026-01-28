import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegister } from '@/components/PwaRegister';
import { prisma } from '@/lib/db';
import { resolveThemeId, themeToCssVars } from '@/lib/themes';

export const viewport: Viewport = {
  themeColor: '#e63946',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'CCFrame - Personal Photography Showcase',
  description: 'Artistic photography portfolio with elegant design and fast loading',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'CCFrame',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.svg', sizes: 'any', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/apple-touch-icon.svg', type: 'image/svg+xml' },
    ],
    other: [
      { rel: 'mask-icon', url: '/logo.svg', color: '#e63946' },
    ],
  },
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let themePreset: string | null = null;
  let themeColor: string | null = null;
  try {
    const siteCopy = await prisma.siteCopy.findUnique({
      where: { id: 1 },
      select: { themePreset: true, themeColor: true },
    });
    themePreset = siteCopy?.themePreset ?? null;
    themeColor = siteCopy?.themeColor ?? null;
  } catch {
    themePreset = null;
    themeColor = null;
  }
  const themeId = resolveThemeId(themePreset, themeColor);
  const themeVars = themeToCssVars(themePreset, themeColor);

  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      data-theme={themeId}
      style={themeVars as React.CSSProperties}
    >
      <body className="antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
