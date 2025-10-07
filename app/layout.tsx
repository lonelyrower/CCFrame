import type { Metadata } from 'next';
import './globals.css';
import { Noto_Sans_SC, Noto_Serif_SC, Playfair_Display } from 'next/font/google';

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${sans.variable} ${serif.variable} ${playfair.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
