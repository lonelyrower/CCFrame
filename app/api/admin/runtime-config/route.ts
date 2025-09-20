import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdmin } from '@/lib/admin-auth'
import { getRuntimeConfig, updateRuntimeConfig } from '@/lib/runtime-config'
import { resetStorageManager } from '@/lib/storage-manager'
import { refreshSemanticConfig } from '@/lib/semantic-config'

const storageSchema = z.object({
  provider: z.string().optional(),
  local: z.object({
    basePath: z.string().optional(),
  }).optional(),
  minio: z.object({
    endpoint: z.string().optional(),
    region: z.string().optional(),
    bucket: z.string().optional(),
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
    cdnUrl: z.string().optional(),
    forcePathStyle: z.boolean().optional(),
  }).optional(),
  aws: z.object({
    endpoint: z.string().optional(),
    region: z.string().optional(),
    bucket: z.string().optional(),
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
    cdnUrl: z.string().optional(),
  }).optional(),
}).optional()

const semanticSchema = z.object({
  enabled: z.boolean().optional(),
  mode: z.enum(['off', 'shadow', 'on']).optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  dim: z.number().int().positive().optional(),
  openaiApiKey: z.string().optional(),
  openaiBaseUrl: z.string().optional(),
  strictMode: z.boolean().optional(),
  rpmLimit: z.number().int().nonnegative().optional(),
  maxRetry: z.number().int().nonnegative().optional(),
  queryCacheTtlMs: z.number().int().nonnegative().optional(),
  cacheTtlMs: z.number().int().nonnegative().optional(),
  cacheSize: z.number().int().nonnegative().optional(),
  negativeCache: z.boolean().optional(),
  negativeCacheTtlMs: z.number().int().nonnegative().optional(),
}).optional()

const updateSchema = z.object({
  storage: storageSchema,
  semantic: semanticSchema
})

function boolFromEnv(value: string | undefined, fallback = false) {
  if (value === undefined) return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function numberFromEnv(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function numberFromConfig(runtimeValue: unknown, envValue: string | undefined, fallback: number) {
  if (typeof runtimeValue === 'number' && Number.isFinite(runtimeValue)) {
    return runtimeValue
  }
  return numberFromEnv(envValue, fallback)
}

function buildConfigResponse()() {
  const runtime = getRuntimeConfig()
  const runtimeStorage = runtime.storage || {}
  const runtimeSemantic = runtime.semantic || {}

  return {
    storage: {
      provider: runtimeStorage.provider || process.env.STORAGE_PROVIDER || 'minio',
      local: {
        basePath: runtimeStorage.local?.basePath || process.env.UPLOAD_PATH || './uploads'
      },
      minio: {
        endpoint: runtimeStorage.minio?.endpoint || process.env.S3_ENDPOINT || process.env.MINIO_ENDPOINT || '',
        region: runtimeStorage.minio?.region || process.env.S3_REGION || process.env.MINIO_REGION || '',
        bucket: runtimeStorage.minio?.bucket || process.env.S3_BUCKET_NAME || process.env.MINIO_BUCKET || '',
        accessKeyId: runtimeStorage.minio?.accessKeyId || process.env.S3_ACCESS_KEY_ID || process.env.MINIO_ROOT_USER || '',
        secretAccessKey: runtimeStorage.minio?.secretAccessKey || process.env.S3_SECRET_ACCESS_KEY || process.env.MINIO_ROOT_PASSWORD || '',
        cdnUrl: runtimeStorage.minio?.cdnUrl || process.env.CDN_BASE_URL || '',
        forcePathStyle: runtimeStorage.minio?.forcePathStyle ?? boolFromEnv(process.env.S3_FORCE_PATH_STYLE, true),
      },
      aws: {
        endpoint: runtimeStorage.aws?.endpoint || process.env.AWS_S3_ENDPOINT || '',
        region: runtimeStorage.aws?.region || process.env.AWS_REGION || process.env.S3_REGION || '',
        bucket: runtimeStorage.aws?.bucket || process.env.AWS_S3_BUCKET || process.env.S3_BUCKET_NAME || '',
        accessKeyId: runtimeStorage.aws?.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: runtimeStorage.aws?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || '',
        cdnUrl: runtimeStorage.aws?.cdnUrl || process.env.AWS_CLOUDFRONT_URL || ''
      }
    },
    semantic: {
      enabled: runtimeSemantic.enabled ?? boolFromEnv(process.env.ENABLE_SEMANTIC_SEARCH, false),
      mode: (runtimeSemantic.mode || process.env.SEMANTIC_USE_PGVECTOR || 'off') as 'off' | 'shadow' | 'on',
      provider: runtimeSemantic.provider || process.env.EMBED_PROVIDER || 'deterministic',
      model: runtimeSemantic.model || process.env.EMBED_MODEL_NAME || 'deterministic-v1',
      dim: numberFromConfig(runtimeSemantic.dim, process.env.EMBED_DIM, 768),
      openaiApiKey: runtimeSemantic.openaiApiKey || process.env.OPENAI_API_KEY || '',
      openaiBaseUrl: runtimeSemantic.openaiBaseUrl || process.env.OPENAI_BASE_URL || '',
      strictMode: runtimeSemantic.strictMode ?? boolFromEnv(process.env.EMBED_OPENAI_STRICT, false),
      rpmLimit: numberFromConfig(runtimeSemantic.rpmLimit, process.env.EMBED_OPENAI_RPM, 60),
      maxRetry: numberFromConfig(runtimeSemantic.maxRetry, process.env.EMBED_OPENAI_MAX_RETRY, 3),
      queryCacheTtlMs: numberFromConfig(runtimeSemantic.queryCacheTtlMs, process.env.EMBED_QUERY_CACHE_TTL_MS, 30000),
      cacheTtlMs: numberFromConfig(runtimeSemantic.cacheTtlMs, process.env.SEMANTIC_LRU_TTL_MS, 60000),
      cacheSize: numberFromConfig(runtimeSemantic.cacheSize, process.env.SEMANTIC_LRU_SIZE, 100),
      negativeCache: runtimeSemantic.negativeCache ?? boolFromEnv(process.env.EMBED_NEG_CACHE, false),
      negativeCacheTtlMs: numberFromConfig(runtimeSemantic.negativeCacheTtlMs, process.env.EMBED_NEG_CACHE_TTL_MS, 5000),
    }
  }
}

export async function GET() {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  return NextResponse.json(buildConfigResponse())
}

export async function PUT(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  try {
    const body = await request.json()
    const parsed = updateSchema.parse(body)
    await updateRuntimeConfig(parsed)

    if (parsed.storage) {
      resetStorageManager()
    }
    if (parsed.semantic) {
      refreshSemanticConfig()
    }

    return NextResponse.json(buildConfigResponse())
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '参数错误', details: error.errors }, { status: 400 })
    }
    console.error('[runtime-config] update failed', error)
    return NextResponse.json({ error: '内部错误' }, { status: 500 })
  }
}
