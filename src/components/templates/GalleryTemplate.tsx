'use client'
import {Grid3X3Icon, LayoutGridIcon, ChevronLeftIcon, ChevronRightIcon, XIcon} from 'lucide-react'
import Image from 'next/image'
import {useState} from 'react'

import {ArtImage} from '@/components/molecules/ArtImage'
import {useEventListener} from '@/hooks/useEventListener'

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '../ui/dialog'

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {imageArrays.map((imageArray, imageArrayIndex) => (
        <div
          className="flex flex-col gap-4 lg:gap-6"
          key={imageArrayIndex.toString()}
        >
          {imageArray.map((image, imageIndex) => (
            <DialogTrigger
              key={imageArrayIndex.toString() + imageIndex.toString()}
              onClick={() => setImage(image)}
              className="group relative overflow-hidden rounded-xl bg-card border border-ring/20 hover:shadow-lg transition-all duration-300"
            >
              <div className="relative overflow-hidden">
                <ArtImage
                  src={image.url}
                  description={image.description}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </DialogTrigger>
          ))}
        </div>
      ))}
    </div>
  )

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {allImages.map((image, index) => (
        <DialogTrigger
          key={index}
          onClick={() => setImage(image)}
          className="group relative overflow-hidden rounded-xl bg-card border border-ring/20 hover:shadow-lg transition-all duration-300"
        >
          <div className="relative h-80 overflow-hidden">
            <ArtImage
              src={image.url}
              className="w-full h-full transition-transform duration-500 group-hover:scale-105"
              imageClassName='h-full object-cover'
            />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-muted-foreground line-clamp-1 font-mono tracking-wide">
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
        <div className="flex items-center bg-card border border-ring/20 rounded-lg p-1">
          <button
            onClick={() => setViewMode('masonry')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
              viewMode === 'masonry'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGridIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Masonry</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid3X3Icon className="w-4 h-4" />
            <span className="text-sm font-medium">Grid</span>
          </button>
        </div>
      </div>

      {/* Gallery Content */}
      <Dialog>
        {viewMode === 'masonry' ? renderMasonryView() : renderGridView()}

        {image && (
          <DialogContent className="max-w-[100vw] min-w-full max-h-[100vh] min-h-full bg-gradient-to-br from-slate-900 via-slate-800 to-black border-0 p-0 overflow-hidden rounded-none">
            <div className="relative w-full h-full">
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(255,255,255,0.03)_50%,transparent_51%)] bg-[length:20px_20px]" />
              </div>

              {/* Top Bar */}
              <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/50 to-transparent p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                  </div>
                  
                  <div className="text-white/80 text-sm font-mono">
                    {allImages.findIndex(item => item.url === image.url) + 1} of {allImages.length}
                  </div>
                  
                  <button
                    onClick={() => setImage(null)}
                    className="text-white/80 hover:text-white transition-colors duration-200"
                  >
                    <XIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex h-full">
                {/* Left Header - Thumbnails */}
                <div className="w-20 bg-black/20 backdrop-blur-sm border-r border-white/10 flex flex-col items-center py-20 space-y-3 overflow-y-auto">
                  {allImages.map((img, idx) => (
                    <button
                      key={img.url}
                      onClick={() => setImage(img)}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden transition-all duration-300 ${
                        img.url === image.url 
                          ? 'ring-2 ring-blue-400 scale-110 shadow-lg shadow-blue-400/25' 
                          : 'opacity-40 hover:opacity-80 hover:scale-105'
                      }`}
                    >
                      <Image
                        src={img.url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 text-center">
                        <span className="text-xs text-white font-mono">{idx + 1}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Center - Main Image */}
                <div className="flex-1 flex items-center justify-center p-8 relative">
                  {/* Navigation Arrows */}
                  <button
                    onClick={() => {
                      const currentIndex = allImages.findIndex(item => item.url === image.url)
                      const prevIndex = currentIndex > 0 ? currentIndex - 1 : allImages.length - 1
                      setImage(allImages[prevIndex])
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white p-4 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-white/10"
                  >
                    <ChevronLeftIcon className="w-6 h-6" />
                  </button>
                  
                  <button
                    onClick={() => {
                      const currentIndex = allImages.findIndex(item => item.url === image.url)
                      const nextIndex = currentIndex < allImages.length - 1 ? currentIndex + 1 : 0
                      setImage(allImages[nextIndex])
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white p-4 rounded-full transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-white/10"
                  >
                    <ChevronRightIcon className="w-6 h-6" />
                  </button>

                  {/* Main Image Container */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 shadow-2xl">
                      <Image
                        src={image.url}
                        alt={image.description || 'Artwork'}
                        width={1200}
                        height={800}
                        className="max-w-full max-h-[70vh] min-w-96 h-auto object-contain rounded-lg"
                      />
                      
                      {/* Image Reflection */}
                      <div className="absolute -bottom-4 left-4 right-4 h-8 bg-gradient-to-b from-white/5 to-transparent rounded-b-2xl blur-sm" />
                    </div>
                  </div>
                </div>

                {/* Right Header - Info */}
                <div className="w-80 bg-black/20 backdrop-blur-sm border-l border-white/10 p-6 flex flex-col h-full">
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-shrink-0">
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Artwork Details
                      </h3>
                      <div className="w-12 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mb-6" />
                    </div>
                    
                    <div className="flex-1 space-y-4 min-h-0">
                      <div className="flex-shrink-0">
                        <label className="text-xs text-white/60 uppercase tracking-wider font-mono">Title</label>
                        <p className="text-white font-medium mt-1">
                          Photo {allImages.findIndex(item => item.url === image.url) + 1}
                        </p>
                      </div>
                      
                      {image.description && (
                        <div className="flex-1 min-h-0 flex flex-col">
                          <label className="text-xs text-white/60 uppercase tracking-wider font-mono flex-shrink-0">Description</label>
                          <div className="flex-1 min-h-0 mt-1">
                            <p className="text-white/80 text-sm leading-relaxed overflow-y-auto h-full max-h-48 pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                              {image.description}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex-shrink-0">
                        <label className="text-xs text-white/60 uppercase tracking-wider font-mono">Collection</label>
                        <p className="text-white/80 text-sm mt-1">Instagram Gallery</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-white/60 font-mono">
                      <span>Progress</span>
                      <span>{Math.round(((allImages.findIndex(item => item.url === image.url) + 1) / allImages.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-purple-500 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${((allImages.findIndex(item => item.url === image.url) + 1) / allImages.length) * 100}%` }}
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
