'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Camera,
  Aperture,
  Home,
  Search,
  Calendar,
  FileX,
  Sparkles,
  Zap,
  Grid3X3,
  Tag,
  RotateCcw,
  Lightbulb
} from 'lucide-react'
import { Navigation } from '@/components/navigation'

export default function NotFound() {
  const [mounted, setMounted] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const [showEasterEgg, setShowEasterEgg] = useState(false)
  const [easterEggPhase, setEasterEggPhase] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogoClick = () => {
    setClickCount(prev => prev + 1)
    if (clickCount >= 4) {
      setShowEasterEgg(true)
      setEasterEggPhase(0)

      // 分阶段展示彩蛋效果
      setTimeout(() => setEasterEggPhase(1), 500)
      setTimeout(() => setEasterEggPhase(2), 1500)
      setTimeout(() => setEasterEggPhase(3), 3000)
      setTimeout(() => {
        setShowEasterEgg(false)
        setEasterEggPhase(0)
      }, 6000)

      setClickCount(0)
    }
  }

  if (!mounted) return null

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/80 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 relative overflow-hidden">
        {/* 动态背景效果 */}
        <div className="absolute inset-0 pointer-events-none">
          {/* 主背景光晕 */}
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-400/15 via-purple-400/8 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-gradient-radial from-indigo-400/15 via-pink-400/8 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

          {/* 微粒效果 */}
          <div className="absolute inset-0 opacity-30">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-blue-400/60 dark:bg-blue-300/40 rounded-full animate-float"
                style={{
                  left: `${10 + (i * 8)}%`,
                  top: `${20 + (i * 5)}%`,
                  animationDelay: `${i * 0.5}s`,
                  animationDuration: `${3 + (i % 3)}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="relative z-10 container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
          {/* 彩蛋提示 - 多阶段动画 */}
          {showEasterEgg && (
            <div className="fixed inset-0 z-50 pointer-events-none">
              {/* 背景光效 */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/10 to-blue-900/20 animate-pulse" />

              {/* 阶段 0: 初始爆炸效果 */}
              {easterEggPhase >= 0 && (
                <>
                  {/* 中心爆炸光晕 */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-32 h-32 bg-gradient-radial from-yellow-400/80 via-orange-500/60 to-transparent rounded-full animate-ping" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-radial from-white/90 to-yellow-400/80 rounded-full animate-bounce" />
                  </div>

                  {/* 围绕的火花效果 */}
                  {Array.from({ length: 12 }).map((_, i) => {
                    const angle = (i * 30) * (Math.PI / 180)
                    const radius = 120
                    const x = Math.cos(angle) * radius
                    const y = Math.sin(angle) * radius

                    return (
                      <div
                        key={i}
                        className="absolute top-1/2 left-1/2 w-4 h-4 transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                          transform: `translate(${x}px, ${y}px)`,
                        }}
                      >
                        <div className="w-full h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping"
                             style={{ animationDelay: `${i * 100}ms`, animationDuration: '1s' }} />
                        <Sparkles
                          className="absolute top-0 left-0 w-4 h-4 text-yellow-300 animate-spin"
                          style={{ animationDelay: `${i * 100}ms` }}
                        />
                      </div>
                    )
                  })}
                </>
              )}

              {/* 阶段 1: 发现消息 */}
              {easterEggPhase >= 1 && (
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-fade-in">
                  <div className="relative">
                    <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white px-8 py-4 rounded-2xl shadow-2xl border-2 border-white/20 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                          <Lightbulb className="w-5 h-5 text-yellow-900" />
                        </div>
                        <div>
                          <div className="text-lg font-bold animate-typing overflow-hidden whitespace-nowrap">
                            📸 恭喜发现隐藏彩蛋！
                          </div>
                          <div className="text-sm opacity-90 mt-1">
                            你是第 {Math.floor(Math.random() * 42) + 1} 位发现这个秘密的探索者
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute -bottom-2 left-8 w-4 h-4 bg-gradient-to-r from-purple-600 to-pink-500 rotate-45" />
                  </div>
                </div>
              )}

              {/* 阶段 2: 相机变身动画 */}
              {easterEggPhase >= 2 && (
                <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 animate-slide-up">
                  <div className="flex items-center gap-6 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-lg text-white px-10 py-6 rounded-3xl shadow-2xl border border-white/20">
                    <div className="relative">
                      <Camera className="w-12 h-12 animate-bounce" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse flex items-center justify-center">
                        <Zap className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xl font-bold mb-1">✨ 相机升级中...</div>
                      <div className="flex items-center gap-2 text-sm opacity-90">
                        <div className="flex space-x-1">
                          {[0, 1, 2].map((i) => (
                            <div
                              key={i}
                              className="w-2 h-2 bg-white rounded-full animate-pulse"
                              style={{ animationDelay: `${i * 0.2}s` }}
                            />
                          ))}
                        </div>
                        <span>正在解锁高级功能</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 阶段 3: 成就解锁 */}
              {easterEggPhase >= 3 && (
                <div className="absolute top-2/3 left-1/2 -translate-x-1/2 animate-zoom-in">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-8 rounded-3xl shadow-2xl border-4 border-white/30">
                        <div className="text-6xl mb-4">🏆</div>
                        <div className="text-white font-bold text-xl mb-2">成就解锁</div>
                        <div className="text-white/90 text-lg mb-3">「好奇的探索者」</div>
                        <div className="text-white/80 text-sm">
                          你发现了 CC Frame 的隐藏彩蛋！<br />
                          真正的摄影师从不停止探索 📷
                        </div>
                      </div>

                      {/* 成就光环 */}
                      <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400/20 via-orange-500/20 to-red-500/20 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
                      <div className="absolute -inset-2 bg-gradient-to-r from-white/30 to-yellow-300/30 rounded-full animate-ping" />
                    </div>
                  </div>
                </div>
              )}

              {/* 全屏彩带效果 */}
              {easterEggPhase >= 1 && (
                <div className="absolute inset-0 overflow-hidden">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 bg-gradient-to-b from-transparent via-yellow-400 to-transparent h-full animate-fall opacity-70"
                      style={{
                        left: `${(i * 5) % 100}%`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: `${2 + (i % 3)}s`,
                        transform: `rotate(${-15 + (i % 30)}deg)`
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 相机图标区域 */}
          <div className="text-center mb-12">
            <div className="relative inline-block group">
              {/* 相机背景光晕 */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity animate-pulse" />

              {/* 主相机容器 */}
              <div
                className="relative glass-card rounded-3xl p-12 shadow-floating cursor-pointer transform hover:scale-105 transition-all duration-300"
                onClick={handleLogoClick}
              >
                <div className="relative">
                  {/* 主相机图标 */}
                  <Camera className="w-24 h-24 text-text-secondary dark:text-text-muted mx-auto mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />

                  {/* 闪光效果 */}
                  <div className="absolute top-2 right-2 w-4 h-4 bg-yellow-400 rounded-full animate-ping" />
                  <Zap className="absolute top-1 right-1 w-6 h-6 text-yellow-400 animate-pulse" />

                  {/* 404 标记 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-500/90 backdrop-blur-sm rounded-full p-3">
                      <FileX className="w-8 h-8 text-text-inverted" />
                    </div>
                  </div>

                  {/* 装饰元素 */}
                  <div className="absolute -top-2 -left-2">
                    <Sparkles className="w-6 h-6 text-blue-400 animate-bounce" style={{ animationDelay: '1s' }} />
                  </div>
                  <div className="absolute -bottom-2 -right-2">
                    <Aperture className="w-5 h-5 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                </div>

                {/* CC Frame 品牌 */}
                <div className="mt-6">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    CC Frame
                  </h2>
                  <p className="text-sm text-text-muted dark:text-text-muted">创意相册</p>
                </div>
              </div>
            </div>
          </div>

          {/* 404 标题区域 */}
          <div className="text-center mb-12">
            <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-6 animate-bounce-in leading-none">
              404
            </h1>

            <div className="glass-card rounded-2xl p-8 max-w-lg mx-auto">
              <h3 className="text-3xl font-bold text-text-primary dark:text-text-inverted mb-4 flex items-center justify-center gap-3">
                <Camera className="w-8 h-8 text-blue-600" />
                照片失焦了...
              </h3>
              <p className="text-lg text-text-secondary dark:text-text-muted mb-4 leading-relaxed">
                看起来这个页面跑到镜头之外了 📸
              </p>
              <p className="text-sm text-text-muted dark:text-text-muted">
                不过没关系，让我们重新对焦，寻找更精彩的画面！
              </p>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-6 mb-16">
            <Link href="/">
              <button className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-text-inverted font-semibold py-4 px-8 rounded-2xl shadow-floating hover:shadow-floating transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity" />
                <div className="relative flex items-center gap-3">
                  <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="text-lg">回到首页</span>
                </div>
                <div className="absolute inset-0 border-2 border-contrast-outline/20 rounded-2xl group-hover:border-contrast-outline/40 transition-colors" />
              </button>
            </Link>

            <Link href="/photos">
              <button className="group relative overflow-hidden glass-card hover:bg-surface-panel/90 dark:hover:bg-surface-panel/90 text-text-secondary dark:text-text-muted font-semibold py-4 px-8 rounded-2xl shadow-surface hover:shadow-floating transition-all duration-300 transform hover:-translate-y-2 hover:scale-105">
                <div className="relative flex items-center gap-3">
                  <Grid3X3 className="w-6 h-6 group-hover:scale-110 transition-transform text-blue-600" />
                  <span className="text-lg">浏览照片</span>
                </div>
              </button>
            </Link>
          </div>

          {/* 快速导航卡片 */}
          <div className="glass-card rounded-3xl p-8 max-w-2xl w-full mb-12">
            <h3 className="text-2xl font-bold text-text-primary dark:text-text-muted mb-6 text-center flex items-center justify-center gap-3">
              <Aperture className="w-7 h-7 text-blue-600 animate-spin" style={{ animationDuration: '8s' }} />
              快速导航
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/timeline"
                className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 hover:from-blue-100 hover:to-indigo-200 dark:hover:from-blue-800/30 dark:hover:to-indigo-800/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-surface"
              >
                <Calendar className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="font-semibold text-text-primary dark:text-text-muted mb-1">时间线</h4>
                <p className="text-sm text-text-secondary dark:text-text-muted">按时间浏览照片</p>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
              </Link>

              <Link
                href="/tags"
                className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 hover:from-purple-100 hover:to-pink-200 dark:hover:from-purple-800/30 dark:hover:to-pink-800/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-surface"
              >
                <Tag className="w-8 h-8 text-purple-600 mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="font-semibold text-text-primary dark:text-text-muted mb-1">标签分类</h4>
                <p className="text-sm text-text-secondary dark:text-text-muted">按标签查找照片</p>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
              </Link>

              <Link
                href="/photos"
                className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 hover:from-green-100 hover:to-emerald-200 dark:hover:from-green-800/30 dark:hover:to-emerald-800/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-surface"
              >
                <Grid3X3 className="w-8 h-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="font-semibold text-text-primary dark:text-text-muted mb-1">全部照片</h4>
                <p className="text-sm text-text-secondary dark:text-text-muted">浏览所有内容</p>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Sparkles className="w-4 h-4 text-green-400" />
                </div>
              </Link>
            </div>
          </div>

          {/* 底部引用 */}
          <div className="text-center space-y-4">
            <div className="glass-card rounded-2xl px-6 py-4 inline-block">
              <p className="text-text-secondary dark:text-text-muted italic">
                有时候迷路，是为了发现更美的风景
              </p>
              <p className="text-sm text-text-muted dark:text-text-muted mt-1">— 某位摄影师的箴言</p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-text-muted dark:text-text-secondary">
              <Camera className="w-3 h-3" />
              <span>错误代码: 404</span>
              <span>•</span>
              <span>页面未找到</span>
              <span>•</span>
              <span>CC Frame</span>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
