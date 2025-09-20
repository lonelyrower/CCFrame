import { env } from 'process'
import { getRuntimeConfig } from './runtime-config'

type SemanticMode = 'off' | 'shadow' | 'on'
export type SemanticProvider = 'deterministic' | 'openai' | 'custom'

export interface SemanticConfig {
  enabled: boolean
  mode: SemanticMode
  provider: SemanticProvider | string
  model: string
  dim: number
  queryCacheTtlMs: number
  cacheSize: number
  cacheTtlMs: number
  negativeCache: boolean
  negativeCacheTtlMs: number
  strictMode: boolean
  rpmLimit: number
  maxRetry: number
}

getRuntimeConfig()

let cached: SemanticConfig | null = null

function parseBool(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function parseIntEnv(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function resolveConfig(): SemanticConfig {
  const runtime = getRuntimeConfig()
  const runtimeSemantic = runtime.semantic || {}

  const enabled = typeof runtimeSemantic.enabled === 'boolean'
    ? runtimeSemantic.enabled
    : parseBool(env.ENABLE_SEMANTIC_SEARCH, false)

  const rawModeSource = (runtimeSemantic.mode || env.SEMANTIC_USE_PGVECTOR || 'off').toString()
  const rawMode = rawModeSource.toLowerCase() as SemanticMode
  const providerSource = (runtimeSemantic.provider || env.EMBED_PROVIDER || 'deterministic').toString()
  const provider = providerSource.toLowerCase() as SemanticProvider | string
  const model = runtimeSemantic.model || env.EMBED_MODEL_NAME || 'deterministic-v1'
  const dim = typeof runtimeSemantic.dim === 'number'
    ? runtimeSemantic.dim
    : parseIntEnv(env.EMBED_DIM, 768)
  const queryCacheTtlMs = typeof runtimeSemantic.queryCacheTtlMs === 'number'
    ? runtimeSemantic.queryCacheTtlMs
    : parseIntEnv(env.EMBED_QUERY_CACHE_TTL_MS, 30000)
  const cacheSize = typeof runtimeSemantic.cacheSize === 'number'
    ? runtimeSemantic.cacheSize
    : parseIntEnv(env.SEMANTIC_LRU_SIZE, 100)
  const cacheTtlMs = typeof runtimeSemantic.cacheTtlMs === 'number'
    ? runtimeSemantic.cacheTtlMs
    : parseIntEnv(env.SEMANTIC_LRU_TTL_MS, 60000)
  const negativeCache = typeof runtimeSemantic.negativeCache === 'boolean'
    ? runtimeSemantic.negativeCache
    : parseBool(env.EMBED_NEG_CACHE, false)
  const negativeCacheTtlMs = typeof runtimeSemantic.negativeCacheTtlMs === 'number'
    ? runtimeSemantic.negativeCacheTtlMs
    : parseIntEnv(env.EMBED_NEG_CACHE_TTL_MS, 5000)
  const strictMode = typeof runtimeSemantic.strictMode === 'boolean'
    ? runtimeSemantic.strictMode
    : parseBool(env.EMBED_OPENAI_STRICT, false)
  const rpmLimit = typeof runtimeSemantic.rpmLimit === 'number'
    ? runtimeSemantic.rpmLimit
    : parseIntEnv(env.EMBED_OPENAI_RPM, 60)
  const maxRetry = typeof runtimeSemantic.maxRetry === 'number'
    ? runtimeSemantic.maxRetry
    : parseIntEnv(env.EMBED_OPENAI_MAX_RETRY, 3)

  const mode: SemanticMode = enabled ? rawMode : 'off'

  return {
    enabled,
    mode,
    provider,
    model,
    dim,
    queryCacheTtlMs,
    cacheSize,
    cacheTtlMs,
    negativeCache,
    negativeCacheTtlMs,
    strictMode,
    rpmLimit,
    maxRetry,
  }
}
export function getSemanticConfig(): SemanticConfig {
  if (!cached || process.env.NODE_ENV === 'development') {
    cached = resolveConfig()
  }
  return cached
}

export function refreshSemanticConfig() {
  cached = resolveConfig()
}

