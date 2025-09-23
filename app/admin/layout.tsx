import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import type { ReactNode } from 'react'

import { AppShell } from '@/components/layout/app-shell'
import { AppOverlays } from '@/components/layout/app-overlays'
import { featureFlags } from '@/lib/config/feature-flags'
import { requireAdmin } from '@/lib/admin-auth'
import { AdminControlHeader } from '@/components/admin/admin-control-header'
import { AdminNavigationSidebar } from '@/components/admin/admin-navigation'
import { AdminCommandDrawer } from '@/components/admin/admin-command-drawer'

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
      header={<AdminControlHeader />}
      sidebar={<AdminNavigationSidebar className="pt-8" />}
      overlays={featureFlags.enableOverlays ? <AppOverlays /> : undefined}
      contentPadding="auto"
    >
      <AdminCommandDrawer />
      {children}
    </AppShell>
  )
}
