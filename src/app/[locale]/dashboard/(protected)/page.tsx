import Link from 'next/link'

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

      {draftArtworks + publishedArtworks + collections + newInquiries === 0 ? (
        <div className="mt-8 border border-dashed border-stone-500/60 bg-white/30 p-8">
          <h2 className="font-serif text-2xl">The Studio queue is clear.</h2>
          <p className="mt-2 max-w-xl leading-7 text-stone-700">
            Begin the editorial archive with a real artwork record. Everything
            can be revised before publication.
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center bg-stone-950 px-5 py-3 font-medium text-white"
            href="/dashboard/artworks/new"
          >
            Create an artwork
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-11 items-center bg-stone-950 px-5 py-3 font-medium text-white"
            href="/dashboard/artworks?status=DRAFT"
          >
            Review drafts
          </Link>
          <Link
            className="inline-flex min-h-11 items-center border border-stone-500 px-5 py-3 font-medium"
            href="/dashboard/inquiries?status=NEW"
          >
            Open inquiry inbox
          </Link>
        </div>
      )}
    </section>
  )
}
