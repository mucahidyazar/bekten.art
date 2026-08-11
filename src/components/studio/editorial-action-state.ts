export const INITIAL_STUDIO_ACTION_STATE: StudioActionState = Object.freeze({
  fieldErrors: Object.freeze({}),
  message: '',
  status: 'idle',
})

export type StudioActionState = Readonly<{
  fieldErrors: Readonly<Record<string, readonly string[]>>
  message: string
  status: 'error' | 'idle'
}>
