import {redirect} from 'next/navigation'

export default async function AdminPage() {
  // Redirect to overview page since we now have separate pages
  redirect('/admin/overview')
}
