'use client'

import Link from 'next/link'

import {ArrowRightIcon, Edit, HeartIcon, PaletteIcon, User} from 'lucide-react'
import {useTranslations} from 'next-intl'

import {saveArtistDataAction} from '@/actions/artist'
import {
  DynamicEditModal,
  type FieldConfig,
  type ViewConfig,
} from '@/components/modals/dynamic-edit-modal'
import {SectionHeader} from '@/components/molecules/section-header'
import {Button} from '@/components/ui/button'

import type {ArtistDatabaseItem, ArtistDatabaseSettings} from '@/types/database'

type ArtistSectionProps = {
  artistData: {
    items: ArtistDatabaseItem[]
    settings: ArtistDatabaseSettings | null
  }
}

export function ArtistSection({artistData}: ArtistSectionProps) {
  const t = useTranslations('homepage')

  // Configuration for artist items (stats)
  const itemFields: FieldConfig[] = [
    {
      name: 'data.number',
      label: 'Number',
      type: 'text',
      placeholder: 'Enter stat number (e.g., 50+)...',
      required: true,
    },
    {
      name: 'data.title',
      label: 'Title',
      type: 'text',
      placeholder: 'Enter stat title...',
      required: true,
    },
    {
      name: 'data.description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter stat description...',
      required: true,
    },
  ]

  // View configuration (using raw database fields)
  const viewConfig: ViewConfig = {
    table: {
      columns: [
        {
          field: 'data.number',
          label: 'Number',
          width: 'w-[120px]',
          type: 'text',
        },
        {field: 'data.title', label: 'Title', type: 'text'},
        {field: 'data.description', label: 'Description', type: 'textarea'},
      ],
    },
  }

  // Create new artist item (stat)
  const createNewItem = (
    data: Partial<ArtistDatabaseItem>,
  ): ArtistDatabaseItem => ({
    id: data.id || `temp-${Date.now()}`,
    section_type: 'artist',
    data: {
      number: data.data?.number || '',
      title: data.data?.title || '',
      description: data.data?.description || '',
      ...data.data,
    },
    order: data.order || artistData.items.length,
    is_active: data.is_active ?? true,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
  })

  const handleArtistSave = async (data: {
    items: ArtistDatabaseItem[]
    settings: ArtistDatabaseSettings
  }) => {
    try {
      console.log('Saving artist data:', data)
      const [result, error] = await saveArtistDataAction(data)

      if (error) {
        console.error('Server action error details:', {
          type: error.type,
          message: error.message,
          issues: error.issues,
          cause: error.cause,
        })

        if (error.type === 'validation' && error.issues) {
          console.error('Validation issues:', error.issues)
          const validationErrors = error.issues
            .map((issue: any) => `${issue.path.join('.')}: ${issue.message}`)
            .join(', ')

          throw new Error(`Validation failed: ${validationErrors}`)
        }

        const errorMessage = error.message || 'Unknown server error'

        throw new Error(errorMessage)
      }

      if (result?.success) {
        console.log('Artist data saved successfully:', result.message)
      } else {
        throw new Error('Save operation failed - no success response')
      }
    } catch (error) {
      console.error('Catch block error:', error)
      throw error
    }
  }

  if (!artistData || !artistData.settings || artistData.items.length === 0) {
    return null
  }

  // Create admin edit trigger
  const adminEditTrigger = (
    <DynamicEditModal
      items={artistData.items}
      settings={artistData.settings!}
      title="Master Kyrgyz Artist"
      description="Bekten Usubaliev - Unveiling the hidden emotions and dreams within the human spirit through masterful brushstrokes"
      icon={<User className="h-6 w-6 text-white" />}
      itemFields={itemFields}
      viewConfig={viewConfig}
      maxItems={artistData.settings?.max_items || 6}
      onSave={handleArtistSave}
      viewType="table"
      createNewItem={createNewItem}
      trigger={
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="h-4 w-4" />
          Edit Artist Info
        </Button>
      }
    />
  )

  return (
    <section className="py-20">
      <div className="container lg:px-0">
        <SectionHeader
          badgeText={artistData.settings?.badge_text || t('artistBadge')}
          badgeIcon="heart"
          title={artistData.settings?.section_title || t('artistName')}
          description={
            artistData.settings?.section_description || t('artistDescription')
          }
          adminEditTrigger={adminEditTrigger}
          className="mb-16"
        />

        {/* Stats */}
        <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {artistData.items.slice(0, 3).map((item, index) => (
            <div
              key={item.id || index}
              className="bg-card/50 border-border/30 rounded-2xl border p-8 text-center backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
            >
              <div className="text-primary mb-2 text-4xl font-bold lg:text-5xl">
                {item.data?.number || '0'}
              </div>
              <div className="text-muted-foreground font-medium">
                {item.data?.title || 'No title'}
              </div>
              <div className="text-muted-foreground/70 mt-2 text-sm">
                {item.data?.description || 'No description'}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/gallery">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              <PaletteIcon className="mr-2 h-4 w-4" />
              {t('statsButton1')}
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/about">
            <Button
              variant="outline"
              size="lg"
              className="border-border/50 text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            >
              <HeartIcon className="mr-2 h-4 w-4" />
              {t('statsButton2')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
