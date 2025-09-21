import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { TwoFactorAuth } from '@/lib/two-factor'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) {
    return auth
  }

  try {
    const { adminUserId } = auth

    // 检查2FA状态
    const isEnabled = await TwoFactorAuth.isEnabled(adminUserId)

    return NextResponse.json({
      enabled: isEnabled,
      message: isEnabled ? '双重认证已启用' : '双重认证未启用'
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}