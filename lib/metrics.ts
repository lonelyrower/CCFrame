import {
  imageProcessingHistogram,
  embeddingGenerationHistogram,
  embeddingGenerationCounter,
  embeddingProviderHistogram,
  embeddingProviderErrorCounter,
  semanticApiLatencyHistogram,
  semanticCacheCounter,
  semanticFallbackCounter,
} from './prometheus'

interface TimingSample {
  totalMs: number
  blurhashMs: number
  variantsMs: number
  ts: number
}

const RING_SIZE = 200
const ring: TimingSample[] = []

// Embedding generation metrics (ring buffer of durations & success/fail counts)
interface EmbeddingGenSample { ms: number; ok: boolean; model: string; ts: number }
const EMB_RING_SIZE = 500
const embRing: EmbeddingGenSample[] = []
let embFailCount = 0
let embSuccessCount = 0

// Query embedding cache metrics
let queryCacheHits = 0
let queryCacheMisses = 0
export function recordQueryEmbeddingCache(hit: boolean) {
  if (hit) queryCacheHits++; else queryCacheMisses++
}
let queryRedisHits = 0
let queryRedisMisses = 0
export function recordQueryEmbeddingRedis(hit: boolean) {
  if (hit) queryRedisHits++; else queryRedisMisses++
}

// Layer usage (memory / redis / provider / negative) for query embeddings
const layerCounts: Record<string, number> = { memory: 0, redis: 0, provider: 0, negative: 0 }
export function recordEmbeddingLayer(layer: 'memory' | 'redis' | 'provider' | 'negative') {
  layerCounts[layer] = (layerCounts[layer] || 0) + 1
}

// Negative cache metrics (for provider failures in strict mode)
let negCacheHits = 0
let negCacheInserts = 0
let negCacheSize = 0
export function recordNegativeCache(ev: 'hit' | 'insert', size?: number) {
  if (ev === 'hit') negCacheHits++; else negCacheInserts++
  if (typeof size === 'number') negCacheSize = size
}

// Provider-level metrics
interface EmbeddingProviderSample { ms: number; ok: boolean; provider: string; model: string; batch: number; ts: number }
const EMB_PROVIDER_RING_SIZE = 400
const embProviderRing: EmbeddingProviderSample[] = []
const embProviderErrors: Record<string, number> = {}

// Semantic API latency ring
interface SemanticApiSample { ms: number; cached: boolean; ts: number }
const SEM_API_RING_SIZE = 300
const semApiRing: SemanticApiSample[] = []
let semCacheHits = 0
let semRequests = 0

// pgvector shadow / fallback metrics
interface ShadowSample { overlap: number; recall: number; deltaMs: number; ts: number }
const SHADOW_RING_SIZE = 200
const shadowRing: ShadowSample[] = []
let pgvectorFallbacks = 0
const pgvectorFallbackErrors: Record<string, number> = {}

export function recordSemanticShadow(m: { overlap: number; recall: number; deltaMs: number }) {
  shadowRing.push({ ...m, ts: Date.now() })
  if (shadowRing.length > SHADOW_RING_SIZE) shadowRing.shift()
}

export function recordSemanticPgvectorFallback(err?: string) {
  pgvectorFallbacks++
  semanticFallbackCounter.inc({ result: err ? 'error' : 'fallback' })
  if (err) pgvectorFallbackErrors[err] = (pgvectorFallbackErrors[err] || 0) + 1
}

export function recordImageProcess(t: { totalMs: number; blurhashMs: number; variantsMs: number }) {
  imageProcessingHistogram.observe({ stage: 'total' }, t.totalMs / 1000)
  imageProcessingHistogram.observe({ stage: 'blurhash' }, t.blurhashMs / 1000)
  imageProcessingHistogram.observe({ stage: 'variants' }, t.variantsMs / 1000)
  ring.push({ ...t, ts: Date.now() })
  if (ring.length > RING_SIZE) ring.shift()
}

export function getImageTimingAverages() {
  if (!ring.length) return { count: 0, avgTotal: 0, avgBlurhash: 0, avgVariants: 0 }
  const sum = ring.reduce((acc, s) => {
    acc.total += s.totalMs
    acc.blur += s.blurhashMs
    acc.vars += s.variantsMs
    return acc
  }, { total: 0, blur: 0, vars: 0 })
  return {
    count: ring.length,
    avgTotal: +(sum.total / ring.length).toFixed(1),
    avgBlurhash: +(sum.blur / ring.length).toFixed(1),
    avgVariants: +(sum.vars / ring.length).toFixed(1)
  }
}

export function recordEmbeddingGeneration(t: { ms: number; ok: boolean; model: string }) {
  embRing.push({ ...t, ts: Date.now() })
  if (embRing.length > EMB_RING_SIZE) embRing.shift()
  const status = t.ok ? 'success' : 'error'
  embeddingGenerationHistogram.observe({ model: t.model, status }, t.ms / 1000)
  embeddingGenerationCounter.inc({ model: t.model, status })
  if (t.ok) embSuccessCount++; else embFailCount++
}

