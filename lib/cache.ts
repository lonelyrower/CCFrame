import { getRedis } from './redis'

// Simple JSON cache wrapper with graceful fallback if Redis unavailable.
// For read-heavy pages (home, stats) to reduce query latency.

const memStore = new Map<string, { exp: number; val: any }>()

export interface CacheOptions {
  ttlSeconds: number
}

export async function cacheGet<T = any>(key: string): Promise<T | null> {
  try {
    const client = await getRedis()
    if (!client) throw new Error('Redis not available')
    const raw = await client.get(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    const m = memStore.get(key)
    if (!m) return null
    if (Date.now() > m.exp) { memStore.delete(key); return null }
    return m.val as T
  }
}

export async function cacheSet<T = any>(key: string, val: T, opts: CacheOptions) {
  const ttl = Math.max(1, opts.ttlSeconds)
  try {
    const client = await getRedis()
    if (!client) throw new Error('Redis not available')
    await client.setex(key, ttl, JSON.stringify(val))
  } catch {
    memStore.set(key, { exp: Date.now() + ttl * 1000, val })
  }
}

export async function cacheGetOrSet<T = any>(key: string, opts: CacheOptions, loader: () => Promise<T>): Promise<T> {
  const existing = await cacheGet<T>(key)
  if (existing !== null) return existing
  const fresh = await loader()
  cacheSet(key, fresh, opts)
  return fresh
}
