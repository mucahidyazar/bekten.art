import {isSafeLocaleCode} from '@/lib/localized-path'

export type BuiltInPublicLocale = 'en' | 'ky' | 'ru' | 'tr'
export const DEFAULT_PUBLIC_LOCALE_OPTIONS: readonly PublicLocaleOption[] =
  Object.freeze([
    {code: 'en', nativeName: 'English'},
    {code: 'tr', nativeName: 'Türkçe'},
    {code: 'ru', nativeName: 'Русский'},
    {code: 'ky', nativeName: 'Кыргызча'},
  ])
export const PUBLIC_LOCALES = [
  'en',
  'tr',
  'ru',
  'ky',
] as const satisfies readonly BuiltInPublicLocale[]

export type PublicLocale = string

type PublicShellCopy = Readonly<{
  availability: string
  collections: string
  commission: string
  contact: string
  collectors: string
  copyright: string
  exhibitions: string
  footerBody: string
  footerHeading: string
  home: string
  inquire: string
  journal: string
  menu: string
  navigationLabel: string
  privateViewing: string
  press: string
  privacy: string
  studioPage: string
  studio: string
  works: string
}>

export type PublicLocaleOption = Readonly<{
  code: string
  nativeName: string
}>

export function isPublicLocale(locale: string): locale is BuiltInPublicLocale {
  return PUBLIC_LOCALES.some(candidate => candidate === locale)
}

export function publicCopyLocale(locale: string): BuiltInPublicLocale {
  return isPublicLocale(locale) ? locale : 'en'
}

export function publicLocale(locale: string): PublicLocale {
  if (locale === 'kg') return 'ky'

  return isSafeLocaleCode(locale) ? locale : 'en'
}

export const publicShellCopy: Readonly<
  Record<BuiltInPublicLocale, PublicShellCopy>
> =
  Object.freeze({
    en: {
      availability: 'Availability inquiry',
      collections: 'Collections',
      commission: 'Commission',
      contact: 'Contact',
      collectors: 'Collectors',
      copyright: 'All works and images remain the property of the artist.',
      exhibitions: 'Exhibitions',
      footerBody:
        'For availability, commissions and private viewings, contact Bekten Studio.',
      footerHeading: 'Begin a conversation',
      home: 'Home',
      inquire: 'Inquire',
      journal: 'Journal',
      menu: 'Menu',
      navigationLabel: 'Primary navigation',
      press: 'Press',
      privateViewing: 'Private viewing',
      privacy: 'Privacy',
      studio: 'About',
      studioPage: 'Studio',
      works: 'Works',
    },
    ky: {
      availability: 'Жеткиликтүүлүк тууралуу суроо',
      collections: 'Жыйнактар',
      commission: 'Буйрутма',
      contact: 'Байланыш',
      collectors: 'Коллекционерлер',
      copyright: 'Бардык эмгектер жана сүрөттөр сүрөтчүгө таандык.',
      exhibitions: 'Көргөзмөлөр',
      footerBody:
        'Жеткиликтүүлүк, буйрутма жана жеке көрүү үчүн Bekten Studio менен байланышыңыз.',
      footerHeading: 'Баарлашууну баштайлы',
      home: 'Башкы бет',
      inquire: 'Байланышуу',
      journal: 'Журнал',
      menu: 'Бөлүмдөр',
      navigationLabel: 'Негизги навигация',
      press: 'Басма сөз',
      privateViewing: 'Жеке көрүү',
      privacy: 'Купуялык',
      studio: 'Сүрөтчү тууралуу',
      studioPage: 'Устакана',
      works: 'Эмгектер',
    },
    ru: {
      availability: 'Запрос о доступности',
      collections: 'Коллекции',
      commission: 'Заказать работу',
      contact: 'Контакты',
      collectors: 'Коллекционерам',
      copyright: 'Все работы и изображения принадлежат художнику.',
      exhibitions: 'Выставки',
      footerBody:
        'По вопросам доступности, заказов и частных просмотров свяжитесь с Bekten Studio.',
      footerHeading: 'Начать разговор',
      home: 'Главная',
      inquire: 'Связаться',
      journal: 'Журнал',
      menu: 'Меню',
      navigationLabel: 'Основная навигация',
      press: 'Пресса',
      privateViewing: 'Частный просмотр',
      privacy: 'Конфиденциальность',
      studio: 'О художнике',
      studioPage: 'Студия',
      works: 'Работы',
    },
    tr: {
      availability: 'Uygunluk talebi',
      collections: 'Koleksiyonlar',
      commission: 'Özel eser',
      contact: 'İletişim',
      collectors: 'Koleksiyonerler',
      copyright: 'Tüm eser ve görsellerin hakları sanatçıya aittir.',
      exhibitions: 'Sergiler',
      footerBody:
        'Eser uygunluğu, özel sipariş ve kişisel gösterim için Bekten Studio ile iletişime geçin.',
      footerHeading: 'Bir sohbet başlatalım',
      home: 'Ana sayfa',
      inquire: 'İletişime geç',
      journal: 'Journal',
      menu: 'Menü',
      navigationLabel: 'Ana navigasyon',
      press: 'Basın',
      privateViewing: 'Kişisel gösterim',
      privacy: 'Gizlilik',
      studio: 'Hakkında',
      studioPage: 'Stüdyo',
      works: 'Eserler',
    },
  })

export function publicShellCopyFor(locale: string) {
  return publicShellCopy[publicCopyLocale(locale)]
}
