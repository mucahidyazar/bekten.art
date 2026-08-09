'use client'

import {useEffect} from 'react'

export default function AdminError({
  error,
  reset,
}: Readonly<{error: Error & {digest?: string}; reset: () => void}>) {
  useEffect(() => {
    console.error('Admin page render failed', {digest: error.digest})
  }, [error.digest])

  return (
    <div
      className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-900 dark:bg-red-950"
      role="alert"
    >
      <h1 className="font-serif text-2xl font-semibold text-red-950 dark:text-red-100">
        The administration data could not be loaded
      </h1>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-red-800 dark:text-red-200">
        No changes were made. Check the system readiness view or retry the
        database read.
      </p>
      <button
        className="mt-6 min-h-11 rounded-xl bg-red-800 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </div>
  )
}
