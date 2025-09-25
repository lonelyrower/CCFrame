'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Star, StarOff, Image as ImageIcon, Upload, RefreshCw, Check } from 'lucide-react'

import { getImageUrl } from '@/lib/utils'

interface HeroImageManagementProps {}

interface PhotoOption {
  id: string
  title?: string
  filename: string
  width?: number
  height?: number
  isCurrentHero: boolean
}

// Mock data - 实际应该从API获取
const mockPhotos: PhotoOption[] = [
  {
    id: '1',
    title: '城市夜景',
    filename: 'city-night.jpg',
    width: 1920,
    height: 1280,
    isCurrentHero: true
  },
  {
    id: '2',
    title: '自然风光',
    filename: 'nature.jpg',
    width: 1920,
    height: 1080,
    isCurrentHero: false
  },
  {
    id: '3',
    title: '街头摄影',
    filename: 'street.jpg',
    width: 1920,
    height: 1280,
    isCurrentHero: false
  }
]

export default function HeroImageManagement() {
  const [photos, setPhotos] = useState<PhotoOption[]>(mockPhotos)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const handleSetHero = async (photoId: string) => {
    setIsUpdating(photoId)

    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    setPhotos(prev => prev.map(photo => ({
      ...photo,
      isCurrentHero: photo.id === photoId
    })))

    setIsUpdating(null)
    setLastUpdated(new Date())
  }

  const currentHero = photos.find(p => p.isCurrentHero)

  return (
    <div className="space-y-8 pb-20 pt-6 text-text-primary">
      {/* Film grain background */}
      <div
        className="fixed inset-0 opacity-5 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px'
        }}
      />

      <header className="relative space-y-3">
        <h1
          className="text-3xl font-light tracking-tight text-text-primary"
          style={{ fontFamily: 'var(--token-typography-display-font-family)' }}
        >
          首页大图管理
        </h1>
        <p className="font-light leading-relaxed text-text-secondary">
          设置网站首页展示的主图，这将影响整个网站的动态配色主题。
        </p>
        {lastUpdated && (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Check className="h-4 w-4 text-emerald-500" />
            <span>最后更新: {lastUpdated.toLocaleString('zh-CN')}</span>
          </div>
        )}
      </header>

      {/* Current Hero Display */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.25, 0.25, 1] }}
        className="relative overflow-hidden rounded-[24px] border border-surface-outline/40 bg-surface-panel/90 dark:border-white/10 dark:bg-black/40 backdrop-blur-xl shadow-xl"
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-[12px] bg-blue-400/20 p-3">
              <ImageIcon className="h-6 w-6 text-blue-200" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-text-primary">当前首页大图</h2>
              <p className="text-sm font-light text-text-secondary">
                正在使用的首页背景图片
              </p>
            </div>
          </div>

          {currentHero ? (
            <div className="relative aspect-[16/9] overflow-hidden rounded-[16px] border border-surface-outline/40">
              <Image
                src={getImageUrl(currentHero.id, 'large', 'webp')}
                alt={currentHero.title || '首页大图'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h3 className="font-medium">{currentHero.title || '无标题'}</h3>
                <p className="text-sm opacity-80">
                  {currentHero.width} × {currentHero.height}
                </p>
              </div>
            </div>
          ) : (
            <div className="aspect-[16/9] rounded-[16px] border-2 border-dashed border-surface-outline/40 flex items-center justify-center">
              <div className="text-center text-text-muted">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>未设置首页大图</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Photo Selection Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-medium text-text-primary">选择首页大图</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.1, ease: [0.25, 0.25, 0.25, 1] }}
              className={`relative overflow-hidden rounded-[20px] border backdrop-blur-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                photo.isCurrentHero
                  ? 'border-emerald-400/50 bg-emerald-400/10'
                  : 'border-surface-outline/40 bg-surface-panel/80 dark:border-white/10 dark:bg-black/40 hover:border-surface-outline/60'
              }`}
            >
              <div className="aspect-[16/10] relative overflow-hidden">
                <Image
                  src={getImageUrl(photo.id, 'medium', 'webp')}
                  alt={photo.title || '照片'}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {photo.isCurrentHero && (
                  <div className="absolute top-3 right-3">
                    <div className="rounded-full bg-emerald-500 p-2 text-white shadow-lg">
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-medium text-text-primary mb-1">
                  {photo.title || '无标题'}
                </h3>
                <p className="text-sm text-text-muted mb-3">
                  {photo.width} × {photo.height}
                </p>

                <button
                  onClick={() => handleSetHero(photo.id)}
                  disabled={photo.isCurrentHero || isUpdating === photo.id}
                  className={`w-full rounded-[8px] px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    photo.isCurrentHero
                      ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                      : isUpdating === photo.id
                      ? 'bg-blue-500/20 text-blue-300 cursor-not-allowed'
                      : 'bg-surface-outline/20 text-text-secondary hover:bg-surface-outline/30 hover:text-text-primary'
                  }`}
                >
                  {isUpdating === photo.id ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      设置中...
                    </>
                  ) : photo.isCurrentHero ? (
                    <>
                      <Star className="h-4 w-4 fill-current" />
                      当前使用
                    </>
                  ) : (
                    <>
                      <StarOff className="h-4 w-4" />
                      设为首页大图
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Upload New Photo Hint */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6, ease: [0.25, 0.25, 0.25, 1] }}
        className="relative overflow-hidden rounded-[24px] border border-blue-200/30 bg-blue-100/10 p-6 text-center backdrop-blur-xl shadow-lg"
      >
        <div className="space-y-4">
          <div className="rounded-[16px] bg-blue-400/20 p-4 inline-block">
            <Upload className="h-8 w-8 text-blue-200" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-text-primary mb-2">
              需要上传新照片？
            </h2>
            <p className="text-text-secondary font-light mb-4 max-w-2xl mx-auto">
              前往照片管理页面上传新的作品，上传完成后即可在此处选择作为首页大图。
            </p>
            <button className="inline-flex items-center gap-2 rounded-[8px] border border-blue-400/30 bg-blue-400/20 px-4 py-2 text-sm font-medium text-blue-200 hover:bg-blue-400/30 transition-colors">
              <Upload className="h-4 w-4" />
              前往照片管理
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}