import type { Metadata } from 'next';
import './globals.css';

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
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
