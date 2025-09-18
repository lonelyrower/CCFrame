import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getClientIp, rateLimit, rateLimitHeaders } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

function applyHeaders(response: NextResponse, headers: Record<string, string>) {
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }
}

export async function GET(req: NextRequest) {
  const rateIdentity = getClientIp(req)
  const rate = await rateLimit(rateIdentity, 'upload:check', 60, 60)
  const headers = rateLimitHeaders(rate)

  if (!rate.allowed) {
    const response = NextResponse.json({ error: 'Too many duplicate checks' }, { status: 429 })
    applyHeaders(response, headers)
    return response
  }

  const url = new URL(req.url)
  const hash = url.searchParams.get('hash')?.trim().toLowerCase()
  if (!hash || hash.length < 16) {
    const response = NextResponse.json({ error: 'invalid hash' }, { status: 400 })
    applyHeaders(response, headers)
    return response
  }

  const photo = await db.photo.findFirst({
    where: { contentHash: hash, status: 'COMPLETED' },
    select: { id: true, width: true, height: true, blurhash: true }
  })

  const response = photo
    ? NextResponse.json({ existing: true, photo })
    : NextResponse.json({ existing: false })

  applyHeaders(response, headers)
  return response
}
