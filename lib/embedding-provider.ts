import crypto from 'crypto'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getSemanticConfig, type SemanticProvider } from '@/lib/semantic-config'
import { recordEmbeddingProvider, recordQueryEmbeddingCache } from '@/lib/metrics'

export interface EmbeddingResult {
  embedding: Float32Array
  model: string
  provider: string
}

const OPENAI_ENDPOINT = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

function normalize(vector: Float32Array) {
  let sum = 0
  for (let i = 0; i < vector.length; i++) sum += vector[i] * vector[i]
  if (sum <= 0) {
    const fallback = 1 / Math.sqrt(vector.length || 1)
    vector.fill(fallback)
    return vector
  }
  const norm = Math.sqrt(sum)
  for (let i = 0; i < vector.length; i++) vector[i] = vector[i] / norm
  return vector
}

function seededVector(seedParts: string[], dim: number): Float32Array {
  const vector = new Float32Array(dim)
  const seedBase = seedParts.filter(Boolean).join('|') || 'semantic-placeholder'
  let filled = 0
  let salt = 0
  while (filled < dim) {
    const hash = crypto.createHash('sha256').update(`${seedBase}:${salt}`).digest()
    salt += 1
    for (let i = 0; i < hash.length && filled < dim; i += 4) {
      const chunk = hash.readInt32BE(i)
      vector[filled++] = chunk / 0x7fffffff
    }
  }
  return normalize(vector)
}

function toFloat32Array(values: number[]): Float32Array {
  const array = new Float32Array(values.length)
  for (let i = 0; i < values.length; i++) {
    array[i] = values[i]
  }
  return normalize(array)
}

const queryMemoryCache = new Map<string, { expires: number; value: Float32Array }>()

function cacheQueryEmbedding(key: string, value: Float32Array, ttlMs: number, maxSize: number) {
  const expires = Date.now() + ttlMs
  queryMemoryCache.set(key, { expires, value })
  if (queryMemoryCache.size > maxSize) {
    const firstKey = queryMemoryCache.keys().next().value
    if (firstKey) queryMemoryCache.delete(firstKey)
  }
}

function readQueryCache(key: string) {
  const cached = queryMemoryCache.get(key)
  if (!cached) return null
  if (cached.expires < Date.now()) {
    queryMemoryCache.delete(key)
    return null
  }
  return new Float32Array(cached.value)
}

