import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import fs from 'fs/promises'
import path from 'path'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const storageSettingsSchema = z.object({
  provider: z.enum(['minio', 'aws', 'aliyun', 'qcloud']),
  config: z.object({
    endpoint: z.string().optional(),
    region: z.string(),
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
    bucket: z.string(),
    cdnUrl: z.string().optional()
  })
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 读取当前存储设置
    const currentProvider = process.env.STORAGE_PROVIDER || 'minio'
    
    const settings = {
      currentProvider,
      providers: [
        {
          id: 'minio',
          name: 'MinIO (本地存储)',
          description: '存储在本地VPS上，完全控制数据',
          icon: '🏠',
          pros: ['无外部费用', '数据安全', '访问速度快'],
          cons: ['存储空间有限', '需要自己备份']
        },
        {
          id: 'aws',
          name: 'Amazon S3',
          description: 'AWS云存储服务，全球CDN加速',
          icon: '☁️',
          pros: ['无限扩展', '全球加速', '专业备份'],
          cons: ['按量付费', '依赖外部服务']
        },
        {
          id: 'aliyun',
          name: '阿里云 OSS',
          description: '阿里云对象存储，国内访问优化',
          icon: '🔶',
          pros: ['国内速度快', '价格合理', '中文支持'],
          cons: ['需要备案', '按量付费']
        },
        {
          id: 'qcloud',
          name: '腾讯云 COS',
          description: '腾讯云对象存储，性价比高',
          icon: '🔷',
          pros: ['价格便宜', '功能完善', '国内优化'],
          cons: ['需要备案', '按量付费']
        }
      ]
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to get storage settings:', error)
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { provider, config } = storageSettingsSchema.parse(body)

    // 测试存储连接
    try {
      const { StorageManager } = await import('@/lib/storage-manager')
      const testManager = new StorageManager({
        provider,
        ...config,
        forcePathStyle: provider === 'minio'
      })

      // 尝试上传一个测试文件
      const testBuffer = Buffer.from('test')
      const testKey = `test/${Date.now()}.txt`
      await testManager.uploadBuffer(testKey, testBuffer, 'text/plain')
      
      // 删除测试文件
      await testManager.deleteObject(testKey)
    } catch (testError) {
      return NextResponse.json({
        error: '存储配置测试失败，请检查配置参数',
        details: testError instanceof Error ? testError.message : '未知错误'
      }, { status: 400 })
    }

    // 保存配置到环境文件（在实际部署中，这应该保存到数据库）
    // 同步命名到应用实际读取的变量
    const envPath = path.join(process.cwd(), '.env.local')

    let envLines: string[] = []
    envLines.push(`STORAGE_PROVIDER=${provider}`)

    if (provider === 'minio') {
      // 应用读取通用 S3_* 变量；MinIO 凭证也可用 MINIO_ROOT_*，但此处以 S3_* 为准
      envLines.push(`S3_ENDPOINT=${config.endpoint || ''}`)
      envLines.push(`S3_REGION=${config.region}`)
      envLines.push(`S3_ACCESS_KEY_ID=${config.accessKeyId}`)
      envLines.push(`S3_SECRET_ACCESS_KEY=${config.secretAccessKey}`)
      envLines.push(`S3_BUCKET_NAME=${config.bucket}`)
      if (config.cdnUrl) envLines.push(`CDN_BASE_URL=${config.cdnUrl}`)
    } else if (provider === 'aws') {
      // 与 storage-manager 期望的 AWS_* 命名对齐
      envLines.push(`AWS_REGION=${config.region}`)
      envLines.push(`AWS_ACCESS_KEY_ID=${config.accessKeyId}`)
      envLines.push(`AWS_SECRET_ACCESS_KEY=${config.secretAccessKey}`)
      envLines.push(`AWS_S3_BUCKET=${config.bucket}`)
      if (config.cdnUrl) envLines.push(`AWS_CLOUDFRONT_URL=${config.cdnUrl}`)
    } else if (provider === 'aliyun') {
      envLines.push(`ALIYUN_REGION=${config.region}`)
      envLines.push(`ALIYUN_ACCESS_KEY_ID=${config.accessKeyId}`)
      envLines.push(`ALIYUN_SECRET_ACCESS_KEY=${config.secretAccessKey}`)
      envLines.push(`ALIYUN_OSS_BUCKET=${config.bucket}`)
      if (config.cdnUrl) envLines.push(`ALIYUN_CDN_URL=${config.cdnUrl}`)
    } else if (provider === 'qcloud') {
      envLines.push(`QCLOUD_REGION=${config.region}`)
      envLines.push(`QCLOUD_SECRET_ID=${config.accessKeyId}`)
      envLines.push(`QCLOUD_SECRET_KEY=${config.secretAccessKey}`)
      envLines.push(`QCLOUD_COS_BUCKET=${config.bucket}`)
      if (config.cdnUrl) envLines.push(`QCLOUD_CDN_URL=${config.cdnUrl}`)
    }

    envLines.push('')
    await fs.writeFile(envPath, envLines.join('\n'))

    return NextResponse.json({ 
      success: true,
      message: '存储设置已保存，重启服务后生效'
    })
  } catch (error) {
    console.error('Failed to update storage settings:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
