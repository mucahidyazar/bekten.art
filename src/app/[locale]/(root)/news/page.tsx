import {NewsList} from '@/components/molecules/NewsList'
import {PressList} from '@/components/molecules/PressList'
import {db} from '@/lib/db'
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

// const pressLinks = [
//   {
//     id: '01',
//     title: 'Ressamlar Aksaray’da buluştu',
//     url: 'https://aksarayhaberci.com/haber/ressamlar-aksarayda-bulustu--13418.html',
//   },
//   {
//     id: '02',
//     title: 'Kültürel imge kavramının günümüz resim sanatına yansımaları',
//     url: 'http://acikerisim.akdeniz.edu.tr:8080/xmlui/handle/123456789/5561?show=full',
//   },
//   {
//     id: '03',
//     title: 'Türk Dünyası’ndan Mimar ve Heykeltıraşlar Bolu’da Bir Araya Geldi',
//     url: 'https://www.turksoy.org/haberler/2015-08-25-turk-dunyasi-ndan-mimar-ve-heykeltiraslar-bolu-da-bir-araya-geldi',
//   },
//   {
//     id: '04',
//     title: 'Open Studio Tour',
//     url: 'https://www.bishkekart.kg/news/10/',
//   },
//   {
//     id: '05',
//     title: 'Workshop for the Children',
//     url: 'https://www.bishkekart.kg/news/30/',
//   },
// ]

export default async function Page() {
  const pressList = await db.press.findMany({
    include: {user: true},
    orderBy: {createdAt: 'desc'},
  })
  const newsList = await db.news.findMany({
    include: {user: true},
    orderBy: {createdAt: 'desc'},
  })

  return (
    <div id="press" className="flex flex-col gap-4 bg-background">
      <PressList pressList={pressList} />
      <NewsList newsList={newsList} />
    </div>
  )
}
