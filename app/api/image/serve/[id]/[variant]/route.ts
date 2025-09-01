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
    const { id: photoId, variant } = params
    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'jpeg'

    // Get photo with variants
    const photo = await db.photo.findUnique({
      where: { id: photoId },
      include: { 
        variants: {
          where: {
            variant,
            format
          }
        }
      }
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

    // Find requested variant
    const photoVariant = photo.variants.find(v => v.variant === variant && v.format === format)
    if (!photoVariant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }

    // For public photos, redirect to CDN
    const storage = getStorageManager()
    if (photo.visibility === 'PUBLIC') {
      const publicUrl = storage.getPublicUrl(photoVariant.fileKey)
      return NextResponse.redirect(publicUrl)
    }

    // For private photos, stream from S3 with signed URL
    const downloadUrl = await storage.getPresignedDownloadUrl(photoVariant.fileKey)
    const response = await fetch(downloadUrl)
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 })
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': `image/${format}`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'private, max-age=3600', // 1 hour for private images
      }
    })
  } catch (error) {
    console.error('Image serve error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