export function getEmbeddingMetrics() {
  if (!embRing.length) return { count: 0, success: embSuccessCount, failed: embFailCount, avgMs: 0, p95Ms: 0, modelTop: [] as { model: string; count: number }[], provider: { count: 0 }, queryCache: { hits: queryCacheHits, misses: queryCacheMisses, hitRate: 0 }, queryRedis: { hits: queryRedisHits, misses: queryRedisMisses, hitRate: 0 }, negativeCache: { hits: negCacheHits, inserts: negCacheInserts, size: negCacheSize } }
  const durations = embRing.map(s => s.ms).sort((a, b) => a - b)
  const p95 = durations[Math.min(durations.length - 1, Math.floor(durations.length * 0.95))]
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length
  const modelCounts: Record<string, number> = {}
  for (const s of embRing) modelCounts[s.model] = (modelCounts[s.model] || 0) + 1
  const modelTop = Object.entries(modelCounts).map(([model, count]) => ({ model, count })).sort((a, b) => b.count - a.count).slice(0, 5)
  // provider aggregation
  const providerCounts: Record<string, number> = {}
  let providerMs = 0
  for (const s of embProviderRing) {
    providerCounts[s.provider] = (providerCounts[s.provider] || 0) + 1
    providerMs += s.ms
  }
  const providerTop = Object.entries(providerCounts).map(([provider, count]) => ({ provider, count })).sort((a, b) => b.count - a.count)
  return {
    count: embRing.length,
    success: embSuccessCount,
    failed: embFailCount,
    avgMs: +avg.toFixed(1),
    p95Ms: +p95.toFixed(1),
    modelTop,
    provider: {
      count: embProviderRing.length,
      avgMs: embProviderRing.length ? +(providerMs / embProviderRing.length).toFixed(1) : 0,
      top: providerTop.slice(0, 5),
      errors: Object.keys(embProviderErrors).length ? embProviderErrors : undefined,
    },
    queryCache: {
      hits: queryCacheHits,
      misses: queryCacheMisses,
      hitRate: (queryCacheHits + queryCacheMisses) ? +(queryCacheHits / (queryCacheHits + queryCacheMisses)).toFixed(3) : 0,
    },
    queryRedis: {
      hits: queryRedisHits,
      misses: queryRedisMisses,
      hitRate: (queryRedisHits + queryRedisMisses) ? +(queryRedisHits / (queryRedisHits + queryRedisMisses)).toFixed(3) : 0,
    },
    layers: layerCounts,
    negativeCache: { hits: negCacheHits, inserts: negCacheInserts, size: negCacheSize },
  }
}

export function recordEmbeddingProvider(t: { ms: number; ok: boolean; provider: string; model: string; batch: number; error?: string }) {
  embProviderRing.push({ ...t, ts: Date.now() })
  if (embProviderRing.length > EMB_PROVIDER_RING_SIZE) embProviderRing.shift()
  const status = t.ok ? 'success' : 'error'
  embeddingProviderHistogram.observe({ provider: t.provider, status }, t.ms / 1000)
  if (!t.ok) {
    const errorLabel = t.error || 'unknown'
    embeddingProviderErrorCounter.inc({ provider: t.provider, error: errorLabel })
    embProviderErrors[errorLabel] = (embProviderErrors[errorLabel] || 0) + 1
  }
}

export function recordSemanticApi(t: { ms: number; cached: boolean }) {
  semApiRing.push({ ...t, ts: Date.now() })
  if (semApiRing.length > SEM_API_RING_SIZE) semApiRing.shift()
  semRequests++
  semanticApiLatencyHistogram.observe({ cached: t.cached ? 'true' : 'false' }, t.ms / 1000)
  semanticCacheCounter.inc({ status: t.cached ? 'hit' : 'miss' })
  if (t.cached) semCacheHits++
}

export function getSemanticApiMetrics() {
  if (!semApiRing.length) return { count: 0, avgMs: 0, p95Ms: 0, cacheHitRate: 0 }
  const durations = semApiRing.map(s => s.ms).sort((a, b) => a - b)
  const p95 = durations[Math.min(durations.length - 1, Math.floor(durations.length * 0.95))]
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length
  const cacheHitRate = semRequests ? +(semCacheHits / semRequests).toFixed(3) : 0
  // shadow metrics aggregation (recent window averages)
  let shadowAvgRecall = 0, shadowAvgOverlap = 0, shadowAvgDelta = 0
  if (shadowRing.length) {
    for (const s of shadowRing) {
      shadowAvgRecall += s.recall
      shadowAvgOverlap += s.overlap
      shadowAvgDelta += s.deltaMs
    }
    shadowAvgRecall /= shadowRing.length
    shadowAvgOverlap /= shadowRing.length
    shadowAvgDelta /= shadowRing.length
  }
  return {
    count: semApiRing.length,
    avgMs: +avg.toFixed(1),
    p95Ms: +p95.toFixed(1),
    cacheHitRate,
    shadow: shadowRing.length ? {
      samples: shadowRing.length,
      avgRecall: +shadowAvgRecall.toFixed(3),
      avgOverlap: +shadowAvgOverlap.toFixed(3),
      avgDeltaMs: +shadowAvgDelta.toFixed(1),
      fallbacks: pgvectorFallbacks,
      fallbackErrors: Object.keys(pgvectorFallbackErrors).length ? pgvectorFallbackErrors : undefined,
    } : undefined,
  }
}
