'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import {Settings2Icon, XIcon} from 'lucide-react'
import {useTranslations} from 'next-intl'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {Button} from '@/components/ui/button'
import {cn} from '@/utils'

import {
  CONSENT_STORAGE_KEY,
  type ConsentDecision,
  createConsentDecision,
  parseStoredConsent,
  toGoogleConsentState,
} from './model'

type ConsentContextValue = {
  allowExternalMedia: () => void
  decision: ConsentDecision | null
  draftDecision: ConsentDecision
  hydrated: boolean
  openPreferences: () => void
  preferencesOpen: boolean
  saveDecision: (decision: ConsentDecision) => void
  setDraftPreference: (
    preference: 'analytics' | 'externalMedia' | 'marketing',
    checked: boolean,
  ) => void
  setPreferencesOpen: (open: boolean) => void
}

const ConsentContext = createContext<ConsentContextValue | null>(null)

function ConsentProvider({children}: React.PropsWithChildren) {
  const [decision, setDecision] = useState<ConsentDecision | null>(null)
  const [draftDecision, setDraftDecision] = useState(() =>
    createConsentDecision(false, false, false),
  )
  const [hydrated, setHydrated] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setDecision(parseStoredConsent(localStorage.getItem(CONSENT_STORAGE_KEY)))
      setHydrated(true)
    }, 0)

    const synchronizeConsent = (event: StorageEvent) => {
      if (event.key !== CONSENT_STORAGE_KEY) return

      const synchronizedDecision = parseStoredConsent(event.newValue)

      setDecision(synchronizedDecision)

      if (synchronizedDecision) {
        window.gtag?.(
          'consent',
          'update',
          toGoogleConsentState(synchronizedDecision),
        )
      }
    }

    window.addEventListener('storage', synchronizeConsent)

    return () => {
      window.clearTimeout(hydrationTimer)
      window.removeEventListener('storage', synchronizeConsent)
    }
  }, [])

  const saveDecision = useCallback((nextDecision: ConsentDecision) => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(nextDecision))
    setDecision(nextDecision)
    window.gtag?.('consent', 'update', toGoogleConsentState(nextDecision))
    window.dataLayer?.push({
      event: 'consent_preferences_updated',
      consent_analytics: nextDecision.analytics,
      consent_external_media: nextDecision.externalMedia,
      consent_marketing: nextDecision.marketing,
    })
  }, [])

  const allowExternalMedia = useCallback(() => {
    saveDecision(
      createConsentDecision(
        decision?.analytics ?? false,
        decision?.marketing ?? false,
        true,
      ),
    )
  }, [decision, saveDecision])

  const openPreferences = useCallback(() => {
    setDraftDecision(
      createConsentDecision(
        decision?.analytics ?? false,
        decision?.marketing ?? false,
        decision?.externalMedia ?? false,
      ),
    )
    setPreferencesOpen(true)
  }, [decision])

  const setDraftPreference = useCallback(
    (
      preference: 'analytics' | 'externalMedia' | 'marketing',
      checked: boolean,
    ) => {
      setDraftDecision(currentDecision => ({
        ...currentDecision,
        [preference]: checked,
      }))
    },
    [],
  )

  const value = useMemo(
    () => ({
      allowExternalMedia,
      decision,
      draftDecision,
      hydrated,
      openPreferences,
      preferencesOpen,
      saveDecision,
      setDraftPreference,
      setPreferencesOpen,
    }),
    [
      allowExternalMedia,
      decision,
      draftDecision,
      hydrated,
      openPreferences,
      preferencesOpen,
      saveDecision,
      setDraftPreference,
    ],
  )

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  )
}

function useConsent() {
  const context = useContext(ConsentContext)

  if (!context) {
    throw new Error('useConsent must be used within ConsentProvider')
  }

  return context
}

