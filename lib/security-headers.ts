import { NextResponse } from 'next/server'

const BASE_CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "media-src 'self' blob:",
  "object-src 'none'",
  "child-src 'none'",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'"
]

const BASE_SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()'
  ].join(', ')
}

const HTTPS_ONLY_SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
}

function isProduction() {
  return process.env.NODE_ENV === 'production'
}

function shouldForceHttps() {
  if (!isProduction()) return false
  return process.env.FORCE_HTTPS !== 'false'
}

function resolveSecurityHeaders(): Record<string, string> {
  const forceHttps = shouldForceHttps()
  const cspDirectives = [...BASE_CSP_DIRECTIVES]

  if (forceHttps) {
    cspDirectives.push('upgrade-insecure-requests')
  }

  const headers: Record<string, string> = {
    ...BASE_SECURITY_HEADERS,
    'Content-Security-Policy': cspDirectives.join('; ')
  }

  if (forceHttps) {
    Object.assign(headers, HTTPS_ONLY_SECURITY_HEADERS)
  }

  return headers
}

export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(resolveSecurityHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export function createSecureResponse(
  body?: BodyInit | null,
  init?: ResponseInit
): NextResponse {
  const response = new NextResponse(body, init)
  return addSecurityHeaders(response)
}

export function secureJsonResponse(
  data: any,
  status: number = 200,
  headers: Record<string, string> = {}
): NextResponse {
  const response = NextResponse.json(data, {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json; charset=utf-8'
    }
  })

  return addSecurityHeaders(response)
}
