import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const user = await db.user.findUnique({
      where: { id: guard.adminUserId },
      select: { id: true, pixabayApiKey: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      pixabayApiKey: (user as any)?.pixabayApiKey || '',
    })
  } catch (error) {
    console.error('获取API设置失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const { pixabayApiKey } = await request.json()

    const user = await db.user.update({
      where: { id: guard.adminUserId },
      data: ({ pixabayApiKey: pixabayApiKey || null } as any),
      select: { id: true, pixabayApiKey: true },
    })

    return NextResponse.json({
      message: 'API设置已保存',
      pixabayApiKey: (user as any)?.pixabayApiKey || '',
    })
  } catch (error) {
    console.error('保存API设置失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
