const withAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: false, // 开发时禁用严格模式提升性能
  swcMinify: process.env.NODE_ENV === 'production',
  output: 'standalone',
  // 构建性能优化
  webpack: (config, { dev, isServer }) => {
    // 生产环境构建优化
    if (!dev) {
      // 优化模块解析
      config.resolve.symlinks = false
      
      // 限制并行处理数量，避免内存溢出
      config.parallelism = 2
      
      // 优化分包策略（保持简单）
      if (config.optimization && config.optimization.splitChunks) {
        config.optimization.splitChunks = {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        }
      }
    }
    
    return config
  },
  // 允许外网访问开发服务器
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: ['172.22.230.246'],
  }),
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: true,
    },
  }),
  // 构建性能优化 - 在 Docker 构建时跳过类型检查和 ESLint
  typescript: {
    ignoreBuildErrors: true, // Docker 环境中跳过 TS 检查以提升构建速度
  },
  eslint: {
    ignoreDuringBuilds: true, // Docker 环境中跳过 ESLint 检查以提升构建速度
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp', 'exifr'],
    optimizePackageImports: ['lucide-react', '@aws-sdk/client-s3'],
    // 开发环境优化：禁用慢速功能
    ...(process.env.NODE_ENV === 'development' && {
      webVitalsAttribution: [],
      optimizeCss: false,
      esmExternals: true,
      turbo: {
        rules: {
          '*.svg': {
            loaders: ['@svgr/webpack'],
            as: '*.js',
          },
        },
      },
    }),
  },
  images: {
    // 我们已在后端生成多尺寸/格式的变体，禁用 Next 内置优化，
    // 直接使用 /api/image 路由，避免 /_next/image 二次代理导致的 500。
    unoptimized: true,
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
  // Use streaming image route by default to avoid exposing internal S3 endpoints
  // and ensure images load even when storage hostname isn't publicly resolvable.
  // If you prefer redirect-based serving, reintroduce a rewrite to
  // '/api/image/serve/:id/:variant'.
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
