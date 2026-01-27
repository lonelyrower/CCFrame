const imageHostEnv = process.env.NEXT_PUBLIC_IMAGE_HOSTS ?? 'imagedelivery.net';
const remoteImageHosts = imageHostEnv
  .split(',')
  .map((host) => host.trim())
  .filter(Boolean);

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
