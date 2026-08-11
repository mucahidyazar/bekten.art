export default function StudioLoading() {
  return (
    <section aria-label="Loading Studio content" aria-live="polite">
      <p className="text-xs font-semibold tracking-[0.2em] text-red-900 uppercase">
        Loading
      </p>
      <div
        aria-hidden="true"
        className="mt-5 grid animate-pulse gap-4 sm:grid-cols-2"
      >
        <div className="h-28 bg-stone-300/60" />
        <div className="h-28 bg-stone-300/60" />
      </div>
    </section>
  )
}
