import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    // 获取关键配置信息（不暴露敏感数据）
    const config = {
      NODE_ENV: process.env.NODE_ENV,
      STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'local',
      SEED_TOKEN_SET: !!process.env.SEED_TOKEN,
      SEED_TOKEN_VALUE: process.env.SEED_TOKEN ? `${process.env.SEED_TOKEN.substring(0, 6)}***` : 'not set',
      PIXABAY_API_KEY_SET: !!process.env.PIXABAY_API_KEY,
      PIXABAY_API_KEY_VALUE: process.env.PIXABAY_API_KEY ? `${process.env.PIXABAY_API_KEY.substring(0, 6)}***` : 'not set',
      SEED_MAX_COUNT: process.env.SEED_MAX_COUNT || '5',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('获取配置信息失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}