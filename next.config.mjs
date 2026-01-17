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
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
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
