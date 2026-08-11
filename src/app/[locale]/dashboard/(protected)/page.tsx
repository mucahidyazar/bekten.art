import Link from 'next/link'

import {PublicPageTransition} from '@/components/public-site/public-view-transition'
import {NAV_FORWARD_TRANSITION} from '@/components/public-site/public-view-transition'
import {
  StudioEmptyState,
  StudioMetricCard,
  StudioPageHeader,
} from '@/components/studio/studio-dashboard-components'
import {buttonVariants} from '@/components/ui/button'
import {prisma} from '@/lib/db'
import {requireStudioEditor} from '@/server/studio-auth/configured-access'
import {cn} from '@/utils'

const cards = [
  {key: 'draftArtworks', label: 'Artwork drafts'},
  {key: 'publishedArtworks', label: 'Published artworks'},
  {key: 'collections', label: 'Collections'},
  {key: 'newInquiries', label: 'New inquiries'},
] as const

export default async function StudioOverviewPage() {
  await requireStudioEditor()

  const [draftArtworks, publishedArtworks, collections, newInquiries] =
    await Promise.all([
      prisma.artwork.count({where: {status: 'DRAFT'}}),
      prisma.artwork.count({where: {status: 'PUBLISHED'}}),
      prisma.collection.count(),
      prisma.inquiry.count({where: {status: 'NEW'}}),
    ])
  const counts = {
    collections,
    draftArtworks,
    newInquiries,
    publishedArtworks,
  }

  return (
    <PublicPageTransition>
      <section aria-labelledby="studio-overview-title">
        <StudioPageHeader
          description="A quiet view of the archive, current drafts, and collector requests."
          eyebrow="Today"
          title="Editorial overview"
          titleId="studio-overview-title"
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(card => (
            <StudioMetricCard
              key={card.key}
              label={card.label}
              value={counts[card.key]}
            />
          ))}
        </div>

        {draftArtworks + publishedArtworks + collections + newInquiries ===
        0 ? (
          <div className="mt-8">
            <StudioEmptyState
              action={
                <Link
                  className={cn(
                    buttonVariants({size: 'lg'}),
                    'bg-[#6f2a1a] text-[#fffaf0] hover:bg-[#542014]',
                  )}
                  href="/dashboard/artworks/new"
                  transitionTypes={[...NAV_FORWARD_TRANSITION]}
                >
                  Create an artwork
                </Link>
              }
              description="Begin the editorial archive with a real artwork record. Everything can be revised before publication."
              title="The Studio queue is clear."
            />
          </div>
        ) : (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className={cn(
                buttonVariants({size: 'lg'}),
                'bg-[#6f2a1a] text-[#fffaf0] hover:bg-[#542014]',
              )}
              href="/dashboard/artworks?status=DRAFT"
              transitionTypes={[...NAV_FORWARD_TRANSITION]}
            >
              Review drafts
            </Link>
            <Link
              className={cn(
                buttonVariants({size: 'lg', variant: 'outline'}),
                'border-stone-500/45 bg-[#f7f1e6]',
              )}
              href="/dashboard/inquiries?status=NEW"
              transitionTypes={[...NAV_FORWARD_TRANSITION]}
            >
              Open inquiry inbox
            </Link>
          </div>
        )}
      </section>
    </PublicPageTransition>
  )
}
