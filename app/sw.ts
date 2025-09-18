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
const PRECACHE_MANIFEST = [...(__WB_MANIFEST || []), { url: OFFLINE_PAGE, revision: '1' }, { url: OFFLINE_IMAGE_PLACEHOLDER, revision: '1' }]

cleanupOutdatedCaches()
precacheAndRoute(PRECACHE_MANIFEST)

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

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

// HTML shell: network first so最新内容仍优先，再回退缓存
registerRoute(
  ({ request }: { request: Request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
  })
)

// Next.js 构建产物使用 CacheFirst，减少重复下载
registerRoute(
  ({ url }: { url: URL }) => url.pathname.startsWith('/_next/static'),
  new CacheFirst({
    cacheName: 'next-static-assets',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
)

// JS / CSS / 字体等静态资源：SWR 确保更新及时
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
  })
)

// Google Fonts 样式表：快速更新
registerRoute(
  ({ url }: { url: URL }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-styles',
  })
)

// Google Fonts 字体文件：长效缓存
registerRoute(
  ({ url }: { url: URL }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
)

// 图片资源：缓存优先并限制体积
registerRoute(
  ({ request, url }: { request: Request; url: URL }) => request.destination === 'image' || url.pathname.startsWith('/api/image/'),
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 }),
    ],
  })
)

// API 请求：网络优先，离线时使用缓存数据
registerRoute(
  ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api',
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 5 }),
    ],
  })
)

// 处理后台同步（占位）
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'upload-photos') {
    // Handle background sync for photo uploads
  }
})
