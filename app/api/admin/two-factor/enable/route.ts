import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { TwoFactorAuth } from '@/lib/two-factor'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const enableSchema = z.object({
  secret: z.string(),
  token: z.string().length(6, '验证码必须是6位数字')
})

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) {
    return auth
  }

  try {
    const { adminUserId } = auth
    const body = await request.json()
    const { secret, token } = enableSchema.parse(body)

    // 检查是否已经启用2FA
    const isEnabled = await TwoFactorAuth.isEnabled(adminUserId)
    if (isEnabled) {
      return NextResponse.json({ error: '2FA already enabled' }, { status: 400 })
    }

    // 验证用户提供的验证码
    const isValid = TwoFactorAuth.verifyToken(secret, token)
    if (!isValid) {
      logger.warn({ userId: adminUserId }, '2FA enable failed: invalid token')
      return NextResponse.json({ error: '验证码无效' }, { status: 400 })
    }

    // 启用2FA
    await TwoFactorAuth.enableTwoFactor(adminUserId, secret)

    logger.info({ userId: adminUserId }, '2FA enabled successfully')

    return NextResponse.json({ success: true, message: '双重认证已启用' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : String(error)
    logger.error({ error: message }, '2FA enable error')
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}