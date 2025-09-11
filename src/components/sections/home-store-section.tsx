'use client'

import Image from 'next/image'
import Link from 'next/link'

import {Edit, HeartIcon, ShoppingBagIcon} from 'lucide-react'
import {useTranslations} from 'next-intl'
import {useState} from 'react'

import {saveStoreDataAction} from '@/actions/store'
import {
  DynamicEditModal,
  type FieldConfig,
  type ViewConfig,
} from '@/components/modals/dynamic-edit-modal'
import {GalleryModal} from '@/components/modals/gallery-modal'
import {SectionHeader} from '@/components/molecules/section-header'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {cn, handleSectionSave} from '@/utils'

import type {StoreDatabaseItem, StoreDatabaseSettings} from '@/types/database'

type HomeStoreSectionProps = {
  storeData: {
    items: StoreDatabaseItem[]
    settings: StoreDatabaseSettings | null
  }
}

type ArtworkCardProps = {
  artwork: StoreDatabaseItem
  className?: string
  priority?: boolean
}

function ArtworkCard({artwork, className, priority = false}: ArtworkCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0) // TODO: Implement likes from database
  const t = useTranslations('cards.artworkCard')

  const handleLike = () => {
    // TODO: Implement with Supabase
    setIsLiked(!isLiked)
    setLikeCount(prev => (isLiked ? prev - 1 : prev + 1))
  }

  return (
    <div
      className={cn(
        'group bg-card border-border/50 hover:border-primary/20 relative flex w-full flex-col overflow-hidden rounded-2xl border shadow-lg transition-all duration-500 hover:scale-[1.02] hover:shadow-xl',
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={artwork.data?.imageUrl || '/img/art/art-0.png'}
          alt={artwork.data?.title || t('defaultAlt')}
          fill
          priority={priority}
          className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Price Badge */}
        {artwork.data?.price && (
          <Badge className="absolute top-3 left-3 border-0 bg-gradient-to-r from-green-500 to-green-600 px-3 py-1 text-white shadow-lg">
            ${artwork.data.price.toLocaleString()} {artwork.data?.currency}
          </Badge>
        )}

        {/* Availability Badge */}
        {artwork.data?.availability === 'sold' && (
          <Badge className="absolute right-3 bottom-3 border-0 bg-red-500/90 px-3 py-1 text-white shadow-lg">
            Sold
          </Badge>
        )}

        {/* Like Button */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'bg-background/90 border-border/50 hover:bg-background absolute top-3 right-3 h-10 w-10 rounded-full border p-0 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:shadow-lg',
            isLiked && 'border-red-200 bg-red-50 text-red-500',
          )}
          onClick={handleLike}
        >
          <HeartIcon
            className={cn(
              'h-4 w-4 transition-transform duration-300',
              isLiked && 'scale-110 fill-current',
            )}
          />
        </Button>
      </div>

      <div className="flex flex-col gap-3 p-6">
        <div className="space-y-2">
          <h3 className="text-foreground group-hover:text-primary line-clamp-1 text-lg font-bold transition-colors duration-300">
            {artwork.data?.title || t('untitled')}
          </h3>

          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
            {artwork.data?.description || t('noDescription')}
          </p>
        </div>

        {/* Artwork Details */}
        <div className="text-muted-foreground space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Medium:</span>
            <span className="font-medium">{artwork.data?.medium}</span>
          </div>
          <div className="flex justify-between">
            <span>Year:</span>
            <span className="font-medium">{artwork.data?.year}</span>
          </div>
        </div>

        <div className="border-border/30 flex items-center justify-between border-t pt-2">
          <div className="flex items-center gap-1">
            <HeartIcon className="text-muted-foreground h-3 w-3" />
            <span className="text-muted-foreground text-xs font-medium">
              {likeCount} {likeCount === 1 ? t('like') : t('likes')}
            </span>
          </div>

          <span className="text-muted-foreground text-xs font-medium capitalize">
            {artwork.data?.category}
          </span>
        </div>
      </div>
    </div>
  )
}

