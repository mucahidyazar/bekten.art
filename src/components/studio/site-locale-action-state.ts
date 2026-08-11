type SiteLocaleActionState = Readonly<{
  message: string
  status: 'error' | 'idle' | 'success'
}>

const INITIAL_SITE_LOCALE_ACTION_STATE = Object.freeze({
  message: '',
  status: 'idle' as const,
})

export {INITIAL_SITE_LOCALE_ACTION_STATE}

export type {SiteLocaleActionState}
