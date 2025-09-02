'use client'

import { Camera, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="relative">
            <div className="flex items-center justify-center w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full">
              <Camera className="h-12 w-12 text-gray-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
              <WifiOff className="h-4 w-4 text-red-500" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            网络已断开
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            似乎你的网络连接中断了。别担心 - 你仍可以浏览最近查看过的照片。
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => window.location.reload()}
            className="w-full"
          >
            <Wifi className="h-4 w-4 mr-2" />
            重试
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
          >
            返回
          </Button>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>缓存的照片和页面可离线使用</p>
        </div>
      </div>
    </div>
  )
}

