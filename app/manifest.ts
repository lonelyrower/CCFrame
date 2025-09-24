import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CC Frame - 我的摄影时光',
    short_name: 'CC Frame',
    description: 'CC Frame 是一个简洁优雅的个人相册，记录生活中的美好瞬间，分享摄影路上的点点滴滴',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#6366f1',
    orientation: 'portrait',
    categories: ['photography', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-256.png',
        sizes: '256x256',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/favicon.ico',
        sizes: '32x32',
        type: 'image/x-icon'
      }
    ]
  }
}
