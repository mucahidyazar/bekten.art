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
      'How Bekten Art processes inquiry, newsletter, analytics and Studio data.',
    title: 'Privacy Policy',
  },
  ky: {
    description:
      'Bekten Art кайрылуу, жаңылыктар, аналитика жана Studio маалыматтарын кантип иштетет.',
    title: 'Купуялык саясаты',
  },
  ru: {
    description:
      'Как Bekten Art обрабатывает данные запросов, рассылки, аналитики и Studio.',
    title: 'Политика конфиденциальности',
  },
  tr: {
    description:
      'Bekten Art talep, bülten, analiz ve Studio verilerini nasıl işler.',
    title: 'Gizlilik Politikası',
  },
})

export async function generateMetadata({
  params,
}: LegalPageProps): Promise<Metadata> {
  const locale = publicLocale((await params).locale)
  const copy = metadataCopy[publicCopyLocale(locale)]

  return prepareMetadata({
    alternates: {canonical: localizedPath(locale, '/privacy-policy')},
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
        {t('legal.privacyPolicyPage.title')}
      </h1>
      <section>
        <h2 className="text-base font-semibold">
          {t('legal.privacyPolicyPage.introduction')}
        </h2>
        <ul>
          <li>{t('legal.privacyPolicyPage.website')}</li>
          <li>{t('legal.privacyPolicyPage.contactEmail')}</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold">
          {t('legal.privacyPolicyPage.informationCollected')}
        </h2>
        <ul>
          <li>{t('legal.privacyPolicyPage.userDetails')}</li>
          <li>{t('legal.privacyPolicyPage.additionalData')}</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold">
          {t('legal.privacyPolicyPage.purposeOfCollection')}
        </h2>
        <ul>
          <li>{t('legal.privacyPolicyPage.servicesPurpose')}</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold">
          {t('legal.privacyPolicyPage.dataSharing')}
        </h2>
        <ul>
          <li>{t('legal.privacyPolicyPage.noThirdParty')}</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold">
          {t('legal.privacyPolicyPage.userRights')}
        </h2>
        <ul>
          <li>{t('legal.privacyPolicyPage.rightsDescription')}</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold">
          {t('legal.privacyPolicyPage.dataSecurity')}
        </h2>
        <ul>
          <li>{t('legal.privacyPolicyPage.securityDescription')}</li>
        </ul>
      </section>
      <section>
        <h2 className="text-base font-semibold">
          {t('legal.privacyPolicyPage.policyChanges')}
        </h2>
        <ul>
          <li>{t('legal.privacyPolicyPage.changesNotification')}</li>
        </ul>
      </section>
    </section>
  )
}
