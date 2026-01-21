import type { Metadata } from 'next';
import './globals.css';
import { PwaRegister } from '@/components/PwaRegister';
import { prisma } from '@/lib/db';
import { resolveThemeId, themeToCssVars } from '@/lib/themes';

export const metadata: Metadata = {
  title: 'CCFrame - Personal Photography Showcase',
  description: 'Artistic photography portfolio with elegant design and fast loading',
  manifest: '/manifest.json',
  themeColor: '#fafaf9',
  appleWebApp: {
    capable: true,
    title: 'CCFrame',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.svg', sizes: '64x64', type: 'image/svg+xml' }
    ],
    apple: '/logo.svg',
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