function ConsentManager() {
  const t = useTranslations('consent')
  const {
    decision,
    draftDecision,
    hydrated,
    openPreferences,
    preferencesOpen,
    saveDecision,
    setDraftPreference,
    setPreferencesOpen,
  } = useConsent()
  const [savedAnnouncement, setSavedAnnouncement] = useState('')

  const persist = (nextDecision: ConsentDecision) => {
    saveDecision(nextDecision)
    setPreferencesOpen(false)
    setSavedAnnouncement(t('preferencesSaved'))
  }

  if (!hydrated) return null

  return (
    <>
      {!decision ? (
        <section
          aria-labelledby="consent-banner-title"
          className="bg-background text-foreground border-border fixed inset-x-3 bottom-3 z-50 mx-auto max-w-4xl rounded-xl border p-5 shadow-2xl sm:bottom-5 sm:p-6"
          role="region"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <h2 id="consent-banner-title" className="text-lg font-semibold">
                {t('title')}
              </h2>
              <p className="text-muted-foreground max-w-2xl text-sm leading-6">
                {t('description')}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Button
                className="w-full"
                type="button"
                variant="outline"
                onClick={() => persist(createConsentDecision(false, false, false))}
              >
                {t('rejectAll')}
              </Button>
              <Button
                className="w-full"
                type="button"
                variant="outline"
                onClick={openPreferences}
              >
                {t('managePreferences')}
              </Button>
              <Button
                className="w-full"
                type="button"
                variant="outline"
                onClick={() => persist(createConsentDecision(true, true, true))}
              >
                {t('acceptAll')}
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <Button
          aria-label={t('openPreferences')}
          className="fixed bottom-3 left-3 z-40 h-11 w-11 rounded-full shadow-lg"
          size="icon"
          type="button"
          variant="outline"
          onClick={openPreferences}
        >
          <Settings2Icon aria-hidden="true" className="h-4 w-4" />
        </Button>
      )}

      <ConsentPreferencesDialog
        analytics={draftDecision.analytics}
        externalMedia={draftDecision.externalMedia}
        marketing={draftDecision.marketing}
        open={preferencesOpen}
        setAnalytics={checked => setDraftPreference('analytics', checked)}
        setExternalMedia={checked =>
          setDraftPreference('externalMedia', checked)
        }
        setMarketing={checked => setDraftPreference('marketing', checked)}
        onOpenChange={setPreferencesOpen}
        onSave={() =>
          persist(
            createConsentDecision(
              draftDecision.analytics,
              draftDecision.marketing,
              draftDecision.externalMedia,
            ),
          )
        }
      />

      <p aria-live="polite" className="sr-only">
        {savedAnnouncement}
      </p>
    </>
  )
}

type ConsentPreferencesDialogProps = {
  analytics: boolean
  externalMedia: boolean
  marketing: boolean
  open: boolean
  setAnalytics: (checked: boolean) => void
  setExternalMedia: (checked: boolean) => void
  setMarketing: (checked: boolean) => void
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

function ConsentPreferencesDialog({
  analytics,
  externalMedia,
  marketing,
  open,
  setAnalytics,
  setExternalMedia,
  setMarketing,
  onOpenChange,
  onSave,
}: ConsentPreferencesDialogProps) {
  const t = useTranslations('consent')

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="bg-background/80 fixed inset-0 z-50 backdrop-blur-sm" />
        <DialogPrimitive.Content className="bg-background text-foreground border-border fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border p-6 shadow-2xl focus:outline-none">
          <DialogPrimitive.Title className="pr-10 text-xl font-semibold">
            {t('preferencesTitle')}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-muted-foreground mt-2 text-sm leading-6">
            {t('preferencesDescription')}
          </DialogPrimitive.Description>

          <div className="mt-6 space-y-3">
            <ConsentOption
              checked
              description={t('necessaryDescription')}
              disabled
              id="consent-necessary"
              title={t('necessaryTitle')}
              trailingText={t('alwaysActive')}
            />
            <ConsentOption
              checked={analytics}
              description={t('analyticsDescription')}
              id="consent-analytics"
              title={t('analyticsTitle')}
              onCheckedChange={setAnalytics}
            />
            <ConsentOption
              checked={marketing}
              description={t('marketingDescription')}
              id="consent-marketing"
              title={t('marketingTitle')}
              onCheckedChange={setMarketing}
            />
            <ConsentOption
              checked={externalMedia}
              description={t('externalMediaDescription')}
              id="consent-external-media"
              title={t('externalMediaTitle')}
              onCheckedChange={setExternalMedia}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="button" onClick={onSave}>
              {t('savePreferences')}
            </Button>
          </div>

          <DialogPrimitive.Close
            aria-label={t('closePreferences')}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-4 right-4 rounded-md p-2 focus-visible:ring-2 focus-visible:outline-none"
          >
            <XIcon aria-hidden="true" className="h-4 w-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

type ConsentOptionProps = {
  checked: boolean
  description: string
  disabled?: boolean
  id: string
  title: string
  trailingText?: string
  onCheckedChange?: (checked: boolean) => void
}

function ConsentOption({
  checked,
  description,
  disabled = false,
  id,
  title,
  trailingText,
  onCheckedChange,
}: ConsentOptionProps) {
  return (
    <div className="border-border grid grid-cols-[1fr_auto] gap-4 rounded-lg border p-4">
      <div>
        <label className="font-medium" htmlFor={id}>
          {title}
        </label>
        <p className="text-muted-foreground mt-1 text-sm leading-5">{description}</p>
      </div>
      {trailingText ? (
        <span className="text-muted-foreground self-center text-xs font-medium">
          {trailingText}
        </span>
      ) : null}
      <input
        checked={checked}
        className={cn(
          'border-input accent-primary h-5 w-5 self-center rounded focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-60',
        )}
        disabled={disabled}
        id={id}
        type="checkbox"
        onChange={event => onCheckedChange?.(event.currentTarget.checked)}
      />
    </div>
  )
}

export {ConsentManager, ConsentProvider, useConsent}
