// Performance monitoring utilities for frontend optimization

type MetricName = 'render' | 'navigation' | 'resource'

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
}

interface ResourceSnapshot {
  timestamp: number
  totalKb: number
  scriptKb: number
  imageKb: number
  fontKb: number
  stylesheetKb: number
  otherKb: number
  requests: number
}

interface ConnectionInfo {
  effectiveType?: string
  downlink?: number
  saveData?: boolean
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private activeTimers: Map<string, number> = new Map()
  private resourceSnapshots: ResourceSnapshot[] = []
  private webVitalObservers: PerformanceObserver[] = []

  startTimer(name: string): void {
    if (typeof window === 'undefined' || !window.performance) return

    this.activeTimers.set(name, window.performance.now())
  }

  endTimer(name: string): number | null {
    if (typeof window === 'undefined' || !window.performance) return null

    const startTime = this.activeTimers.get(name)
    if (typeof startTime !== 'number') return null

    const duration = window.performance.now() - startTime
    this.activeTimers.delete(name)

    this.pushMetric({ name, duration, timestamp: Date.now() })
    return duration
  }

  private pushMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)

    // Keep a sliding window to avoid unbounded growth
    if (this.metrics.length > 150) {
      this.metrics = this.metrics.slice(-150)
    }
  }

  collectResourceSnapshot(): ResourceSnapshot | null {
    if (typeof window === 'undefined' || !window.performance?.getEntriesByType) return null

    const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    if (!resources.length) return null

    const summary = resources.reduce(
      (acc, resource) => {
        const transferKb = (resource.transferSize || 0) / 1024
        acc.totalKb += transferKb
        acc.requests += 1

        switch (resource.initiatorType) {
          case 'script':
          case 'fetch':
          case 'xmlhttprequest':
            acc.scriptKb += transferKb
            break
          case 'img':
          case 'image':
            acc.imageKb += transferKb
            break
          case 'font':
            acc.fontKb += transferKb
            break
          case 'link':
          case 'style':
            acc.stylesheetKb += transferKb
            break
          default:
            acc.otherKb += transferKb
        }

        return acc
      },
      {
        timestamp: Date.now(),
        totalKb: 0,
        scriptKb: 0,
        imageKb: 0,
        fontKb: 0,
        stylesheetKb: 0,
        otherKb: 0,
        requests: 0,
      } as ResourceSnapshot,
    )

    this.resourceSnapshots.push(summary)
    if (this.resourceSnapshots.length > 50) {
      this.resourceSnapshots.shift()
    }

    return summary
  }

  getResourceSnapshots(): ResourceSnapshot[] {
    return [...this.resourceSnapshots]
  }

  getLatestResourceSnapshot(): ResourceSnapshot | undefined {
    return this.resourceSnapshots.at(-1)
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getAverageTime(name: string): number {
    const relevant = this.metrics.filter((metric) => metric.name === name)
    if (relevant.length === 0) return 0

    const total = relevant.reduce((sum, metric) => sum + metric.duration, 0)
    return total / relevant.length
  }

  clear(): void {
    this.metrics = []
    this.activeTimers.clear()
    this.resourceSnapshots = []
    this.disconnectWebVitalObservers()
  }

  measureRender(componentName: string) {
    this.startTimer(`render:${componentName}`)

    return () => {
      const duration = this.endTimer(`render:${componentName}`)
      if (duration && process.env.NODE_ENV === 'development') {
        console.debug(`[perf] ${componentName} rendered in ${duration.toFixed(2)}ms`)
      }
    }
  }

  observeWebVitals(onMetric: (metric: string, value: number, attribution?: PerformanceEntry) => void) {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    this.disconnectWebVitalObservers()

    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries.at(-1)
      if (lastEntry) {
        onMetric('LCP', (lastEntry as any).startTime ?? 0, lastEntry)
      }
    })
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any) {
        if (entry.processingStart && entry.startTime) {
          const fid = entry.processingStart - entry.startTime
          onMetric('FID', fid, entry)
        }
      }
    })
    fidObserver.observe({ entryTypes: ['first-input'] })

    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any) {
        if (!entry.hadRecentInput && entry.value) {
          onMetric('CLS', entry.value, entry)
        }
      }
    })
    clsObserver.observe({ entryTypes: ['layout-shift'] })

    const inpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any) {
        if (entry.duration) {
          onMetric('INP', entry.duration, entry)
        }
      }
    })
    inpObserver.observe({ entryTypes: ['event'] })

    this.webVitalObservers = [lcpObserver, fidObserver, clsObserver, inpObserver]

    setTimeout(() => {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      if (navigation) {
        onMetric('TTFB', navigation.responseStart ?? 0, navigation)
        onMetric('DOM_READY', navigation.domContentLoadedEventEnd ?? 0, navigation)
        onMetric('LOAD', navigation.loadEventEnd ?? 0, navigation)
      }
    }, 1000)
  }

  private disconnectWebVitalObservers() {
    for (const observer of this.webVitalObservers) {
      observer.disconnect()
    }
    this.webVitalObservers = []
  }

  getConnectionInfo(): ConnectionInfo {
    if (typeof navigator === 'undefined') return {}
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (!connection) return {}

    return {
      effectiveType: connection.effectiveType,
      downlink: typeof connection.downlink === 'number' ? connection.downlink : undefined,
      saveData: Boolean(connection.saveData),
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()

// React Hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  if (typeof window === 'undefined') {
    return { startTimer: () => {}, endTimer: () => {}, measureRender: () => () => {} }
  }

  return {
    startTimer: () => performanceMonitor.startTimer(componentName),
    endTimer: () => performanceMonitor.endTimer(componentName),
    measureRender: () => performanceMonitor.measureRender(componentName),
  }
}

// Image loading performance tracker
export function trackImageLoading(imageId: string, variant: string = 'default') {
  const key = `image:${imageId}:${variant}`
  performanceMonitor.startTimer(key)

  return {
    onLoad: () => {
      const duration = performanceMonitor.endTimer(key)
      if (duration && process.env.NODE_ENV === 'development') {
        console.debug(`[perf] image ${imageId}/${variant} loaded in ${duration.toFixed(2)}ms`)
      }
      performanceMonitor.collectResourceSnapshot()
    },
    onError: () => {
      performanceMonitor.endTimer(key)
      console.warn(`[perf] image ${imageId}/${variant} failed to load`)
    },
  }
}

// API call performance tracker
export function trackApiCall(endpoint: string) {
  const key = `api:${endpoint}`
  performanceMonitor.startTimer(key)

  return {
    onComplete: () => {
      const duration = performanceMonitor.endTimer(key)
      if (duration && process.env.NODE_ENV === 'development') {
        console.debug(`[perf] api ${endpoint} completed in ${duration.toFixed(2)}ms`)
      }
    },
    onError: (error: unknown) => {
      performanceMonitor.endTimer(key)
      console.warn(`[perf] api ${endpoint} failed`, error)
    },
  }
}

export function shouldDeferPrefetch() {
  const info = performanceMonitor.getConnectionInfo()
  if (!info) return false
  if (info.saveData) return true
  if (info.effectiveType && ['slow-2g', '2g'].includes(info.effectiveType)) return true
  return false
}
