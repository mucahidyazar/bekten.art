'use client'

import {HeartIcon} from 'lucide-react'
import Image from 'next/image'
import {useTranslations} from 'next-intl'
import {useState} from 'react'

import {cn} from '@/utils'

import {Badge} from '../ui/badge'
import {Button} from '../ui/button'

type ArtworkCardProps = {
  artwork: any // TODO: Define proper type with Supabase
  className?: string
  priority?: boolean
}

export function ArtworkCard({
  artwork,
  className,
  priority = false,
}: ArtworkCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(artwork?.likes?.length || 0)
  const t = useTranslations('cards.artworkCard')

  const handleLike = () => {
    // TODO: Implement with Supabase
    setIsLiked(!isLiked)
    setLikeCount((prev: number) => isLiked ? prev - 1 : prev + 1)
  }

  return (
    <div
      className={cn(
        'group relative flex w-full flex-col overflow-hidden rounded-2xl bg-card border border-border/50 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] hover:border-primary/20',
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={artwork?.image || '/img/art/art-0.png'}
          alt={artwork?.title || t('defaultAlt')}
          fill
          priority={priority}
          className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {artwork?.price && (
          <Badge className="absolute left-3 top-3 bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg border-0 px-3 py-1">
            ${artwork.price}
          </Badge>
        )}

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'absolute right-3 top-3 h-10 w-10 rounded-full bg-background/90 backdrop-blur-md border border-border/50 p-0 transition-all duration-300 hover:bg-background hover:scale-110 hover:shadow-lg',
            isLiked && 'text-red-500 bg-red-50 border-red-200'
          )}
          onClick={handleLike}
        >
          <HeartIcon className={cn('h-4 w-4 transition-transform duration-300', isLiked && 'fill-current scale-110')} />
        </Button>
      </div>

      <div className="flex flex-col gap-3 p-6">
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-300">
            {artwork?.title || t('untitled')}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {artwork?.description || t('noDescription')}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div className="flex items-center gap-1">
            <HeartIcon className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">
              {likeCount} {likeCount === 1 ? t('like') : t('likes')}
            </span>
          </div>

          {artwork?.artist?.name && (
            <span className="text-xs text-muted-foreground font-medium">
              {t('by')} {artwork.artist.name}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
