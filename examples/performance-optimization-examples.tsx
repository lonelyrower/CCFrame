/**
 * 性能优化使用示例
 * 
 * 本文件展示如何在实际组件中使用性能优化功能
 */

'use client'

import { OptimizedImage } from '@/components/ui/optimized-image'
import { usePerformanceOptimization } from '@/components/ui/performance-monitor'
import { ScrollIndicator } from '@/components/ui/scroll-indicator'
import { HomeHeroSkeleton, PhotoGridSkeleton } from '@/components/ui/loading-skeletons'
import { cn } from '@/lib/utils'
import { usePhotos } from '@/hooks/use-photos'
import { motion } from 'framer-motion'

// ============================================
// 示例 1: 图片组件优化
// ============================================

export function OptimizedPhotoCard({ photo }: { photo: any }) {
  return (
    <div className="rounded-lg overflow-hidden">
      <OptimizedImage
        src={photo.url}
        alt={photo.title}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        fallbackSrc="/images/photo-fallback.jpg"
        showSkeleton={true}
        aspectRatio="landscape"
        className="object-cover hover:scale-105 transition-transform duration-300"
      />
      <div className="p-4">
        <h3 className="font-semibold">{photo.title}</h3>
        <p className="text-sm text-text-muted">{photo.description}</p>
      </div>
    </div>
  )
}

// ============================================
// 示例 2: 性能感知的玻璃效果
// ============================================

export function PerformanceAwareGlassCard({ children }: { children: React.ReactNode }) {
  const { shouldReduceBlur } = usePerformanceOptimization()

  return (
    <div className={cn(
      // 基础样式
      "rounded-2xl bg-white/10 border border-white/20",
      "transition-all duration-300",
      "hover:bg-white/15 hover:border-white/30",
      // 条件性 blur（性能优化）
      !shouldReduceBlur && "backdrop-blur-xl"
    )}>
      {children}
    </div>
  )
}

// ============================================
// 示例 3: 横向滚动内容 + 指示器
// ============================================

export function HorizontalScrollSection({ items }: { items: any[] }) {
  return (
    <div className="space-y-4">
      {/* 滚动容器 */}
      <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide">
        {items.map((item, index) => (
          <div 
            key={index} 
            className="snap-center min-w-[300px] flex-shrink-0"
          >
            <div className="h-64 rounded-lg bg-surface-panel p-6">
              {item.content}
            </div>
          </div>
        ))}
      </div>

      {/* 滚动指示器 - 仅在移动端显示 */}
      <ScrollIndicator itemCount={items.length} className="md:hidden" />
    </div>
  )
}

// ============================================
// 示例 4: 带加载状态的页面
// ============================================

export function OptimizedPhotoGallery() {
  const { photos, isLoading } = usePhotos()

  // 加载状态 - 显示骨架屏
  if (isLoading) {
    return <PhotoGridSkeleton count={12} />
  }

  // 没有数据
  if (!photos || photos.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted">暂无作品</p>
      </div>
    )
  }

  // 正常渲染
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {photos.map((photo: any) => (
        <OptimizedPhotoCard key={photo.id} photo={photo} />
      ))}
    </div>
  )
}

// ============================================
// 示例 5: 性能感知的动画
// ============================================

export function AnimatedHeroSection() {
  const { shouldReduceAnimations } = usePerformanceOptimization()

  // 根据性能决定是否启用复杂动画
  const animationVariants = shouldReduceAnimations
    ? {
        // 简化版 - 仅透明度
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 }
      }
    : {
        // 完整版 - 透明度 + 位移 + 缩放
        initial: { opacity: 0, y: 50, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { 
          duration: 0.8, 
          ease: [0.33, 1, 0.68, 1] 
        }
      }

  return (
    <motion.div {...animationVariants}>
      <h1 className="text-6xl font-bold">欢迎来到 CC Frame</h1>
      <p className="text-xl text-text-secondary">发现光影的艺术</p>
    </motion.div>
  )
}

// ============================================
// 示例 6: 响应式图片
// ============================================

export function ResponsiveHeroImage({ src, alt }: { src: string; alt: string }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      priority // 首屏图片优先加载
      sizes="100vw"
      className="object-cover"
      quality={85}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDA..."
    />
  )
}

// ============================================
// 示例 7: 条件性渲染（移动端优化）
// ============================================

export function AdaptiveFeatureCard() {
  const { isPerformanceMode } = usePerformanceOptimization()
  
  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* 背景 - 在性能模式下使用纯色替代渐变 */}
      <div className={cn(
        "absolute inset-0 -z-10",
        isPerformanceMode 
          ? "bg-primary/10" 
          : "bg-gradient-to-br from-primary/20 via-accent/10 to-transparent"
      )} />

      {/* 内容 */}
      <div className="p-8">
        <h3 className="text-2xl font-bold mb-4">功能亮点</h3>
        <p className="text-text-secondary">
          自动检测设备性能，提供最佳体验
        </p>
      </div>

      {/* 装饰 - 在性能模式下隐藏 */}
      {!isPerformanceMode && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-accent/20 to-transparent blur-3xl" />
      )}
    </div>
  )
}

// ============================================
// 示例 8: 完整的优化页面组件
// ============================================

export default function OptimizedPageExample() {
  const { shouldReduceBlur, shouldReduceAnimations, isPerformanceMode } = usePerformanceOptimization()

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className={cn(
        "relative h-screen",
        !shouldReduceBlur && "backdrop-blur-sm"
      )}>
        <ResponsiveHeroImage
          src="/images/hero.jpg"
          alt="Hero Image"
        />
        <div className="relative z-10 flex items-center justify-center h-full">
          <AnimatedHeroSection />
        </div>
      </section>

      {/* 内容区域 */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* 性能提示（仅开发环境） */}
          {process.env.NODE_ENV === 'development' && isPerformanceMode && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                ⚡ 性能模式已启用：已优化视觉效果以提升性能
              </p>
            </div>
          )}

          {/* 作品展示 */}
          <OptimizedPhotoGallery />

          {/* 横向滚动区域 */}
          <HorizontalScrollSection 
            items={[
              { content: '内容 1' },
              { content: '内容 2' },
              { content: '内容 3' },
            ]} 
          />
        </div>
      </section>
    </main>
  )
}

// ============================================
// 实用工具函数
// ============================================

/**
 * 获取优化的图片 URL
 */
export function getOptimizedImageUrl(
  photoId: string,
  size: 'small' | 'medium' | 'large',
  format: 'webp' | 'avif' | 'jpg' = 'webp'
): string {
  return `/api/photos/${photoId}?size=${size}&format=${format}`
}

/**
 * 预加载关键图片
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

/**
 * 批量预加载图片
 */
export async function preloadImages(urls: string[]): Promise<void> {
  await Promise.all(urls.map(preloadImage))
}
