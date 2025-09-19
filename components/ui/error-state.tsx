"use client"

import { cn } from "@/lib/utils"
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react"
import { Button } from "./button"

interface ErrorStateProps {
  title?: string
  message?: string
  error?: Error | string
  showRetry?: boolean
  showHome?: boolean
  showBack?: boolean
  onRetry?: () => void
  onHome?: () => void
  onBack?: () => void
  className?: string
  size?: "sm" | "default" | "lg"
}

export function ErrorState({
  title = "发生错误",
  message = "抱歉，加载内容时出现了问题。",
  error,
  showRetry = true,
  showHome = false,
  showBack = false,
  onRetry,
  onHome,
  onBack,
  className,
  size = "default"
}: ErrorStateProps) {
  const sizes = {
    sm: {
      container: "py-8",
      iconWrapper: "w-16 h-16 mb-4",
      icon: "w-8 h-8",
      title: "text-lg",
      message: "text-sm"
    },
    default: {
      container: "py-16",
      iconWrapper: "w-24 h-24 mb-6",
      icon: "w-12 h-12",
      title: "text-xl",
      message: "text-base"
    },
    lg: {
      container: "py-24",
      iconWrapper: "w-32 h-32 mb-8",
      icon: "w-16 h-16",
      title: "text-2xl",
      message: "text-lg"
    }
  }

  const sizeConfig = sizes[size]

  return (
    <div className={cn("text-center", sizeConfig.container, className)}>
      <div className="max-w-md mx-auto">
        {/* 错误图标 */}
        <div className="relative mx-auto mb-6">
          <div className={cn("mx-auto relative", sizeConfig.iconWrapper)}>
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full animate-pulse" />

            <div className="relative bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/50 rounded-full border border-red-200 dark:border-red-800 flex items-center justify-center h-full w-full">
              <AlertTriangle className={cn(
                "text-red-500 dark:text-red-400",
                sizeConfig.icon
              )} aria-hidden />
            </div>
          </div>
        </div>

        <h3 className={cn(
          "font-semibold mb-2 text-gray-900 dark:text-white",
          sizeConfig.title
        )}>
          {title}
        </h3>

        <p className={cn(
          "text-gray-600 dark:text-gray-400 mb-6",
          sizeConfig.message
        )}>
          {message}
        </p>

        {error && process.env.NODE_ENV === 'development' && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              查看错误详情
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-auto text-red-600 dark:text-red-400">
              {typeof error === 'string' ? error : error.message}
              {typeof error !== 'string' && error.stack && '\n\n' + error.stack}
            </pre>
          </details>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          {showRetry && onRetry && (
            <Button
              onClick={onRetry}
              variant="default"
              size={size === "sm" ? "sm" : "default"}
              className="min-w-[100px]"
              aria-label="重新尝试"
            >
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden />
              重试
            </Button>
          )}

          {showBack && onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              size={size === "sm" ? "sm" : "default"}
              aria-label="返回上一页"
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden />
              返回
            </Button>
          )}

          {showHome && onHome && (
            <Button
              onClick={onHome}
              variant="ghost"
              size={size === "sm" ? "sm" : "default"}
              aria-label="返回首页"
            >
              <Home className="w-4 h-4 mr-2" aria-hidden />
              首页
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// 常用错误态封装
export function NetworkErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="网络连接异常"
      message="请检查网络状态后再试一次。"
      showRetry
      onRetry={onRetry}
    />
  )
}

export function UploadErrorState({ onRetry, onBack }: { onRetry?: () => void; onBack?: () => void }) {
  return (
    <ErrorState
      title="上传失败"
      message="文件上传过程中出现了问题，请重试。"
      showRetry
      showBack
      onRetry={onRetry}
      onBack={onBack}
      size="sm"
    />
  )
}

export function NotFoundErrorState({ onHome }: { onHome?: () => void }) {
  return (
    <ErrorState
      title="页面不存在"
      message="抱歉，你访问的页面不存在或已被移动。"
      showHome
      onHome={onHome}
    />
  )
}

export function UnauthorizedErrorState({ onHome }: { onHome?: () => void }) {
  return (
    <ErrorState
      title="访问被拒绝"
      message="你没有权限访问该内容。"
      showHome
      onHome={onHome}
    />
  )
}

