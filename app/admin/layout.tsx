import { AdminNav } from '@/components/admin/AdminNav';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-neutral-950">
      <AdminNav />
      <main className="pb-20 md:pb-0">{children}</main>
      <AdminMobileNav />
    </div>
  );
}
