/** @type {import('next').NextConfig} */
const withAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const baseConfig = {
  // 基础配置
  reactStrictMode: false,
  swcMinify: true,
  output: 'standalone',
  
  // 激进的构建性能优化
  typescript: {
    ignoreBuildErrors: true, // 跳过类型检查
  },
  eslint: {
    ignoreDuringBuilds: true, // 跳过 ESLint
  },
  
  // 最小化构建时间的 webpack 配置
  webpack: (config, { dev }) => {
    if (!dev) {
      // 生产环境激进优化
      config.optimization.minimize = true
      config.optimization.nodeEnv = 'production'
      
      // 禁用源码映射以加速构建
      config.devtool = false
      
      // 简化模块解析
      config.resolve.symlinks = false
      config.resolve.cacheWithContext = false
      
      // 限制并行度
      config.parallelism = 1
    }
    return config
  },
  
  // 生产环境配置
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: true,
    },
  }),
  
  // 实验性优化
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'exifr'],
    optimizePackageImports: ['lucide-react'],
    turbo: {}, // 启用 Turbopack（如果支持）
  },
  
  // 图片优化
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  
  // 缓存头
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

module.exports = withAnalyzer(baseConfig)