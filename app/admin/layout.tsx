import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

import { AdminNav } from '@/components/admin/admin-nav'
import { requireAdmin } from '@/lib/admin-auth'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const guard = await requireAdmin()

  if (guard instanceof NextResponse) {
    if (guard.status === 401) {
      redirect('/admin/login')
    }

    if (guard.status === 403) {
      redirect('/admin/login?error=forbidden')
    }

    throw new Error('Admin access required')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminNav />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}
