"use client"

import type { UploadGuardInfoDto } from '@/types/upload'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'

interface UploadGuardProps {
  guard: UploadGuardInfoDto
}

export function UploadGuard({ guard }: UploadGuardProps) {
  const percent = Math.min(100, Math.round(guard.percentUsed))
  const showWarning = guard.approachingLimit

  return (
    <Surface tone="panel" padding="lg" className="shadow-subtle space-y-4">
      <Heading size="sm">存储使用概况</Heading>
      <Text tone="secondary" size="xs">
        {guard.message}
      </Text>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-outline/30">
        <div
          className={`h-full rounded-full ${showWarning ? 'bg-red-500' : 'bg-primary'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>已用 {percent}%</span>
        <span>剩余 {Math.max(0, 100 - percent)}%</span>
      </div>
      {showWarning ? (
        <Button variant="outline" size="sm" className="w-full" asChild>
          <a href="/admin/settings/storage">检查存储与扩容</a>
        </Button>
      ) : null}
    </Surface>
  )
}
