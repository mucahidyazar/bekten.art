'use client'

import Image from 'next/image'

import {
  CheckCircleIcon,
  ClockIcon,
  Edit,
  FilterIcon,
  PaletteIcon,
  ShoppingBagIcon,
  SortAscIcon,
  StarIcon,
  XCircleIcon,
} from 'lucide-react'
import {useTranslations} from 'next-intl'
import {useMemo, useState} from 'react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {handleSectionSave} from '@/utils/section-save-handler'

import type {StoreDatabaseItem, StoreDatabaseSettings} from '@/types/database'

export type SortOption =
  | 'featured'
  | 'price-low'
  | 'price-high'
  | 'newest'
  | 'oldest'

type StoreSectionProps = {
  storeData: {
    items: StoreDatabaseItem[]
    settings: StoreDatabaseSettings | null
  }
}

export function StoreSection({storeData}: StoreSectionProps) {
  const t = useTranslations()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('featured')
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState('')
  const [imageUpdateCallback, setImageUpdateCallback] = useState<
    ((url: string) => void) | null
  >(null)

  // Generate categories dynamically from data
  const storeCategories = useMemo(() => {
    const allCategory = {
      id: 'all',
      name: 'All Artworks',
      count: storeData.items.length,
    }

    const categoryMap = new Map()

    storeData.items.forEach(item => {
      const category = item.data?.category || 'painting'
      const current = categoryMap.get(category) || 0

      categoryMap.set(category, current + 1)
    })

    const categories = Array.from(categoryMap.entries()).map(([id, count]) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1) + 's',
      count,
    }))

    return [allCategory, ...categories]
  }, [storeData.items])

  // Filter and sort artworks
  const filteredAndSortedArtworks = useMemo(() => {
    let filtered =
      selectedCategory === 'all'
        ? storeData.items
        : storeData.items.filter(
            item => item.data?.category === selectedCategory,
          )

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'featured':
          if (a.data?.featured && !b.data?.featured) return -1
          if (!a.data?.featured && b.data?.featured) return 1

          return (b.data?.year || 0) - (a.data?.year || 0)
        case 'price-low':
          return (a.data?.price || 0) - (b.data?.price || 0)
        case 'price-high':
          return (b.data?.price || 0) - (a.data?.price || 0)
        case 'newest':
          return (b.data?.year || 0) - (a.data?.year || 0)
        case 'oldest':
          return (a.data?.year || 0) - (b.data?.year || 0)
        default:
          return 0
      }
    })

    return sorted
  }, [selectedCategory, sortBy, storeData.items])

  // Availability helper
  const getAvailabilityInfo = (availability: string) => {
    switch (availability) {
      case 'available':
        return {
          icon: CheckCircleIcon,
          text: t('store.available'),
          color: 'text-green-500',
        }
      case 'reserved':
        return {
          icon: ClockIcon,
          text: t('store.reserved'),
          color: 'text-yellow-500',
        }
      case 'sold':
        return {
          icon: XCircleIcon,
          text: t('store.sold'),
          color: 'text-red-500',
        }
      default:
        return {
          icon: CheckCircleIcon,
          text: t('store.available'),
          color: 'text-green-500',
        }
    }
  }

  // Configuration for store items
  const itemFields: FieldConfig[] = [
    {
      name: 'data.imageUrl',
      label: t('store.mainImage'),
      type: 'image',
      placeholder: 'Select main artwork image...',
      required: true,
    },
    {
      name: 'data.title',
      label: t('common.title'),
      type: 'text',
      placeholder: 'Enter artwork title...',
      required: true,
    },
    {
      name: 'data.description',
      label: t('common.description'),
      type: 'textarea',
      placeholder: 'Enter artwork description...',
      required: true,
    },
    {
      name: 'data.price',
      label: t('store.price'),
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
      label: t('store.category'),
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
    return handleSectionSave(data, saveStoreDataAction, 'store')
  }

  // Create admin edit trigger
  const adminEditTrigger = storeData.settings ? (
    <DynamicEditModal
      items={storeData.items}
      settings={storeData.settings}
      title={storeData.settings?.section_title || t('store.storeManagement')}
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
      {/* Section Header with Admin Edit */}
      <SectionHeader
        badgeText={storeData.settings?.badge_text || t('store.storeBadge')}
        badgeIcon="sparkles"
        title={storeData.settings?.section_title || t('store.artStore')}
        description={
          storeData.settings?.section_description ||
          'Discover and collect original artworks by Bekten Usubaliev. Each piece tells a story of Kyrgyz culture, contemporary expression, and artistic mastery.'
        }
        adminEditTrigger={adminEditTrigger}
        className="mb-8"
      />

      {/* Filters and Sort */}
      <div className="bg-card/50 border-border/50 mb-8 flex flex-col gap-4 rounded-xl border p-6 backdrop-blur-sm sm:flex-row sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <FilterIcon className="text-muted-foreground h-4 w-4" />
            <span className="text-muted-foreground text-sm font-medium">
              Filter by category:
            </span>
          </div>

          {storeCategories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="h-8 px-3 text-xs transition-all duration-200"
            >
              {category.name}
              <Badge
                variant="secondary"
                className="ml-2 h-4 px-1.5 font-mono text-xs"
              >
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <SortAscIcon className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground text-sm font-medium">
            Sort by:
          </span>
          <Select
            value={sortBy}
            onValueChange={(value: SortOption) => setSortBy(value)}
          >
            <SelectTrigger className="h-8 w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Artworks Grid */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedArtworks.map(artwork => {
          const availabilityInfo = getAvailabilityInfo(
            artwork.data?.availability || 'available',
          )
          const AvailabilityIcon = availabilityInfo.icon

          return (
            <div
              key={artwork.id}
              className="group border-border/30 bg-card/80 hover:border-border/60 hover:shadow-primary/5 overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:shadow-xl"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={artwork.data?.imageUrl || ''}
                  alt={artwork.data?.title || ''}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />

                {/* Overlay Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {artwork.data?.featured && (
                    <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-sm">
                      <StarIcon className="mr-1 h-3 w-3" />
                      Featured
                    </Badge>
                  )}
                  {artwork.data?.isLimitedEdition && (
                    <Badge
                      variant="secondary"
                      className="bg-purple-100/90 text-purple-800 backdrop-blur-sm dark:bg-purple-900/90 dark:text-purple-200"
                    >
                      Limited Edition
                    </Badge>
                  )}
                </div>

                {/* Availability Status */}
                <div className="absolute top-4 right-4">
                  <div
                    className={`bg-background/90 flex items-center gap-1 rounded-full px-2 py-1 backdrop-blur-sm ${availabilityInfo.color}`}
                  >
                    <AvailabilityIcon className="h-3 w-3" />
                    <span className="text-xs font-medium">
                      {availabilityInfo.text}
                    </span>
                  </div>
                </div>

                {/* Quick Actions - Show on Hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <Button size="sm" className="backdrop-blur-sm">
                      {t('store.viewDetails')}
                    </Button>
                    {artwork.data?.availability === 'available' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="backdrop-blur-sm"
                      >
                        {t('store.inquire')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="space-y-4">
                  {/* Title and Category */}
                  <div>
                    <h3 className="text-foreground group-hover:text-primary text-xl font-bold transition-colors">
                      {artwork.data?.title}
                    </h3>
                    <p className="text-muted-foreground text-sm capitalize">
                      {artwork.data?.category} • {artwork.data?.year}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                    {artwork.data?.description}
                  </p>

                  {/* Details */}
                  <div className="text-muted-foreground space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Medium:</span>
                      <span className="font-medium">
                        {artwork.data?.medium}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dimensions:</span>
                      <span className="font-medium">
                        {artwork.data?.dimensions?.width} ×{' '}
                        {artwork.data?.dimensions?.height}{' '}
                        {artwork.data?.dimensions?.unit}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {artwork.data?.tags?.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {(artwork.data?.tags?.length || 0) > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{(artwork.data?.tags?.length || 0) - 3} more
                      </Badge>
                    )}
                  </div>

                  {/* Price and Action */}
                  <div className="border-border/50 flex items-center justify-between border-t pt-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-2xl font-bold">
                          ${artwork.data?.price?.toLocaleString()}
                        </span>
                        {artwork.data?.originalPrice &&
                          artwork.data.originalPrice > artwork.data.price && (
                            <span className="text-muted-foreground text-sm line-through">
                              ${artwork.data.originalPrice.toLocaleString()}
                            </span>
                          )}
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {artwork.data?.currency} •{' '}
                        {artwork.data?.isOriginal
                          ? t('store.original')
                          : t('store.reproduction')}
                      </p>
                    </div>

                    {artwork.data?.availability === 'available' ? (
                      <Button
                        size="sm"
                        className="from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 bg-gradient-to-r transition-all duration-200"
                      >
                        {t('store.inquire')}
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        {availabilityInfo.text}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredAndSortedArtworks.length === 0 && (
        <div className="py-12 text-center">
          <PaletteIcon className="text-muted-foreground/50 mx-auto h-12 w-12" />
          <h3 className="text-foreground mt-4 text-lg font-medium">
            No artworks found
          </h3>
          <p className="text-muted-foreground mt-2 text-sm">
            Try adjusting your filters or check back later for new pieces.
          </p>
        </div>
      )}

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
