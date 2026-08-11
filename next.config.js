/** @type {import('next').NextConfig} */
const withNextIntl = require('next-intl/plugin')(
  // This is the default (also the `src` folder is supported out of the box)
  './i18n.ts',
)

function toRemotePattern(rawUrl) {
  if (!rawUrl) {
    return null
  }

  try {
    const parsed = new URL(rawUrl)

    return {
      protocol: parsed.protocol.replace(':', ''),
      hostname: parsed.hostname,
      port: parsed.port || undefined,
    }
  } catch {
    return null
  }
}

const mediaEndpointPattern = toRemotePattern(process.env.MEDIA_S3_ENDPOINT)

const nextConfig = {
  ...withNextIntl(),
  output: 'standalone',
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GOOGLE_ANALYTICS_ID:
      process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
    NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID:
      process.env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: 'scontent.cdninstagram.com',
      },
      ...(mediaEndpointPattern ? [mediaEndpointPattern] : []),
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
    webpackBuildWorker: true,
  },
  poweredByHeader: false,
  compress: true,
  trailingSlash: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
