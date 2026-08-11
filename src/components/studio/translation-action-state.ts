const INITIAL_TRANSLATION_ACTION_STATE: TranslationActionState = Object.freeze({
  message: '',
  status: 'idle',
})

type TranslationActionState = Readonly<{
  message: string
  status: 'error' | 'idle' | 'success'
}>

export {INITIAL_TRANSLATION_ACTION_STATE}

export type {TranslationActionState}
