/** @type {import('next').NextConfig} */
const nextConfig = {
  // LAN access: the platform is opened at http://10.215.8.74:3000.
  allowedDevOrigins: ['10.215.8.74', '192.168.184.1', 'localhost', '127.0.0.1'],
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons', 'lucide-react'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
