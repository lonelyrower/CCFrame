import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const settings = await db.appSettings.findUnique({ where: { id: 'singleton' } })
    return NextResponse.json({
      openaiApiKey: settings?.openaiApiKey || '',
      googleApiKey: settings?.googleApiKey || '',
      clipdropApiKey: settings?.clipdropApiKey || '',
      removeBgApiKey: settings?.removeBgApiKey || '',
      autoTagEnabled: settings?.autoTagEnabled ?? false,
      autoTagIncludeColors: settings?.autoTagIncludeColors ?? true,
      autoTagIncludeContent: settings?.autoTagIncludeContent ?? true,
      autoTagProvider: settings?.autoTagProvider || 'auto',
      autoTagDailyLimit: settings?.autoTagDailyLimit ?? null,
      autoTagUsageDate: settings?.autoTagUsageDate || null,
      autoTagUsageCount: settings?.autoTagUsageCount || 0,
    })
  } catch (error) {
    console.error('获取AI设置失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { openaiApiKey, googleApiKey, clipdropApiKey, removeBgApiKey, autoTagEnabled, autoTagIncludeColors, autoTagIncludeContent, autoTagProvider, autoTagDailyLimit } = body || {}

    const settings = await db.appSettings.upsert({
      where: { id: 'singleton' },
      update: {
        openaiApiKey: openaiApiKey || null,
        googleApiKey: googleApiKey || null,
        clipdropApiKey: clipdropApiKey || null,
        removeBgApiKey: removeBgApiKey || null,
        autoTagEnabled: !!autoTagEnabled,
        autoTagIncludeColors: autoTagIncludeColors !== false,
        autoTagIncludeContent: autoTagIncludeContent !== false,
        autoTagProvider: autoTagProvider || 'auto',
        autoTagDailyLimit: typeof autoTagDailyLimit === 'number' ? autoTagDailyLimit : (autoTagDailyLimit ? parseInt(autoTagDailyLimit) : null),
      },
      create: {
        id: 'singleton',
        openaiApiKey: openaiApiKey || null,
        googleApiKey: googleApiKey || null,
        clipdropApiKey: clipdropApiKey || null,
        removeBgApiKey: removeBgApiKey || null,
        autoTagEnabled: !!autoTagEnabled,
        autoTagIncludeColors: autoTagIncludeColors !== false,
        autoTagIncludeContent: autoTagIncludeContent !== false,
        autoTagProvider: autoTagProvider || 'auto',
        autoTagDailyLimit: typeof autoTagDailyLimit === 'number' ? autoTagDailyLimit : (autoTagDailyLimit ? parseInt(autoTagDailyLimit) : null),
      },
      select: { id: true }
    })

    return NextResponse.json({ message: 'AI设置已保存' })
  } catch (error) {
    console.error('保存AI设置失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
