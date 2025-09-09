import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

function hexToBytes(hex: string): number[] {
  const clean = (hex || '').trim()
  const bytes: number[] = []
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.slice(i, i + 2), 16) || 0)
  }
  return bytes
}

function hamming(a: string, b: string): number {
  const ab = hexToBytes(a)
  const bb = hexToBytes(b)
  let dist = 0
  for (let i = 0; i < Math.min(ab.length, bb.length); i++) {
    let v = ab[i] ^ bb[i]
    // count bits
    while (v) { dist += v & 1; v >>= 1 }
  }
  return dist + Math.abs(ab.length - bb.length) * 8
}

class DSU {
  parent: number[]
  size: number[]
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i)
    this.size = Array.from({ length: n }, () => 1)
  }
  find(x: number): number { return this.parent[x] === x ? x : (this.parent[x] = this.find(this.parent[x])) }
  union(a: number, b: number) {
    a = this.find(a); b = this.find(b)
    if (a === b) return
    if (this.size[a] < this.size[b]) [a, b] = [b, a]
    this.parent[b] = a
    this.size[a] += this.size[b]
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '500', 10), 2000)
    const threshold = Math.min(Math.max(parseInt(url.searchParams.get('threshold') || '8', 10), 0), 64)

    const photos = await db.photo.findMany({
      where: { userId: session.user.id, status: 'COMPLETED' },
      select: { id: true, hash: true, width: true, height: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const n = photos.length
    const dsu = new DSU(n)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const ha = photos[i].hash
        const hb = photos[j].hash
        if (!ha || !hb) continue
        if (hamming(ha, hb) <= threshold) {
          dsu.union(i, j)
        }
      }
    }

    // Group by parent
    const groups: Record<number, number[]> = {}
    for (let i = 0; i < n; i++) {
      const p = dsu.find(i)
      if (!groups[p]) groups[p] = []
      groups[p].push(i)
    }

    const clusters = Object.values(groups)
      .filter(idx => idx.length > 1)
      .map(idxList => {
        const items = idxList.map(i => photos[i])
        // choose primary: largest area, then newest
        const primary = items.reduce((best, x) => {
          const area = (x.width || 0) * (x.height || 0)
          const bestArea = (best.width || 0) * (best.height || 0)
          if (area !== bestArea) return area > bestArea ? x : best
          return x.createdAt > best.createdAt ? x : best
        }, items[0])
        return {
          primaryId: primary.id,
          ids: items.map(x => x.id),
        }
      })

    return NextResponse.json({ clusters, total: photos.length, threshold })
  } catch (e) {
    console.error('Duplicate scan error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

