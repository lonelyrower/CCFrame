import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { TwoFactorAuth } from '@/lib/two-factor'
import { logger } from '@/lib/logger'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const disableSchema = z.object({
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
    const { token } = disableSchema.parse(body)

    // 检查是否启用了2FA
    const isEnabled = await TwoFactorAuth.isEnabled(adminUserId)
    if (!isEnabled) {
      return NextResponse.json({ error: '2FA not enabled' }, { status: 400 })
    }

    // 获取用户的2FA密钥并验证
    const userSecret = await TwoFactorAuth.getUserSecret(adminUserId)
    if (!userSecret || !TwoFactorAuth.verifyToken(userSecret, token)) {
      logger.warn({ userId: adminUserId }, '2FA disable failed: invalid token')
      return NextResponse.json({ error: '验证码无效' }, { status: 400 })
    }

    // 禁用2FA
    await TwoFactorAuth.disableTwoFactor(adminUserId)

    logger.info({ userId: adminUserId }, '2FA disabled successfully')

    return NextResponse.json({ success: true, message: '双重认证已禁用' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : String(error)
    logger.error({ error: message }, '2FA disable error')
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}