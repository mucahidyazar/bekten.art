import {News, User} from '@prisma/client'

import {NewsCard} from '../cards/NewsCard'

import {NewsListHeader} from './NewsListHeader'

type NewsListProps = {
  newsList: (News & {user: User})[]
}
export async function NewsList({newsList}: NewsListProps) {
  return (
    <section>
      <NewsListHeader />
      {/* {/* grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));  */}
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {newsList.map(news => (
          <NewsCard key={news.id} news={news} className="w-full" />
        ))}
      </ul>
    </section>
  )
}
