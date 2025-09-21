import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import type { ReactNode } from 'react'

import { AppShell } from '@/components/layout/app-shell'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { AdminTopbar } from '@/components/layout/admin-topbar'
import { AppOverlays } from '@/components/layout/app-overlays'
import { featureFlags } from '@/lib/config/feature-flags'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

interface AdminLayoutProps {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
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
    <AppShell
      header={<AdminTopbar />}
      sidebar={<AdminSidebar />}
      overlays={featureFlags.enableOverlays ? <AppOverlays /> : undefined}
      contentClassName="bg-surface-canvas px-4 pb-16 pt-6 md:px-6 lg:px-10"
    >
      {children}
    </AppShell>
  )
}

