import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import { getRuntimeConfig } from '@/lib/runtime-config'
import { db } from '@/lib/db'
import { getStorageManager } from '@/lib/storage-manager'
import { ImageProcessor } from '@/lib/image-processing'

const importSchema = z.object({
  count: z.number().min(1).max(100).default(20)
})

interface PixabayImage {
  id: number
  webformatURL: string
  largeImageURL: string
  tags: string
  user: string
  views: number
  downloads: number
  type: string
}

interface PixabayResponse {
  total: number
  totalHits: number
  hits: PixabayImage[]
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) return guard

  try {
    const body = await request.json()
    const { count } = importSchema.parse(body)

    // 获取 Pixabay 配置
    const runtime = getRuntimeConfig()
    const pixabayConfig = runtime.pixabay || {}

    if (!pixabayConfig.enabled || !pixabayConfig.apiKey) {
      return NextResponse.json(
        { error: 'Pixabay API 未配置或未启用' },
        { status: 400 }
      )
    }

    // 搜索词列表，用于获取多样化的图片
    const searchTerms = [
      'nature',
      'landscape',
      'architecture',
      'city',
      'travel',
      'flowers',
      'animals',
      'sunset',
      'mountains',
      'ocean',
      'forest',
      'abstract',
      'art',
      'technology',
      'business'
    ]

    const importedImages: any[] = []
    const perBatch = Math.ceil(count / 3) // 分批获取以增加多样性

    for (let batch = 0; batch < 3 && importedImages.length < count; batch++) {
      const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)]
      const page = Math.floor(Math.random() * 10) + 1 // 随机页面

      const pixabayUrl = new URL('https://pixabay.com/api/')
      pixabayUrl.searchParams.set('key', pixabayConfig.apiKey)
      pixabayUrl.searchParams.set('q', searchTerm)
      pixabayUrl.searchParams.set('image_type', 'photo')
      pixabayUrl.searchParams.set('orientation', 'all')
      pixabayUrl.searchParams.set('category', 'backgrounds,fashion,nature,science,education,feelings,health,people,religion,places,animals,industry,computer,food,sports,transportation,travel,buildings,business,music')
      pixabayUrl.searchParams.set('min_width', '1920')
      pixabayUrl.searchParams.set('min_height', '1080')
      pixabayUrl.searchParams.set('per_page', Math.min(perBatch, 20).toString())
      pixabayUrl.searchParams.set('page', page.toString())
      pixabayUrl.searchParams.set('safesearch', 'true')

      const response = await fetch(pixabayUrl.toString())
      if (!response.ok) {
        console.error('Pixabay API 请求失败:', response.statusText)
        continue
      }

      const data: PixabayResponse = await response.json()

      for (const image of data.hits) {
        if (importedImages.length >= count) break

        try {
          // 检查是否已存在（通过 external_id）
          const existingPhoto = await db.photo.findFirst({
            where: { externalId: `pixabay-${image.id}` }
          })

          if (existingPhoto) {
            console.log(`图片 ${image.id} 已存在，跳过`)
            continue
          }

          // 下载图片
          const imageResponse = await fetch(image.largeImageURL)
          if (!imageResponse.ok) continue

          const imageArrayBuffer = await imageResponse.arrayBuffer()
          const storage = getStorageManager()

          // 生成唯一文件名
          const fileName = `pixabay-${image.id}-${Date.now()}.jpg`

          // 处理图片获取元数据和变体
          const imageBuffer = Buffer.from(imageArrayBuffer)
          const processed = await ImageProcessor.processImage(imageBuffer)

          // 计算内容哈希
          const contentHash = await ImageProcessor.calculateContentHash(imageBuffer)

          // 上传原始图片和变体
          await storage.uploadFromBuffer(`photos/${fileName}`, imageBuffer)

          // 上传所有变体
          for (const variant of processed.variants) {
            const variantPath = `photos/variants/${fileName.replace('.jpg', '')}_${variant.variant}.${variant.format}`
            await storage.uploadFromBuffer(variantPath, variant.buffer)
          }

          // 处理标签
          const tags = image.tags
            .split(',')
            .map(tag => tag.trim().toLowerCase())
            .filter(tag => tag.length > 0)
            .slice(0, 10) // 限制标签数量

          // 创建照片记录
          const photo = await db.photo.create({
            data: {
              id: `pixabay-${image.id}-${Date.now()}`,
              fileName,
              originalName: `pixabay-${image.id}.jpg`,
              mimeType: 'image/jpeg',
              size: imageBuffer.length,
              width: processed.metadata.width || null,
              height: processed.metadata.height || null,
              hash: contentHash,
              blurHash: processed.blurhash,
              takenAt: new Date(),
              uploadedAt: new Date(),
              isPublic: true,
              externalId: `pixabay-${image.id}`,
              metadata: {
                source: 'pixabay',
                author: image.user,
                views: image.views,
                downloads: image.downloads,
                originalUrl: image.webformatURL,
                variants: processed.variants.map(v => ({
                  variant: v.variant,
                  format: v.format,
                  width: v.width,
                  height: v.height,
                  size: v.size
                }))
              }
            }
          })

          // 创建标签关联
          for (const tagName of tags) {
            try {
              // 使用 upsert 创建或获取标签
              const tag = await db.tag.upsert({
                where: { name: tagName },
                update: {},
                create: { name: tagName }
              })

              // 创建照片标签关联
              await db.photoTag.create({
                data: {
                  photoId: photo.id,
                  tagId: tag.id
                }
              })
            } catch (tagError) {
              // 忽略标签创建错误，继续处理
              console.error(`创建标签失败: ${tagName}`, tagError)
            }
          }

          importedImages.push({
            id: photo.id,
            fileName: photo.fileName,
            tags: tags.length
          })

        } catch (imageError) {
          console.error(`处理图片 ${image.id} 失败:`, imageError)
          continue
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported: importedImages.length,
      images: importedImages
    })

  } catch (error) {
    console.error('Pixabay 导入失败:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '请求参数错误', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : '导入失败' },
      { status: 500 }
    )
  }
}