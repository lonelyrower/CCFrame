import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-8rem)] pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileNav />
    </>
  );
}
