import { NextRequest, NextResponse } from 'next/server'
import { getStorageManager } from '@/lib/storage-manager'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('=== 存储管理器测试 ===')
    
    const storage = getStorageManager()
    console.log('存储管理器类型:', storage.constructor.name)
    
    // 测试预签名URL生成
    const testKey = 'test/test.jpg'
    const testUrl = await storage.getPresignedUploadUrl(testKey, 'image/jpeg')
    console.log('测试预签名URL:', testUrl)
    
    // 如果是LocalStorageManager，检查健康状态
    let healthResult = null
    if (typeof storage.healthCheck === 'function') {
      healthResult = await storage.healthCheck()
      console.log('健康检查结果:', healthResult)
    }
    
    return NextResponse.json({
      success: true,
      storageType: storage.constructor.name,
      testUploadUrl: testUrl,
      health: healthResult,
      envVars: {
        STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
        UPLOAD_PATH: process.env.UPLOAD_PATH,
        LOCAL_STORAGE_PATH: process.env.LOCAL_STORAGE_PATH
      }
    })
    
  } catch (error) {
    console.error('存储测试失败:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      envVars: {
        STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
        UPLOAD_PATH: process.env.UPLOAD_PATH,
        LOCAL_STORAGE_PATH: process.env.LOCAL_STORAGE_PATH
      }
    }, { status: 500 })
  }
}