import {MetadataRoute} from 'next'

const DOMAIN = process.env.NEXT_PUBLIC_APP_URL || 'https://bekten.art'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/*',
          '/admin/*',
          '/auth/*',
          '/_next/*',
          '/private/*',
          '/*.json$',
          '/node_modules/*',
        ],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/api/og*', // Allow OG image generation for Google
        ],
        disallow: [
          '/api/*',
          '/admin/*',
          '/auth/*',
          '/_next/static/*',
          '/private/*',
        ],
      },
      {
        userAgent: 'facebookexternalhit',
        allow: [
          '/',
          '/api/og*', // Allow OG image generation for Facebook/WhatsApp
        ],
        disallow: ['/admin/*', '/auth/*', '/private/*'],
      },
      {
        userAgent: 'Twitterbot',
        allow: [
          '/',
          '/api/og*', // Allow OG image generation for Twitter
        ],
        disallow: ['/admin/*', '/auth/*', '/private/*'],
      },
      {
        userAgent: 'WhatsApp',
        allow: [
          '/',
          '/api/og*', // Allow OG image generation for WhatsApp
          '/link-preview.jpg',
        ],
        disallow: ['/admin/*', '/auth/*', '/private/*'],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'Google-Extended',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/',
      },
      {
        userAgent: 'Claude-Web',
        disallow: '/',
      },
    ],
    sitemap: `${DOMAIN}/sitemap.xml`,
    host: DOMAIN,
  }
}
