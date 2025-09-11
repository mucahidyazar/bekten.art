'use client'

import Image from 'next/image'

import {Edit, ImageIcon, Sparkles} from 'lucide-react'
import {useTranslations} from 'next-intl'
import {useState} from 'react'

import {saveMemoriesDataAction} from '@/actions/memories'
import {
  DynamicEditModal,
  type FieldConfig,
  type ViewConfig,
} from '@/components/modals/dynamic-edit-modal'
import {GalleryModal} from '@/components/modals/gallery-modal'
import {ArtImage} from '@/components/molecules/art-image'
import {SectionHeader} from '@/components/molecules/section-header'
import {Button} from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {useEventListener} from '@/hooks/use-event-listener'
import {handleSectionSave} from '@/utils/section-save-handler'

import type {
  MemoriesDatabaseItem,
  MemoriesDatabaseSettings,
} from '@/types/database'

type MemoriesSectionProps = {
  memoriesData: {
    items: MemoriesDatabaseItem[]
    settings: MemoriesDatabaseSettings | null
  }
}

export function MemoriesSection({memoriesData}: MemoriesSectionProps) {
  const t = useTranslations('homepage')
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState('')
  const [imageUpdateCallback, setImageUpdateCallback] = useState<
    ((url: string) => void) | null
  >(null)
  const [selectedImage, setSelectedImage] =
    useState<MemoriesDatabaseItem | null>(null)

  // Configuration for memories items
  const itemFields: FieldConfig[] = [
    {
      name: 'data.url',
      label: 'Image',
      type: 'image',
      placeholder: 'Enter image URL or select from gallery...',
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
  ]

  // View configuration (using raw database fields)
  const viewConfig: ViewConfig = {
    card: {
      aspectRatio: '160/240',
      imageField: 'data.url',
      titleField: 'data.title',
      descriptionField: 'data.description',
      placeholderIcon: (
        <ImageIcon className="text-muted-foreground/60 h-8 w-8" />
      ),
    },
    table: {
      columns: [
        {field: 'data.url', label: 'Image', width: 'w-[100px]', type: 'image'},
        {field: 'data.title', label: 'Title', type: 'text'},
        {field: 'data.description', label: 'Description', type: 'textarea'},
      ],
    },
  }

  // Create new memories item (raw database format)
  const createNewItem = (
    data: Partial<MemoriesDatabaseItem>,
  ): MemoriesDatabaseItem => ({
    id: data.id || `temp-${Date.now()}`,
    section_type: 'memories',
    data: {
      url: data.data?.url || '',
      title: data.data?.title || '',
      description: data.data?.description || '',
      ...data.data,
    },
    order: data.order || memoriesData.items.length,
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

  // Create a callback for image selected - this will be passed to DynamicEditModal
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

  const handleMemoriesSave = async (data: {
    items: MemoriesDatabaseItem[]
    settings: MemoriesDatabaseSettings
  }) => {
    return handleSectionSave(data, saveMemoriesDataAction, 'memories')
  }

  // Keyboard navigation for modal
  const handleKeyPress = (e: KeyboardEvent) => {
    if (selectedImage) {
      if (e.key === 'ArrowRight') {
        const index = memoriesData.items.findIndex(
          item => item.id === selectedImage.id,
        )

        if (index < memoriesData.items.length - 1) {
          setSelectedImage(memoriesData.items[index + 1])
        } else {
          setSelectedImage(memoriesData.items[0]) // Go to first
        }
      } else if (e.key === 'ArrowLeft') {
        const index = memoriesData.items.findIndex(
          item => item.id === selectedImage.id,
        )

        if (index > 0) {
          setSelectedImage(memoriesData.items[index - 1])
        }
      }
    }
  }

  useEventListener('keydown', handleKeyPress)

  if (
    !memoriesData ||
    !memoriesData.settings ||
    memoriesData.items.length === 0
  ) {
    return null
  }

  // Create admin edit trigger
  const adminEditTrigger = (
    <DynamicEditModal
      items={memoriesData.items}
      settings={memoriesData.settings!}
      title={memoriesData.settings?.section_title || 'Memories in Paint'}
      description={
        memoriesData.settings?.section_description ||
        'Manage the collection of artworks that capture emotions and memories'
      }
      icon={<Sparkles className="h-6 w-6 text-white" />}
      itemFields={itemFields}
      viewConfig={viewConfig}
      maxItems={memoriesData.settings?.max_items || 12}
      onSave={handleMemoriesSave}
      onImageSelect={handleImageSelect}
      onImageSelected={handleImageSelected}
      viewType="table"
      createNewItem={createNewItem}
      trigger={
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="h-4 w-4" />
          Edit Memories
        </Button>
      }
    />
  )

  return (
    <section className="py-20">
      <div className="container lg:px-0">
        <SectionHeader
          badgeText={memoriesData.settings?.badge_text || t('collectionBadge')}
          badgeIcon="sparkles"
          title={memoriesData.settings?.section_title || t('collectionTitle')}
          description={
            memoriesData.settings?.section_description ||
            t('collectionDescription')
          }
          adminEditTrigger={adminEditTrigger}
        />

        {/* Memories Gallery */}
        <aside className="w-full">
          <Dialog>
            <div className="flex w-full gap-2 overflow-auto">
              {memoriesData.items.map(item => (
                <DialogTrigger
                  key={item.id}
                  onClick={() => setSelectedImage(item)}
                >
                  <ArtImage
                    src={item.data?.url}
                    description={item.data?.title}
                    className="h-60 w-40 min-w-[10rem] rounded-lg"
                    imageClassName="object-cover h-full group-hover:scale-125 duration-500"
                  />
                </DialogTrigger>
              ))}
            </div>

            {selectedImage && (
              <DialogContent className="flex h-full w-fit flex-col bg-white p-2 sm:h-auto sm:p-4 lg:rounded">
                <DialogHeader>
                  <DialogTitle>{selectedImage.data?.title}</DialogTitle>
                  <DialogDescription>
                    {selectedImage.data?.description}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex h-full flex-grow flex-col items-center overflow-hidden">
                  <Image
                    src={selectedImage.data?.url || ''}
                    alt={selectedImage.data?.description || ''}
                    width={1000}
                    height={1000}
                    className="h-full max-h-[80vh] w-fit"
                  />
                </div>
              </DialogContent>
            )}
          </Dialog>
        </aside>

        {/* Gallery Modal */}
        <GalleryModal
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
          onSelect={handleGallerySelect}
          selectedUrl={selectedImageUrl}
        />
      </div>
    </section>
  )
}
