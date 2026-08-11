'use client'

export default function StudioError({
  reset,
}: Readonly<{error: Error & {digest?: string}; reset: () => void}>) {
  return (
    <section
      aria-labelledby="studio-error-title"
      className="border border-red-900/30 bg-red-50/50 p-8"
      role="alert"
    >
      <p className="text-xs font-semibold tracking-[0.2em] text-red-900 uppercase">
        Studio interruption
      </p>
      <h1 className="mt-3 font-serif text-3xl" id="studio-error-title">
        This workspace could not be loaded.
      </h1>
      <p className="mt-3 max-w-xl leading-7 text-stone-700">
        Your changes were not submitted. Try loading this Studio view again.
      </p>
      <button
        className="mt-6 min-h-11 bg-stone-950 px-5 py-3 font-medium text-white"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </section>
  )
}
