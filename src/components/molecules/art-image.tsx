import Image from 'next/image'

import {shouldBypassImageOptimization} from '@/lib/image-optimization'
import {cn} from '@/utils'

type ArtImageProps = {
  className?: string
  description?: string
  imageClassName?: string
  src: string
  onClick?: () => void
}
export function ArtImage({
  className,
  description,
  imageClassName,
  src,
  onClick,
}: ArtImageProps) {
  const unoptimized = shouldBypassImageOptimization(src)

  return (
    <div
      className={cn('group relative w-full overflow-hidden', className)}
      onClick={onClick}
    >
      <Image
        src={src}
        alt={description || 'Artwork'}
        width={400}
        height={400}
        className={cn('w-full object-cover', imageClassName)}
        unoptimized={unoptimized}
      />
      {description && (
        <>
          <p className="wrap absolute bottom-0 left-0 z-20 m-3 line-clamp-3 max-w-full overflow-hidden text-xs break-words text-white">
            {description}
          </p>
          <div className="absolute right-0 bottom-0 left-0 z-10 h-16 bg-gradient-to-t from-black to-transparent" />
        </>
      )}
    </div>
  )
}
