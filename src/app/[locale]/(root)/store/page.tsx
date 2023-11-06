import Link from 'next/link'

import {ArtworkCard} from '@/components/molecules/ArtworkCard'
import {Button} from '@/components/ui/button'
import {db} from '@/lib/db'
import {getCurrentUser} from '@/lib/session'
import {prepareMetadata} from '@/utils/prepareMetadata'

export function generateMetadata() {
  const title = '🎨 Latest Updates - Bekten Usubaliev`s Art Exhibitions & News'
  const description =
    '🎨 Stay updated with the latest exhibitions, artworks, and journey of Bekten Usubaliev. Dive into a world where art and emotions intertwine gracefully.'

  return prepareMetadata({
    title,
    description,
    page: 'press',
  })
}

export default async function Page() {
  const artworks = await db.artwork.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      artist: true,
      likes: true,
    },
  })
  const user = await getCurrentUser()

  return (
    <div id="press" className="flex flex-col gap-4 bg-background">
      {user?.role === 'ADMIN' && (
        <section className="flex justify-end">
          <Button variant="destructive">
            <Link href="/store/create">Add New Artwork</Link>
          </Button>
        </section>
      )}
      <section className="flex flex-wrap gap-4">
        {artworks.map(artwork => (
          <ArtworkCard key={artwork.id} artwork={artwork} />
        ))}
      </section>
    </div>
  )
}
