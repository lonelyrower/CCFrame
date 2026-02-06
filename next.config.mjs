const imageHostEnv = process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? 'imagedelivery.net';
const remoteImageHosts = imageHostEnv
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);
const isDev = process.env.NODE_ENV !== 'production';

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https:${isDev ? ' ws: wss:' : ''}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

if (!isDev) {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: remoteImageHosts.map((hostname) => ({
      protocol: 'https',
      hostname,
    })),
    unoptimized: true, // Use Cloudflare image optimization instead
    // Next.js 16+ requires explicit qualities
    qualities: [25, 50, 75, 88, 90, 95, 100],
    // Enable AVIF for modern browsers with WebP fallback
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    // Enable View Transitions API (Next.js 16+)
    viewTransition: true,
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // React Compiler moved to top-level in Next.js 16
  // Disabled by default as it requires babel-plugin-react-compiler
  // reactCompiler: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
  // Enable standalone output for Docker
  output: 'standalone',
};

export default nextConfig;
