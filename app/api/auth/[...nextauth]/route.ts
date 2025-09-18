import NextAuth from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getClientIp, rateLimit, rateLimitHeaders } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

type NextAuthContext = { params: { nextauth: string[] } }

const authHandler = NextAuth(authOptions)

export async function GET(request: NextRequest, context: NextAuthContext) {
  return authHandler(request, context)
}

export async function POST(request: NextRequest, context: NextAuthContext) {
  const clientIp = getClientIp(request)
  const result = await rateLimit(clientIp, 'auth:login', 5, 60)
  const headers = rateLimitHeaders(result)

  if (!result.allowed) {
    logger.warn({ clientIp, event: 'auth_rate_limited' }, 'Login rate limit exceeded')
    const response = NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    )
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value)
    }
    return response
  }

  const response = await authHandler(request, context)
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }
  return response
}
