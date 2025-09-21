'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface CSRFToken {
  token: string
  expires: number
}

export function useCSRF() {
  const [csrfToken, setCSRFToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { data: session } = useSession()

  const fetchToken = useCallback(async () => {
    if (!session?.user) {
      setCSRFToken(null)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/csrf-token')
      if (response.ok) {
        const data: CSRFToken = await response.json()
        setCSRFToken(data.token)

        // 在过期前自动刷新令牌
        const refreshTime = data.expires - Date.now() - (5 * 60 * 1000) // 5分钟前刷新
        if (refreshTime > 0) {
          setTimeout(fetchToken, refreshTime)
        }
      } else {
        setCSRFToken(null)
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error)
      setCSRFToken(null)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    fetchToken()
  }, [fetchToken])

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken
    }

    return headers
  }, [csrfToken])

  const secureRequest = useCallback(async (
    url: string,
    options: RequestInit = {}
  ) => {
    const headers = getHeaders()

    return fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    })
  }, [getHeaders])

  return {
    csrfToken,
    loading,
    getHeaders,
    secureRequest,
    refreshToken: fetchToken
  }
}