'use client'

type PressListProps = {
  pressData: any[] // TODO: Define proper type with Supabase
}

export function PressList({pressData}: PressListProps) {
  return (
    <div className="mx-auto flex h-40 w-full items-center justify-center rounded bg-gray-100 dark:bg-slate-950">
      <p className="text-sm text-gray-500">
        Press list will be implemented with Supabase. Items count:{' '}
        {pressData?.length || 0}
      </p>
    </div>
  )
}
