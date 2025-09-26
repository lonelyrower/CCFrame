import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'

const CSRF_SECRET = (() => {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error(
      '[csrf] NEXTAUTH_SECRET must be configured. See README env setup to generate a unique value.'
    )
  }
  return secret
})()
const CSRF_EXPIRY = 1000 * 60 * 60 // 1 hour

interface CSRFTokenData {
  userId: string
  timestamp: number
  nonce: string
}

export class CSRFProtection {
  /**
   * 生成CSRF令牌
   */
  static generateToken(userId: string): string {
    const timestamp = Date.now()
    const nonce = crypto.randomBytes(16).toString('hex')

    const tokenData: CSRFTokenData = {
      userId,
      timestamp,
      nonce
    }

    const payload = Buffer.from(JSON.stringify(tokenData)).toString('base64')
    const signature = crypto
      .createHmac('sha256', CSRF_SECRET)
      .update(payload)
      .digest('hex')

    return `${payload}.${signature}`
  }

  /**
   * 验证CSRF令牌
   */
  static verifyToken(token: string, userId: string): boolean {
    try {
      const [payload, signature] = token.split('.')
      if (!payload || !signature) {
        return false
      }

      // 验证签名
      const expectedSignature = crypto
        .createHmac('sha256', CSRF_SECRET)
        .update(payload)
        .digest('hex')

      if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
        return false
      }

      // 解析令牌数据
      const tokenData: CSRFTokenData = JSON.parse(Buffer.from(payload, 'base64').toString())

      // 验证用户ID
      if (tokenData.userId !== userId) {
        return false
      }

      // 验证过期时间
      if (Date.now() - tokenData.timestamp > CSRF_EXPIRY) {
        return false
      }

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 从请求中提取CSRF令牌
   */
  static extractToken(request: NextRequest): string | null {
    // 首先尝试从请求头获取
    const headerToken = request.headers.get('x-csrf-token')
    if (headerToken) {
      return headerToken
    }

    // 然后尝试从请求体获取
    const formData = request.nextUrl.searchParams.get('_token')
    if (formData) {
      return formData
    }

    return null
  }

  /**
   * 验证请求的CSRF令牌
   */
  static async verifyRequest(request: NextRequest): Promise<{ valid: boolean; userId?: string }> {
    try {
      // 获取当前用户会话
      const session = await getServerSession(authOptions)
      if (!session?.user?.id) {
        return { valid: false }
      }

      const userId = session.user.id
      const token = this.extractToken(request)

      if (!token) {
        return { valid: false }
      }

      const isValid = this.verifyToken(token, userId)
      return { valid: isValid, userId }
    } catch (error) {
      return { valid: false }
    }
  }
}

/**
 * CSRF保护中间件
 */
export function withCSRFProtection<T extends any[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    const request = args[0] as NextRequest

    // 只对修改操作进行CSRF检查
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const { valid } = await CSRFProtection.verifyRequest(request)

      if (!valid) {
        return new Response(
          JSON.stringify({ error: 'Invalid CSRF token' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    return handler(...args)
  }
}
