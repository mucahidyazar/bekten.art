type PageProps = {
  params: Promise<{id: string}>
}

export default async function Page({params}: PageProps) {
  const {id} = await params

  return (
    <section className="mx-auto flex w-full flex-col gap-2 sm:w-80">
      <div className="mx-auto flex h-40 w-full items-center justify-center rounded bg-gray-100 dark:bg-slate-950">
        <p className="text-sm text-gray-500">
          Profile edit page will be implemented with Supabase. User ID: {id}
        </p>
      </div>
    </section>
  )
}
