// Performance monitoring utilities for frontend optimization

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private activeTimers: Map<string, number> = new Map()

  startTimer(name: string): void {
    if (typeof window === 'undefined' || !window.performance) return

    this.activeTimers.set(name, window.performance.now())
  }

  endTimer(name: string): number | null {
    if (typeof window === 'undefined' || !window.performance) return null

    const startTime = this.activeTimers.get(name)
    if (!startTime) return null

    const duration = window.performance.now() - startTime
    this.activeTimers.delete(name)

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now()
    }

    this.metrics.push(metric)

    // Keep only last 100 metrics to prevent memory leak
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }

    return duration
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getAverageTime(name: string): number {
    const relevant = this.metrics.filter(m => m.name === name)
    if (relevant.length === 0) return 0

    const total = relevant.reduce((sum, m) => sum + m.duration, 0)
    return total / relevant.length
  }

  clearMetrics(): void {
    this.metrics = []
    this.activeTimers.clear()
  }

  // React hook for measuring component render time
  measureRender(componentName: string) {
    this.startTimer(`render:${componentName}`)

    return () => {
      const duration = this.endTimer(`render:${componentName}`)
      if (duration && process.env.NODE_ENV === 'development') {
        console.log(`🔍 ${componentName} rendered in ${duration.toFixed(2)}ms`)
      }
    }
  }

  // Report current Core Web Vitals
  reportWebVitals(): void {
    if (typeof window === 'undefined' || !window.performance) return

    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          if (lastEntry?.startTime) {
            console.log(`📊 LCP: ${lastEntry.startTime.toFixed(2)}ms`)
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) {
              const fid = entry.processingStart - entry.startTime
              console.log(`📊 FID: ${fid.toFixed(2)}ms`)
            }
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })

        // Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          if (clsValue > 0) {
            console.log(`📊 CLS: ${clsValue.toFixed(4)}`)
          }
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (error) {
        console.warn('Performance observer not supported:', error)
      }
    }

    // Navigation Timing
    setTimeout(() => {
      const navigation = window.performance.getEntriesByType('navigation')[0] as any
      if (navigation) {
        console.log(`📊 Page Load: ${navigation.loadEventEnd.toFixed(2)}ms`)
        console.log(`📊 DOM Ready: ${navigation.domContentLoadedEventEnd.toFixed(2)}ms`)
      }
    }, 1000)
  }
}

export const performanceMonitor = new PerformanceMonitor()

// React Hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  if (typeof window === 'undefined') return { startTimer: () => {}, endTimer: () => {} }

  return {
    startTimer: () => performanceMonitor.startTimer(componentName),
    endTimer: () => performanceMonitor.endTimer(componentName),
    measureRender: () => performanceMonitor.measureRender(componentName)
  }
}

// Image loading performance tracker
export function trackImageLoading(imageId: string, variant: string = 'small') {
  const key = `image:${imageId}:${variant}`
  performanceMonitor.startTimer(key)

  return {
    onLoad: () => {
      const duration = performanceMonitor.endTimer(key)
      if (duration && process.env.NODE_ENV === 'development') {
        console.log(`🖼️ Image ${imageId}/${variant} loaded in ${duration.toFixed(2)}ms`)
      }
    },
    onError: () => {
      performanceMonitor.endTimer(key)
      console.warn(`❌ Image ${imageId}/${variant} failed to load`)
    }
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
        console.log(`🌐 API ${endpoint} completed in ${duration.toFixed(2)}ms`)
      }
    },
    onError: (error: any) => {
      performanceMonitor.endTimer(key)
      console.warn(`❌ API ${endpoint} failed:`, error)
    }
  }
}