"use client"

import { useEffect, useState } from 'react'

/**
 * 性能监控组件 - 检测设备性能并提供优化建议
 */
export function usePerformanceOptimization() {
  const [shouldReduceBlur, setShouldReduceBlur] = useState(false)
  const [shouldReduceAnimations, setShouldReduceAnimations] = useState(false)

  useEffect(() => {
    // 检测设备性能
    const checkPerformance = () => {
      // 1. 检测硬件并发数（CPU 核心数）
      const cpuCores = navigator.hardwareConcurrency || 2
      const isLowEndDevice = cpuCores <= 2

      // 2. 检测内存（如果可用）
      const memory = (navigator as any).deviceMemory
      const isLowMemory = memory && memory <= 2

      // 3. 检测用户偏好
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // 4. 检测连接质量
      const connection = (navigator as any).connection
      const isSlowConnection = connection && (
        connection.effectiveType === 'slow-2g' || 
        connection.effectiveType === '2g' ||
        connection.saveData === true
      )

      // 根据检测结果决定是否降级
      if (isLowEndDevice || isLowMemory || isSlowConnection) {
        setShouldReduceBlur(true)
      }

      if (prefersReducedMotion) {
        setShouldReduceAnimations(true)
      }
    }

    checkPerformance()

    // 监听连接变化
    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', checkPerformance)
      return () => connection.removeEventListener('change', checkPerformance)
    }
  }, [])

  return {
    shouldReduceBlur,
    shouldReduceAnimations,
    isPerformanceMode: shouldReduceBlur || shouldReduceAnimations
  }
}

/**
 * 性能优化的 CSS 类生成器
 */
export function getOptimizedClassName(
  baseClass: string,
  shouldOptimize: boolean,
  optimizedClass: string
): string {
  return shouldOptimize ? optimizedClass : baseClass
}
