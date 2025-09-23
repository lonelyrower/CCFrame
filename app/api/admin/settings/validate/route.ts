import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/admin-auth'
import { validateSettings } from '@/lib/admin/settings-service'
import type { SettingsValidationTarget } from '@/types/settings'

export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  const body = await request.json().catch(() => null)
  const target = body?.target as SettingsValidationTarget | undefined

  if (!target) {
    return NextResponse.json({ error: '必须提供校验目标 target' }, { status: 400 })
  }

  const result = await validateSettings(target, guard.adminUserId)
  return NextResponse.json(result)
}
