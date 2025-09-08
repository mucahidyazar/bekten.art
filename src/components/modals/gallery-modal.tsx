'use client'

import Image from 'next/image'

import {Check, Search, Upload} from 'lucide-react'
import {useEffect, useState} from 'react'

import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'

type GalleryImage = {
  id: string
  url: string
  title: string
  category: 'art' | 'workshop' | 'other'
  alt?: string
}

type GalleryModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (imageUrl: string) => void
  selectedUrl?: string
}

// Mock gallery data - in real app, this would come from API
const mockGalleryImages: GalleryImage[] = [
  // Art images
  {id: '1', url: '/img/art/art-0.png', title: 'Artwork 1', category: 'art'},
  {id: '2', url: '/img/art/art-1.png', title: 'Artwork 2', category: 'art'},
  {id: '3', url: '/img/art/art-2.png', title: 'Artwork 3', category: 'art'},
  {id: '4', url: '/img/art/art-3.png', title: 'Artwork 4', category: 'art'},
  {id: '5', url: '/img/art/art-4.png', title: 'Artwork 5', category: 'art'},
  {id: '6', url: '/img/art/art-5.png', title: 'Artwork 6', category: 'art'},
  {id: '7', url: '/img/art/art-6.png', title: 'Artwork 7', category: 'art'},

  // Workshop images
  {
    id: '8',
    url: '/img/workshop/workshop-0.jpeg',
    title: 'Workshop View',
    category: 'workshop',
  },
  {
    id: '9',
    url: '/img/workshop/workshop-1.jpeg',
    title: 'Portraits',
    category: 'workshop',
  },
  {
    id: '10',
    url: '/img/workshop/workshop-2.jpeg',
    title: 'Painting Shelves',
    category: 'workshop',
  },
  {
    id: '11',
    url: '/img/workshop/workshop-3.jpeg',
    title: 'Uncle Portrait',
    category: 'workshop',
  },
  {
    id: '12',
    url: '/img/workshop/workshop-4.jpeg',
    title: 'Workshop Entrance',
    category: 'workshop',
  },
]

export function GalleryModal({
  open,
  onOpenChange,
  onSelect,
  selectedUrl,
}: GalleryModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'art' | 'workshop' | 'other'
  >('all')
  const [customUrl, setCustomUrl] = useState('')

  // Filter images based on search and category
  const filteredImages = mockGalleryImages.filter(image => {
    const matchesSearch =
      image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.url.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategory === 'all' || image.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const handleImageSelect = (url: string) => {
    onSelect(url)
    onOpenChange(false)
  }

  const handleCustomUrlSubmit = () => {
    if (customUrl.trim()) {
      onSelect(customUrl.trim())
      onOpenChange(false)
      setCustomUrl('')
    }
  }

  // Reset search when modal closes
  useEffect(() => {
    if (!open) {
      setSearchTerm('')
      setCustomUrl('')
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/20 max-h-[80vh] max-w-4xl">
        <DialogHeader>
          <DialogTitle>Select Image</DialogTitle>
          <DialogDescription>
            Choose an image from the gallery or enter a custom URL
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="gallery" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="custom">Custom URL</TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="space-y-4">
            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
                <Input
                  placeholder="Search images..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                {(['all', 'art', 'workshop', 'other'] as const).map(
                  category => (
                    <Button
                      key={category}
                      variant={
                        selectedCategory === category ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="capitalize"
                    >
                      {category}
                    </Button>
                  ),
                )}
              </div>
            </div>

            {/* Image Grid */}
            <div className="h-[400px] w-full overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 p-1 md:grid-cols-3 lg:grid-cols-4">
                {filteredImages.map(image => (
                  <div
                    key={image.id}
                    className={`group relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all hover:shadow-lg ${
                      selectedUrl === image.url
                        ? 'border-primary shadow-md'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleImageSelect(image.url)}
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={image.url}
                        alt={image.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />

                      {/* Selected indicator */}
                      {selectedUrl === image.url && (
                        <div className="bg-primary text-primary-foreground absolute top-2 right-2 rounded-full p-1">
                          <Check className="h-3 w-3" />
                        </div>
                      )}

                      {/* Category badge */}
                      <Badge
                        variant="secondary"
                        className="absolute top-2 left-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        {image.category}
                      </Badge>
                    </div>

                    {/* Title */}
                    <div className="p-2">
                      <p className="truncate text-sm font-medium">
                        {image.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {filteredImages.length === 0 && (
                <div className="text-muted-foreground flex h-32 flex-col items-center justify-center">
                  <Search className="mb-2 h-8 w-8" />
                  <p>No images found</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Image URL
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={customUrl}
                    onChange={e => setCustomUrl(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleCustomUrlSubmit()
                      }
                    }}
                  />
                  <Button
                    onClick={handleCustomUrlSubmit}
                    disabled={!customUrl.trim()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Use URL
                  </Button>
                </div>
              </div>

              {/* URL Preview */}
              {customUrl && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preview:</label>
                  <div className="bg-muted relative h-48 w-full overflow-hidden rounded-lg border">
                    <Image
                      src={customUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                      onError={e => {
                        const target = e.target as HTMLImageElement

                        target.style.display = 'none'
                        const parent = target.parentElement

                        if (parent) {
                          parent.innerHTML = `
                            <div class="flex items-center justify-center h-full text-muted-foreground">
                              <div class="text-center">
                                <X class="h-8 w-8 mx-auto mb-2" />
                                <p class="text-sm">Invalid image URL</p>
                              </div>
                            </div>
                          `
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
