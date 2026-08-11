import {MetadataRoute} from 'next'

const DOMAIN = new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://bekten.art')
  .origin

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/og'],
        disallow: [
          '/api/',
          '/dashboard',
          '/*/dashboard',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: ['facebookexternalhit', 'Twitterbot', 'WhatsApp'],
        allow: ['/api/og', '/link-preview.jpg'],
      },
      {
        userAgent: [
          'GPTBot',
          'Google-Extended',
          'CCBot',
          'anthropic-ai',
          'Claude-Web',
        ],
        disallow: '/',
      },
    ],
    sitemap: `${DOMAIN}/sitemap.xml`,
    host: DOMAIN,
  }
}
