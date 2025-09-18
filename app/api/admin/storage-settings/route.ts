import { NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const s = await db.appSettings.findUnique({ where: { id: 'singleton' } })
    return NextResponse.json({
      imageFormats: s?.imageFormats || '',
      imageVariantNames: s?.imageVariantNames || '',
    })
  } catch (e) {
    console.error('获取存储设置失败:', e)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdmin()
    if (guard instanceof NextResponse) return guard

    const body = await req.json().catch(() => ({}))
    const imageFormats = (body.imageFormats || '').trim()
    const imageVariantNames = (body.imageVariantNames || '').trim()
    await db.appSettings.upsert({
      where: { id: 'singleton' },
      update: { imageFormats: imageFormats || null, imageVariantNames: imageVariantNames || null },
      create: { id: 'singleton', imageFormats: imageFormats || null, imageVariantNames: imageVariantNames || null },
      select: { id: true }
    })
    return NextResponse.json({ message: '已保存' })
  } catch (e) {
    console.error('保存存储设置失败:', e)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}
