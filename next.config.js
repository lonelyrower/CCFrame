/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  experimental: {
    forceSwcTransforms: false,
    serverComponentsExternalPackages: ['sharp', 'exifr'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      // 允许通过 http 访问 MinIO/S3 签名地址（内网/开发环境常见）
      { protocol: 'http', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  async rewrites() {
    return [
      {
        source: '/api/image/:id/:variant',
        destination: '/api/image/serve/:id/:variant',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/api/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
