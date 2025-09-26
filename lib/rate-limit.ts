import { getRedis } from './redis'

export type RateLimitResult = { allowed: boolean; remaining: number; limit: number; resetIn: number }

const FALLBACK_LIMIT_STORE = new Map<string, { count: number; resetAt: number }>()
let fallbackWarned = false

function cleanupFallback(now: number) {
  for (const [key, value] of FALLBACK_LIMIT_STORE) {
    if (value.resetAt <= now) {
      FALLBACK_LIMIT_STORE.delete(key)
    }
  }
}

function fallbackRateLimit(
  userId: string,
  key: string,
  limit: number,
  windowSec: number
): RateLimitResult {
  const safeWindow = Math.max(1, windowSec)
  const now = Math.floor(Date.now() / 1000)
  const windowStart = Math.floor(now / safeWindow) * safeWindow
  const storageKey = `rl:${key}:${userId}:${windowStart}`
  const resetAt = windowStart + safeWindow
  cleanupFallback(now)

  const entry = FALLBACK_LIMIT_STORE.get(storageKey)
  const nextCount = entry && entry.resetAt > now ? entry.count + 1 : 1

  FALLBACK_LIMIT_STORE.set(storageKey, { count: nextCount, resetAt })

  if (!fallbackWarned) {
    const message = '[rate-limit] Redis unavailable, using in-memory fallback limiter'
    if (process.env.NODE_ENV === 'production') {
      console.error(message)
    } else {
      console.warn(message)
    }
    fallbackWarned = true
  }

  if (FALLBACK_LIMIT_STORE.size > 5000) {
    cleanupFallback(now)
  }

  const remaining = Math.max(0, limit - nextCount)
  const allowed = nextCount <= limit
  const resetIn = Math.max(0, resetAt - now)
  return { allowed, remaining, limit, resetIn }
}

// Simple sliding window via fixed window buckets
export async function rateLimit(userId: string, key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  const redis = await getRedis()
  if (!redis) {
    return fallbackRateLimit(userId, key, limit, windowSec)
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
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[rate-limit] Redis error, switching to fallback', error)
    } else {
      console.warn('[rate-limit] Redis error, switching to fallback', error)
    }
    return fallbackRateLimit(userId, key, limit, windowSec)
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
