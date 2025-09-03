import {useTranslations} from 'next-intl'

export default function Page() {
  const t = useTranslations()

  return (
    <section className="flex flex-col gap-2 text-xs">
      <h1 className="text-lg font-bold">
        {t('legal.privacyPolicyPage.title')}
      </h1>
      <ul>
        <h2 className="text-base font-semibold">
          {t('legal.privacyPolicyPage.introduction')}
        </h2>
        <li>{t('legal.privacyPolicyPage.website')}</li>
        <li>{t('legal.privacyPolicyPage.contactEmail')}</li>
      </ul>
      <ul>
        <h2 className="text-base font-semibold">
          {t('legal.privacyPolicyPage.informationCollected')}
        </h2>
        <li>{t('legal.privacyPolicyPage.userDetails')}</li>
        <li>{t('legal.privacyPolicyPage.additionalData')}</li>
      </ul>
      <ul>
        <h2 className="text-base font-semibold">
          {t('legal.privacyPolicyPage.purposeOfCollection')}
        </h2>
        <li>{t('legal.privacyPolicyPage.servicesPurpose')}</li>
      </ul>
      <ul>
        <h2 className="text-base font-semibold">
          {t('legal.privacyPolicyPage.dataSharing')}
        </h2>
        <li>{t('legal.privacyPolicyPage.noThirdParty')}</li>
      </ul>
      <ul>
        <h2 className="text-base font-semibold">
          {t('legal.privacyPolicyPage.userRights')}
        </h2>
        <li>{t('legal.privacyPolicyPage.rightsDescription')}</li>
      </ul>
      <ul>
        <h2 className="text-base font-semibold">
          {t('legal.privacyPolicyPage.dataSecurity')}
        </h2>
        <li>{t('legal.privacyPolicyPage.securityDescription')}</li>
      </ul>
      <ul>
        <h2 className="text-base font-semibold">
          {t('legal.privacyPolicyPage.policyChanges')}
        </h2>
        <li>{t('legal.privacyPolicyPage.changesNotification')}</li>
      </ul>
    </section>
  )
}
