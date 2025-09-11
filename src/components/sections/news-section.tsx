'use client'

import Link from 'next/link'

import {CalendarIcon, Edit, MapPinIcon} from 'lucide-react'
import {useTranslations} from 'next-intl'
import {unstable_ViewTransition as ViewTransition} from 'react'

import {saveNewsDataAction} from '@/actions/news'
import {DynamicEditModal} from '@/components/modals/dynamic-edit-modal'
import {SectionHeader} from '@/components/molecules/section-header'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {FallbackImage} from '@/components/ui/fallback-image'
import {formatDate} from '@/utils/format-date'
import {handleSectionSave} from '@/utils/section-save-handler'

import type {
  FieldConfig,
  ViewConfig,
} from '@/components/modals/dynamic-edit-modal'
import type {NewsDatabaseItem, NewsDatabaseSettings} from '@/types/database'

interface NewsSectionProps {
  newsData: {
    items: NewsDatabaseItem[]
    settings: NewsDatabaseSettings | null
  }
}

export function NewsSection({newsData}: NewsSectionProps) {
  const t = useTranslations()

  // Sort news by date (newest first)
  const sortedNews = newsData.items.sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime(),
  )
  const featuredNews = sortedNews[0]
  const otherNews = sortedNews.slice(1)

  const itemFields: FieldConfig[] = [
    {
      name: 'data.title',
      label: t('common.title'),
      type: 'text',
      placeholder: 'Enter news title...',
      required: true,
    },
    {
      name: 'data.subtitle',
      label: t('news.subtitle'),
      type: 'text',
      placeholder: 'Enter news subtitle...',
      required: false,
    },
    {
      name: 'data.description',
      label: t('common.description'),
      type: 'textarea',
      placeholder: 'Enter news description...',
      required: true,
    },
    {
      name: 'data.image',
      label: 'Image URL',
      type: 'image',
      placeholder: 'Enter image URL or select from gallery...',
      required: false,
    },
    {
      name: 'data.date',
      label: 'Date',
      type: 'text',
      placeholder: 'Enter date (YYYY-MM-DDTHH:mm:ssZ)...',
      required: true,
    },
    {
      name: 'data.location',
      label: 'Location',
      type: 'text',
      placeholder: 'Enter event location...',
      required: false,
    },
    {
      name: 'data.address',
      label: 'Address',
      type: 'text',
      placeholder: 'Enter event address...',
      required: false,
    },
    {
      name: 'data.note',
      label: 'Note',
      type: 'textarea',
      placeholder: 'Enter additional notes...',
      required: false,
    },
    {
      name: 'data.source',
      label: 'Source URL',
      type: 'text',
      placeholder: 'Enter source URL...',
      required: false,
    },
    {
      name: 'data.category',
      label: t('news.category'),
      type: 'select',
      placeholder: 'Select news category...',
      options: [
        {value: 'news', label: 'News'},
        {value: 'feature', label: 'Feature'},
        {value: 'interview', label: 'Interview'},
        {value: 'exhibition', label: 'Exhibition'},
        {value: 'biography', label: 'Biography'},
      ],
      required: false,
    },
  ]

  const viewConfig: ViewConfig = {
    card: {
      titleField: 'data.title',
      descriptionField: 'data.description',
      imageField: 'data.image',
    },
    table: {
      columns: [
        {field: 'data.title', label: 'Title', type: 'text'},
        {field: 'data.subtitle', label: 'Subtitle', type: 'text'},
        {field: 'data.category', label: 'Category', type: 'text'},
        {field: 'data.date', label: 'Date', type: 'text'},
        {field: 'data.location', label: 'Location', type: 'text'},
        {field: 'data.source', label: 'Source', type: 'text'},
        {field: 'is_active', label: 'Active', type: 'text'},
      ],
    },
  }

  const handleNewsSave = async (data: {items: any[]; settings: any}) => {
    return handleSectionSave(
      {
        items: data.items,
        settings: data.settings,
      },
      saveNewsDataAction,
      'news',
    )
  }

  // Create new news item (raw database format)
  const createNewItem = (
    data: Partial<NewsDatabaseItem>,
  ): NewsDatabaseItem => ({
    id: data.id || `temp-${Date.now()}`,
    section_type: 'news',
    is_active: true,
    order: 0,
    data: {
      title: data.data?.title || '',
      subtitle: data.data?.subtitle || '',
      description: data.data?.description || '',
      image: data.data?.image || '',
      date: data.data?.date || new Date().toISOString(),
      location: data.data?.location || '',
      address: data.data?.address || '',
      note: data.data?.note || '',
      source: data.data?.source || '',
      category: data.data?.category || 'news',
      ...data.data,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...data,
  })

  const adminEditTrigger = (
    <DynamicEditModal
      title={t('news.editNewsSection')}
      description={t('news.manageNewsDescription')}
      items={newsData.items}
      settings={newsData.settings || {}}
      itemFields={itemFields}
      viewConfig={viewConfig}
      onSave={handleNewsSave}
      createNewItem={createNewItem}
      trigger={
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          {t('news.editNews')}
        </Button>
      }
    />
  )

  return (
    <div className="container">
      {/* Featured News */}
      {featuredNews && (
        <ViewTransition>
          <Link
            href={`/news/${featuredNews.id}`}
            className="group block cursor-pointer"
          >
            <div className="bg-card border-ring/20 relative overflow-hidden rounded-2xl border shadow-xl transition-transform duration-300 hover:scale-[1.02] sm:max-h-[490px]">
              <div className="grid gap-0 lg:grid-cols-2">
                {/* Image */}
                <div className="relative h-80 lg:h-auto">
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/50 to-transparent" />
                  <FallbackImage
                    src={featuredNews.data.image}
                    fallbackSrc="/img/empty-event-image.png"
                    alt={featuredNews.data.title}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute top-4 left-4 z-20 flex gap-2">
                    <Badge
                      variant="default"
                      className="bg-primary text-primary-foreground"
                    >
                      {t('news.featured')}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {featuredNews.data.category}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col justify-center p-6 lg:p-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h2 className="text-foreground text-2xl leading-tight font-bold lg:text-3xl">
                        {featuredNews.data.title}
                      </h2>
                      {featuredNews.data.subtitle && (
                        <p className="text-primary text-base font-medium">
                          {featuredNews.data.subtitle}
                        </p>
                      )}
                    </div>

                    <p className="text-muted-foreground leading-relaxed">
                      {featuredNews.data.description}
                    </p>

                    {/* Event Details */}
                    <div className="space-y-2">
                      <div className="text-muted-foreground flex items-center space-x-2 text-sm">
                        <CalendarIcon className="text-primary h-4 w-4" />
                        <span className="font-medium">
                          {formatDate(
                            'MMMM DD, YYYY',
                            new Date(featuredNews.data.date),
                          )}
                        </span>
                      </div>

                      {featuredNews.data.location && (
                        <div className="text-muted-foreground flex items-center space-x-2 text-sm">
                          <MapPinIcon className="text-primary h-4 w-4" />
                          <span>{featuredNews.data.location}</span>
                        </div>
                      )}
                    </div>

                    {featuredNews.data.source && (
                      <ViewTransition>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            window.open(
                              featuredNews.data.source,
                              '_blank',
                              'noopener,noreferrer',
                            )
                          }}
                          className="text-primary hover:text-primary/80 inline-flex cursor-pointer items-center text-sm font-medium transition-colors"
                        >
                          {t('news.readOriginal')} →
                        </button>
                      </ViewTransition>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </ViewTransition>
      )}

      {/* News Grid */}
      <div className="space-y-8">
        <SectionHeader
          badgeText={newsData.settings?.badge_text || t('news.latestUpdates')}
          badgeIcon="newspaper"
          title={newsData.settings?.section_title || t('news.allNewsEvents')}
          description={
            newsData.settings?.section_description || t('news.newsDescription')
          }
          className="mb-8"
          adminEditTrigger={adminEditTrigger}
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {otherNews.map(news => (
            <ViewTransition key={news.id}>
              <Link
                href={`/news/${news.id}`}
                className="group block cursor-pointer"
              >
                <article className="group bg-card border-ring/20 overflow-hidden rounded-xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <FallbackImage
                      src={news.data.image}
                      fallbackSrc="/img/empty-event-image.png"
                      alt={news.data.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="space-y-4 p-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-foreground group-hover:text-primary line-clamp-2 text-xl font-bold transition-colors">
                          {news.data.title}
                        </h3>
                        <Badge
                          variant="secondary"
                          className="ml-2 shrink-0 capitalize"
                        >
                          {news.data.category}
                        </Badge>
                      </div>
                      {news.data.subtitle && (
                        <p className="text-primary text-sm font-medium">
                          {news.data.subtitle}
                        </p>
                      )}
                    </div>

                    <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                      {news.data.description}
                    </p>

                    {/* Event Info */}
                    <div className="text-muted-foreground space-y-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="text-primary h-3 w-3" />
                        <span>
                          {formatDate(
                            'MMMM DD, YYYY',
                            new Date(news.data.date),
                          )}
                        </span>
                      </div>

                      {news.data.location && (
                        <div className="flex items-center space-x-2">
                          <MapPinIcon className="text-primary h-3 w-3" />
                          <span className="line-clamp-1">
                            {news.data.location}
                          </span>
                        </div>
                      )}
                    </div>

                    {news.data.source ? (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          window.open(
                            news.data.source,
                            '_blank',
                            'noopener,noreferrer',
                          )
                        }}
                        className="text-primary hover:text-primary/80 inline-flex cursor-pointer items-center text-sm font-medium transition-colors"
                      >
                        {t('news.readOriginal')} →
                      </button>
                    ) : (
                      <span className="text-primary hover:text-primary/80 inline-flex items-center text-sm font-medium transition-colors">
                        {t('news.readMore')} →
                      </span>
                    )}
                  </div>
                </article>
              </Link>
            </ViewTransition>
          ))}
        </div>
      </div>
    </div>
  )
}
