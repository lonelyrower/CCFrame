/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true, // Use Cloudflare image optimization instead
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  // Enable standalone output for Docker
  output: 'standalone',
};

export default nextConfig;
