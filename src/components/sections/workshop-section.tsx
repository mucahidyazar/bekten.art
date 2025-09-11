'use client'

import {Edit, Palette, PaletteIcon, Sparkles} from 'lucide-react'
import {useTranslations} from 'next-intl'
import {useState} from 'react'

import {saveWorkshopDataAction} from '@/actions/workshop'
import {
  DynamicEditModal,
  type FieldConfig,
  type ViewConfig,
} from '@/components/modals/dynamic-edit-modal'
import {GalleryModal} from '@/components/modals/gallery-modal'
import {ArtImage} from '@/components/molecules/art-image'
import {SectionHeader} from '@/components/molecules/section-header'
import {Button} from '@/components/ui/button'

import type {
  WorkshopDatabaseItem,
  WorkshopDatabaseSettings,
} from '@/types/database'

type WorkshopSectionProps = {
  workshopData: {
    items: WorkshopDatabaseItem[]
    settings: WorkshopDatabaseSettings | null
  }
}

export function WorkshopSection({workshopData}: WorkshopSectionProps) {
  const t = useTranslations('homepage')
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState('')
  const [imageUpdateCallback, setImageUpdateCallback] = useState<
    ((url: string) => void) | null
  >(null)

  // Configuration for workshop items
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
      placeholderIcon: <Palette className="text-muted-foreground/60 h-8 w-8" />,
    },
    table: {
      columns: [
        {field: 'data.url', label: 'Image', width: 'w-[100px]', type: 'image'},
        {field: 'data.title', label: 'Title', type: 'text'},
        {field: 'data.description', label: 'Description', type: 'textarea'},
      ],
    },
  }
  // Create new workshop item (raw database format)
  const createNewItem = (
    data: Partial<WorkshopDatabaseItem>,
  ): WorkshopDatabaseItem => ({
    id: data.id || `temp-${Date.now()}`,
    section_type: 'workshop',
    data: {
      url: data.data?.url || '',
      title: data.data?.title || '',
      description: data.data?.description || '',
      ...data.data,
    },
    order: data.order || workshopData.items.length,
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

  const handleWorkshopSave = async (data: {
    items: WorkshopDatabaseItem[]
    settings: WorkshopDatabaseSettings
  }) => {
    try {
      console.log('Saving workshop data:', data) // Debug log
      console.log(
        'Items URLs:',
        data.items.map(item => ({id: item.id, url: item.data?.url})),
      ) // Debug URLs
      const [result, error] = await saveWorkshopDataAction(data)

      console.log('Server action response:', {result, error}) // Debug log

      if (error) {
        console.error('Server action error details:', {
          type: error.type,
          message: error.message,
          issues: error.issues,
          cause: error.cause,
        })

        // Validation hatalarını detaylı göster
        if (error.type === 'validation' && error.issues) {
          console.error('Validation issues:', error.issues)
          const validationErrors = error.issues
            .map(issue => `${issue.path.join('.')}: ${issue.message}`)
            .join(', ')

          throw new Error(`Validation failed: ${validationErrors}`)
        }

        // Daha anlamlı hata mesajı
        const errorMessage = error.message || 'Unknown server error'

        throw new Error(errorMessage)
      }

      if (result?.success) {
        console.log('Workshop data saved successfully:', result.message)
        // No need to refresh - revalidatePath handles the update
      } else {
        throw new Error('Save operation failed - no success response')
      }
    } catch (error) {
      console.error('Catch block error:', error)
      throw error
    }
  }

  if (
    !workshopData ||
    !workshopData.settings ||
    workshopData.items.length === 0
  ) {
    return null
  }

  // Create admin edit trigger
  const adminEditTrigger = (
    <DynamicEditModal
      items={workshopData.items}
      settings={workshopData.settings!}
      title={workshopData.settings?.section_title || 'Workshop Studio'}
      description={
        workshopData.settings?.section_description ||
        'Craft your creative space with intuitive drag & drop tools and modern design elements'
      }
      icon={<Sparkles className="h-6 w-6 text-white" />}
      itemFields={itemFields}
      viewConfig={viewConfig}
      maxItems={workshopData.settings?.max_items || 6}
      onSave={handleWorkshopSave}
      onImageSelect={handleImageSelect}
      onImageSelected={handleImageSelected}
      viewType="table"
      createNewItem={createNewItem}
      trigger={
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="h-4 w-4" />
          Edit Workshop
        </Button>
      }
    />
  )

  return (
    <section className="relative overflow-hidden py-32">
      <div className="relative z-10 container lg:px-0">
        <SectionHeader
          badgeText={workshopData.settings?.badge_text || t('workshopBadge')}
          badgeIcon="palette"
          title={workshopData.settings?.section_title || t('workshopTitle')}
          description={
            workshopData.settings?.section_description ||
            t('workshopDescription')
          }
          adminEditTrigger={adminEditTrigger}
          className="mb-20"
        />

        {/* Interactive Workshop Grid */}
        <div className="grid min-h-[600px] grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Large Featured Image */}
          {workshopData.items[0] && (
            <div className="group from-card/80 to-card/40 border-border/20 hover:shadow-primary/10 relative flex flex-col overflow-hidden rounded-2xl border bg-gradient-to-br shadow-2xl backdrop-blur-sm transition-all duration-700 lg:col-span-7">
              <div className="relative flex-grow overflow-hidden">
                <ArtImage
                  src={workshopData.items[0].data?.url}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  imageClassName="h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h4 className="text-foreground/90 group-hover:text-primary mb-3 text-xl font-semibold transition-colors duration-300">
                  {workshopData.items[0].data?.title}
                </h4>
                <p className="text-muted-foreground/80 text-sm leading-relaxed">
                  {workshopData.items[0].data?.description}
                </p>
              </div>
              {/* Decorative Elements */}
              <div className="absolute top-4 right-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 backdrop-blur-sm transition-transform duration-500 group-hover:rotate-90">
                <PaletteIcon className="h-5 w-5 text-white/80" />
              </div>
            </div>
          )}

          {/* Right Column - Smaller Images */}
          <div className="space-y-6 lg:col-span-5">
            {/* Top Row - Two Medium Images */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
              {workshopData.items.slice(1, 3).map((item, index) => (
                <div
                  key={item.id || index}
                  className="group from-card/60 to-card/30 border-border/10 relative overflow-hidden rounded-xl border bg-gradient-to-br backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="relative h-48 overflow-hidden">
                    <ArtImage
                      src={item.data?.url}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      imageClassName="h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="text-foreground/90 group-hover:text-primary mb-2 font-semibold transition-colors duration-300">
                      {item.data?.title}
                    </h4>
                    <p className="text-muted-foreground/80 line-clamp-2 text-xs">
                      {item.data?.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Row - Three Small Images */}
            <div className="grid grid-cols-3 gap-4">
              {workshopData.items.slice(3, 6).map((item, index) => (
                <div
                  key={item.id || index}
                  className="group border-border/10 bg-card/50 relative overflow-hidden rounded-lg border backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
                >
                  <div className="relative h-24 overflow-hidden">
                    <ArtImage
                      src={item.data?.url}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-2">
                    <h5 className="text-foreground/80 line-clamp-1 text-xs font-medium">
                      {item.data?.title}
                    </h5>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      <GalleryModal
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onSelect={handleGallerySelect}
        selectedUrl={selectedImageUrl}
      />
    </section>
  )
}
