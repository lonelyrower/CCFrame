import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSemanticConfig } from '@/lib/semantic-config'
import { generateQueryEmbedding } from '@/lib/embedding-provider'
import { listSearchableEmbeddings, cosineSimilarity } from '@/lib/embeddings'
import { recordSemanticApi } from '@/lib/metrics'

export const dynamic = 'force-dynamic'

interface SemanticRequestBody {
  query: string
  limit?: number
}

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 })
}

export async function POST(request: NextRequest) {
  const started = Date.now()
  const cfg = getSemanticConfig()
  if (!cfg.enabled) {
    return badRequest('Semantic search is disabled')
  }

  let body: SemanticRequestBody
  try {
    body = await request.json()
  } catch {
    return badRequest('Invalid JSON payload')
  }

  const query = (body.query || '').trim()
  if (!query) {
    return badRequest('Missing query')
  }

  const limit = Math.min(50, Math.max(1, body.limit ?? 12))

  try {
    const { embedding: queryEmbedding, model } = await generateQueryEmbedding(query, { dim: cfg.dim })
    const candidates = await listSearchableEmbeddings()

    if (!candidates.length) {
      const elapsed = Date.now() - started
      recordSemanticApi({ ms: elapsed, cached: false })
      return NextResponse.json({ ok: true, items: [], count: 0, tookMs: elapsed, model })
    }

    const scored: Array<{ photoId: string; score: number }> = []
    for (const row of candidates) {
      if (row.dim !== queryEmbedding.length) continue
      const score = cosineSimilarity(queryEmbedding, row.embedding)
      scored.push({ photoId: row.photoId, score })
    }

    scored.sort((a, b) => b.score - a.score)
    const top = scored.slice(0, limit)
    const ids = top.map((entry) => entry.photoId)

    const photos = ids.length
      ? await db.photo.findMany({
          where: { id: { in: ids }, visibility: 'PUBLIC', status: 'COMPLETED' },
          select: { id: true, width: true, height: true, blurhash: true, createdAt: true },
        })
      : []

    const photoMap = new Map(photos.map((p) => [p.id, p]))
    const items = top
      .map((entry) => {
        const photo = photoMap.get(entry.photoId)
        if (!photo) return null
        return {
          photoId: entry.photoId,
          similarity: Number(entry.score.toFixed(4)),
          width: photo.width,
          height: photo.height,
          blurhash: photo.blurhash,
          createdAt: photo.createdAt?.toISOString?.() ?? null,
          imageUrl: `/api/image/${entry.photoId}/small?format=webp`,
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))

    const elapsed = Date.now() - started
    recordSemanticApi({ ms: elapsed, cached: false })

    return NextResponse.json({ ok: true, items, count: items.length, tookMs: elapsed, model })
  } catch (error) {
    const elapsed = Date.now() - started
    recordSemanticApi({ ms: elapsed, cached: false })
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'Use POST' }, { status: 405 })
}
