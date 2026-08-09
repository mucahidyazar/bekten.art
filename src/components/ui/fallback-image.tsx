'use client'

import Image, {ImageProps} from 'next/image'

import {useState} from 'react'

interface FallbackImageProps extends Omit<ImageProps, 'src' | 'onError'> {
  src: string
  alt: string
  title?: string
  loading?: 'lazy' | 'eager'
  priority?: boolean
  sizes?: string
  quality?: number
}

export function FallbackImage({
  src,
  alt,
  title,
  loading = 'lazy',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85,
  ...props
}: FallbackImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (failedSrc === src) return null

  const handleError = () => {
    if (failedSrc !== src) {
      setFailedSrc(src)
    }
  }

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      title={title || alt}
      loading={priority ? undefined : loading}
      priority={priority || undefined}
      sizes={sizes}
      quality={quality}
      onError={handleError}
    />
  )
}
