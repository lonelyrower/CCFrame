/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false, // Disable SWC minifier to avoid potential issues
  experimental: {
    forceSwcTransforms: false,
  },
}

module.exports = nextConfig