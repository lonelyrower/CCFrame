import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { TwoFactorAuth } from '@/lib/two-factor'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) {
    return auth
  }

  try {
    const { adminUserId, adminEmail } = auth

    // 检查是否已经启用2FA
    const isEnabled = await TwoFactorAuth.isEnabled(adminUserId)
    if (isEnabled) {
      return NextResponse.json({ error: '2FA already enabled' }, { status: 400 })
    }

    // 生成2FA设置
    const setup = await TwoFactorAuth.generateSetup(adminEmail, 'CCFrame')

    logger.info({ userId: adminUserId }, '2FA setup initiated')

    return NextResponse.json({
      qrCodeUrl: setup.qrCodeUrl,
      manualEntryKey: setup.manualEntryKey,
      secret: setup.secret // 临时存储，用于验证
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error({ error: message }, '2FA setup error')
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}