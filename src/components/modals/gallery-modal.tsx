'use client'

import Image from 'next/image'

import {Check, Search, Upload, X, Trash2, Loader2} from 'lucide-react'
import {useCallback, useEffect, useRef, useState} from 'react'

import {Alert, AlertDescription} from '@/components/ui/alert'
import {Button} from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Progress} from '@/components/ui/progress'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {
  deleteMedia,
  listMedia,
  uploadMedia,
  type UploadedMedia,
} from '@/lib/media-library'

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

// Curated local artwork available even when the media library is empty.
const curatedGalleryImages: GalleryImage[] = [
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

  // Upload states
  const [uploadedFiles, setUploadedFiles] = useState<readonly UploadedMedia[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filter images based on search and category
  const filteredImages = curatedGalleryImages.filter(image => {
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

  // Load uploaded files when upload tab is opened
  const loadUploadedFiles = useCallback(async () => {
    try {
      const files = await listMedia('images', 'gallery')

      setUploadedFiles(files)
    } catch (error) {
      console.error('Failed to load uploaded files:', error)
      setUploadError('Failed to load uploaded files')
    }
  }, [])

  // Handle file upload
  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return

    setIsUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    try {
      // Upload files one by one to show progress
      const uploadedFiles: UploadedMedia[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        setUploadProgress(((i + 1) / files.length) * 100)

        const uploadedFile = await uploadMedia(file, {
          bucket: 'images',
          folder: 'gallery',
          maxSizeInMB: 12,
          allowedTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/avif',
          ],
        })

        uploadedFiles.push(uploadedFile)
      }

      // Refresh uploaded files list
      await loadUploadedFiles()
      setUploadProgress(100)

      // Auto-select first uploaded file if only one file uploaded
      if (uploadedFiles.length === 1) {
        handleImageSelect(uploadedFiles[0].url)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  // Handle file input change
  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || [])

    handleFileUpload(files)
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/'),
    )

    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  // Handle file deletion
  const handleFileDelete = async (fileId: string) => {
    try {
      await deleteMedia(fileId)
      await loadUploadedFiles() // Refresh list
    } catch (error) {
      console.error('Delete error:', error)
      setUploadError(error instanceof Error ? error.message : 'Delete failed')
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSearchTerm('')
      setCustomUrl('')
      setUploadError(null)
      setUploadProgress(0)
    }

    onOpenChange(nextOpen)
  }

  // Load uploaded files when component mounts
  useEffect(() => {
    if (!open) return

    let active = true

    void listMedia('images', 'gallery')
      .then(files => {
        if (active) setUploadedFiles(files)
      })
      .catch(error => {
        console.error('Failed to load uploaded files:', error)
        if (active) setUploadError('Failed to load uploaded files')
      })

    return () => {
      active = false
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-border/20 max-h-[80vh] max-w-4xl">
        <DialogHeader>
          <DialogTitle>Select Image</DialogTitle>
          <DialogDescription>
            Choose an image from the gallery or enter a custom URL
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="gallery" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="custom">Custom URL</TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="space-y-4">
            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <label htmlFor="gallery-search" className="sr-only">
                  Search images
                </label>
                <Search
                  aria-hidden="true"
                  className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform"
                />
                <Input
                  id="gallery-search"
                  type="search"
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
                      type="button"
                      aria-pressed={selectedCategory === category}
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
                  <button
                    type="button"
                    key={image.id}
                    aria-label={`Select ${image.title}`}
                    aria-pressed={selectedUrl === image.url}
                    className={`group focus-visible:ring-ring relative overflow-hidden rounded-lg border-2 text-left transition-all hover:shadow-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
                      selectedUrl === image.url
                        ? 'border-primary shadow-md'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleImageSelect(image.url)}
                  >
                    <span className="relative block aspect-square">
                      <Image
                        src={image.url}
                        alt={image.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Overlay */}
                      <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />

                      {/* Selected indicator */}
                      {selectedUrl === image.url && (
                        <span className="bg-primary text-primary-foreground absolute top-2 right-2 rounded-full p-1">
                          <Check aria-hidden="true" className="h-3 w-3" />
                        </span>
                      )}

                      {/* Category badge */}
                      <span className="bg-secondary text-secondary-foreground absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100">
                        {image.category}
                      </span>
                    </span>

                    {/* Title */}
                    <span className="block p-2">
                      <span className="block truncate text-sm font-medium">
                        {image.title}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              {filteredImages.length === 0 && (
                <div className="text-muted-foreground flex h-32 flex-col items-center justify-center">
                  <Search aria-hidden="true" className="mb-2 h-8 w-8" />
                  <p>No images found</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            {/* File Upload Area */}
            <div
              className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                  <Upload aria-hidden="true" className="text-primary h-8 w-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Upload Images</h3>
                  <p className="text-muted-foreground text-sm">
                    Drag and drop images here, or click to select files
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Supports JPEG, PNG, WebP and AVIF up to 12MB each
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="mx-auto"
                >
                  {isUploading ? (
                    <>
                      <Loader2
                        aria-hidden="true"
                        className="mr-2 h-4 w-4 animate-spin"
                      />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload aria-hidden="true" className="mr-2 h-4 w-4" />
                      Select Files
                    </>
                  )}
                </Button>

                <input
                  id="gallery-file-input"
                  aria-label="Choose images to upload"
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && uploadProgress > 0 && (
              <div className="space-y-2" role="status" aria-live="polite">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Upload Error */}
            {uploadError && (
              <Alert variant="destructive">
                <X aria-hidden="true" className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {/* Uploaded Files Grid */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Your Uploaded Images</h4>
                <div className="h-[300px] w-full overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4 p-1 md:grid-cols-3 lg:grid-cols-4">
                    {uploadedFiles.map(file => (
                      <div
                        key={file.id}
                        className={`group relative overflow-hidden rounded-lg border-2 transition-all hover:shadow-lg ${
                          selectedUrl === file.url
                            ? 'border-primary shadow-md'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <button
                          type="button"
                          aria-label={`Select ${file.name}`}
                          aria-pressed={selectedUrl === file.url}
                          className="focus-visible:ring-ring block w-full text-left focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
                          onClick={() => handleImageSelect(file.url)}
                        >
                          <span className="relative block aspect-square">
                            <Image
                              src={file.url}
                              alt={file.name}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                              loading="lazy"
                            />

                            {/* Overlay */}
                            <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />

                            {/* Selected indicator */}
                            {selectedUrl === file.url && (
                              <span className="bg-primary text-primary-foreground absolute top-2 right-2 rounded-full p-1">
                                <Check aria-hidden="true" className="h-3 w-3" />
                              </span>
                            )}

                            {/* File info */}
                            <span className="absolute right-0 bottom-0 left-0 block bg-black/50 p-2 text-white opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                              <span className="block truncate text-xs font-medium">
                                {file.name}
                              </span>
                              <span className="block text-xs opacity-75">
                                {(file.size / 1024 / 1024).toFixed(1)} MB
                              </span>
                            </span>
                          </span>
                        </button>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          aria-label={`Delete ${file.name}`}
                          className="absolute top-2 left-2 z-10 h-6 w-6 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                          onClick={() => handleFileDelete(file.id)}
                        >
                          <Trash2 aria-hidden="true" className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="custom-image-url"
                  className="mb-2 block text-sm font-medium"
                >
                  Image URL
                </label>
                <div className="flex gap-2">
                  <Input
                    id="custom-image-url"
                    type="url"
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
                    type="button"
                    onClick={handleCustomUrlSubmit}
                    disabled={!customUrl.trim()}
                    className="min-w-fit"
                  >
                    <Upload aria-hidden="true" className="mr-2 h-4 w-4" />
                    Use URL
                  </Button>
                </div>
              </div>

              {/* URL Preview */}
              {customUrl && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Preview:</p>
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
