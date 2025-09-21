'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'
import toast from 'react-hot-toast'

interface SWRProviderProps {
  children: ReactNode
}

// Global SWR error handler
const handleError = (error: any, key: string) => {
  console.error('SWR Error:', key, error)

  // Show user-friendly error messages
  if (error.message?.includes('401')) {
    toast.error('请重新登录')
  } else if (error.message?.includes('403')) {
    toast.error('没有权限访问此资源')
  } else if (error.message?.includes('404')) {
    // Don't show 404 errors to user as they're often expected
    console.warn('Resource not found:', key)
  } else if (error.message?.includes('500')) {
    toast.error('服务器错误，请稍后重试')
  } else if (error.message?.includes('网络')) {
    toast.error('网络连接错误')
  } else if (process.env.NODE_ENV === 'development') {
    toast.error(`开发环境错误: ${error.message}`)
  }
}

// Global SWR success handler for mutations
const handleSuccess = (data: any, key: string) => {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('SWR Success:', key, data)
  }
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        // Global configuration
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        refreshInterval: 0,
        dedupingInterval: 2000,
        errorRetryCount: 3,
        errorRetryInterval: 1000,

        // Global error handling
        onError: handleError,
        onSuccess: handleSuccess,

        // Performance optimizations
        keepPreviousData: true,

        // Cache configuration
        compare: (a, b) => {
          // Custom comparison for better cache management
          if (a === b) return true
          if (!a || !b) return false

          // For arrays, compare length and shallow equality
          if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false
            return a.every((item, index) => {
              if (typeof item === 'object' && item !== null && b[index] !== null) {
                return item.id === b[index].id && item.updatedAt === b[index].updatedAt
              }
              return item === b[index]
            })
          }

          // For objects with id and updatedAt, use those for comparison
          if (
            typeof a === 'object' && typeof b === 'object' &&
            a !== null && b !== null &&
            'id' in a && 'id' in b &&
            'updatedAt' in a && 'updatedAt' in b
          ) {
            return a.id === b.id && a.updatedAt === b.updatedAt
          }

          return false
        },

        // Middleware for request/response processing
        use: [
          // Request middleware
          (useSWRNext) => (key, fetcher, config) => {
            // Add request timing
            const start = performance.now()

            return useSWRNext(key, fetcher, {
              ...config,
              onSuccess: (data, key, config) => {
                const duration = performance.now() - start

                if (process.env.NODE_ENV === 'development') {
                  console.log(`📊 SWR ${key} completed in ${duration.toFixed(2)}ms`)
                }

                // Call original onSuccess if provided
                if (config.onSuccess) {
                  config.onSuccess(data, key, config)
                }

                handleSuccess(data, key)
              },
              onError: (error, key, config) => {
                const duration = performance.now() - start

                if (process.env.NODE_ENV === 'development') {
                  console.warn(`❌ SWR ${key} failed after ${duration.toFixed(2)}ms`)
                }

                // Call original onError if provided
                if (config.onError) {
                  config.onError(error, key, config)
                }

                handleError(error, key)
              }
            })
          }
        ],

        // Fallback data for specific patterns
        fallback: {},

        // Loading timeout
        loadingTimeout: 30000,

        // Focus throttle
        focusThrottleInterval: 5000
      }}
    >
      {children}
    </SWRConfig>
  )
}