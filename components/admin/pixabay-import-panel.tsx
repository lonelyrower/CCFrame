"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, Image, Loader2, CheckCircle2, AlertCircle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Surface } from '@/components/ui/surface'
import toast from 'react-hot-toast'

interface PixabayConfig {
  apiKey: string
  enabled: boolean
}

export function PixabayImportPanel() {
  const [config, setConfig] = useState<PixabayConfig>({ apiKey: '', enabled: false })
  const [configLoading, setConfigLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importCount, setImportCount] = useState(20)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/runtime-config')
      if (!response.ok) throw new Error('配置加载失败')
      const data = await response.json()
      setConfig(data.pixabay || { apiKey: '', enabled: false })
    } catch (error) {
      console.error('加载Pixabay配置失败:', error)
    } finally {
      setConfigLoading(false)
    }
  }

  const handleImport = async () => {
    if (!config.enabled || !config.apiKey) {
      toast.error('请先在运行时配置中启用并配置 Pixabay API')
      return
    }

    setImporting(true)
    try {
      const response = await fetch('/api/admin/pixabay-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: importCount })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '导入失败')
      }

      const result = await response.json()
      toast.success(`成功导入 ${result.imported} 张示例图片！`)
    } catch (error) {
      console.error('导入示例图片失败:', error)
      toast.error(error instanceof Error ? error.message : '导入失败')
    } finally {
      setImporting(false)
    }
  }

  if (configLoading) {
    return (
      <Surface tone="panel" padding="lg" className="shadow-subtle">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
          <span className="ml-2 text-sm text-text-secondary">加载配置中...</span>
        </div>
      </Surface>
    )
  }

  const isConfigured = config.enabled && config.apiKey

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Surface tone="panel" padding="lg" className="shadow-subtle space-y-6">
        {/* Film grain background */}
        <div
          className="absolute inset-0 opacity-5 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px'
          }}
        />

        <header className="relative flex items-start gap-4">
          <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3">
            <Image className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-text-primary">示例图片导入</h2>
            <p className="text-sm text-text-secondary mt-1">
              从 Pixabay 导入高质量示例图片，快速填充您的相册
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium">已配置</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs font-medium">需要配置</span>
              </div>
            )}
          </div>
        </header>

        {isConfigured ? (
          <div className="relative space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-secondary">
                  导入数量
                </label>
                <select
                  value={importCount}
                  onChange={(e) => setImportCount(Number(e.target.value))}
                  disabled={importing}
                  className="px-3 py-2 border border-surface-outline/60 dark:border-surface-outline/70 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-surface-panel dark:bg-surface-panel text-text-primary dark:text-text-inverted"
                >
                  <option value={10}>10 张图片</option>
                  <option value={20}>20 张图片</option>
                  <option value={50}>50 张图片</option>
                  <option value={100}>100 张图片</option>
                </select>
                <p className="text-xs text-text-muted">
                  将从 Pixabay 随机导入优质摄影作品
                </p>
              </div>

              <Button
                onClick={handleImport}
                disabled={importing}
                className="bg-green-600 hover:bg-green-700 text-white shadow-soft"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    导入中...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    开始导入
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-text-muted bg-surface-canvas/50 rounded-lg p-3 space-y-1">
              <p className="font-medium text-text-secondary">导入说明：</p>
              <ul className="space-y-1 pl-4">
                <li>• 图片来源：Pixabay 高质量免费图片</li>
                <li>• 自动生成标签和分类</li>
                <li>• 可重复导入，不会产生重复</li>
                <li>• 支持的格式：JPEG、PNG</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="relative text-center py-8 space-y-4">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
            <div>
              <h3 className="text-sm font-medium text-text-primary">需要配置 Pixabay API</h3>
              <p className="text-sm text-text-secondary mt-1">
                请先在运行时配置中启用 Pixabay API 并填写密钥
              </p>
            </div>
            <a
              href="/admin/runtime-config"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Settings className="h-4 w-4" />
              前往配置
            </a>
          </div>
        )}
      </Surface>
    </motion.div>
  )
}