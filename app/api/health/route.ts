import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getStorageManager } from '@/lib/storage-manager'
import { getRedis } from '@/lib/redis'
import { getImageTimingAverages, getEmbeddingMetrics, getSemanticApiMetrics } from '@/lib/metrics'
import { getSemanticConfig } from '@/lib/semantic-config'
import { storageHealthCounter, dbHealthCounter, redisHealthCounter } from '@/lib/prometheus'

const version = process.env.npm_package_version || '0.1.0'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()
  const result: any = {
    ok: true,
    version,
    time: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    services: {
      db: { ok: false, latencyMs: null as null | number },
      storage: { ok: false, latencyMs: null as null | number, authOk: null as null | boolean },
      redis: { ok: false, latencyMs: null as null | number },
    },
    metrics: {
      process: {
        rssMb: Number((process.memoryUsage().rss / 1024 / 1024).toFixed(1)),
        heapUsedMb: Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)),
      },
    },
  }

  // Database connectivity
  try {
    const t0 = Date.now()
    await db.$queryRaw`SELECT 1`
    result.services.db.ok = true
    result.services.db.latencyMs = Date.now() - t0
    dbHealthCounter.inc({ status: 'success' })
  } catch (e) {
    result.ok = false
    result.services.db.ok = false
    result.dbError = e instanceof Error ? e.message : String(e)
    dbHealthCounter.inc({ status: 'error' })
  }

  // Storage connectivity & credentials
  try {
    const storage = getStorageManager()
    if (typeof storage.healthCheck === 'function') {
      const probe = await storage.healthCheck()
      result.services.storage.ok = Boolean(probe.ok)
      result.services.storage.latencyMs = typeof probe.latencyMs === 'number' ? probe.latencyMs : null
      result.services.storage.authOk = typeof probe.authOk === 'boolean' ? probe.authOk : null
      const statusLabel = probe.ok ? 'success' : (probe.authOk === false ? 'auth_error' : 'error')
      storageHealthCounter.inc({ status: statusLabel })
      if (!probe.ok || probe.authOk === false) {
        result.ok = false
      }
      if (probe.error) {
        result.storageError = probe.error
      }
      if (probe.code) {
        result.storageCode = probe.code
      }
      if (typeof probe.statusCode === 'number') {
        result.storageStatusCode = probe.statusCode
      }
    } else {
      const t0 = Date.now()
      await storage.getPresignedDownloadUrl('healthcheck/non-existent')
      result.services.storage.ok = true
      result.services.storage.authOk = true
      result.services.storage.latencyMs = Date.now() - t0
      storageHealthCounter.inc({ status: 'success' })
    }
  } catch (e) {
    result.ok = false
    result.services.storage.ok = false
    result.services.storage.authOk = false
    result.storageError = e instanceof Error ? e.message : String(e)
    storageHealthCounter.inc({ status: 'error' })
  }

  // Redis
  try {
    const redis = await getRedis()
    if (redis) {
      const t0 = Date.now()
      await redis.ping()
      result.services.redis.ok = true
      result.services.redis.latencyMs = Date.now() - t0
      redisHealthCounter.inc({ status: 'success' })
    } else if (process.env.REDIS_URL) {
      result.services.redis.ok = false
      result.redisError = 'Redis unavailable'
      result.ok = false
      redisHealthCounter.inc({ status: 'error' })
    } else {
      result.services.redis.ok = false
      result.redisError = 'Redis not configured'
      redisHealthCounter.inc({ status: 'skipped' })
    }
  } catch (e) {
    result.services.redis.ok = false
    result.redisError = e instanceof Error ? e.message : String(e)
    redisHealthCounter.inc({ status: 'error' })
    result.ok = false
  }

  result.metrics.imageProcessing = getImageTimingAverages()
  const embMetrics = getEmbeddingMetrics()
  result.metrics.embeddings = embMetrics
  if (embMetrics.provider) {
    result.metrics.embeddingProviders = embMetrics.provider
  }
  result.metrics.semanticApi = getSemanticApiMetrics()
  result.semantic = { mode: getSemanticConfig().mode }
  try {
    const orphanRows = await db.$queryRawUnsafe(
      'SELECT count(*)::int AS c FROM photo_embeddings e LEFT JOIN photos p ON p.id = e.photo_id WHERE p.id IS NULL'
    ) as any[]
    const missingRows = await db.$queryRawUnsafe(
      'SELECT count(*)::int AS c FROM photos p WHERE NOT EXISTS (SELECT 1 FROM photo_embeddings e WHERE e.photo_id = p.id)'
    ) as any[]
    result.metrics.embeddingLifecycle = {
      orphanCount: orphanRows?.[0]?.c ?? 0,
      missingCount: missingRows?.[0]?.c ?? 0,
    }
  } catch (e) {
    result.metrics.embeddingLifecycleError = (e as Error).message
  }

  result.latencyMs = Date.now() - start
  const status = result.ok ? 200 : 503
  return NextResponse.json(result, { status })
}
