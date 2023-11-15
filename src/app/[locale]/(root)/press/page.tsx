import {headers} from 'next/headers'

import {EventCard} from '@/components/cards/EventCard'
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

const pressLinks = [
  'https://aksarayhaberci.com/haber/ressamlar-aksarayda-bulustu--13418.html',
  'http://acikerisim.akdeniz.edu.tr:8080/xmlui/handle/123456789/5561?show=full',
  'https://www.turksoy.org/haberler/2015-08-25-turk-dunyasi-ndan-mimar-ve-heykeltiraslar-bolu-da-bir-araya-geldi',
  'https://www.bishkekart.kg/news/10/',
  'https://www.bishkekart.kg/news/30/',
]
const getLinkPreview = async (link: string) => {
  const host = headers().get('host')
  const protocal = process?.env.NODE_ENV === 'development' ? 'http' : 'https'

  const HTTP_TIMEOUT = 10000
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), HTTP_TIMEOUT)

  try {
    const reponse = await fetch(`${protocal}://${host}/api/link-preview`, {
      method: 'POST',
      body: JSON.stringify({link}),
      next: {revalidate: 60 * 60 * 24 * 7},
      // next: {revalidate: 3},
      signal: controller.signal,
    })
    const responseJson = await reponse.json()
    return responseJson.data
  } catch (error) {
    console.log(error)
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}
type LinkPreviewType = {
  url: string
  title: string
  description: string
  image: string
}
export default async function Home() {
  const getAllLinkPreviews = async () => {
    let allPreviews: LinkPreviewType[] = []
    const linkPreviewPromises = pressLinks.map(async link => {
      const linkPreview = await getLinkPreview(link)
      if (linkPreview) return linkPreview
    })
    allPreviews = await Promise.all(linkPreviewPromises)
    return allPreviews
  }
  const linkPreviews = await getAllLinkPreviews()
  console.log({linkPreviews})

  return (
    <div id="press" className="flex flex-col gap-4 bg-background">
      <section>
        {linkPreviews.map((linkPreview, index) => {
          return (
            <>
              <a
                key={linkPreview?.url}
                href={linkPreview?.url}
                target="_blank"
                rel="noreferrer"
              >
                <EventCard
                  title={linkPreview.title}
                  description={linkPreview.description}
                  image={linkPreview.image}
                />
              </a>
              {index !== pressLinks.length - 1 && (
                <hr className="my-2 w-[50%] sm:mx-auto sm:my-4" />
              )}
            </>
          )
        })}
      </section>
    </div>
  )
}
