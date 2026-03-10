'use client'

import Image, {ImageProps} from 'next/image'

import {useState} from 'react'

interface FallbackImageProps extends Omit<ImageProps, 'src' | 'onError'> {
  src: string | undefined
  fallbackSrc: string
  alt: string
  title?: string
  loading?: 'lazy' | 'eager'
  priority?: boolean
  sizes?: string
  quality?: number
}

export function FallbackImage({
  src,
  fallbackSrc,
  alt,
  title,
  loading = 'lazy',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85,
  ...props
}: FallbackImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const currentSrc = src && failedSrc !== src ? src : fallbackSrc
  const imageError = !src || failedSrc === src

  const handleError = () => {
    if (src && failedSrc !== src) {
      setFailedSrc(src)
    }
  }

  // SEO optimized alt text - fallback için uyarı eklenir
  const optimizedAlt = imageError ? `${alt} (fallback image)` : alt

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={optimizedAlt}
      title={title || alt}
      loading={priority ? undefined : loading}
      priority={priority}
      sizes={sizes}
      quality={quality}
      onError={handleError}
    />
  )
}
