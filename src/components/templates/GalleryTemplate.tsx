'use client'
import {
  Grid3X3Icon,
  LayoutGridIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from 'lucide-react'
import Image from 'next/image'
import {useState} from 'react'

import {ArtImage} from '@/components/molecules/ArtImage'
import {useEventListener} from '@/hooks/useEventListener'

import {Dialog, DialogContent, DialogTrigger, DialogTitle} from '../ui/dialog'

type SectionData = {
  url: string
  title: string
  description: string
}
type GalleryTemplateProps = {
  imageArrays: SectionData[][]
}
export function GalleryTemplate({imageArrays = []}: GalleryTemplateProps) {
  const [image, setImage] = useState<SectionData | null>(null)
  const [viewMode, setViewMode] = useState<'masonry' | 'grid'>('grid')

  const handleKeyPress = (e: KeyboardEvent) => {
    if (image) {
      const allImages = imageArrays.flat()
      if (e.key === 'ArrowRight') {
        const index = allImages.findIndex(item => item.url === image.url)
        if (index < allImages.length - 1) {
          setImage(allImages[index + 1])
        } else {
          setImage(allImages[0]) // Başa dön
        }
      } else if (e.key === 'ArrowLeft') {
        const index = allImages.findIndex(item => item.url === image.url)
        if (index > 0) {
          setImage(allImages[index - 1])
        }
      }
    }
  }

  useEventListener('keydown', handleKeyPress)

  const allImages = imageArrays.flat()

  const renderMasonryView = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
      {imageArrays.map((imageArray, imageArrayIndex) => (
        <div
          className="flex flex-col gap-4 lg:gap-6"
          key={imageArrayIndex.toString()}
        >
          {imageArray.map((image, imageIndex) => (
            <DialogTrigger
              key={imageArrayIndex.toString() + imageIndex.toString()}
              onClick={() => setImage(image)}
              className="group bg-card border-ring/20 relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg"
            >
              <div className="relative overflow-hidden">
                <ArtImage
                  src={image.url}
                  description={image.description}
                  className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            </DialogTrigger>
          ))}
        </div>
      ))}
    </div>
  )

  const renderGridView = () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {allImages.map((image, index) => (
        <DialogTrigger
          key={index}
          onClick={() => setImage(image)}
          className="group bg-card border-ring/20 relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-lg"
        >
          <div className="relative h-80 overflow-hidden">
            <ArtImage
              src={image.url}
              className="h-full w-full transition-transform duration-500 group-hover:scale-105"
              imageClassName="h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
          <div className="px-4 py-3">
            <p className="text-muted-foreground line-clamp-1 font-mono text-sm tracking-wide">
              {image.description || `Photo ${index + 1}`}
            </p>
          </div>
        </DialogTrigger>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-end">
        <div className="bg-card border-ring/20 flex items-center rounded-lg border p-1">
          <button
            onClick={() => setViewMode('masonry')}
            className={`flex items-center space-x-2 rounded-md px-3 py-2 transition-colors ${
              viewMode === 'masonry'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGridIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Masonry</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center space-x-2 rounded-md px-3 py-2 transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid3X3Icon className="h-4 w-4" />
            <span className="text-sm font-medium">Grid</span>
          </button>
        </div>
      </div>

      {/* Gallery Content */}
      <Dialog>
        {viewMode === 'masonry' ? renderMasonryView() : renderGridView()}

        {image && (
          <DialogContent className="max-h-[100vh] min-h-full max-w-[100vw] min-w-full overflow-hidden rounded-none border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black p-0">
            <DialogTitle className="sr-only">
              {image.description || `Photo ${allImages.findIndex(item => item.url === image.url) + 1}`}
            </DialogTitle>
            <div className="relative h-full w-full max-w-full overflow-hidden">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(255,255,255,0.03)_50%,transparent_51%)] bg-[length:20px_20px]" />
              </div>

              {/* Top Bar */}
              <div className="absolute top-0 right-0 left-0 z-40 bg-gradient-to-b from-black/70 via-black/40 to-transparent p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="hidden items-center space-x-4 md:flex">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>

                  <div className="rounded-full border border-white/20 bg-black/20 px-3 py-1 font-mono text-sm text-white/90 backdrop-blur-sm">
                    {allImages.findIndex(item => item.url === image.url) + 1} of{' '}
                    {allImages.length}
                  </div>

                  <button
                    onClick={() => setImage(null)}
                    className="rounded-full border border-white/20 bg-black/30 p-2 text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-black/50"
                  >
                    <XIcon className="h-5 w-5 md:h-6 md:w-6" />
                  </button>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="flex h-full flex-col overflow-hidden md:hidden">
                {/* Main Image - Mobile */}
                <div className="flex flex-1 flex-col items-center justify-center pt-16 pb-4">
                  {/* Main Image Container - Mobile */}
                  <div className="relative mb-4 flex w-full items-center justify-center px-4">
                    <div className="relative w-full rounded-2xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-sm">
                      <Image
                        src={image.url}
                        alt={image.description || 'Artwork'}
                        width={800}
                        height={600}
                        className="h-auto max-h-[56vh] w-full rounded-lg object-contain"
                      />
                    </div>
                  </div>

                  {/* Navigation Arrows Below Image - Mobile */}
                  <div className="flex items-center justify-center space-x-8">
                    <button
                      onClick={() => {
                        const currentIndex = allImages.findIndex(
                          item => item.url === image.url,
                        )
                        const prevIndex =
                          currentIndex > 0
                            ? currentIndex - 1
                            : allImages.length - 1
                        setImage(allImages[prevIndex])
                      }}
                      className="rounded-full border border-white/30 bg-black/60 p-4 text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-black/80"
                    >
                      <ChevronLeftIcon className="h-6 w-6" />
                    </button>

                    <button
                      onClick={() => {
                        const currentIndex = allImages.findIndex(
                          item => item.url === image.url,
                        )
                        const nextIndex =
                          currentIndex < allImages.length - 1
                            ? currentIndex + 1
                            : 0
                        setImage(allImages[nextIndex])
                      }}
                      className="rounded-full border border-white/30 bg-black/60 p-4 text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-black/80"
                    >
                      <ChevronRightIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Bottom Info Panel - Mobile */}
                <div className="max-h-[30vh] overflow-y-auto border-t border-white/10 bg-black/40 p-4 backdrop-blur-sm">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        Photo{' '}
                        {allImages.findIndex(item => item.url === image.url) +
                          1}
                      </h3>
                      <div className="font-mono text-xs text-white/60">
                        {Math.round(
                          ((allImages.findIndex(
                            item => item.url === image.url,
                          ) +
                            1) /
                            allImages.length) *
                            100,
                        )}
                        %
                      </div>
                    </div>

                    {image.description && (
                      <div>
                        <p className="line-clamp-3 text-sm leading-relaxed text-white/80">
                          {image.description}
                        </p>
                      </div>
                    )}

                    {/* Progress Bar - Mobile */}
                    <div className="h-1 w-full rounded-full bg-white/10">
                      <div
                        className="h-1 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
                        style={{
                          width: `${((allImages.findIndex(item => item.url === image.url) + 1) / allImages.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Thumbnails - Mobile */}
                <div className="border-t border-white/10 bg-black/20 p-2 backdrop-blur-sm">
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {allImages.map((img, idx) => (
                      <button
                        key={img.url}
                        onClick={() => setImage(img)}
                        className={`relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg transition-all duration-300 ${
                          img.url === image.url
                            ? 'scale-110 ring-2 ring-blue-400'
                            : 'opacity-40 hover:opacity-80'
                        }`}
                      >
                        <Image
                          src={img.url}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute right-0 bottom-0 left-0 text-center">
                          <span className="font-mono text-xs text-white">
                            {idx + 1}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden h-full md:flex">
                {/* Left Header - Thumbnails */}
                <div className="flex w-20 flex-col items-center space-y-3 overflow-y-auto border-r border-white/10 bg-black/20 py-20 backdrop-blur-sm">
                  {allImages.map((img, idx) => (
                    <button
                      key={img.url}
                      onClick={() => setImage(img)}
                      className={`relative h-12 w-12 overflow-hidden rounded-lg transition-all duration-300 ${
                        img.url === image.url
                          ? 'scale-110 shadow-lg ring-2 shadow-blue-400/25 ring-blue-400'
                          : 'opacity-40 hover:scale-105 hover:opacity-80'
                      }`}
                    >
                      <Image
                        src={img.url}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute right-0 bottom-0 left-0 text-center">
                        <span className="font-mono text-xs text-white">
                          {idx + 1}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Center - Main Image */}
                <div className="relative flex flex-1 items-center justify-center p-8">
                  {/* Navigation Arrows */}
                  <button
                    onClick={() => {
                      const currentIndex = allImages.findIndex(
                        item => item.url === image.url,
                      )
                      const prevIndex =
                        currentIndex > 0
                          ? currentIndex - 1
                          : allImages.length - 1
                      setImage(allImages[prevIndex])
                    }}
                    className="absolute top-1/2 left-4 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-white/5 p-4 text-white/60 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/10 hover:text-white"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>

                  <button
                    onClick={() => {
                      const currentIndex = allImages.findIndex(
                        item => item.url === image.url,
                      )
                      const nextIndex =
                        currentIndex < allImages.length - 1
                          ? currentIndex + 1
                          : 0
                      setImage(allImages[nextIndex])
                    }}
                    className="absolute top-1/2 right-4 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-white/5 p-4 text-white/60 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white/10 hover:text-white"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>

                  {/* Main Image Container */}
                  <div className="relative flex h-full w-full items-center justify-center">
                    <div className="relative rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-sm">
                      <Image
                        src={image.url}
                        alt={image.description || 'Artwork'}
                        width={1200}
                        height={800}
                        className="h-auto max-h-[70vh] max-w-full min-w-96 rounded-lg object-contain"
                      />

                      {/* Image Reflection */}
                      <div className="absolute right-4 -bottom-4 left-4 h-8 rounded-b-2xl bg-gradient-to-b from-white/5 to-transparent blur-sm" />
                    </div>
                  </div>
                </div>

                {/* Right Header - Info */}
                <div className="flex h-full w-80 flex-col border-l border-white/10 bg-black/20 p-6 backdrop-blur-sm">
                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-shrink-0">
                      <h3 className="mb-2 text-xl font-semibold text-white">
                        Artwork Details
                      </h3>
                      <div className="mb-6 h-0.5 w-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500" />
                    </div>

                    <div className="min-h-0 flex-1 space-y-4">
                      <div className="flex-shrink-0">
                        <label className="font-mono text-xs tracking-wider text-white/60 uppercase">
                          Title
                        </label>
                        <p className="mt-1 font-medium text-white">
                          Photo{' '}
                          {allImages.findIndex(item => item.url === image.url) +
                            1}
                        </p>
                      </div>

                      {image.description && (
                        <div className="flex min-h-0 flex-1 flex-col">
                          <label className="flex-shrink-0 font-mono text-xs tracking-wider text-white/60 uppercase">
                            Description
                          </label>
                          <div className="mt-1 min-h-0 flex-1">
                            <p className="scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent h-full max-h-48 overflow-y-auto pr-2 text-sm leading-relaxed text-white/80">
                              {image.description}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex-shrink-0">
                        <label className="font-mono text-xs tracking-wider text-white/60 uppercase">
                          Collection
                        </label>
                        <p className="mt-1 text-sm text-white/80">
                          Instagram Gallery
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex justify-between font-mono text-xs text-white/60">
                      <span>Progress</span>
                      <span>
                        {Math.round(
                          ((allImages.findIndex(
                            item => item.url === image.url,
                          ) +
                            1) /
                            allImages.length) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-white/10">
                      <div
                        className="h-1 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 transition-all duration-500"
                        style={{
                          width: `${((allImages.findIndex(item => item.url === image.url) + 1) / allImages.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
