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
  // Hoist for error logging scope
  const { id: photoId } = params
  const reqVariant = params.variant === 'thumbnail' ? 'thumb' : params.variant
  let format = 'jpeg'
  try {
    const url = new URL(request.url)
    format = url.searchParams.get('format') || 'jpeg'

    console.log('Image API request:', { photoId, reqVariant, format })

    let photo
    try {
      photo = await db.photo.findUnique({
        where: { id: photoId },
        include: {
          // 包含全部变体，便于按尺寸与格式回退
          variants: true,
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
    let photoVariant = sizes
      .map((sz) => preferFormats.map((fmt) => photo.variants.find((v) => v.variant === sz && v.format === fmt)).find(Boolean))
      .find(Boolean)
    // Fallback: stream original file when variant not present yet
    if (!photoVariant) {
      console.log('Variant not found, fallback to original fileKey', {
        photoId,
        reqVariant,
        availableVariants: photo.variants.map(v => `${v.variant}.${v.format}`)
      })

      let storage
      try {
        storage = getStorageManager()
      } catch (storageError) {
        console.error('Storage manager initialization failed:', storageError)
        return NextResponse.json({ error: 'Storage service unavailable' }, { status: 503 })
      }

      try {
        const originalUrl = await storage.getPresignedDownloadUrl(photo.fileKey)
        const resp = await fetch(originalUrl)
        if (!resp.ok) {
          console.error('Original fetch failed:', { status: resp.status, statusText: resp.statusText })
          return NextResponse.json({ error: 'Failed to fetch original image' }, { status: 500 })
        }
        const arrayBuf = await resp.arrayBuffer()
        const buf = Buffer.from(arrayBuf)
        const contentType = resp.headers.get('content-type') || 'image/jpeg'
        const cacheHeader = photo.visibility === 'PUBLIC' ? 'public, max-age=86400, immutable' : 'private, max-age=3600'
        return new NextResponse(buf, {
          headers: {
            'Content-Type': contentType,
            'Content-Length': buf.length.toString(),
            'Cache-Control': cacheHeader,
          }
        })
      } catch (e) {
        console.error('Original stream failed:', e)
        return NextResponse.json({ error: 'Failed to stream original' }, { status: 500 })
      }
    }

    console.log('Using photo variant:', { variant: photoVariant.variant, format: photoVariant.format, fileKey: photoVariant.fileKey })

    // For PUBLIC photos, prefer redirect to signed URL to leverage edge/CDN caching
    let storage
    try {
      storage = getStorageManager()
    } catch (storageError) {
      console.error('Storage manager initialization failed:', storageError)
      return NextResponse.json({ error: 'Storage service unavailable' }, { status: 503 })
    }

    const downloadUrl = await storage.getPresignedDownloadUrl(photoVariant.fileKey)

    if (photo.visibility === 'PUBLIC') {
      const res = NextResponse.redirect(downloadUrl, { status: 302 })
      res.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      return res
    }

    // PRIVATE: stream via server
    const response = await fetch(downloadUrl)
    if (!response.ok) {
      console.error('Storage fetch failed:', { status: response.status, statusText: response.statusText })
      return NextResponse.json({ error: 'Failed to fetch image from storage' }, { status: 500 })
    }
    const buffer = Buffer.from(await response.arrayBuffer())
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': `image/${photoVariant.format}`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, max-age=3600',
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
