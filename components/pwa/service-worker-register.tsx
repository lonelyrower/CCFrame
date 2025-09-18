'use client'

import { useEffect } from 'react'

const SW_URL = '/sw.js'
const REGISTRATION_OPTIONS: RegistrationOptions = { scope: '/' }

type ServiceWorkerMessage = {
  type: 'SKIP_WAITING'
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    let unmounted = false

    const visibilityListener = () => {
      if (document.visibilityState === 'visible') {
        navigator.serviceWorker
          .getRegistration(REGISTRATION_OPTIONS.scope)
          ?.then((registration) => registration?.update().catch(() => undefined))
      }
    }

    const sendSkipWaiting = (registration: ServiceWorkerRegistration) => {
      const waiting = registration.waiting
      if (waiting) {
        waiting.postMessage({ type: 'SKIP_WAITING' } satisfies ServiceWorkerMessage)
      }
    }

    const handleRegistration = (registration: ServiceWorkerRegistration) => {
      if (unmounted) return

      sendSkipWaiting(registration)

      registration.addEventListener('updatefound', () => {
        const { installing } = registration
        if (!installing) return

        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            sendSkipWaiting(registration)
          }
        })
      })
    }

    const controllerChangeListener = () => {
      console.info('[PWA] Service worker 已激活')
    }

    navigator.serviceWorker
      .register(SW_URL, REGISTRATION_OPTIONS)
      .then(handleRegistration)
      .catch((error) => {
        console.error('[PWA] Service worker 注册失败', error)
      })

    navigator.serviceWorker.addEventListener('controllerchange', controllerChangeListener)
    document.addEventListener('visibilitychange', visibilityListener)

    return () => {
      unmounted = true
      navigator.serviceWorker.removeEventListener('controllerchange', controllerChangeListener)
      document.removeEventListener('visibilitychange', visibilityListener)
    }
  }, [])

  return null
}
