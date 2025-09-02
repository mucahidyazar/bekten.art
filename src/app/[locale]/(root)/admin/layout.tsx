import {requireAdmin} from '@/lib/auth-actions'

interface AdminRootLayoutProps {
  children: React.ReactNode
  params: Promise<{
    locale: string
  }>
}

export default async function AdminRootLayout({
  children,
}: AdminRootLayoutProps) {
  await requireAdmin()

  return <>{children}</>
}
