"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "rounded" | "circle" | "text"
  animate?: boolean
}

export function Skeleton({
  className,
  variant = "default",
  animate = true,
  ...props
}: SkeletonProps) {
  const variants = {
    default: "rounded-md",
    rounded: "rounded-lg",
    circle: "rounded-full",
    text: "rounded-sm h-4"
  }

  return (
    <div
      className={cn(
        "bg-gray-200 dark:bg-gray-800",
        animate && "animate-pulse",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

// 专用骨架屏组件
export function PhotoSkeleton({ aspectRatio = "square" }: { aspectRatio?: "square" | "landscape" | "portrait" }) {
  const aspectClasses = {
    square: "aspect-square",
    landscape: "aspect-[4/3]",
    portrait: "aspect-[3/4]"
  }

  return (
    <div className="group">
      <Skeleton className={cn("w-full", aspectClasses[aspectRatio])} variant="rounded" />
      <div className="mt-2 space-y-1">
        <Skeleton className="h-3 w-3/4" variant="text" />
        <Skeleton className="h-3 w-1/2" variant="text" />
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" variant="text" />
          <Skeleton className="h-8 w-12" />
        </div>
        <Skeleton className="w-12 h-12" variant="rounded" />
      </div>
    </div>
  )
}

export function GalleryGridSkeleton({
  columns = 4,
  rows = 3,
  aspectRatio = "square" as "square" | "landscape" | "portrait"
}) {
  return (
    <div className={cn(
      "grid gap-4",
      columns === 2 && "grid-cols-2",
      columns === 3 && "grid-cols-3",
      columns === 4 && "grid-cols-4",
      columns === 5 && "grid-cols-5"
    )}>
      {Array.from({ length: columns * rows }).map((_, i) => (
        <PhotoSkeleton key={i} aspectRatio={aspectRatio} />
      ))}
    </div>
  )
}

export function FilterSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap gap-4">
        <Skeleton className="flex-1 min-w-60 h-10" variant="rounded" />
        <Skeleton className="w-32 h-10" variant="rounded" />
        <Skeleton className="w-32 h-10" variant="rounded" />
        <Skeleton className="w-32 h-10" variant="rounded" />
      </div>
    </div>
  )
}

export function NavigationSkeleton() {
  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Skeleton className="h-8 w-32" variant="rounded" />

          <div className="hidden md:flex items-center space-x-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-16" variant="text" />
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10" variant="circle" />
            <Skeleton className="w-20 h-8" variant="rounded" />
          </div>
        </div>
      </div>
    </nav>
  )
}