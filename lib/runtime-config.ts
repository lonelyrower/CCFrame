import fs from 'fs'
import path from 'path'

export type RuntimeStorageAwsConfig = {
  endpoint?: string
  region?: string
  bucket?: string
  accessKeyId?: string
  secretAccessKey?: string
  cdnUrl?: string
  forcePathStyle?: boolean
}

export type RuntimeStorageConfig = {
  provider?: string
  local?: {
    basePath?: string
  }
  minio?: RuntimeStorageAwsConfig
  aws?: RuntimeStorageAwsConfig
  aliyun?: RuntimeStorageAwsConfig & { endpoint?: string }
  qcloud?: RuntimeStorageAwsConfig & { endpoint?: string }
}

export type RuntimeSemanticConfig = {
  enabled?: boolean
  mode?: 'off' | 'shadow' | 'on'
  provider?: string
  model?: string
  dim?: number
  openaiApiKey?: string
  openaiBaseUrl?: string
  strictMode?: boolean
  rpmLimit?: number
  maxRetry?: number
  queryCacheTtlMs?: number
  cacheTtlMs?: number
  cacheSize?: number
  negativeCache?: boolean
  negativeCacheTtlMs?: number
}

export type RuntimeConfig = {
  storage?: RuntimeStorageConfig
  semantic?: RuntimeSemanticConfig
}

const CONFIG_PATH = process.env.RUNTIME_CONFIG_PATH
  ? path.resolve(process.env.RUNTIME_CONFIG_PATH)
  : path.resolve(process.cwd(), 'config', 'runtime-config.json')

let cachedConfig: RuntimeConfig | null = null

function ensureDirExists(filePath: string) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const base = { ...target }
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) {
      continue
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const current = (base as Record<string, any>)[key] ?? {}
      ;(base as Record<string, any>)[key] = deepMerge(current, value)
    } else {
      ;(base as Record<string, any>)[key] = value
    }
  }
  return base
}

function readRuntimeConfigFile(): RuntimeConfig {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return {}
    }
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8')
    if (!raw.trim()) return {}
    const parsed = JSON.parse(raw) as RuntimeConfig
    return parsed || {}
  } catch (error) {
    console.error('[runtime-config] Failed to read runtime config:', error)
    return {}
  }
}

function applyRuntimeConfigToEnv(config: RuntimeConfig) {
  const storage = config.storage
  if (storage?.provider) {
    process.env.STORAGE_PROVIDER = storage.provider
  }
  if (storage?.local?.basePath) {
    process.env.UPLOAD_PATH = storage.local.basePath
  }
  const minio = storage?.minio
  if (minio) {
    if (minio.endpoint) process.env.S3_ENDPOINT = minio.endpoint
    if (minio.region) process.env.S3_REGION = minio.region
    if (minio.bucket) process.env.S3_BUCKET_NAME = minio.bucket
    if (minio.accessKeyId) process.env.S3_ACCESS_KEY_ID = minio.accessKeyId
    if (minio.secretAccessKey) process.env.S3_SECRET_ACCESS_KEY = minio.secretAccessKey
    if (minio.cdnUrl) process.env.CDN_BASE_URL = minio.cdnUrl
    if (typeof minio.forcePathStyle === 'boolean') {
      process.env.S3_FORCE_PATH_STYLE = String(minio.forcePathStyle)
    }
  }
  const aws = storage?.aws
  if (aws) {
    if (aws.endpoint) process.env.AWS_S3_ENDPOINT = aws.endpoint
    if (aws.region) process.env.AWS_REGION = aws.region
    if (aws.bucket) process.env.AWS_S3_BUCKET = aws.bucket
    if (aws.accessKeyId) process.env.AWS_ACCESS_KEY_ID = aws.accessKeyId
    if (aws.secretAccessKey) process.env.AWS_SECRET_ACCESS_KEY = aws.secretAccessKey
    if (aws.cdnUrl) process.env.AWS_CLOUDFRONT_URL = aws.cdnUrl
  }

  const semantic = config.semantic
  if (semantic) {
    if (typeof semantic.enabled === 'boolean') {
      process.env.ENABLE_SEMANTIC_SEARCH = semantic.enabled ? 'true' : 'false'
    }
    if (semantic.mode) process.env.SEMANTIC_USE_PGVECTOR = semantic.mode
    if (semantic.provider) process.env.EMBED_PROVIDER = semantic.provider
    if (semantic.model) process.env.EMBED_MODEL_NAME = semantic.model
    if (typeof semantic.dim === 'number') process.env.EMBED_DIM = String(semantic.dim)
    if (semantic.openaiApiKey) process.env.OPENAI_API_KEY = semantic.openaiApiKey
    if (semantic.openaiBaseUrl) process.env.OPENAI_BASE_URL = semantic.openaiBaseUrl
    if (typeof semantic.strictMode === 'boolean') process.env.EMBED_OPENAI_STRICT = semantic.strictMode ? 'true' : 'false'
    if (typeof semantic.rpmLimit === 'number') process.env.EMBED_OPENAI_RPM = String(semantic.rpmLimit)
    if (typeof semantic.maxRetry === 'number') process.env.EMBED_OPENAI_MAX_RETRY = String(semantic.maxRetry)
    if (typeof semantic.queryCacheTtlMs === 'number') process.env.EMBED_QUERY_CACHE_TTL_MS = String(semantic.queryCacheTtlMs)
    if (typeof semantic.cacheTtlMs === 'number') process.env.SEMANTIC_LRU_TTL_MS = String(semantic.cacheTtlMs)
    if (typeof semantic.cacheSize === 'number') process.env.SEMANTIC_LRU_SIZE = String(semantic.cacheSize)
    if (typeof semantic.negativeCache === 'boolean') process.env.EMBED_NEG_CACHE = semantic.negativeCache ? 'true' : 'false'
    if (typeof semantic.negativeCacheTtlMs === 'number') process.env.EMBED_NEG_CACHE_TTL_MS = String(semantic.negativeCacheTtlMs)
  }
}

export function getRuntimeConfig(): RuntimeConfig {
  if (!cachedConfig) {
    cachedConfig = readRuntimeConfigFile()
    applyRuntimeConfigToEnv(cachedConfig)
  }
  return cachedConfig
}

export async function updateRuntimeConfig(patch: Partial<RuntimeConfig>): Promise<RuntimeConfig> {
  const current = getRuntimeConfig()
  const merged = deepMerge(current, patch)
  ensureDirExists(CONFIG_PATH)
  await fs.promises.writeFile(CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf8')
  cachedConfig = merged
  applyRuntimeConfigToEnv(merged)
  return merged
}

export function overwriteRuntimeConfigSync(nextConfig: RuntimeConfig) {
  ensureDirExists(CONFIG_PATH)
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(nextConfig, null, 2), 'utf8')
  cachedConfig = nextConfig
  applyRuntimeConfigToEnv(nextConfig)
}

export function runtimeConfigPath() {
  return CONFIG_PATH
}
