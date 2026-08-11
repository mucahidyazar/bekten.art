import {prisma} from '@/lib/db'

const cards = [
  {key: 'draftArtworks', label: 'Artwork drafts'},
  {key: 'publishedArtworks', label: 'Published artworks'},
  {key: 'collections', label: 'Collections'},
  {key: 'newInquiries', label: 'New inquiries'},
] as const

export default async function StudioOverviewPage() {
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
    <section aria-labelledby="studio-overview-title">
      <p className="text-xs font-semibold tracking-[0.2em] text-red-900 uppercase">
        Today
      </p>
      <h1
        className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl"
        id="studio-overview-title"
      >
        Editorial overview
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-stone-700">
        A quiet view of the archive, current drafts, and collector requests.
      </p>

      <dl className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(card => (
          <div
            className="border border-stone-400/60 bg-[#f8f2e6] p-6"
            key={card.key}
          >
            <dt className="text-sm leading-6 text-stone-600">{card.label}</dt>
            <dd className="mt-3 font-serif text-4xl">{counts[card.key]}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