export function HomeStoreSection({storeData}: HomeStoreSectionProps) {
  const t = useTranslations()
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState('')
  const [imageUpdateCallback, setImageUpdateCallback] = useState<
    ((url: string) => void) | null
  >(null)

  // Filter to only show available/featured artworks on homepage
  const featuredArtworks = storeData.items
    .filter(
      item => item.data?.featured || item.data?.availability === 'available',
    )
    .slice(0, 6) // Limit to 6 items for homepage

  if (!storeData.settings || featuredArtworks.length === 0) {
    return null
  }

  // Configuration for store items
  const itemFields: FieldConfig[] = [
    {
      name: 'data.imageUrl',
      label: 'Main Image',
      type: 'image',
      placeholder: 'Select main artwork image...',
      required: true,
    },
    {
      name: 'data.title',
      label: 'Title',
      type: 'text',
      placeholder: 'Enter artwork title...',
      required: true,
    },
    {
      name: 'data.description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter artwork description...',
      required: true,
    },
    {
      name: 'data.price',
      label: 'Price',
      type: 'number',
      placeholder: 'Enter price...',
      required: true,
    },
    {
      name: 'data.originalPrice',
      label: 'Original Price',
      type: 'number',
      placeholder: 'Enter original price (optional)...',
    },
    {
      name: 'data.currency',
      label: 'Currency',
      type: 'select',
      options: [
        {value: 'USD', label: 'USD ($)'},
        {value: 'EUR', label: 'EUR (€)'},
        {value: 'KGS', label: 'KGS (сом)'},
      ],
      required: true,
    },
    {
      name: 'data.category',
      label: 'Category',
      type: 'select',
      options: [
        {value: 'painting', label: 'Painting'},
        {value: 'digital', label: 'Digital Art'},
        {value: 'print', label: 'Print'},
        {value: 'sculpture', label: 'Sculpture'},
      ],
      required: true,
    },
    {
      name: 'data.medium',
      label: 'Medium',
      type: 'text',
      placeholder: 'e.g., Oil on Canvas, Digital Art...',
      required: true,
    },
    {
      name: 'data.dimensions.width',
      label: 'Width',
      type: 'number',
      placeholder: 'Width in cm or inches...',
      required: true,
    },
    {
      name: 'data.dimensions.height',
      label: 'Height',
      type: 'number',
      placeholder: 'Height in cm or inches...',
      required: true,
    },
    {
      name: 'data.dimensions.unit',
      label: 'Unit',
      type: 'select',
      options: [
        {value: 'cm', label: 'Centimeters (cm)'},
        {value: 'in', label: 'Inches (in)'},
      ],
      required: true,
    },
    {
      name: 'data.year',
      label: 'Year',
      type: 'number',
      placeholder: 'Year created...',
      required: true,
    },
    {
      name: 'data.availability',
      label: 'Availability',
      type: 'select',
      options: [
        {value: 'available', label: 'Available'},
        {value: 'sold', label: 'Sold'},
        {value: 'reserved', label: 'Reserved'},
      ],
      required: true,
    },
    {
      name: 'data.featured',
      label: 'Featured',
      type: 'select',
      options: [
        {value: 'true', label: 'Yes'},
        {value: 'false', label: 'No'},
      ],
    },
    {
      name: 'data.isOriginal',
      label: 'Original Artwork',
      type: 'select',
      options: [
        {value: 'true', label: 'Yes'},
        {value: 'false', label: 'No'},
      ],
    },
    {
      name: 'data.isLimitedEdition',
      label: 'Limited Edition',
      type: 'select',
      options: [
        {value: 'true', label: 'Yes'},
        {value: 'false', label: 'No'},
      ],
    },
    {
      name: 'data.tags',
      label: 'Tags',
      type: 'text',
      placeholder: 'Enter tags separated by commas...',
    },
  ]

  // View configuration
  const viewConfig: ViewConfig = {
    card: {
      aspectRatio: '1/1',
      imageField: 'data.imageUrl',
      titleField: 'data.title',
      descriptionField: 'data.description',
      placeholderIcon: (
        <ShoppingBagIcon className="text-muted-foreground/60 h-8 w-8" />
      ),
    },
    table: {
      columns: [
        {
          field: 'data.imageUrl',
          label: 'Image',
          width: 'w-[100px]',
          type: 'image',
        },
        {field: 'data.title', label: 'Title', type: 'text'},
        {field: 'data.price', label: 'Price', type: 'text'},
        {field: 'data.category', label: 'Category', type: 'text'},
        {field: 'data.availability', label: 'Status', type: 'text'},
      ],
    },
  }

  // Create new store item
  const createNewItem = (
    data: Partial<StoreDatabaseItem>,
  ): StoreDatabaseItem => ({
    id: data.id || `temp-${Date.now()}`,
    section_type: 'store',
    data: {
      title: data.data?.title || '',
      description: data.data?.description || '',
      price: data.data?.price || 0,
      originalPrice: data.data?.originalPrice,
      currency: data.data?.currency || 'USD',
      imageUrl: data.data?.imageUrl || '',
      images: data.data?.images || [],
      category: data.data?.category || 'painting',
      medium: data.data?.medium || '',
      dimensions: data.data?.dimensions || {
        width: 0,
        height: 0,
        unit: 'cm',
      },
      year: data.data?.year || new Date().getFullYear(),
      isOriginal: data.data?.isOriginal ?? true,
      isLimitedEdition: data.data?.isLimitedEdition ?? false,
      availability: data.data?.availability || 'available',
      tags: data.data?.tags || [],
      featured: data.data?.featured ?? false,
      ...data.data,
    },
    order: data.order || storeData.items.length,
    is_active: data.is_active ?? true,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
  })

  // Handle image selection
  const handleImageSelect = (_fieldName: string) => {
    setGalleryOpen(true)
  }

  const handleGallerySelect = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl)
    setGalleryOpen(false)

    // Call the callback to update the field
    if (imageUpdateCallback) {
      imageUpdateCallback(imageUrl)
      setImageUpdateCallback(null)
    }
  }

  // Create a callback for image selected
  const handleImageSelected = (
    imageUrl: string,
    fieldName: string,
    updateCallback?: (url: string) => void,
  ) => {
    // Store the callback and open gallery
    if (updateCallback) {
      setImageUpdateCallback(() => updateCallback)
    }
    setGalleryOpen(true)
  }

  const handleStoreSave = async (data: {
    items: StoreDatabaseItem[]
    settings: StoreDatabaseSettings
  }) => {
    return handleSectionSave(data, saveStoreDataAction, 'home-store')
  }

  // Create admin edit trigger
  const adminEditTrigger = storeData.settings ? (
    <DynamicEditModal
      items={storeData.items}
      settings={storeData.settings}
      title={storeData.settings?.section_title || 'Store Management'}
      description="Manage your artwork store, products, and sales"
      icon={<ShoppingBagIcon className="h-6 w-6 text-white" />}
      itemFields={itemFields}
      viewConfig={viewConfig}
      maxItems={storeData.settings?.max_items || 50}
      onSave={handleStoreSave}
      onImageSelect={handleImageSelect}
      onImageSelected={handleImageSelected}
      viewType="table"
      createNewItem={createNewItem}
      trigger={
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="h-4 w-4" />
          Edit Store
        </Button>
      }
    />
  ) : null

  return (
    <>
      <section className="py-20">
        <div className="container lg:px-0">
          <SectionHeader
            badgeText={storeData.settings?.badge_text || t('storeBadge')}
            badgeIcon="sparkles"
            title={storeData.settings?.section_title || t('storeTitle')}
            description={
              storeData.settings?.section_description || t('storeDescription')
            }
            adminEditTrigger={adminEditTrigger}
          />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredArtworks.map((artwork, index) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                priority={index < 3} // Priority loading for first 3 items
              />
            ))}
          </div>

          {/* View All Button */}
          <div className="mt-12 text-center">
            <Link href="/store">
              <Button size="lg" className="gap-2">
                <ShoppingBagIcon className="h-4 w-4" />
                View All Artworks
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Modal */}
      <GalleryModal
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onSelect={handleGallerySelect}
        selectedUrl={selectedImageUrl}
      />
    </>
  )
}
