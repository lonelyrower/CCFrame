import { NextRequest, NextResponse } from 'next/server'
import { getRuntimeConfig, updateRuntimeConfig } from '@/lib/runtime-config'
import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/runtime-config
 * 获取运行时配置（storage + semantic + pixabay）
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) {
    return guard
  }

  try {
    const config = getRuntimeConfig()
    
    // 从当前管理员用户获取 pixabay 配置
    const adminUser = await db.user.findUnique({
      where: { id: guard.adminUserId },
      select: { pixabayApiKey: true }
    })

    return NextResponse.json({
      storage: config.storage || {},
      semantic: config.semantic || {},
      pixabay: {
        apiKey: adminUser?.pixabayApiKey || '',
        enabled: Boolean(adminUser?.pixabayApiKey)
      }
    })
  } catch (error) {
    console.error('[runtime-config] GET error:', error)
    return NextResponse.json(
      { error: '加载运行时配置失败' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/runtime-config
 * 更新运行时配置（支持部分更新）
 */
export async function PUT(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard instanceof NextResponse) {
    return guard
  }

  try {
    const body = await request.json()
    
    // 分离 pixabay 配置（存储到数据库）和其他配置（存储到文件）
    const { pixabay, ...fileConfig } = body

    // 更新文件配置
    let updatedConfig = getRuntimeConfig()
    if (Object.keys(fileConfig).length > 0) {
      updatedConfig = await updateRuntimeConfig(fileConfig)
    }

    // 更新 pixabay 配置到数据库
    let pixabayResult = { apiKey: '', enabled: false }
    if (pixabay) {
      await db.user.update({
        where: { id: guard.adminUserId },
        data: { pixabayApiKey: pixabay.apiKey || '' }
      })
      pixabayResult = {
        apiKey: pixabay.apiKey || '',
        enabled: Boolean(pixabay.apiKey)
      }
    } else {
      // 如果没有传 pixabay，返回当前值
      const adminUser = await db.user.findUnique({
        where: { id: guard.adminUserId },
        select: { pixabayApiKey: true }
      })
      pixabayResult = {
        apiKey: adminUser?.pixabayApiKey || '',
        enabled: Boolean(adminUser?.pixabayApiKey)
      }
    }

    return NextResponse.json({
      storage: updatedConfig.storage || {},
      semantic: updatedConfig.semantic || {},
      pixabay: pixabayResult
    })
  } catch (error) {
    console.error('[runtime-config] PUT error:', error)
    return NextResponse.json(
      { error: '保存运行时配置失败' },
      { status: 500 }
    )
  }
}
