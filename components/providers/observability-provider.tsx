"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import LogRocket from 'logrocket'
import * as Sentry from '@sentry/nextjs'

import { initWebVitalsReporting } from '@/lib/observability/web-vitals-client'

interface ObservabilityContextValue {
  statusMessage: string | null
  setStatusMessage: (message: string | null) => void
  captureBreadcrumb: (breadcrumb: { message: string; category?: string; level?: Sentry.SeverityLevel | string; data?: Record<string, unknown> }) => void
}

const ObservabilityContext = createContext<ObservabilityContextValue | null>(null)

function StatusBridge({ message }: { message: string | null }) {

  useEffect(() => {
    if (typeof document === 'undefined') return
    const region = document.getElementById('app-shell-status-region')
    if (region) {
      region.textContent = message ?? ''
    }
  }, [message])

  return null
}

let sentryInitialized = false
let logrocketInitialized = false

function ensureSentry() {
  if (sentryInitialized) return
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return

  try {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.05,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1,
      ignoreErrors: ['ResizeObserver loop limit exceeded'],
    })
    sentryInitialized = true
  } catch (error) {
    console.warn('[observability] Sentry init failed', error)
  }
}

function ensureLogRocket() {
  if (logrocketInitialized) return
  const appId = process.env.NEXT_PUBLIC_LOGROCKET_APP_ID
  if (!appId) return

  try {
    LogRocket.init(appId, {
      release: process.env.NEXT_PUBLIC_COMMIT_SHA,
    })
    logrocketInitialized = true
  } catch (error) {
    console.warn('[observability] LogRocket init failed', error)
  }
}

export function ObservabilityProvider({ children }: { children: ReactNode }) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    initWebVitalsReporting()
    ensureSentry()
    ensureLogRocket()
  }, [])

  const captureBreadcrumb: ObservabilityContextValue['captureBreadcrumb'] = (breadcrumb) => {
    try {
      Sentry.addBreadcrumb({
        message: breadcrumb.message,
        category: breadcrumb.category,
        level: breadcrumb.level as Sentry.SeverityLevel,
        data: breadcrumb.data,
      })
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[observability] breadcrumb capture failed', error)
      }
    }

    try {
      if (logrocketInitialized) {
        LogRocket.log(`[crumb] ${breadcrumb.message}`)
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[observability] logrocket breadcrumb failed', error)
      }
    }
  }

  const value = useMemo<ObservabilityContextValue>(
    () => ({ statusMessage, setStatusMessage, captureBreadcrumb }),
    [statusMessage],
  )

  return (
    <ObservabilityContext.Provider value={value}>
      {children}
      <StatusBridge message={statusMessage} />
    </ObservabilityContext.Provider>
  )
}

export function useObservability() {
  const ctx = useContext(ObservabilityContext)
  if (!ctx) {
    throw new Error('useObservability must be used within ObservabilityProvider')
  }
  return ctx
}



