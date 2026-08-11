import Image from 'next/image'

import type {PublicEditorialMediaPlacement} from '@/server/public-editorial'

type PublicEditorialImageProps = Readonly<{
  media: PublicEditorialMediaPlacement
  priority?: boolean
  sizes: string
}>

export function PublicEditorialImage({
  media,
  priority = false,
  sizes,
}: PublicEditorialImageProps) {
  const width = media.width ?? 1200
  const height = media.height ?? 1500

  return (
    <Image
      alt={media.altText}
      height={height}
      priority={priority}
      sizes={sizes}
      src={media.url}
      unoptimized={media.url.startsWith('/api/media/')}
      width={width}
    />
  )
}
