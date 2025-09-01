import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getStorageManager, StorageManager } from '@/lib/storage-manager'
import { ImageProcessor } from '@/lib/image-processing'
import { ExifProcessor } from '@/lib/exif'

const MAX_COUNT = 20

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Restrict to dev or require token
    const token = request.headers.get('x-seed-token') || ''
    const allowInProd = process.env.DEV_SEED_TOKEN && token === process.env.DEV_SEED_TOKEN
    if (process.env.NODE_ENV === 'production' && !allowInProd) {
      return NextResponse.json({ error: 'Forbidden in production' }, { status: 403 })
    }

    const apiKey = process.env.PIXABAY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'PIXABAY_API_KEY is not set' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const query = (body.query as string) || 'nature'
    const count = Math.min(Number(body.count || 12), MAX_COUNT)
    const visibility = (body.visibility as 'PUBLIC' | 'PRIVATE') || 'PUBLIC'

    const searchUrl = new URL('https://pixabay.com/api/')
    searchUrl.searchParams.set('key', apiKey)
    searchUrl.searchParams.set('q', query)
    searchUrl.searchParams.set('image_type', 'photo')
    searchUrl.searchParams.set('per_page', String(count))
    searchUrl.searchParams.set('safesearch', 'true')

    const res = await fetch(searchUrl.toString())
    if (!res.ok) {
      return NextResponse.json({ error: `Pixabay error: ${res.statusText}` }, { status: 502 })
    }
    const data = await res.json()
    const hits: any[] = data.hits || []
    if (hits.length === 0) {
      return NextResponse.json({ seeded: 0 })
    }

    const storage = getStorageManager()

    let seeded = 0
    for (const hit of hits) {
      try {
        const imageUrl: string = hit.largeImageURL || hit.webformatURL || hit.previewURL
        if (!imageUrl) continue

        // Download image
        const imgResp = await fetch(imageUrl)
        if (!imgResp.ok) continue
        const buffer = Buffer.from(await imgResp.arrayBuffer())

        // Generate file key for original
        const ext = imageUrl.split('.').pop()?.split('?')[0] || 'jpg'
        const originalKey = StorageManager.generateKey('originals', `pixabay_${Date.now()}.${ext}`)
        await storage.uploadBuffer(originalKey, buffer, `image/${ext === 'jpg' ? 'jpeg' : ext}`)

        // Create photo record (placeholder)
        const photo = await db.photo.create({
          data: {
            fileKey: originalKey,
            hash: '',
            width: 0,
            height: 0,
            userId: session.user.id,
            albumId: null,
            status: 'PROCESSING',
            visibility,
          },
        })

        // Process image (variants, exif, blurhash)
        const exifData = await ExifProcessor.extractExif(buffer)
        const { variants, blurhash, metadata } = await ImageProcessor.processImage(buffer)

        // Upload variants
        const variantRecords: any[] = []
        for (const v of variants) {
          const variantKey = `variants/${photo.id}/${v.variant}.${v.format}`
          await storage.uploadBuffer(variantKey, v.buffer, `image/${v.format}`)
          variantRecords.push({
            variant: v.variant,
            format: v.format,
            width: v.width,
            height: v.height,
            fileKey: variantKey,
            sizeBytes: v.size,
          })
        }

        // Update photo
        await db.photo.update({
          where: { id: photo.id },
          data: {
            hash: await ImageProcessor.calculateHash(buffer),
            width: metadata.width || 0,
            height: metadata.height || 0,
            blurhash,
            exifJson: exifData ? JSON.parse(JSON.stringify(exifData)) : undefined,
            takenAt: exifData?.takenAt,
            location: exifData?.location ? JSON.parse(JSON.stringify(exifData.location)) : undefined,
            status: 'COMPLETED',
            variants: { createMany: { data: variantRecords } },
          },
        })

        seeded += 1
      } catch (e) {
        console.error('Seed one image failed:', e)
      }
    }

    return NextResponse.json({ seeded })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

