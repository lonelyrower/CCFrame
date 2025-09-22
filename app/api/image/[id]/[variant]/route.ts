import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getStorageManager } from '@/lib/storage-manager'
import { getLocalStorageManager } from '@/lib/local-storage'
import { Readable } from 'stream'
import type { ReadableStream as WebReadableStream } from 'stream/web'

interface Params {
  params: {
    id: string
    variant: string
  }
}

const MIME_BY_EXT: Record<string, string> = {
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.heic': 'image/heic',
}

function inferContentTypeFromKey(key: string, fallback: string) {
  const ext = key ? key.substring(key.lastIndexOf('.')).toLowerCase() : ''
  return MIME_BY_EXT[ext] || fallback
}

function formatError(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function toResponse(stream: Readable, contentType: string, cacheHeader: string, contentLength?: number) {
  const headers = new Headers({
    'Content-Type': contentType,
    'Cache-Control': cacheHeader,
  })
  if (typeof contentLength === 'number') {
    headers.set('Content-Length', contentLength.toString())
  }
  const webStream = Readable.toWeb(stream) as unknown as WebReadableStream<Uint8Array>
  return new NextResponse(webStream as ReadableStream<Uint8Array>, { headers })
}

async function tryLocalStream(key: string, cacheHeader: string, contentType: string) {
  try {
    const local = getLocalStorageManager()
    const { stream, contentLength, contentType: localType } = await local.streamObject(key)
    return toResponse(stream, localType || contentType, cacheHeader, contentLength)
  } catch {
    return null
  }
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: Params) {
  const { id: photoId } = params
  const reqVariant = params.variant === 'thumbnail' ? 'thumb' : params.variant
  const url = new URL(request.url)
  const requestedFormat = (url.searchParams.get('format') || 'jpeg').toLowerCase()

  try {
    const photo = await db.photo.findUnique({
      where: { id: photoId },
      include: { variants: true },
    })

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    if (photo.visibility === 'PRIVATE') {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id || session.user.id !== photo.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const storage = getStorageManager()
    const cacheHeaderPublic = 'public, max-age=31536000, immutable'
    const cacheHeaderPrivate = 'private, max-age=3600'
    const cacheHeader = photo.visibility === 'PUBLIC' ? cacheHeaderPublic : cacheHeaderPrivate

    const sizePreference: Record<string, string[]> = {
      thumb: ['thumb', 'small', 'medium', 'large'],
      small: ['small', 'medium', 'thumb', 'large'],
      medium: ['medium', 'small', 'large', 'thumb'],
      large: ['large', 'medium', 'small', 'thumb'],
      zoom: ['original', 'xlarge', 'large', 'medium', 'small'],
    }
    const sizes = sizePreference[reqVariant] || [reqVariant, 'small', 'medium', 'large', 'thumb']
    const preferFormats = reqVariant === 'zoom' ? ['jpeg', 'webp', requestedFormat, 'avif'] : [requestedFormat, 'webp', 'jpeg', 'avif']

    const chooseVariant = () => {
      for (const size of sizes) {
        for (const fmt of preferFormats) {
          const match = photo.variants.find((v) => v.variant === size && v.format === fmt)
          if (match) return match
        }
      }
      return null
    }

    const variant = chooseVariant()

    const streamVariant = async (key: string, contentType: string) => {
      const localResponse = await tryLocalStream(key, cacheHeader, contentType)
      if (localResponse) return localResponse
      const { stream, contentLength, contentType: storeType } = await storage.streamObject(key)
      return toResponse(stream, storeType || contentType, cacheHeader, contentLength)
    }

    if (variant) {
      try {
        return await streamVariant(variant.fileKey, `image/${variant.format}`)
      } catch (variantErr) {
        console.warn(`Variant stream failed for ${photoId} (${variant.variant}/${variant.format}): ${formatError(variantErr)}`)
      }
    }

    try {
      const fallbackContentType = inferContentTypeFromKey(photo.fileKey, `image/${requestedFormat}`)
      return await streamVariant(photo.fileKey, fallbackContentType)
    } catch (origErr) {
      console.error(`Failed to stream original image for ${photoId}: ${formatError(origErr)}`)
      return NextResponse.json({ error: 'Failed to stream image' }, { status: 500 })
    }
  } catch (error) {
    console.error(`Image route error for ${photoId}: ${formatError(error)}`)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
