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
        {/* 图标带渐变背景 */}
        <div className="relative mx-auto mb-6">
          <div className={cn(
            "mx-auto relative",
            sizeConfig.iconWrapper
          )}>
            {/* 背景模糊光晕 */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-sm" />

            {/* 主背景 */}
            <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center h-full w-full">
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

        {/* 文案 */}
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

        {/* 操作按钮 */}
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

// 常用空状态场景
export function EmptyPhotosState({ onUpload }: { onUpload?: () => void }) {
  return (
    <EmptyState
      icon={Camera}
      title="暂无照片"
      description="你还没有上传任何照片，点击下方按钮即可开始。"
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
      description="试试调整筛选条件或换一个关键词再试一次。"
      action={onReset ? {
        label: "重置筛选",
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
      description="创建一个新的相册来整理和分享你的照片。"
      action={onCreate ? {
        label: "新建相册",
        onClick: onCreate
      } : undefined}
    />
  )
}

export function EmptyTagsState() {
  return (
    <EmptyState
      icon={Tag}
      title="暂时没有标签"
      description="为照片添加标签，方便日后查找与分类。"
      size="sm"
    />
  )
}


