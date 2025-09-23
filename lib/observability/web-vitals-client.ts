import { onCLS, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'

let initialized = false
const endpoint = '/api/observability/web-vitals'
const sentMetrics = new Set<string>()

type MetricPayload = Metric & {
  page: string
  timestamp: number
  navigationType?: Metric['navigationType']
  connection?: {
    effectiveType?: string
    downlink?: number
    saveData?: boolean
  }
}

function sendMetric(metric: MetricPayload) {
  if (typeof navigator === 'undefined') return
  const body = JSON.stringify(metric)

  if (typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' })
    navigator.sendBeacon(endpoint, blob)
    return
  }

  void fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}

function normaliseMetric(metric: Metric): MetricPayload {
  const navigationType = (() => {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (!entry) return undefined
    return (entry.type === 'back_forward' ? 'back-forward' : entry.type) as Metric['navigationType']
  })()

  const connectionInfo = (() => {
    if (typeof navigator === 'undefined') return undefined
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (!connection) return undefined
    return {
      effectiveType: connection.effectiveType,
      downlink: typeof connection.downlink === 'number' ? connection.downlink : undefined,
      saveData: Boolean(connection.saveData),
    }
  })()

  return {
    ...metric,
    page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    timestamp: Date.now(),
    ...(navigationType ? { navigationType } : {}),
    ...(connectionInfo ? { connection: connectionInfo } : {}),
  }
}

export function initWebVitalsReporting() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  const report = (metric: Metric) => {
    const dedupeKey = `${metric.name}-${metric.id}`
    if (sentMetrics.has(dedupeKey)) return
    sentMetrics.add(dedupeKey)
    sendMetric(normaliseMetric(metric))
  }

  onCLS(report, { reportAllChanges: true })
  onINP(report, { reportAllChanges: true })
  onLCP(report, { reportAllChanges: true })
  onTTFB(report)
}
