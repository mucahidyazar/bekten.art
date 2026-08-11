import type {Metadata} from 'next'

import {useTranslations} from 'next-intl'

import {
  publicCopyLocale,
  publicLocale,
  type PublicLocale,
} from '@/components/public-site/public-copy'
import {localizedPath} from '@/lib/localized-path'
import {prepareMetadata} from '@/utils/prepare-metadata'

type LegalPageProps = Readonly<{params: Promise<{locale: string}>}>

const metadataCopy: Readonly<
  Record<PublicLocale, Readonly<{description: string; title: string}>>
> = Object.freeze({
  en: {
    description:
      'Terms governing use of the Bekten Art portfolio, archive and inquiry services.',
    title: 'Terms of Service',
  },
  ky: {
    description:
      'Bekten Art портфолиосун, архивин жана кайрылуу кызматтарын колдонуу шарттары.',
    title: 'Кызмат шарттары',
  },
  ru: {
    description:
      'Условия использования портфолио, архива и сервисов запросов Bekten Art.',
    title: 'Условия обслуживания',
  },
  tr: {
    description:
      'Bekten Art portfolyosu, arşivi ve talep hizmetlerinin kullanım koşulları.',
    title: 'Hizmet Şartları',
  },
})

export async function generateMetadata({
  params,
}: LegalPageProps): Promise<Metadata> {
  const locale = publicLocale((await params).locale)
  const copy = metadataCopy[publicCopyLocale(locale)]

  return prepareMetadata({
    alternates: {canonical: localizedPath(locale, '/terms-of-service')},
    contentLocale: locale,
    description: copy.description,
    title: copy.title,
  })
}

export default function Page() {
  const t = useTranslations()

  return (
    <section className="flex flex-col gap-2 text-xs">
      <h1 className="text-lg font-bold">
        {t('legal.termsOfServicePage.title')}
      </h1>
      <section>
        <h2 className="text-base font-semibold">
          {t('legal.termsOfServicePage.introduction')}
        </h2>
        <ul>
          <li>{t('legal.termsOfServicePage.website')}</li>
          <li>{t('legal.termsOfServicePage.contactEmail')}</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold">
          {t('legal.termsOfServicePage.usageTerms')}
        </h2>
        <ul>
          <li>{t('legal.termsOfServicePage.usageDescription')}</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold">
          {t('legal.termsOfServicePage.intellectualProperty')}
        </h2>
        <ul>
          <li>{t('legal.termsOfServicePage.propertyDescription')}</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold">
          {t('legal.termsOfServicePage.userResponsibilities')}
        </h2>
        <ul>
          <li>{t('legal.termsOfServicePage.responsibilitiesDescription')}</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold">
          {t('legal.termsOfServicePage.liabilityLimitations')}
        </h2>
        <ul>
          <li>{t('legal.termsOfServicePage.liabilityDescription')}</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold">
          {t('legal.termsOfServicePage.disputeResolution')}
        </h2>
        <ul>
          <li>{t('legal.termsOfServicePage.disputeDescription')}</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold">
          {t('legal.termsOfServicePage.generalInformation')}
        </h2>
        <ul>
          <li>{t('legal.termsOfServicePage.siteDescription')}</li>
        </ul>
      </section>
    </section>
  )
}
