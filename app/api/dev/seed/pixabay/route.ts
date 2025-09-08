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
    const expectedToken = process.env.DEV_SEED_TOKEN || 'dev-seed-123'  // 默认token
    const allowInProd = token === expectedToken
    if (process.env.NODE_ENV === 'production' && !allowInProd) {
      return NextResponse.json({ 
        error: 'Forbidden in production - valid seed token required',
        hint: 'Make sure DEV_SEED_TOKEN is configured and x-seed-token header is provided'
      }, { status: 403 })
    }

    // Try to get API key from user's settings first, then fallback to environment variable
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    })

    let apiKey = (user as any)?.pixabayApiKey || process.env.PIXABAY_API_KEY
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Pixabay API Key 未设置。请在管理设置 > API 配置中配置您的 API Key，或者联系管理员设置环境变量。' 
      }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const query = (body.query as string) || 'nature'
    const count = Math.min(Number(body.count || 3), 5) // 降低默认数量避免超时
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
            // 临时唯一哈希占位，避免唯一索引冲突
            hash: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
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
