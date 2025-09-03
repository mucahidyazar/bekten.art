import {useTranslations} from 'next-intl'

export default function Page() {
  const t = useTranslations()

  return (
    <section className="flex flex-col gap-2 text-xs">
      <h1 className="text-lg font-bold">
        {t('legal.termsOfServicePage.title')}
      </h1>
      <ul>
        <h2 className="text-base font-semibold">
          {t('legal.termsOfServicePage.introduction')}
        </h2>
        <li>{t('legal.termsOfServicePage.website')}</li>
        <li>{t('legal.termsOfServicePage.contactEmail')}</li>
      </ul>
      <ul>
        <h2 className="text-base font-semibold">
          {t('legal.termsOfServicePage.usageTerms')}
        </h2>
        <li>{t('legal.termsOfServicePage.usageDescription')}</li>
      </ul>
      <ul>
        <h2 className="text-base font-semibold">
          {t('legal.termsOfServicePage.intellectualProperty')}
        </h2>
        <li>{t('legal.termsOfServicePage.propertyDescription')}</li>
      </ul>
      <ul>
        <h2 className="text-base font-semibold">
          {t('legal.termsOfServicePage.userResponsibilities')}
        </h2>
        <li>{t('legal.termsOfServicePage.responsibilitiesDescription')}</li>
      </ul>
      <ul>
        <h2 className="text-base font-semibold">
          {t('legal.termsOfServicePage.liabilityLimitations')}
        </h2>
        <li>{t('legal.termsOfServicePage.liabilityDescription')}</li>
      </ul>
      <ul>
        <h2 className="text-base font-semibold">
          {t('legal.termsOfServicePage.disputeResolution')}
        </h2>
        <li>{t('legal.termsOfServicePage.disputeDescription')}</li>
      </ul>
      <ul>
        <h2 className="text-base font-semibold">
          {t('legal.termsOfServicePage.generalInformation')}
        </h2>
        <li>{t('legal.termsOfServicePage.siteDescription')}</li>
      </ul>
    </section>
  )
}