async function callOpenAIEmbedding(input: string | string[], model: string, retries: number): Promise<Float32Array> {
  if (!OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY')
  }
  const payload = JSON.stringify({ input, model })
  let attempt = 0
  let delay = 500
  while (true) {
    const started = Date.now()
    const response = await fetch(`${OPENAI_ENDPOINT}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: payload,
    })
    if (response.ok) {
      const json = (await response.json()) as { data: Array<{ embedding: number[] }> }
      if (!json?.data?.length) {
        throw new Error('OpenAI response missing embedding data')
      }
      const vector = json.data[0].embedding
      if (!Array.isArray(vector) || !vector.length) {
        throw new Error('OpenAI embedding payload invalid')
      }
      const elapsed = Date.now() - started
      recordEmbeddingProvider({ ms: elapsed, ok: true, provider: 'openai', model, batch: Array.isArray(input) ? input.length : 1 })
      return toFloat32Array(vector)
    }

    const isRetriable = response.status === 429 || (response.status >= 500 && response.status < 600)
    const errorBody = await response.text()
    if (!isRetriable || attempt >= retries) {
      const err = new Error(`OpenAI embeddings failed (${response.status}): ${errorBody}`)
      const elapsed = Date.now() - started
      recordEmbeddingProvider({ ms: elapsed, ok: false, provider: 'openai', model, batch: Array.isArray(input) ? input.length : 1, error: err.message })
      throw err
    }
    await new Promise((resolve) => setTimeout(resolve, delay))
    delay = Math.min(delay * 2, 5000)
    attempt += 1
  }
}

function buildPhotoContext(photo: Prisma.PhotoGetPayload<{ include: { tags: { include: { tag: true } }; album: true } }>): string {
  const sections: string[] = []
  const tags = photo.tags?.map((t) => t.tag.name).filter(Boolean)
  if (tags?.length) {
    sections.push(`Tags: ${tags.join(', ')}`)
  }
  const exif = typeof photo.exifJson === 'object' && photo.exifJson !== null ? JSON.parse(JSON.stringify(photo.exifJson)) as Record<string, unknown> : null
  if (exif) {
    const camera = exif.Model || exif.CameraModelName || exif.Camera
    const lens = exif.LensModel || exif.Lens || exif.LensID
    const iso = exif.ISO || exif.Iso
    const exposure = exif.ExposureTime || exif.Exposure || exif.ShutterSpeedValue
    const aperture = exif.FNumber || exif.Aperture || exif.FStop
    const extra: string[] = []
    if (camera) extra.push(`Camera: ${camera}`)
    if (lens) extra.push(`Lens: ${lens}`)
    if (iso) extra.push(`ISO: ${iso}`)
    if (exposure) extra.push(`Exposure: ${exposure}`)
    if (aperture) extra.push(`Aperture: ${aperture}`)
    if (extra.length) sections.push(extra.join(', '))
  }
  if (photo.album?.title) {
    sections.push(`Album: ${photo.album.title}`)
  }
  if (photo.location && typeof photo.location === 'object') {
    sections.push(`Location metadata present`)
  }
  if (!sections.length) {
    sections.push('No additional metadata available; rely on tags and album names if any.')
  }
  return sections.join('\n')
}

function deterministicPhotoEmbedding(photo: Prisma.PhotoGetPayload<{ include: { tags: { include: { tag: true } }; album: true } }>, dim: number) {
  const seedParts = [
    photo.id,
    photo.hash ?? '',
    photo.contentHash ?? '',
    photo.album?.title ?? '',
    photo.albumId ?? '',
    photo.exifJson ? JSON.stringify(photo.exifJson).slice(0, 512) : '',
    ...photo.tags.map((t) => t.tag.name),
  ]
  return seededVector(seedParts, dim)
}

function deterministicQueryEmbedding(query: string, dim: number) {
  const cleanedTokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
  const seedParts = [query, ...cleanedTokens]
  return seededVector(seedParts, dim)
}

export async function generatePhotoEmbedding(photoId: string, opts?: { dim?: number; model?: string }): Promise<EmbeddingResult> {
  const cfg = getSemanticConfig()
  const dim = opts?.dim || cfg.dim || 768
  const model = opts?.model || cfg.model || 'deterministic-v1'
  const provider: SemanticProvider = (cfg.provider as SemanticProvider) || 'deterministic'

  const photo = await db.photo.findUnique({
    where: { id: photoId },
    include: {
      tags: { include: { tag: true } },
      album: true,
    },
  })
  if (!photo) {
    throw new Error('Photo not found')
  }

  if (provider === 'openai') {
    try {
      const prompt = `Photo metadata summary:
${buildPhotoContext(photo)}`
      const vector = await callOpenAIEmbedding(prompt, model, cfg.maxRetry)
      return { embedding: vector, model, provider }
    } catch (error) {
      if (cfg.strictMode) {
        throw error
      }
    }
  }

  const deterministicStart = Date.now()
  const fallbackVector = deterministicPhotoEmbedding(photo, dim)
  recordEmbeddingProvider({ ms: Date.now() - deterministicStart, ok: true, provider: provider === 'openai' ? 'deterministic' : provider, model, batch: 1 })
  return { embedding: fallbackVector, model, provider }
}

export async function generateQueryEmbedding(query: string, opts?: { dim?: number; model?: string }): Promise<EmbeddingResult> {
  const cfg = getSemanticConfig()
  const dim = opts?.dim || cfg.dim || 768
  const model = opts?.model || cfg.model || 'deterministic-v1'
  const provider: SemanticProvider = (cfg.provider as SemanticProvider) || 'deterministic'
  const cacheKey = `${provider}:${model}:${dim}:${query.trim().toLowerCase()}`

  if (cfg.queryCacheTtlMs > 0) {
    const cached = readQueryCache(cacheKey)
    if (cached) {
      recordQueryEmbeddingCache(true)
      return { embedding: normalize(cached), model, provider }
    }
  }

  let vector: Float32Array
  if (provider === 'openai') {
    try {
      vector = await callOpenAIEmbedding(query, model, cfg.maxRetry)
    } catch (error) {
      if (cfg.strictMode) {
        throw error
      }
      const deterministicStart = Date.now()
      vector = deterministicQueryEmbedding(query, dim)
      recordEmbeddingProvider({ ms: Date.now() - deterministicStart, ok: true, provider: 'deterministic', model, batch: 1 })
    }
  } else {
    const started = Date.now()
    vector = deterministicQueryEmbedding(query, dim)
    recordEmbeddingProvider({ ms: Date.now() - started, ok: true, provider, model, batch: 1 })
  }

  if (cfg.queryCacheTtlMs > 0) {
    cacheQueryEmbedding(cacheKey, vector, cfg.queryCacheTtlMs, Math.max(10, cfg.cacheSize))
    recordQueryEmbeddingCache(false)
  }

  return { embedding: vector, model, provider }
}
