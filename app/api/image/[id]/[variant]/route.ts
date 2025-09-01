import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { StorageService } from '@/lib/storage'

type Params = { params: { id: string; variant: string } }

export async function GET(request: NextRequest, { params }: Params) {
  const { id, variant } = params
  const url = new URL(request.url)
  const format = (url.searchParams.get('format') || 'webp').toLowerCase()

  // Fetch photo with variants
  const photo = await db.photo.findUnique({
    where: { id },
    include: { variants: true }
  })

  if (!photo || photo.status !== 'COMPLETED') {
    return new Response('Not Found', { status: 404 })
  }

  // Visibility check
  if (photo.visibility === 'PRIVATE') {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.id !== photo.userId) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  // Find desired variant
  let selected = photo.variants.find(v => v.variant === variant && v.format.toLowerCase() === format)
  if (!selected) {
    // Fallback to any format with same variant
    selected = photo.variants.find(v => v.variant === variant)
  }
  if (!selected) {
    // Final fallback to medium/webp if exists
    selected = photo.variants.find(v => v.variant === 'medium' && v.format.toLowerCase() === 'webp')
  }

  if (!selected) {
    return new Response('Variant Not Found', { status: 404 })
  }

  // Stream from storage
  const signedUrl = await StorageService.getPresignedDownloadUrl(selected.fileKey)
  const upstream = await fetch(signedUrl)
  if (!upstream.ok || !upstream.body) {
    return new Response('Failed to fetch image', { status: 502 })
  }

  const headers = new Headers(upstream.headers)
  headers.set('Content-Type', `image/${selected.format}`)
  headers.delete('Set-Cookie')
  // Cache policy: public images can be cached long, private short
  if (photo.visibility === 'PUBLIC') {
    headers.set('Cache-Control', 'public, s-maxage=31536000, max-age=31536000, immutable')
  } else {
    headers.set('Cache-Control', 'private, max-age=60')
  }

  return new Response(upstream.body, { status: 200, headers })
}

