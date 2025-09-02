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

// This route serves images by streaming from storage for both PUBLIC and PRIVATE
// photos. It avoids redirecting clients to the storage endpoint (e.g., MinIO),
// which may not be resolvable from the user's network/environment.
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: photoId } = params
    // Support legacy alias "thumbnail" => "thumb"
    const reqVariant = params.variant === 'thumbnail' ? 'thumb' : params.variant
    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'jpeg'

    const photo = await db.photo.findUnique({
      where: { id: photoId },
      include: {
        variants: {
          where: { variant: reqVariant },
        },
      },
    })

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Enforce access for private photos
    if (photo.visibility === 'PRIVATE') {
      const session = await getServerSession(authOptions)
      if (!session?.user?.id || session.user.id !== photo.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Find exact or fallback format/size
    const preferFormats = [format, 'webp', 'jpeg', 'avif']
    const sizePreference: Record<string, string[]> = {
      thumb: ['thumb', 'small', 'medium', 'large'],
      small: ['small', 'medium', 'thumb', 'large'],
      medium: ['medium', 'small', 'large', 'thumb'],
      large: ['large', 'medium', 'small', 'thumb'],
    }
    const sizes = sizePreference[reqVariant] || [reqVariant, 'small', 'medium', 'large', 'thumb']
    const photoVariant = sizes
      .map((sz) => preferFormats.map((fmt) => photo.variants.find((v) => v.variant === sz && v.format === fmt)).find(Boolean))
      .find(Boolean)
    if (!photoVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    const storage = getStorageManager()

    // Always stream via server to avoid exposing internal endpoints
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
      },
    })
  } catch (error) {
    console.error('Image serve (compat) error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
