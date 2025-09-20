import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

// Enhanced lightweight search endpoint.
// Supports filtering by:
//  - q: generic keyword (matches tag names OR any exifJson substring)
//  - camera: camera model substring (case-insensitive) matched via exifJson AND parsed EXIF fields validation
//  - lens: lens model substring (case-insensitive) matched via exifJson AND parsed EXIF fields validation
//  - limit: max items (default 30, max 100)
// Strategy:
// 1. Perform two limited queries (tags + exif) with basic substring filters so DB prunes rows early.
// 2. For exif matches, parse exifJson and verify camera / lens constraints against common EXIF keys to reduce false positives.
// 3. Merge & rank (tag hits score 2, exif-only score 1). Apply camera/lens re-validation post-merge.
// NOTE: Schema lacks dedicated camera/lens columns; this is an interim implementation until structured columns or FTS.

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const camera = (searchParams.get('camera') || '').trim()
  const lens = (searchParams.get('lens') || '').trim()
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '30', 10))

  if (!q && !camera && !lens) {
    return NextResponse.json({ ok: true, count: 0, items: [], query: { q, camera, lens } })
  }

  const half = Math.max(1, Math.ceil(limit / 2))

  // Build shared AND conditions for camera/lens basic substring (DB-level narrowing)
  const exifAnd: any[] = []
  if (camera) exifAnd.push({ exifJson: { contains: camera } })
  if (lens) exifAnd.push({ exifJson: { contains: lens } })

  // Tag query (only if q provided)
  const tagWhere: any = {
    status: 'COMPLETED',
  }
  if (q) {
    tagWhere.tags = { some: { tag: { name: { contains: q } } } }
  }
  if (exifAnd.length) {
    // Even for tagMatches we enforce camera/lens constraints to ensure intersection semantics
    tagWhere.AND = exifAnd
  }

  const tagPromise = (q || exifAnd.length)
    ? db.photo.findMany({
        where: tagWhere,
        select: { id: true, blurhash: true, width: true, height: true, exifJson: true },
        take: half
      })
    : Promise.resolve([])

  // EXIF query (q OR camera/lens). We widen exifJson contains with q (if present)
  const exifWhere: any = { status: 'COMPLETED' }
  const exifConditions: any[] = []
  if (q) exifConditions.push({ exifJson: { contains: q } })
  exifAnd.forEach(c => exifConditions.push(c))
  if (exifConditions.length) exifWhere.AND = exifConditions

  const exifPromise = exifConditions.length
    ? db.photo.findMany({
        where: exifWhere,
        select: { id: true, blurhash: true, width: true, height: true, exifJson: true },
        take: half
      })
    : Promise.resolve([])

  const [tagMatchesRaw, exifMatchesRaw] = await Promise.all([tagPromise, exifPromise])

  // Helper to parse EXIF and validate camera/lens precisely
  const camNeed = camera.toLowerCase()
  const lensNeed = lens.toLowerCase()
  function exifPass(exifJson?: Prisma.JsonValue | null) {
    if ((!camNeed && !lensNeed) || !exifJson) return true
    let ex: any = null
    try {
      if (typeof exifJson === 'string') {
        ex = JSON.parse(exifJson)
      } else if (typeof exifJson === 'object') {
        ex = JSON.parse(JSON.stringify(exifJson))
      }
      if (!ex || typeof ex !== 'object') return true
      const candidates: string[] = []
      const cameraKeys = ['Model','model','CameraModelName','Camera','MakeModel','BodySerialNumber']
      const lensKeys = ['LensModel','lensModel','Lens','LensID','LensSerialNumber']
      if (camNeed) {
        for (const k of cameraKeys) if (typeof ex[k] === 'string') candidates.push(String(ex[k]))
        const camHit = candidates.some(v => v.toLowerCase().includes(camNeed))
        if (!camHit) return false
      }
      if (lensNeed) {
        const lensValues: string[] = []
        for (const k of lensKeys) if (typeof ex[k] === 'string') lensValues.push(String(ex[k]))
        const lensHit = lensValues.some(v => v.toLowerCase().includes(lensNeed))
        if (!lensHit) return false
      }
      return true
    } catch {
      // Fallback: rely on raw substring filter already applied; accept to avoid over-filtering
      return true
    }
  }

  // Filter / sanitize / score
  const map = new Map<string, any>()
  for (const p of exifMatchesRaw) {
    if (!exifPass(p.exifJson)) continue
    const { exifJson, ...rest } = p
    map.set(p.id, { ...rest, score: 1 })
  }
  for (const p of tagMatchesRaw) {
    if (!exifPass(p.exifJson)) continue
    const existing = map.get(p.id)
    const { exifJson, ...rest } = p
    if (existing) {
      existing.score = Math.max(existing.score, 2)
    } else {
      map.set(p.id, { ...rest, score: 2 })
    }
  }

  const merged = Array.from(map.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return NextResponse.json({ ok: true, count: merged.length, items: merged, query: { q, camera, lens } })
}
