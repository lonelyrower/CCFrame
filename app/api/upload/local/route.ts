import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getLocalStorageManager } from '@/lib/local-storage'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const contentType = searchParams.get('contentType')

    if (!key || !contentType) {
      return NextResponse.json({ error: 'Missing key or contentType' }, { status: 400 })
    }

    // 读取文件内容
    const buffer = Buffer.from(await request.arrayBuffer())

    // 使用本地存储管理器保存文件
    const storage = getLocalStorageManager()
    await storage.uploadBuffer(key, buffer, contentType)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Local upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}