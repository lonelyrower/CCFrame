"use client"

import { useMemo } from 'react'

import { useUploadQueue } from '@/components/providers/upload-queue-provider'
import {
  type AdminNavigationMetrics,
  defaultAdminNavigationMetrics,
} from '@/lib/admin/navigation-registry'

export function useAdminNavigationMetrics(): AdminNavigationMetrics {
  const { stats } = useUploadQueue()

  return useMemo(() => {
    return {
      pendingTasks: stats.pending ?? defaultAdminNavigationMetrics.pendingTasks,
      activeUploads: stats.active ?? defaultAdminNavigationMetrics.activeUploads,
      failedUploads: stats.failed ?? defaultAdminNavigationMetrics.failedUploads,
      alerts: Math.max(stats.failed ?? 0, defaultAdminNavigationMetrics.alerts),
    }
  }, [stats])
}
