'use client'

import Link from 'next/link'
import { Camera, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 px-6">
      <div className="max-w-xl w-full text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <Camera className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight mb-3">404</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          啊哦，页面走丢了～ 您访问的内容不存在或已被移动。
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors">
            <ArrowLeft className="w-4 h-4" /> 返回首页
          </Link>
          <Link href="/admin/login" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            管理员登录
          </Link>
        </div>
      </div>
    </main>
  )
}
