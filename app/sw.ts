/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { setCatchHandler } from 'workbox-routing/setCatchHandler'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

declare const self: ServiceWorkerGlobalScope & typeof globalThis
declare const __WB_MANIFEST: Array<{ url: string; revision?: string }>

interface SyncEvent extends ExtendableEvent {
  readonly tag: string
}

declare global {
  interface ServiceWorkerGlobalScopeEventMap {
    sync: SyncEvent
  }
}

clientsClaim()

const OFFLINE_PAGE = '/offline.html'
const OFFLINE_IMAGE_PLACEHOLDER = '/icons/icon-192.png'
const PREFETCH_CACHE = 'prefetch-assets'
const PRECACHE_MANIFEST = [...(__WB_MANIFEST || []), { url: OFFLINE_PAGE, revision: '1' }, { url: OFFLINE_IMAGE_PLACEHOLDER, revision: '1' }]

cleanupOutdatedCaches()
precacheAndRoute(PRECACHE_MANIFEST)

self.addEventListener('message', (event) => {
  if (!event.data) return

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
    return
  }

  if (event.data.type === 'PREFETCH_URLS' && Array.isArray(event.data.urls)) {
    const urls: string[] = event.data.urls
    event.waitUntil(prefetchAssets(urls))
  }
})

async function prefetchAssets(urls: string[]) {
  if (!urls.length) return

  try {
    const cache = await caches.open(PREFETCH_CACHE)
    await Promise.all(
      urls.map(async (url) => {
        try {
          const response = await fetch(url, { credentials: 'include', mode: 'cors' })
          if (response.ok) {
            await cache.put(url, response.clone())
          }
        } catch (error) {
          console.warn('[sw] prefetch failed', url, error)
        }
      }),
    )
  } catch (error) {
    console.warn('[sw] opening prefetch cache failed', error)
  }
}

setCatchHandler(async ({ request }) => {
  if (request.mode === 'navigate') {
    const response = await caches.match(OFFLINE_PAGE)
    return response ?? Response.error()
  }

  if (request.destination === 'image') {
    const fallback = await caches.match(OFFLINE_IMAGE_PLACEHOLDER)
    if (fallback) return fallback
  }

  return Response.error()
})

// HTML shell: network first with cache fallback
registerRoute(
  ({ request }: { request: Request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
  }),
)

// Next.js data JSON (/_next/data/*.json)
registerRoute(
  ({ url }: { url: URL }) => url.pathname.startsWith('/_next/data/'),
  new StaleWhileRevalidate({
    cacheName: 'next-data',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 }),
    ],
  }),
)

// Next.js static assets
registerRoute(
  ({ url }: { url: URL }) => url.pathname.startsWith('/_next/static'),
  new CacheFirst({
    cacheName: 'next-static-assets',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
)

// JS / CSS / fonts: SWR for freshness
registerRoute(
  ({ request }: { request: Request }) =>
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'static-assets',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
  }),
)

// Google Fonts stylesheets
registerRoute(
  ({ url }: { url: URL }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-styles',
  }),
)

// Google Fonts font files
registerRoute(
  ({ url }: { url: URL }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  }),
)

// Image assets and streaming image API
registerRoute(
  ({ request, url }: { request: Request; url: URL }) =>
    request.destination === 'image' ||
    url.pathname.startsWith('/api/image/') ||
    (url.pathname.startsWith('/api/photos/') && url.pathname.includes('/variants')),
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  }),
)

// JSON/meta feeds (catalog snapshots, runtime config, etc.)
registerRoute(
  ({ request, url }: { request: Request; url: URL }) =>
    request.method === 'GET' &&
    (request.destination === '') &&
    (url.pathname.endsWith('.json') || url.pathname.startsWith('/api/runtime-config')),
  new StaleWhileRevalidate({
    cacheName: 'json-feeds',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 60 * 10 }),
    ],
  }),
)

// Generic API fallback: network-first with short cache window
registerRoute(
  ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api',
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 5 }),
    ],
  }),
)

// Background sync placeholder
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'upload-photos') {
    // Handle background sync for photo uploads
  }
})
