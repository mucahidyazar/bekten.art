import {getLinkPreview} from 'link-preview-js'

import {EventCard} from '@/components/cards'
import {prepareMetadata} from '@/utils'

export function generateMetadata() {
  const title = '🎨 Latest Updates - Bekten Usubaliev`s Art Exhibitions & News'
  const description =
    '🎨 Stay updated with the latest exhibitions, artworks, and journey of Bekten Usubaliev. Dive into a world where art and emotions intertwine gracefully.'

  return prepareMetadata({
    title,
    description,
    page: title,
  })
}

const news = [
  'https://aksarayhaberci.com/haber/ressamlar-aksarayda-bulustu--13418.html',
  'http://acikerisim.akdeniz.edu.tr:8080/xmlui/handle/123456789/5561?show=full',
  'https://www.turksoy.org/haberler/2015-08-25-turk-dunyasi-ndan-mimar-ve-heykeltiraslar-bolu-da-bir-araya-geldi',
  'https://www.bishkekart.kg/news/10/',
  'https://www.bishkekart.kg/news/30/',
]
export default function Home() {
  return (
    <div id="home" className="flex flex-col gap-4">
      <section>
        {news.map(async (item, index) => {
          const data = (await getLinkPreview(item)) as any

          return (
            <>
              <a key={item} href={data.url} target="_blank" rel="noreferrer">
                <EventCard
                  title={data.title}
                  description={data.description}
                  image={data.images[0]}
                />
              </a>
              {index !== news.length - 1 && (
                <hr className="my-2 w-[50%] sm:mx-auto sm:my-4" />
              )}
            </>
          )
        })}
      </section>
    </div>
  )
}
