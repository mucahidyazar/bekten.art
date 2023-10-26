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

export default async function Home() {
  return (
    <div id="press" className="flex flex-col gap-4 bg-background">
      <section>
        <div></div>
      </section>
    </div>
  )
}
