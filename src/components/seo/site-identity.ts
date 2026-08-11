import type {AppLocale} from '@/lib/localized-path'

type SiteIdentity = Readonly<{
  artistDescription: string
  jobTitle: string
  organizationDescription: string
  siteDescription: string
}>

const SITE_NAME = 'Bekten — Artist & Studio'

const SITE_IDENTITY: Readonly<Record<AppLocale, SiteIdentity>> = Object.freeze({
  en: {
    artistDescription:
      'Bekten Usubaliev is an artist based in Bishkek, Kyrgyzstan.',
    jobTitle: 'Artist',
    organizationDescription:
      'Bekten Studio maintains the artist’s editorial archive and handles private enquiries.',
    siteDescription:
      'The official editorial archive for Bekten Usubaliev’s works, exhibitions, journal and studio.',
  },
  ky: {
    artistDescription:
      'Бектен Усубалиев — Бишкек шаарында, Кыргызстанда жашап иштеген сүрөтчү.',
    jobTitle: 'Сүрөтчү',
    organizationDescription:
      'Bekten Studio сүрөтчүнүн редакциялык архивин жүргүзүп, жеке суроолорду кабыл алат.',
    siteDescription:
      'Бектен Усубалиевдин эмгектери, көргөзмөлөрү, журналы жана студиясы боюнча расмий редакциялык архив.',
  },
  ru: {
    artistDescription:
      'Бектен Усубалиев — художник, живущий и работающий в Бишкеке, Кыргызстан.',
    jobTitle: 'Художник',
    organizationDescription:
      'Bekten Studio ведёт редакционный архив художника и принимает частные запросы.',
    siteDescription:
      'Официальный редакционный архив работ, выставок, журнала и студии Бектена Усубалиева.',
  },
  tr: {
    artistDescription:
      'Bekten Usubaliev, Kırgızistan’ın Bişkek şehrinde yaşayan ve çalışan bir sanatçıdır.',
    jobTitle: 'Sanatçı',
    organizationDescription:
      'Bekten Studio, sanatçının editoryal arşivini yönetir ve özel talepleri karşılar.',
    siteDescription:
      'Bekten Usubaliev’in eserleri, sergileri, journal yazıları ve stüdyosu için resmi editoryal arşiv.',
  },
})

function getSiteIdentity(locale: AppLocale): SiteIdentity {
  return SITE_IDENTITY[locale]
}

export {SITE_NAME}
export type {SiteIdentity}
export {getSiteIdentity}
