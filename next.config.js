let withAnalyzer = (config) => config
try {
  withAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  })
} catch (error) {
  // @next/bundle-analyzer is not installed, skip analysis
}

const enforceTypeChecks = process.env.ENFORCE_TYPECHECKS === 'true'
if (!enforceTypeChecks && process.env.NODE_ENV === 'production') {
  console.warn('[build] TypeScript build errors are currently ignored. Set ENFORCE_TYPECHECKS=true to enforce them once the schema drift is resolved.')
}

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: false, // ����ʱ�����ϸ�ģʽ��������
  poweredByHeader: false,
  compress: true,
  // ���������Ż�
  webpack: (config, { dev, isServer }) => {
    // �������������Ż�
    if (!dev) {
      // �Ż�ģ�����
      config.resolve.symlinks = false

      // ���Ʋ��д��������������ڴ����
      config.parallelism = 2

      // �Ż��ְ����ԣ����ּ򵥣�
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
  // �����������ʿ���������
  ...(process.env.NODE_ENV === 'development' && {
    allowedDevOrigins: ['172.22.230.246'],
  }),
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: true,
    },
  }),
  typescript: {
    ignoreBuildErrors: !enforceTypeChecks,
  },
  serverExternalPackages: ['sharp', 'exifr'],
  experimental: {
    optimizePackageImports: ['lucide-react', '@aws-sdk/client-s3'],
    webVitalsAttribution: ['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB'],
    // 优化资源加载
    fetchCacheKeyPrefix: 'cc-frame-',
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    // ���������Ż����������ٹ���
    ...(process.env.NODE_ENV === 'development' && {
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
    // �������ں�����ɶ�ߴ�/��ʽ�ı��壬���� Next �����Ż���
    // ֱ��ʹ�� /api/image ·�ɣ����� /_next/image ���δ������µ� 500��
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      // ����ͨ�� http ���� MinIO/S3 ǩ����ַ������/��������������
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
      // Let Next.js handle static file headers automatically
      // Removed custom CSS/JS headers that may conflict with Next.js internal handling
      ...(process.env.NODE_ENV === 'production' ? [
        {
          source: '/((?!_next/static).*)',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'SAMEORIGIN',
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
          ],
        },
      ] : []),
    ]
  },
}

module.exports = withAnalyzer(baseConfig)
