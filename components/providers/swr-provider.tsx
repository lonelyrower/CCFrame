'use client'

import { SWRConfig } from 'swr'
import type { Key, Middleware, SWRConfiguration } from 'swr'
import { ReactNode } from 'react'
import toast from 'react-hot-toast'

interface SWRProviderProps {
  children: ReactNode
}

type SWRKey = Key

const formatKey = (key: SWRKey): string => {
  if (typeof key === 'string') return key
  if (Array.isArray(key)) {
    return key.filter(Boolean).map((item) => String(item)).join(' | ')
  }
  return String(key)
}

const extractMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return ''
}

const handleError = (error: unknown, key: SWRKey) => {
  const message = extractMessage(error)
  console.error('SWR Error:', formatKey(key), error)

  if (!message) {
    if (process.env.NODE_ENV === 'development') {
      toast.error('SWR 请求发生未知错误')
    }
    return
  }

  if (message.includes('401')) {
    toast.error('请重新登录')
  } else if (message.includes('403')) {
    toast.error('没有权限访问该资源')
  } else if (message.includes('404')) {
    console.warn('Resource not found:', formatKey(key))
  } else if (message.includes('500')) {
    toast.error('服务器繁忙，请稍后再试')
  } else if (message.includes('网络')) {
    toast.error('网络连接异常')
  } else if (process.env.NODE_ENV === 'development') {
    toast.error(`SWR 请求错误: ${message}`)
  }
}

const handleSuccess = (data: unknown, key: SWRKey) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('SWR Success:', formatKey(key), data)
  }
}

const timingMiddleware: Middleware = (useSWRNext) => {
  return (key, fetcher, config) => {
    const start = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const originalOnSuccess = config?.onSuccess
    const originalOnError = config?.onError

    const nextConfig: SWRConfiguration = {
      ...(config || {}),
      onSuccess: (data: unknown, keyArg: Key, cfg: Readonly<SWRConfiguration>) => {
        const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start

        if (process.env.NODE_ENV === 'development') {
          console.log(`[SWR] ${formatKey(keyArg)} completed in ${duration.toFixed(2)}ms`)
        }

        if (typeof originalOnSuccess === 'function') {
          (originalOnSuccess as (data: unknown, key: Key, cfg: Readonly<SWRConfiguration>) => void)(data, keyArg, cfg)
        }

        handleSuccess(data, keyArg)
      },
      onError: (error: unknown, keyArg: Key, cfg: Readonly<SWRConfiguration>) => {
        const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start

        if (process.env.NODE_ENV === 'development') {
          console.warn(`[SWR] ${formatKey(keyArg)} failed after ${duration.toFixed(2)}ms`)
        }

        if (typeof originalOnError === 'function') {
          (originalOnError as (error: unknown, key: Key, cfg: Readonly<SWRConfiguration>) => void)(error, keyArg, cfg)
        }

        handleError(error, keyArg)
      },
    }

    return useSWRNext(key, fetcher, nextConfig)
  }
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        refreshInterval: 0,
        dedupingInterval: 2000,
        errorRetryCount: 3,
        errorRetryInterval: 1000,
        onError: handleError,
        onSuccess: handleSuccess,
        keepPreviousData: true,
        compare: (a: unknown, b: unknown) => {
          if (a === b) return true
          if (!a || !b) return false

          if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false
            return a.every((item, index) => {
              const counterpart = b[index] as unknown
              if (item && counterpart && typeof item === 'object' && typeof counterpart === 'object') {
                const leftRecord = item as { id?: unknown; updatedAt?: unknown }
                const rightRecord = counterpart as { id?: unknown; updatedAt?: unknown }
                if (leftRecord.id !== undefined && rightRecord.id !== undefined && leftRecord.updatedAt !== undefined && rightRecord.updatedAt !== undefined) {
                  return leftRecord.id === rightRecord.id && leftRecord.updatedAt === rightRecord.updatedAt
                }
              }
              return item === counterpart
            })
          }

          return false
        },
        use: [timingMiddleware],
        fallback: {},
        loadingTimeout: 30000,
        focusThrottleInterval: 5000,
      }}
    >
      {children}
    </SWRConfig>
  )
}
