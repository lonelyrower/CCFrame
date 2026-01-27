import { AdminNav } from '@/components/admin/AdminNav';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-stone-50 dark:bg-neutral-950">
      <AdminNav />
      <main className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
      <AdminMobileNav />
    </div>
  );
}
