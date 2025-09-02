import Image from 'next/image'

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
  return (
    <div
      className={cn('group relative w-full overflow-hidden', className)}
      onClick={onClick}
    >
      <Image
        src={src}
        alt="'TRAVELLING'  Canvas, oil, 70x85 cm, 2001"
        width={400}
        height={400}
        className={cn('w-full object-cover', imageClassName)}
      />
      {description && (
        <>
          <p className="wrap absolute bottom-0 left-0 z-20 max-w-full break-words m-3 text-xs text-white line-clamp-3 overflow-hidden">
            {description}
          </p>
          <div className="absolute bottom-0 left-0 right-0 z-10 h-16 bg-gradient-to-t from-black to-transparent" />
        </>
      )}
    </div>
  )
}
