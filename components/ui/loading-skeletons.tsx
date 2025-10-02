"use client"

import { Skeleton } from './skeleton'
import { Container } from '../layout/container'

/**
 * 首页加载骨架屏
 */
export function HomeHeroSkeleton() {
  return (
    <section className="relative isolate overflow-hidden min-h-[85vh]">
      <Skeleton className="absolute inset-0" animate={false} />
      <Container className="relative z-10 flex min-h-[85vh] flex-col justify-center gap-16 py-32 sm:py-40">
        <div className="max-w-4xl space-y-10">
          <div className="space-y-4">
            <Skeleton className="h-4 w-48" variant="text" />
            <Skeleton className="h-20 w-full max-w-3xl" />
            <Skeleton className="h-20 w-3/4" />
          </div>
          <Skeleton className="h-16 w-full max-w-2xl" variant="text" />
          <div className="flex gap-6 pt-8">
            <Skeleton className="h-14 w-48" variant="rounded" />
            <Skeleton className="h-14 w-48" variant="rounded" />
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" variant="rounded" />
          ))}
        </div>
      </Container>
    </section>
  )
}

/**
 * 主题卡片加载骨架屏
 */
export function ThemeCardSkeleton() {
  return (
    <div className="min-h-[360px] min-w-[320px] max-w-sm">
      <Skeleton className="h-[360px] w-full" variant="rounded" />
    </div>
  )
}

/**
 * 作品网格加载骨架屏
 */
export function PhotoGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square w-full" variant="rounded" />
          <Skeleton className="h-4 w-3/4" variant="text" />
          <Skeleton className="h-3 w-1/2" variant="text" />
        </div>
      ))}
    </div>
  )
}

/**
 * 通用页面加载骨架屏
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-surface-canvas p-6">
      <Container className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-2xl" variant="text" />
        </div>
        <PhotoGridSkeleton count={8} />
      </Container>
    </div>
  )
}
