import {NewsCard} from '../cards/news-card'

// TODO: Define proper types with Supabase
type NewsListProps = {
  newsList: any[]
}

export async function NewsList({newsList}: NewsListProps) {
  return (
    <div className="flex flex-col gap-4">
      {newsList?.length > 0 ? (
        newsList.map(news => <NewsCard key={news.id} news={news} />)
      ) : (
        <div className="mx-auto flex h-40 w-full items-center justify-center rounded bg-gray-100 dark:bg-slate-950">
          <p className="text-sm text-gray-500">
            News list will be implemented with Supabase
          </p>
        </div>
      )}
    </div>
  )
}
