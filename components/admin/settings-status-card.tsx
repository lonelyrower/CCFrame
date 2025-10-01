"use client"

import { useMemo } from 'react'
import { AlertCircle, CheckCircle2, RefreshCcw, Server, Share2, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import type { SettingsValidationResultDto, SettingsValidationTarget } from '@/types/settings'
import { cn } from '@/lib/utils'

interface SettingsStatusCardProps {
  results: SettingsValidationResultDto[]
  onValidate: (target: SettingsValidationTarget) => void
  validatingTarget?: SettingsValidationTarget | null
}

const targetMeta: Record<SettingsValidationTarget, { title: string; description: string; icon: React.ComponentType<{ className?: string }> }> = {
  storage: {
    title: '存储服务',
    description: '校验对象存储连接与凭据状态。',
    icon: Server,
  },
  integrations: {
    title: '第三方接口',
    description: '检查 Pixabay 等接口的基础配置。',
    icon: Share2,
  },
  semantic: {
    title: '语义检索',
    description: '确认嵌入服务与模型配置。',
    icon: Sparkles,
  },
  analytics: {
    title: '数据分析',
    description: '检查分析服务配置。',
    icon: AlertCircle,
  },
}

export function SettingsStatusCard({ results, onValidate, validatingTarget }: SettingsStatusCardProps) {
  const latestMap = useMemo(() => {
    const store = new Map<SettingsValidationTarget, SettingsValidationResultDto>()
    for (const result of results) {
      store.set(result.target, result)
    }
    return store
  }, [results])

  return (
    <Surface tone="panel" padding="lg" className="shadow-subtle space-y-4">
      <Heading size="sm">配置健康概览</Heading>
      <div className="space-y-3">
        {(Object.keys(targetMeta) as SettingsValidationTarget[]).map((target) => {
          const meta = targetMeta[target]
          const result = latestMap.get(target)
          const success = result?.success ?? false
          return (
            <div key={target} className="flex items-start justify-between gap-3 rounded-xl border border-surface-outline/30 bg-surface-panel/80 px-4 py-3">
              <div className="flex gap-3">
                <span className={cn('mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-surface-outline/40 text-primary')}>
                  <meta.icon className="h-4 w-4" />
                </span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Text size="sm" weight="medium" className="text-text-primary">
                      {meta.title}
                    </Text>
                    {result ? (
                      success ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-500">
                          <CheckCircle2 className="h-3 w-3" />
                          正常
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          待处理
                        </span>
                      )
                    ) : null}
                  </div>
                  <Text tone="secondary" size="xs">
                    {result?.message ?? meta.description}
                  </Text>
                  {result?.timestamp ? (
                    <Text tone="secondary" size="xs" className="text-text-muted">
                      {new Date(result.timestamp).toLocaleString('zh-CN')}
                    </Text>
                  ) : null}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => onValidate(target)}
                disabled={validatingTarget === target}
              >
                {validatingTarget === target ? (
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                立即校验
              </Button>
            </div>
          )
        })}
      </div>
    </Surface>
  )
}
