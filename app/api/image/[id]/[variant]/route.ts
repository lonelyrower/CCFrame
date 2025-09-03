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

    console.log('Image API request:', { photoId, reqVariant, format })

    let photo
    try {
      photo = await db.photo.findUnique({
        where: { id: photoId },
        include: {
          variants: {
            where: { variant: reqVariant },
          },
        },
      })
    } catch (dbError) {
      console.error('Database error in image API:', dbError)
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    if (!photo) {
      console.log('Photo not found:', photoId)
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    console.log('Found photo:', { id: photo.id, variants: photo.variants.length })

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
      console.log('Photo variant not found:', { photoId, reqVariant, availableVariants: photo.variants.map(v => `${v.variant}.${v.format}`) })
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    console.log('Using photo variant:', { variant: photoVariant.variant, format: photoVariant.format, fileKey: photoVariant.fileKey })

    let storage
    try {
      storage = getStorageManager()
    } catch (storageError) {
      console.error('Storage manager initialization failed:', storageError)
      return NextResponse.json({ error: 'Storage service unavailable' }, { status: 503 })
    }

    // Always stream via server to avoid exposing internal endpoints
    let downloadUrl
    try {
      downloadUrl = await storage.getPresignedDownloadUrl(photoVariant.fileKey)
      console.log('Generated download URL for:', photoVariant.fileKey)
    } catch (storageError) {
      console.error('Failed to generate download URL:', storageError)
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
    }

    let response
    try {
      response = await fetch(downloadUrl)
      if (!response.ok) {
        console.error('Storage fetch failed:', { status: response.status, statusText: response.statusText })
        return NextResponse.json({ error: 'Failed to fetch image from storage' }, { status: 500 })
      }
    } catch (fetchError) {
      console.error('Network error fetching from storage:', fetchError)
      return NextResponse.json({ error: 'Network error accessing storage' }, { status: 500 })
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    console.log('Successfully fetched image buffer:', { size: buffer.length })

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
    console.error('Image serve (compat) error:', {
      photoId,
      variant: reqVariant,
      format,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Return more detailed error in development
    const isDev = process.env.NODE_ENV === 'development'
    return NextResponse.json({ 
      error: isDev ? 
        `Image API error: ${error instanceof Error ? error.message : 'Unknown error'}` : 
        'Internal server error' 
    }, { status: 500 })
  }
}
