'use client'

import Image, {ImageProps} from 'next/image'

import {useState, useEffect} from 'react'

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
  const [imageError, setImageError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc)

  // Reset when src prop changes
  useEffect(() => {
    if (src && src !== currentSrc && !imageError) {
      setCurrentSrc(src)
      setImageError(false)
    } else if (!src) {
      setCurrentSrc(fallbackSrc)
      setImageError(false)
    }
  }, [src, fallbackSrc, currentSrc, imageError])

  const handleError = () => {
    if (!imageError && currentSrc !== fallbackSrc) {
      setImageError(true)
      setCurrentSrc(fallbackSrc)
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
