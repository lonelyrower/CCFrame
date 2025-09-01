'use client'

import Link from 'next/link'
import { Camera, ArrowLeft, Aperture, Home, Search, RefreshCw, Sparkles } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-950 px-6">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%236366f1" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
      
      <div className="max-w-2xl w-full text-center relative">
        {/* Animated Logo */}
        <div className="relative mx-auto mb-8">
          <div className="w-24 h-24 mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-30 animate-pulse" />
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-2xl shadow-2xl">
              <Aperture className="w-12 h-12 text-white animate-spin" style={{ animationDuration: '8s' }} />
              <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-yellow-400 animate-bounce" />
            </div>
          </div>
        </div>

        {/* CC Frame Brand */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
            CC Frame
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">创意相册</p>
        </div>

        {/* 404 Display */}
        <div className="mb-8">
          <h1 className="text-8xl md:text-9xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4 leading-none">
            404
          </h1>
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/20 dark:border-purple-500/20">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              页面走散了...
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
              看起来这个页面在创意的世界里迷路了
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              不过别担心，我们有很多精彩的内容等着你发现！
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link 
            href="/" 
            className="group inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          >
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
            回到首页
          </Link>
          
          <Link 
            href="/photos" 
            className="group inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-blue-200/20 dark:border-purple-500/20 text-gray-700 dark:text-gray-300 font-medium hover:bg-white dark:hover:bg-gray-800 transform hover:-translate-y-1 transition-all duration-200"
          >
            <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
            浏览照片
          </Link>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <Link 
            href="/photos" 
            className="group flex items-center gap-2 p-3 rounded-lg bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors"
          >
            <Camera className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            <span className="text-gray-700 dark:text-gray-300">全部照片</span>
          </Link>
          
          <Link 
            href="/tags" 
            className="group flex items-center gap-2 p-3 rounded-lg bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors"
          >
            <span className="w-4 h-4 text-purple-600 text-xs font-bold group-hover:scale-110 transition-transform">#</span>
            <span className="text-gray-700 dark:text-gray-300">标签分类</span>
          </Link>
          
          <Link 
            href="/timeline" 
            className="group flex items-center gap-2 p-3 rounded-lg bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors col-span-2 sm:col-span-1"
          >
            <RefreshCw className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
            <span className="text-gray-700 dark:text-gray-300">时间线</span>
          </Link>
        </div>

        <div className="mt-12 text-xs text-gray-400 dark:text-gray-600">
          <p>错误代码: 404 - 页面未找到</p>
        </div>
      </div>
    </main>
  )
}
