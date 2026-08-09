import {env} from '@/configs/env.mjs'

export const GTM_ID = env.NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID

export const virtualPageview = (path: string) => {
  const safePath = path.startsWith('/') && !path.includes('?') ? path : '/'

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: 'virtual_page_view',
    page_location: new URL(safePath, window.location.origin).toString(),
    page_path: safePath,
    page_title: document.title,
  })
}
