/** @type {import('next').NextConfig} */
const apiBase =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:8000';

const nextConfig = {
  images: { unoptimized: true },
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; img-src 'self' data: blob: http://localhost:8000 http://127.0.0.1:8000; media-src 'self' blob: http://localhost:8000 http://127.0.0.1:8000; connect-src 'self' http://localhost:8000 http://127.0.0.1:8000 ws:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'; base-uri 'self'",
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
  async rewrites() {
    return [{ source: '/media/:path*', destination: `${apiBase}/media/:path*` }];
  },
};

module.exports = nextConfig;
