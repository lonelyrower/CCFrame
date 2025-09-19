import { db } from '@/lib/db'
import { getSemanticConfig } from '@/lib/semantic-config'

export const DEFAULT_EMBEDDING_DIM = 768

export interface PhotoEmbeddingRecord {
  photoId: string
  embedding: Float32Array
  dim: number
  model: string
  provider: string
  updatedAt: Date
}

function normalizeVector(input: Float32Array): Float32Array {
  let sumSquares = 0
  for (let i = 0; i < input.length; i++) {
    sumSquares += input[i] * input[i]
  }
  if (sumSquares <= 0) {
    const dim = input.length
    const fallback = 1 / Math.sqrt(dim || 1)
    input.fill(fallback)
    return input
  }
  const norm = Math.sqrt(sumSquares)
  for (let i = 0; i < input.length; i++) {
    input[i] = input[i] / norm
  }
  return input
}

function toFloat32Array(vector: Float32Array | number[]): Float32Array {
  if (vector instanceof Float32Array) {
    return new Float32Array(vector)
  }
  return new Float32Array(vector)
}

function floatArrayToBuffer(array: Float32Array): Buffer {
  const buffer = Buffer.allocUnsafe(array.length * 4)
  for (let i = 0; i < array.length; i++) {
    buffer.writeFloatLE(array[i], i * 4)
  }
  return buffer
}

function bufferToFloatArray(buffer: Buffer, dim: number): Float32Array {
  const view = new Float32Array(dim)
  for (let i = 0; i < dim; i++) {
    view[i] = buffer.readFloatLE(i * 4)
  }
  return view
}

export async function savePhotoEmbedding(
  photoId: string,
  embedding: Float32Array | number[],
  opts?: { model?: string; provider?: string; dim?: number }
) {
  const cfg = getSemanticConfig()
  const dim = opts?.dim ?? embedding.length ?? cfg.dim ?? DEFAULT_EMBEDDING_DIM
  const vector = normalizeVector(toFloat32Array(embedding))
  if (vector.length !== dim) {
    throw new Error(`Embedding dimension mismatch: expected ${dim}, got ${vector.length}`)
  }

  const payload = floatArrayToBuffer(vector)
  const model = opts?.model || cfg.model || 'deterministic-v1'
  const provider = opts?.provider || cfg.provider || 'deterministic'

  await db.photoEmbedding.upsert({
    where: { photoId },
    create: {
      photoId,
      embedding: payload,
      dim,
      model,
      provider,
    },
    update: {
      embedding: payload,
      dim,
      model,
      provider,
    },
  })
}

export async function getPhotoEmbedding(photoId: string): Promise<PhotoEmbeddingRecord | null> {
  const row = await db.photoEmbedding.findUnique({
    where: { photoId },
    select: { photoId: true, embedding: true, dim: true, model: true, provider: true, updatedAt: true },
  })
  if (!row) return null
  const vector = bufferToFloatArray(Buffer.from(row.embedding), row.dim)
  return {
    photoId: row.photoId,
    embedding: normalizeVector(vector),
    dim: row.dim,
    model: row.model,
    provider: row.provider,
    updatedAt: row.updatedAt,
  }
}

export async function listSearchableEmbeddings(): Promise<PhotoEmbeddingRecord[]> {
  const rows = await db.photoEmbedding.findMany({
    where: {
      photo: {
        status: 'COMPLETED',
        visibility: 'PUBLIC',
      },
    },
    select: {
      photoId: true,
      embedding: true,
      dim: true,
      model: true,
      provider: true,
      updatedAt: true,
    },
  })
  return rows.map((row) => ({
    photoId: row.photoId,
    embedding: normalizeVector(bufferToFloatArray(Buffer.from(row.embedding), row.dim)),
    dim: row.dim,
    model: row.model,
    provider: row.provider,
    updatedAt: row.updatedAt,
  }))
}

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error('Dimension mismatch for cosine similarity')
  }
  let dot = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
  }
  return dot
}

export function serializeEmbedding(vector: Float32Array): number[] {
  return Array.from(vector)
}

export function deserializeEmbedding(values: number[]): Float32Array {
  return normalizeVector(new Float32Array(values))
}
