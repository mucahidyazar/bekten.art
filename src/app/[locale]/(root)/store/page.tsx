'use client'

import {
  FilterIcon,
  SortAscIcon,
  StarIcon,
  PaletteIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from 'lucide-react'
import Image from 'next/image'
import {useState, useMemo} from 'react'
import {unstable_ViewTransition as ViewTransition} from 'react'

import {NewsletterCTA} from '@/components/molecules/NewsletterCTA'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  mockStoreData,
  storeCategories,
  type ArtworkProduct,
} from '@/mocks/store'

type SortOption = 'featured' | 'price-low' | 'price-high' | 'newest' | 'oldest'

export default function StorePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('featured')

  const filteredAndSortedArtworks = useMemo(() => {
    let filtered =
      selectedCategory === 'all'
        ? mockStoreData
        : mockStoreData.filter(artwork => artwork.category === selectedCategory)

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'featured':
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          return b.year - a.year
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'newest':
          return b.year - a.year
        case 'oldest':
          return a.year - b.year
        default:
          return 0
      }
    })

    return sorted
  }, [selectedCategory, sortBy])

  const getAvailabilityInfo = (
    availability: ArtworkProduct['availability'],
  ) => {
    switch (availability) {
      case 'available':
        return {
          icon: CheckCircleIcon,
          text: 'Available',
          color: 'text-green-500',
        }
      case 'reserved':
        return {icon: ClockIcon, text: 'Reserved', color: 'text-yellow-500'}
      case 'sold':
        return {icon: XCircleIcon, text: 'Sold', color: 'text-red-500'}
    }
  }

  return (
    <div className="container">
      {/* Hero Section */}
      {/* <div className="text-center space-y-6 py-12">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Art Store
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Discover and collect original artworks by Bekten Usubaliev. Each piece tells a story of Kyrgyz culture, 
            contemporary expression, and artistic mastery.
          </p>
        </div>
        
        <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <PaletteIcon className="w-4 h-4" />
            <span>Original Artworks</span>
          </div>
          <div className="flex items-center space-x-2">
            <ShoppingBagIcon className="w-4 h-4" />
            <span>Secure Purchase</span>
          </div>
          <div className="flex items-center space-x-2">
            <StarIcon className="w-4 h-4" />
            <span>Authenticity Guaranteed</span>
          </div>
        </div>
      </div> */}

      {/* Filters and Sort */}
      <div className="bg-card border-ring/20 flex flex-col space-y-4 rounded-xl border p-6 lg:flex-row lg:justify-between lg:space-y-0">
        <div className="space-y-3">
          <div className="text-muted-foreground flex items-center space-x-2 text-sm">
            <FilterIcon className="h-4 w-4" />
            <span>Filter by Category</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {storeCategories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`group relative flex items-center space-x-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'from-primary to-primary/90 text-primary-foreground shadow-primary/25 scale-105 bg-gradient-to-r shadow-lg'
                    : 'bg-card hover:bg-muted border-ring/20 text-muted-foreground hover:text-foreground hover:border-ring/40 border hover:shadow-md'
                }`}
              >
                <span>{category.name}</span>
                <div
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold transition-colors duration-300 ${
                    selectedCategory === category.id
                      ? 'text-primary-foreground bg-white/20'
                      : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                  }`}
                >
                  {category.count}
                </div>

                {/* Active indicator */}
                {selectedCategory === category.id && (
                  <div className="bg-primary-foreground absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-muted-foreground flex items-center space-x-2 text-sm">
            <SortAscIcon className="h-4 w-4" />
            <span>Sort by</span>
          </div>
          <Select
            value={sortBy}
            onValueChange={(value: SortOption) => setSortBy(value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Artworks Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedArtworks.map(artwork => {
          const availabilityInfo = getAvailabilityInfo(artwork.availability)
          const AvailabilityIcon = availabilityInfo.icon

          return (
            <ViewTransition key={artwork.id}>
              <article className="group bg-card border-ring/20 hover:shadow-primary/5 relative overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 space-y-2">
                    {artwork.featured && (
                      <Badge className="bg-yellow-500 text-xs text-white">
                        <StarIcon className="mr-1 h-3 w-3" />
                        Featured
                      </Badge>
                    )}
                    {artwork.isLimitedEdition && (
                      <Badge variant="secondary" className="text-xs">
                        Limited
                      </Badge>
                    )}
                  </div>

                  {/* Availability */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant="secondary"
                      className={`${availabilityInfo.color} bg-white/90 text-xs backdrop-blur-sm`}
                    >
                      <AvailabilityIcon className="mr-1 h-3 w-3" />
                      {availabilityInfo.text}
                    </Badge>
                  </div>

                  {/* Quick View Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <Button
                      size="sm"
                      className="bg-white text-black hover:bg-white/90"
                    >
                      Quick View
                    </Button>
                  </div>
                </div>

                {/* Content Section */}
                <div className="space-y-3 p-4">
                  {/* Title & Price */}
                  <div className="space-y-2">
                    <h3 className="text-foreground group-hover:text-primary line-clamp-1 font-semibold transition-colors">
                      {artwork.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-foreground text-lg font-bold">
                        ${artwork.price.toLocaleString()}
                      </span>
                      {artwork.originalPrice && (
                        <span className="text-muted-foreground text-sm line-through">
                          ${artwork.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <span>{artwork.medium}</span>
                    <span>{artwork.year}</span>
                  </div>

                  <div className="text-muted-foreground text-xs">
                    {artwork.dimensions.width} × {artwork.dimensions.height}{' '}
                    {artwork.dimensions.unit}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {artwork.tags.slice(0, 2).map(tag => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="bg-secondary text-muted-foreground! border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30 px-2 py-0.5 text-xs transition-colors"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Action Button */}
                  <Button
                    disabled={artwork.availability !== 'available'}
                    size="sm"
                    className="mt-3 w-full"
                  >
                    {artwork.availability === 'available'
                      ? 'Inquire'
                      : 'Unavailable'}
                  </Button>
                </div>
              </article>
            </ViewTransition>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredAndSortedArtworks.length === 0 && (
        <div className="py-16 text-center">
          <PaletteIcon className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
          <h3 className="text-foreground mb-2 text-xl font-semibold">
            No artworks found
          </h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or browse all categories.
          </p>
        </div>
      )}

      {/* Newsletter CTA */}
      <NewsletterCTA description="Be the first to know about new artworks, exclusive collections, and special exhibitions." />
    </div>
  )
}
