/* eslint-disable @next/next/no-img-element */
import {headers} from 'next/headers'
import {ImageResponse} from 'next/og'

import {configs} from '@/configs'
import {ME} from '@/constants'

export async function GET(request: Request) {
  const {searchParams} = new URL(request.url)
  const page = searchParams.get('page')
  const title = searchParams.get('title')
  const description = searchParams.get('description') || ME.descriptionFull
  const headersList = await headers()
  const host = headersList.get('host')
  const protocal = configs.isDevelopment ? 'http' : 'https'
  const domain = `${protocal}://${host}`

  // Get theme colors based on page
  const getThemeColors = (page: string | null) => {
    switch (page) {
      case 'gallery':
        return {
          bg: 'linear-gradient(135deg, #1a1a1a 0%, #2c3e50 100%)',
          accent: '#f4d03f',
        }
      case 'about':
        return {
          bg: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
          accent: '#e8daef',
        }
      case 'news':
        return {
          bg: 'linear-gradient(135deg, #0d1421 0%, #1e3a8a 100%)',
          accent: '#aed6f1',
        }
      case 'contact':
        return {
          bg: 'linear-gradient(135deg, #1b4332 0%, #2d5016 100%)',
          accent: '#95e5a6',
        }
      case 'store':
        return {
          bg: 'linear-gradient(135deg, #722f37 0%, #8b1538 100%)',
          accent: '#f1948a',
        }
      default:
        return {
          bg: 'radial-gradient(circle, rgba(70, 71, 122, 1) 0%, rgba(11, 17, 32, 1) 100%)',
          accent: '#ffa500',
        }
    }
  }

  const colors = getThemeColors(page)

  const response = new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '60px',
          padding: '60px',
          background: colors.bg,
          position: 'relative',
        }}
      >
        {/* Artistic Background Elements */}
        <div
          style={{
            position: 'absolute',
            top: '30px',
            left: '30px',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: colors.accent,
            opacity: 0.1,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '80px',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: colors.accent,
            opacity: 0.15,
          }}
        />

        {/* Profile Image */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <img
            src={`${domain}/me.jpg`}
            alt="Bekten Usubaliev - Contemporary Oil Painter"
            width={280}
            height={280}
            style={{
              border: `6px solid ${colors.accent}`,
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          />
        </div>

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '600px',
          }}
        >
          {/* Header with logo and page */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '30px',
            }}
          >
            <img
              src={`${domain}/svg/full-logo.svg`}
              alt="Bekten Art Logo"
              height={50}
              style={{filter: 'brightness(0) invert(1)'}}
            />
            {page && (
              <span
                style={{
                  color: colors.accent,
                  fontSize: '40px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                }}
              >
                / {page}
              </span>
            )}
          </div>

          {/* Title */}
          {title && (
            <h1
              style={{
                fontSize: Math.min(
                  42,
                  Math.max(28, 500 / (title.length || 10)),
                ),
                fontWeight: 'bold',
                margin: '0 0 20px 0',
                color: colors.accent,
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
          )}

          {/* Description */}
          <p
            style={{
              color: 'white',
              fontSize: '22px',
              lineHeight: '32px',
              margin: 0,
              opacity: 0.9,
            }}
          >
            {description}
          </p>

          {/* Website URL */}
          <div
            style={{
              marginTop: '30px',
              color: colors.accent,
              fontSize: '18px',
              letterSpacing: '1px',
              opacity: 0.8,
            }}
          >
            bekten.art
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control':
          'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        'Content-Type': 'image/png',
      },
    },
  )

  // Add additional headers for better caching and social media support
  response.headers.set(
    'Cache-Control',
    'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
  )
  response.headers.set('CDN-Cache-Control', 'public, max-age=86400')
  response.headers.set('Vercel-CDN-Cache-Control', 'public, max-age=86400')

  return response
}

export const runtime = 'edge'
