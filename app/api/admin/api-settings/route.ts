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

    // 查找用户的API设置
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true, 
        pixabayApiKey: true 
      }
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json({
      pixabayApiKey: user.pixabayApiKey || ''
    })
  } catch (error) {
    console.error('获取API设置失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { pixabayApiKey } = await request.json()

    // 更新用户的API设置
    const user = await db.user.update({
      where: { id: session.user.id },
      data: { 
        pixabayApiKey: pixabayApiKey || null 
      },
      select: { 
        id: true, 
        pixabayApiKey: true 
      }
    })

    return NextResponse.json({
      message: 'API设置已保存',
      pixabayApiKey: user.pixabayApiKey || ''
    })
  } catch (error) {
    console.error('保存API设置失败:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}