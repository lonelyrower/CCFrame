import type { Metadata } from 'next';
import './globals.css';
import { Noto_Sans_SC, Noto_Serif_SC, Playfair_Display } from 'next/font/google';
import { PwaRegister } from '@/components/PwaRegister';
import { prisma } from '@/lib/db';
import { resolveThemeId, themeToCssVars } from '@/lib/themes';

const sans = Noto_Sans_SC({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '700'],
  display: 'swap',
});

const serif = Noto_Serif_SC({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '700'],
  display: 'swap',
});

// Ensure Playfair Display is bundled for Latin headlines fallback
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

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
      <body className={`${sans.variable} ${serif.variable} ${playfair.variable} antialiased`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
