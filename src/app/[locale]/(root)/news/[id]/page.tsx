import {CalendarIcon, MapPinIcon, ClockIcon, ArrowLeftIcon, ShareIcon, BookmarkIcon} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import { unstable_ViewTransition as ViewTransition } from 'react'

import {mockNewsData} from '@/mocks/news'
import {formatDate} from '@/utils/formatDate'
import {prepareMetadata} from '@/utils/prepareMetadata'

type PageProps = {
  params: Promise<{id: string}>
}

export async function generateMetadata({params}: PageProps) {
  const {id} = await params
  const news = mockNewsData.find(item => item.id === id)
  
  if (!news) {
    return prepareMetadata({
      title: 'News Not Found',
      description: 'The requested news article could not be found.',
      page: 'news detail',
    })
  }

  return await prepareMetadata({
    title: `🎨 ${news.title} - Bekten Usubaliev`,
    description: news.description,
    page: 'news detail',
  })
}

export default async function NewsDetailPage({params}: PageProps) {
  const {id} = await params
  const news = mockNewsData.find(item => item.id === id)

  if (!news) {
    notFound()
  }

  // Get related news (exclude current)
  const relatedNews = mockNewsData
    .filter(item => item.id !== id)
    .slice(0, 3)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Navigation */}
      <ViewTransition>
        <Link
          href="/news"
          className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to News</span>
        </Link>
      </ViewTransition>

      {/* Hero Image */}
      <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />
        <Image
          src={news.image}
          alt={news.title}
          fill
          className="object-cover"
          priority
        />
        
        {/* Floating Actions */}
        <div className="absolute top-6 right-6 z-20 flex space-x-2">
          <button className="p-2 bg-background/80 backdrop-blur-sm rounded-full text-foreground hover:bg-background transition-colors">
            <ShareIcon className="w-4 h-4" />
          </button>
          <button className="p-2 bg-background/80 backdrop-blur-sm rounded-full text-foreground hover:bg-background transition-colors">
            <BookmarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-8">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              {news.title}
            </h1>
            {news.subtitle && (
              <p className="text-xl text-primary-300 font-medium">
                {news.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Event Details Bar */}
      <div className="bg-card border border-ring/20 rounded-xl p-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date & Time</p>
              <p className="font-semibold text-foreground">
                {formatDate('MMMM DD, YYYY', news.date)}
              </p>
            </div>
          </div>

          {news.location && (
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MapPinIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-semibold text-foreground">{news.location}</p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClockIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="font-semibold text-foreground">
                {formatDate('MMMM DD, YYYY', news.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-lg max-w-none">
        <div className="bg-card border border-ring/20 rounded-xl p-8 space-y-6">
          <div className="text-lg leading-relaxed text-foreground">
            {news.description}
          </div>

          {news.address && (
            <div className="border-l-4 border-primary pl-6 bg-primary/5 py-4 rounded-r-lg">
              <h3 className="font-semibold text-foreground mb-2">Address</h3>
              <p className="text-muted-foreground">{news.address}</p>
            </div>
          )}

          {news.note && (
            <div className="border-l-4 border-accent pl-6 bg-accent/5 py-4 rounded-r-lg">
              <h3 className="font-semibold text-foreground mb-2">Important Note</h3>
              <p className="text-muted-foreground">{news.note}</p>
            </div>
          )}

          {/* Extended Content */}
          <div className="space-y-4 text-foreground leading-relaxed">
            <p>
              This event represents another milestone in Bekten Usubaliev&apos;s distinguished career as one of Kyrgyzstan&apos;s most celebrated contemporary artists. With over 25 years of experience in the art world, Usubaliev continues to push the boundaries of traditional painting while honoring his cultural heritage.
            </p>
            
            <p>
              The artist&apos;s work has been featured in numerous international exhibitions, from Luxembourg and Hungary to Turkey, where his paintings were showcased as part of the TÜRKSOY plein air program. His unique approach to oil painting combines classical techniques with modern sensibilities, creating works that speak to both local and global audiences.
            </p>

            <p>
              Visitors can expect to experience not just visual art, but a journey through the rich tapestry of Kyrgyz culture and the universal themes that connect all humanity. Each piece in the collection tells a story, inviting viewers to explore their own emotions and memories through the artist&apos;s masterful use of color, light, and composition.
            </p>
          </div>
        </div>
      </div>

      {/* Related News */}
      {relatedNews.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Related News</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {relatedNews.map((relatedItem) => (
              <ViewTransition key={relatedItem.id}>
                <Link
                  href={`/news/${relatedItem.id}`}
                  className="group bg-card border border-ring/20 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                >
                <div className="relative h-32 overflow-hidden">
                  <Image
                    src={relatedItem.image}
                    alt={relatedItem.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {relatedItem.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {formatDate('MMMM DD, YYYY', relatedItem.date)}
                  </p>
                </div>
                </Link>
              </ViewTransition>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="bg-gradient-to-br from-primary/5 to-transparent rounded-2xl p-8 text-center">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-foreground">Stay Connected</h3>
          <p className="text-muted-foreground">
            Follow Bekten Usubaliev&apos;s artistic journey and never miss an update.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ViewTransition>
              <Link
                href="/contact"
                className=" py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Get in Touch
              </Link>
            </ViewTransition>
            <ViewTransition>
              <Link
                href="/gallery"
                className=" py-3 border-2 border-ring/30 text-foreground font-medium rounded-lg hover:bg-muted/30 transition-colors"
              >
                View Gallery
              </Link>
            </ViewTransition>
          </div>
        </div>
      </div>
    </div>
  )
}