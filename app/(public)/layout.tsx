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
      <main className="min-h-[calc(100dvh-4rem)] pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0 md:min-h-[calc(100vh-8rem)]">{children}</main>
      <Footer />
      <MobileNav />
    </>
  );
}
