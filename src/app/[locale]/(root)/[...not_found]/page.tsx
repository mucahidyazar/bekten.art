import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mt-[30%] flex h-full flex-col items-center justify-center text-center text-foreground">
      <h2 className="mb-4 text-7xl">404</h2>
      <p className="mb-2">
        You didn`t break the internet, but we can`t find what you`re looking
        for.
      </p>
      <Link href="/" className="text-primary-500">
        Return Home
      </Link>
    </div>
  )
}
