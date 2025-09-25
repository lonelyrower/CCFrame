'use client'

import { useEffect } from 'react'
import Script from 'next/script'

interface AnalyticsProviderProps {
  googleAnalyticsId?: string
  microsoftClarityId?: string
  enabled: boolean
}

export function AnalyticsProvider({ googleAnalyticsId, microsoftClarityId, enabled }: AnalyticsProviderProps) {
  useEffect(() => {
    // 只在生产环境且启用跟踪时加载
    if (!enabled || process.env.NODE_ENV !== 'production') {
      return
    }

    // Google Analytics 初始化
    if (googleAnalyticsId && typeof window !== 'undefined') {
      // @ts-ignore
      window.gtag = window.gtag || function (...args: any[]) {
        // @ts-ignore
        (window.dataLayer = window.dataLayer || []).push(args)
      }
      // @ts-ignore
      window.gtag('js', new Date())
      // @ts-ignore
      window.gtag('config', googleAnalyticsId)
    }

    // Microsoft Clarity 初始化
    if (microsoftClarityId && typeof window !== 'undefined') {
      // @ts-ignore
      window.clarity = window.clarity || function (...args: any[]) {
        // @ts-ignore
        (window.clarity.q = window.clarity.q || []).push(args)
      }
    }
  }, [googleAnalyticsId, microsoftClarityId, enabled])

  // 如果未启用或不在生产环境，不加载任何脚本
  if (!enabled || process.env.NODE_ENV !== 'production') {
    return null
  }

  return (
    <>
      {/* Google Analytics */}
      {googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAnalyticsId}');
            `}
          </Script>
        </>
      )}

      {/* Microsoft Clarity */}
      {microsoftClarityId && (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${microsoftClarityId}");
          `}
        </Script>
      )}
    </>
  )
}

// Analytics context for client-side tracking
export const Analytics = {
  // Track page view
  pageView: (url: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      // @ts-ignore
      window.gtag('config', window.GA_MEASUREMENT_ID, {
        page_path: url,
      })
    }
  },

  // Track events
  event: (action: string, parameters?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      // @ts-ignore
      window.gtag('event', action, parameters)
    }
  },

  // Set user properties
  setUser: (userId: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      // @ts-ignore
      window.gtag('config', window.GA_MEASUREMENT_ID, {
        user_id: userId,
      })
    }
  },
}