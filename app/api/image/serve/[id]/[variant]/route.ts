import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getStorageManager } from '@/lib/storage-manager'

interface Params {
  params: {
    id: string
    variant: string
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: photoId } = params
    // Support legacy alias "thumbnail" => "thumb"
    const variant = params.variant === 'thumbnail' ? 'thumb' : params.variant
    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'jpeg'

    // Get photo with variants
    const photo = await db.photo.findUnique({
      where: { id: photoId },
      include: {
        variants: {
          where: { variant },
        },
      },
    })

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Check if photo is private
    if (photo.visibility === 'PRIVATE') {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id || session.user.id !== photo.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Find requested variant with format and size fallback
    const preferFormats = [format, 'webp', 'jpeg', 'avif']
    const sizePreference: Record<string, string[]> = {
      thumb: ['thumb', 'small', 'medium', 'large'],
      small: ['small', 'medium', 'thumb', 'large'],
      medium: ['medium', 'small', 'large', 'thumb'],
      large: ['large', 'medium', 'small', 'thumb'],
    }
    const sizes = sizePreference[variant] || [variant, 'small', 'medium', 'large', 'thumb']
    const photoVariant = sizes
      .map((sz) => preferFormats.map((fmt) => photo.variants.find((v) => v.variant === sz && v.format === fmt)).find(Boolean))
      .find(Boolean) as typeof photo.variants[number] | undefined
    if (!photoVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    // Stream from storage for both public and private to avoid exposing internal endpoints
    const storage = getStorageManager()
    const downloadUrl = await storage.getPresignedDownloadUrl(photoVariant.fileKey)
    const response = await fetch(downloadUrl)
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 })
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    // Public images can be cached longer; private images cached briefly
    const cacheHeader = photo.visibility === 'PUBLIC'
      ? 'public, max-age=86400, immutable'
      : 'private, max-age=3600'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': `image/${photoVariant.format}`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': cacheHeader,
      }
    })
  } catch (error) {
    console.error('Image serve error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
