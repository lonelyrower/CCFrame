import type { SettingsValidationResultDto, SettingsValidationTarget } from '@/types/settings'
import type { UploadQueueSnapshotDto } from '@/types/upload'

const MAX_OPERATIONS = 200
const MAX_ALERTS = 200
const FRONTEND_VITAL_LIMIT = 200
const webhookUrl = process.env.ADMIN_OBSERVABILITY_WEBHOOK ?? ''

type FrontendWebVitalRating = 'good' | 'needs-improvement' | 'poor' | 'unknown' | string

interface FrontendWebVitalEntry {
  id: string
  name: string
  value: number
  delta: number
  rating: FrontendWebVitalRating
  path: string
  navigationType?: string
  connection?: {
    effectiveType?: string
    downlink?: number
    saveData?: boolean
  }
  timestamp: number
}

interface AdminOperationEntry {
  name: string
  durationMs: number
  status: 'success' | 'error'
  timestamp: number
  meta?: Record<string, unknown>
}

interface AdminAlertEntry {
  category: string
  message: string
  timestamp: number
  meta?: Record<string, unknown>
}

const operations: AdminOperationEntry[] = []
const alerts: AdminAlertEntry[] = []
const operationCounters: Record<string, { success: number; error: number; totalDuration: number; count: number }> = {}
const frontendWebVitals: FrontendWebVitalEntry[] = []

async function dispatchWebhook(payload: Record<string, unknown>) {
  if (!webhookUrl || typeof fetch !== 'function') return
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.warn('[observability] webhook dispatch failed', error)
  }
}

export function recordAdminOperation(
  name: string,
  durationMs: number,
  status: 'success' | 'error',
  meta?: Record<string, unknown>,
) {
  const entry: AdminOperationEntry = {
    name,
    durationMs,
    status,
    timestamp: Date.now(),
    meta,
  }
  operations.push(entry)
  if (operations.length > MAX_OPERATIONS) {
    operations.shift()
  }

  const counter = (operationCounters[name] = operationCounters[name] || {
    success: 0,
    error: 0,
    totalDuration: 0,
    count: 0,
  })
  counter.count += 1
  counter.totalDuration += durationMs
  counter[status] += 1

  if (status === 'error') {
    void dispatchWebhook({
      type: 'admin.operation_error',
      name,
      durationMs,
      meta,
      timestamp: entry.timestamp,
    })
  }
}

export function recordAdminAlert(category: string, message: string, meta?: Record<string, unknown>) {
  const entry: AdminAlertEntry = {
    category,
    message,
    timestamp: Date.now(),
    meta,
  }
  alerts.push(entry)
  if (alerts.length > MAX_ALERTS) {
    alerts.shift()
  }

  void dispatchWebhook({
    type: 'admin.alert',
    category,
    message,
    meta,
    timestamp: entry.timestamp,
  })
}

export function getAdminMetricsReport() {
  const totalOps = operations.length
  const successOps = operations.filter((entry) => entry.status === 'success').length
  const errorOps = totalOps - successOps
  const avgDuration = totalOps
    ? +(operations.reduce((acc, entry) => acc + entry.durationMs, 0) / totalOps).toFixed(2)
    : 0

  const byName = Object.entries(operationCounters).map(([name, stats]) => ({
    name,
    success: stats.success,
    error: stats.error,
    avgDurationMs: stats.count ? +(stats.totalDuration / stats.count).toFixed(2) : 0,
  }))

  return {
    operations: {
      total: totalOps,
      success: successOps,
      error: errorOps,
      avgDurationMs: avgDuration,
      recent: operations.slice(-10).reverse(),
      byName,
    },
    alerts: {
      total: alerts.length,
      recent: alerts.slice(-10).reverse(),
    },
  }
}

export function summariseUploadSnapshot(snapshot: UploadQueueSnapshotDto) {
  return {
    queued: snapshot.counts.queued,
    processing: snapshot.counts.processing,
    failed: snapshot.counts.failed,
    completed24h: snapshot.counts.completed24h,
    storage: snapshot.guard,
  }
}

export function summariseValidationResults(
  targets: SettingsValidationTarget[],
  entries: SettingsValidationResultDto[],
) {
  const map = new Map(entries.map((entry) => [entry.target, entry]))
  return targets.map((target) => ({
    target,
    success: map.get(target)?.success ?? false,
    message: map.get(target)?.message ?? '未执行',
  }))
}

export function recordFrontendWebVital(entry: FrontendWebVitalEntry) {
  frontendWebVitals.push(entry)
  if (frontendWebVitals.length > FRONTEND_VITAL_LIMIT) {
    frontendWebVitals.shift()
  }
}

export function getFrontendWebVitalsSummary() {
  if (!frontendWebVitals.length) {
    return { total: 0, metrics: [], recent: [], lastSample: null }
  }

  const grouped = new Map<string, { values: number[]; ratings: Record<string, number> }>()

  for (const entry of frontendWebVitals) {
    const bucket = grouped.get(entry.name) ?? { values: [], ratings: {} }
    bucket.values.push(entry.value)
    bucket.ratings[entry.rating] = (bucket.ratings[entry.rating] || 0) + 1
    grouped.set(entry.name, bucket)
  }

  const metrics = Array.from(grouped.entries()).map(([name, data]) => {
    const sorted = [...data.values].sort((a, b) => a - b)
    const count = sorted.length
    const avg = sorted.reduce((acc, v) => acc + v, 0) / count
    const p95 = sorted[Math.min(count - 1, Math.floor(count * 0.95))]
    return {
      name,
      count,
      average: +avg.toFixed(2),
      p95: +p95.toFixed(2),
      ratings: data.ratings,
    }
  }).sort((a, b) => a.name.localeCompare(b.name))

  return {
    total: frontendWebVitals.length,
    metrics,
    recent: frontendWebVitals.slice(-20).reverse(),
    lastSample: frontendWebVitals.at(-1)?.timestamp ?? null,
  }
}
export function resetAdminObservability() {
  operations.length = 0
  alerts.length = 0
  frontendWebVitals.length = 0
  for (const key of Object.keys(operationCounters)) {
    delete operationCounters[key]
  }
}



