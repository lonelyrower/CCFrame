import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    // 获取用户的API Key设置
    const user = await db.user.findUnique({
      where: { id: guard.adminUserId },
      select: { id: true, pixabayApiKey: true },
    })

    // 检查API Key的优先级：数据库 > 环境变量
    const dbApiKey = (user as any)?.pixabayApiKey
    const envApiKey = process.env.PIXABAY_API_KEY
    const finalApiKey = dbApiKey || envApiKey

    // 获取关键配置信息（不暴露敏感数据）
    const config = {
      NODE_ENV: process.env.NODE_ENV,
      STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'local',
      SEED_TOKEN_SET: !!process.env.SEED_TOKEN,
      SEED_TOKEN_VALUE: process.env.SEED_TOKEN ? `${process.env.SEED_TOKEN.substring(0, 6)}***` : 'not set',
      PIXABAY_API_KEY_SET: !!finalApiKey,
      PIXABAY_API_KEY_VALUE: finalApiKey ? `${finalApiKey.substring(0, 6)}***` : 'not set',
      PIXABAY_API_KEY_SOURCE: dbApiKey ? 'database' : (envApiKey ? 'environment' : 'none'),
      SEED_MAX_COUNT: process.env.SEED_MAX_COUNT || '5',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('获取配置信息失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}