import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getStorageManager, StorageManager } from '@/lib/storage-manager'
import { AIImageProcessor } from '@/lib/ai-providers'
import { z } from 'zod'

const enhanceRequestSchema = z.object({
  photoId: z.string(),
  taskType: z.enum(['enhance', 'upscale', 'remove-background', 'style-transfer']),
  params: z.record(z.any()).optional().default({}),
  provider: z.enum(['gemini', 'openai']).optional().default('gemini')
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { photoId, taskType, params, provider } = enhanceRequestSchema.parse(body)

    // 检查照片是否存在且属于当前用户
    const photo = await db.photo.findFirst({
      where: {
        id: photoId,
        userId: session.user.id,
        status: 'COMPLETED'
      }
    })

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // 创建AI处理任务
    const job = await db.job.create({
      data: {
        type: `AI_${taskType.toUpperCase()}`,
        payloadJson: {
          photoId,
          taskType,
          params,
          provider
        } as any,
        userId: session.user.id,
        status: 'PENDING'
      }
    })

    // 异步处理AI任务
    processAITask(job.id, photo, taskType, params, provider).catch(error => {
      console.error('AI task processing failed:', error)
      // 更新任务状态为失败
      db.job.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          errorMsg: error.message
        }
      }).catch(console.error)
    })

    return NextResponse.json({
      jobId: job.id,
      status: 'PENDING',
      message: 'AI enhancement task started'
    })
  } catch (error) {
    console.error('AI enhance error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processAITask(
  jobId: string,
  photo: any,
  taskType: string,
  params: Record<string, any>,
  provider: 'gemini' | 'openai'
) {
  const storageManager = getStorageManager()

  try {
    // 更新任务状态为运行中
    await db.job.update({
      where: { id: jobId },
      data: { status: 'RUNNING', progress: 10 }
    })

    // 下载原图
    const originalUrl = await storageManager.getPresignedDownloadUrl(photo.fileKey)
    const response = await fetch(originalUrl)
    const originalBuffer = Buffer.from(await response.arrayBuffer())

    // 更新进度
    await db.job.update({
      where: { id: jobId },
      data: { progress: 30 }
    })

    // 使用AI处理图片
    const enhancedBuffer = await AIImageProcessor.processImage(
      originalBuffer,
      taskType,
      params,
      provider
    )

    // 更新进度
    await db.job.update({
      where: { id: jobId },
      data: { progress: 70 }
    })

    // 保存处理后的图片
    const enhancedKey = StorageManager.generateKey(
      'enhanced',
      `${photo.id}_${taskType}_${Date.now()}.jpg`
    )
    
    await storageManager.uploadBuffer(enhancedKey, enhancedBuffer, 'image/jpeg')

    // 创建EditVersion记录
    const editVersion = await db.editVersion.create({
      data: {
        photoId: photo.id,
        name: getVersionName(taskType, params),
        fileKey: enhancedKey,
        params: JSON.stringify({ taskType, params, provider })
      }
    })

    // 更新任务完成
    await db.job.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        resultJson: {
          editVersionId: editVersion.id,
          enhancedKey,
          taskType,
          params
        } as any
      }
    })

  } catch (error) {
    console.error('AI processing error:', error)
    
    await db.job.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errorMsg: error instanceof Error ? error.message : 'Unknown error'
      }
    })
    
    throw error
  }
}

function getVersionName(taskType: string, params: Record<string, any>): string {
  switch (taskType) {
    case 'enhance':
      return 'AI增强'
    case 'upscale':
      return `AI放大 ${params.scale || 2}x`
    case 'remove-background':
      return 'AI去背景'
    case 'style-transfer':
      return `AI风格转换 - ${params.style || '艺术风格'}`
    default:
      return 'AI处理'
  }
}

// 获取AI任务状态
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    const job = await db.job.findFirst({
      where: {
        id: jobId,
        userId: session.user.id
      }
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      result: job.resultJson,
      error: job.errorMsg,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    })
  } catch (error) {
    console.error('Get AI job status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
