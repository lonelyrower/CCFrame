"use client"

import { cn } from "@/lib/utils"
import { LucideIcon, Camera, Search, FolderOpen, Tag } from "lucide-react"
import { Button } from "./button"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "ghost"
  }
  className?: string
  size?: "sm" | "default" | "lg"
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "default"
}: EmptyStateProps) {
  const sizes = {
    sm: {
      container: "py-8",
      iconWrapper: "w-16 h-16 mb-4",
      icon: "w-8 h-8",
      title: "text-lg",
      description: "text-sm"
    },
    default: {
      container: "py-16",
      iconWrapper: "w-24 h-24 mb-6",
      icon: "w-12 h-12",
      title: "text-xl",
      description: "text-base"
    },
    lg: {
      container: "py-24",
      iconWrapper: "w-32 h-32 mb-8",
      icon: "w-16 h-16",
      title: "text-2xl",
      description: "text-lg"
    }
  }

  const sizeConfig = sizes[size]

  return (
    <div className={cn("text-center", sizeConfig.container, className)}>
      <div className="max-w-md mx-auto">
        {/* Icon with gradient background */}
        <div className="relative mx-auto mb-6">
          <div className={cn(
            "mx-auto relative",
            sizeConfig.iconWrapper
          )}>
            {/* Gradient background blur */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-sm" />

            {/* Main background */}
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center h-full w-full">
              {/* Icon with gradient */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur-[1px] opacity-20" />
                <Icon className={cn(
                  "relative text-gray-400 dark:text-gray-500",
                  sizeConfig.icon
                )} />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <h3 className={cn(
          "font-semibold mb-2 text-gray-900 dark:text-white",
          sizeConfig.title
        )}>
          {title}
        </h3>

        <p className={cn(
          "text-gray-600 dark:text-gray-400 mb-6",
          sizeConfig.description
        )}>
          {description}
        </p>

        {/* Action button */}
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || "default"}
            size={size === "sm" ? "sm" : "default"}
            className="min-w-[120px]"
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  )
}

// 专用空状态变体
export function EmptyPhotosState({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      icon={Camera}
      title="暂无照片"
      description="还没有上传任何照片，快来分享你的美好时刻吧"
      action={onUpload ? {
        label: "上传照片",
        onClick: onUpload
      } : undefined}
    />
  )
}

export function EmptySearchState({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="没有找到匹配的照片"
      description="尝试调整搜索条件或浏览其他内容"
      action={onReset ? {
        label: "重置搜索",
        onClick: onReset,
        variant: "outline"
      } : undefined}
      size="sm"
    />
  )
}

export function EmptyAlbumsState({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={FolderOpen}
      title="暂无相册"
      description="创建相册来更好地组织你的照片"
      action={onCreate ? {
        label: "创建相册",
        onClick: onCreate
      } : undefined}
    />
  )
}

export function EmptyTagsState() {
  return (
    <EmptyState
      icon={Tag}
      title="暂无标签"
      description="为照片添加标签，更便于查找和分类"
      size="sm"
    />
  )
}