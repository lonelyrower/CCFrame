import { NextResponse } from 'next/server'

export const CSP_NONCE_HEADER = 'x-nonce'
export const LEGACY_CSP_NONCE_HEADER = 'x-request-nonce'

const LOGROCKET_SCRIPT_ENDPOINTS = [
  'https://cdn.lgrckt-in.com',
  'https://*.logrocket.io',
  'https://*.logrocket.com',
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
    'interest-cohort=()',
  ].join(', '),
}

const HTTPS_ONLY_SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
}

type SecurityHeaderOptions = {
  nonce?: string
}

function isProduction() {
  return process.env.NODE_ENV === 'production'
}

function shouldForceHttps() {
  if (!isProduction()) return false
  return process.env.FORCE_HTTPS !== 'false'
}

function buildContentSecurityPolicy({ nonce }: SecurityHeaderOptions): string {
  const scriptSrc = nonce
    ? [`'nonce-${nonce}'`, "'strict-dynamic'", "'self'", ...LOGROCKET_SCRIPT_ENDPOINTS]
    : ["'self'", ...LOGROCKET_SCRIPT_ENDPOINTS]

  if (!isProduction()) {
    scriptSrc.push("'unsafe-inline'", "'unsafe-eval'")
  }
  const directives: Array<[string, string[]]> = [
    ["default-src", ["'self'"]],
    ['script-src', scriptSrc],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", ["'self'", 'data:', 'blob:', 'https:']],
    ["font-src", ["'self'", 'data:']],
    ["connect-src", ["'self'", 'https:', 'wss:', ...LOGROCKET_SCRIPT_ENDPOINTS]],
    ["media-src", ["'self'", 'blob:']],
    ["object-src", ["'none'"]],
    ["child-src", ["'none'"]],
    ["worker-src", ["'self'", 'blob:']],
    ["frame-ancestors", ["'none'"]],
    ["form-action", ["'self'"]],
    ["base-uri", ["'self'"]],
  ]

  if (shouldForceHttps()) {
    directives.push(['upgrade-insecure-requests', []])
  }

  return directives
    .map(([name, values]) => (values.length ? `${name} ${values.join(' ')}` : name))
    .join('; ')
}

function resolveSecurityHeaders(options: SecurityHeaderOptions = {}): Record<string, string> {
  const headers: Record<string, string> = {
    ...BASE_SECURITY_HEADERS,
    'Content-Security-Policy': buildContentSecurityPolicy(options),
  }

  if (shouldForceHttps()) {
    Object.assign(headers, HTTPS_ONLY_SECURITY_HEADERS)
  }

  return headers
}

export function addSecurityHeaders(
  response: NextResponse,
  options: SecurityHeaderOptions = {}
): NextResponse {
  Object.entries(resolveSecurityHeaders(options)).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  if (options.nonce) {
    response.headers.set('x-csp-nonce', options.nonce)
    response.headers.set(LEGACY_CSP_NONCE_HEADER, options.nonce)
  }

  return response
}

export function createSecureResponse(
  body?: BodyInit | null,
  init?: ResponseInit,
  options: SecurityHeaderOptions = {}
): NextResponse {
  const response = new NextResponse(body, init)
  return addSecurityHeaders(response, options)
}

export function secureJsonResponse(
  data: any,
  status: number = 200,
  headers: Record<string, string> = {},
  options: SecurityHeaderOptions = {}
): NextResponse {
  const response = NextResponse.json(data, {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json; charset=utf-8',
    },
  })

  return addSecurityHeaders(response, options)
}
