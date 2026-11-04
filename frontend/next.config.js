/** @type {import('next').NextConfig} */
const apiBase =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:8000';

const nextConfig = {
  images: { unoptimized: true },
  output: 'standalone',
  async rewrites() {
    return [{ source: '/media/:path*', destination: `${apiBase}/media/:path*` }];
  },
};

module.exports = nextConfig;
