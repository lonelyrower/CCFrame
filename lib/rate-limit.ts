import { getRedis } from './redis'

export type RateLimitResult = { allowed: boolean; remaining: number; limit: number; resetIn: number }

// Simple sliding window via fixed window buckets
export async function rateLimit(userId: string, key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  const redis = await getRedis()
  if (!redis) {
    return { allowed: true, remaining: limit, limit, resetIn: windowSec }
  }
  try {
    const now = Math.floor(Date.now() / 1000)
    const windowStart = Math.floor(now / windowSec) * windowSec
    const redisKey = `rl:${key}:${userId}:${windowStart}`
    const ttl = windowSec + 1
    const count = await redis.incr(redisKey)
    if (count === 1) {
      await redis.expire(redisKey, ttl)
    }
    const remaining = Math.max(0, limit - count)
    const allowed = count <= limit
    const resetIn = Math.max(0, windowStart + windowSec - now)
    return { allowed, remaining, limit, resetIn }
  } catch {
    // Fail-open if Redis not available during development
    return { allowed: true, remaining: limit, limit, resetIn: windowSec }
  }
}

function parseForwardedFor(value: string | null): string | null {
  if (!value) return null
  const first = value.split(',')[0]?.trim()
  return first || null
}

export function getClientIp(request: Request): string {
  const headers = request.headers
  const candidates = [
    parseForwardedFor(headers.get('x-forwarded-for')),
    headers.get('x-real-ip'),
    headers.get('cf-connecting-ip'),
    headers.get('x-client-ip'),
    headers.get('fastly-client-ip'),
    headers.get('true-client-ip'),
  ]
  for (const candidate of candidates) {
    if (candidate && candidate.length > 0) {
      return candidate
    }
  }
  return 'anonymous'
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
    'X-RateLimit-Reset': Math.max(0, result.resetIn).toString(),
  }
}
