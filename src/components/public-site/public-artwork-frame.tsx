import Image from 'next/image'

import {PublicEditorialImage} from './public-editorial-image'

import type {PublicEditorialMediaPlacement} from '@/server/public-editorial'

type PublicArtworkFrameProps = Readonly<{
  className?: string
  fallbackAlt?: string
  fallbackSrc?: string
  media?: PublicEditorialMediaPlacement
  priority?: boolean
  sizes: string
}>

export function PublicArtworkFrame({
  className,
  fallbackAlt = '',
  fallbackSrc,
  media,
  priority = false,
  sizes,
}: PublicArtworkFrameProps) {
  const classNames = ['heritage-artwork-frame', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classNames}>
      <div className="heritage-artwork-frame__art">
        {media ? (
          <PublicEditorialImage
            media={media}
            priority={priority}
            sizes={sizes}
          />
        ) : fallbackSrc ? (
          <Image
            alt={fallbackAlt}
            aria-hidden={fallbackAlt ? undefined : true}
            fill
            priority={priority}
            sizes={sizes}
            src={fallbackSrc}
          />
        ) : null}
      </div>
      <Image
        alt=""
        aria-hidden="true"
        className="heritage-artwork-frame__overlay"
        data-testid="heritage-frame-overlay"
        fill
        loading={priority ? 'eager' : 'lazy'}
        sizes={sizes}
        src="/img/frame.png"
      />
    </div>
  )
}
