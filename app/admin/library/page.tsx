import { NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

import { requireAdmin } from '@/lib/admin-auth'
import { getLibraryOverview } from '@/lib/admin/library-service'
import type { LibraryTableQuery } from '@/types/library'
import { LibraryWorkbench } from '@/components/admin/library-workbench'

interface LibraryPageProps {
  searchParams: {
    filter?: string
    status?: string
    visibility?: string
    page?: string
    view?: string
  }
}

export const dynamic = 'force-dynamic'

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) {
    if (guard.status === 401) redirect('/admin/login')
    if (guard.status === 403) redirect('/admin/login?error=forbidden')
    throw new Error('Admin access required')
  }

  const query: LibraryTableQuery = {
    search: searchParams.filter ?? undefined,
    status: (searchParams.status as LibraryTableQuery['status']) ?? 'all',
    visibility: (searchParams.visibility as LibraryTableQuery['visibility']) ?? 'all',
    page: searchParams.page ? Number(searchParams.page) : 1,
  }

  const overview = await getLibraryOverview(guard.adminUserId, query)
  const view = searchParams.view === 'kanban' ? 'kanban' : 'table'

  return (
    <div className="space-y-10 pb-20 pt-6">
      <LibraryWorkbench initialData={overview} initialQuery={query} initialView={view} />
    </div>
  )
}
