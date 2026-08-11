import type {Metadata} from 'next'

import Link from 'next/link'

import {ConsentGoogleMap} from '@/components/consent/google-map'
import {PublicInquiryForm} from '@/components/public-inquiry'
import {
  publicCopyLocale,
  publicLocale,
  publicShellCopyFor,
  type BuiltInPublicLocale,
} from '@/components/public-site/public-copy'
import {PublicEditorialHero} from '@/components/public-site/public-editorial-hero'
import {NAV_FORWARD_TRANSITION} from '@/components/public-site/public-view-transition'
import {localizedPath} from '@/lib/localized-path'
import {getPublicContactInfo} from '@/server/contact/public-contact'
import {prepareMetadata} from '@/utils/prepare-metadata'

const contactCopy: Readonly<
  Record<
    BuiltInPublicLocale,
    Readonly<{
      address: string
      contactDetails: string
      description: string
      exhibitionDescription: string
      inquiryIntro: string
      inquiryType: string
      instagram: string
      mapTitle: string
      metaDescription: string
      phone: string
      serviceDescriptions: Readonly<{
        availability: string
        commission: string
        privateViewing: string
      }>
      title: string
    }>
  >
> = Object.freeze({
  en: {
    address: 'Studio',
    contactDetails: 'Direct contact',
    description:
      'For the archive, exhibitions, commissions and private viewings, begin a conversation with Bekten Studio.',
    exhibitionDescription: 'Exhibition proposals and collaborations.',
    inquiryIntro: 'Choose the conversation that best matches your inquiry.',
    inquiryType: 'Inquiry type',
    instagram: 'Instagram',
    mapTitle: 'Bekten Studio map',
    metaDescription:
      'Contact Bekten Studio about artwork availability, commissions, exhibitions and private viewings.',
    phone: 'Phone',
    serviceDescriptions: {
      availability: 'Questions about available and upcoming works.',
      commission: 'Discuss an artwork created for a particular setting.',
      privateViewing: 'Arrange a focused conversation and studio viewing.',
    },
    title: 'Contact',
  },
  ky: {
    address: 'Устакана',
    contactDetails: 'Түз байланыш',
    description:
      'Архив, көргөзмөлөр, буйрутмалар жана жеке көрүүлөр боюнча Bekten Studio менен сүйлөшүүнү баштаңыз.',
    exhibitionDescription: 'Көргөзмө сунуштары жана кызматташтык.',
    inquiryIntro: 'Сурооңузга эң ылайыктуу багытты тандаңыз.',
    inquiryType: 'Кайрылуунун түрү',
    instagram: 'Instagram',
    mapTitle: 'Bekten Studio картасы',
    metaDescription:
      'Чыгармалар, буйрутмалар, көргөзмөлөр жана жеке көрүүлөр боюнча Bekten Studio менен байланышыңыз.',
    phone: 'Телефон',
    serviceDescriptions: {
      availability: 'Жеткиликтүү жана жаңы эмгектер тууралуу суроолор.',
      commission: 'Белгилүү бир мейкиндик үчүн жаңы эмгекти талкуулоо.',
      privateViewing: 'Студияда жеке көрүү жана маек уюштуруу.',
    },
    title: 'Байланыш',
  },
  ru: {
    address: 'Студия',
    contactDetails: 'Прямая связь',
    description:
      'Свяжитесь с Bekten Studio по вопросам архива, выставок, заказов и частных просмотров.',
    exhibitionDescription: 'Выставочные предложения и сотрудничество.',
    inquiryIntro: 'Выберите направление, которое соответствует вашему запросу.',
    inquiryType: 'Тип запроса',
    instagram: 'Instagram',
    mapTitle: 'Карта Bekten Studio',
    metaDescription:
      'Свяжитесь с Bekten Studio по вопросам доступности работ, заказов, выставок и частных просмотров.',
    phone: 'Телефон',
    serviceDescriptions: {
      availability: 'Вопросы о доступных и готовящихся работах.',
      commission: 'Обсудить произведение для определённого пространства.',
      privateViewing: 'Организовать личную беседу и просмотр в студии.',
    },
    title: 'Контакты',
  },
  tr: {
    address: 'Stüdyo',
    contactDetails: 'Doğrudan iletişim',
    description:
      'Arşiv, sergiler, özel eserler ve kişisel gösterimler için Bekten Studio ile bir görüşme başlatın.',
    exhibitionDescription: 'Sergi önerileri ve iş birlikleri.',
    inquiryIntro: 'Talebinize en uygun görüşme başlığını seçin.',
    inquiryType: 'Talep türü',
    instagram: 'Instagram',
    mapTitle: 'Bekten Studio haritası',
    metaDescription:
      'Eser uygunluğu, özel eser, sergi ve kişisel gösterim için Bekten Studio ile iletişime geçin.',
    phone: 'Telefon',
    serviceDescriptions: {
      availability: 'Mevcut ve yakında sunulacak eserler hakkında sorular.',
      commission: 'Belirli bir mekân için üretilecek eseri görüşün.',
      privateViewing: 'Odaklı bir görüşme ve stüdyo ziyareti planlayın.',
    },
    title: 'İletişim',
  },
})

type ContactPageProps = Readonly<{
  params: Promise<{locale: string}>
}>

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const locale = publicLocale((await params).locale)
  const copy = contactCopy[publicCopyLocale(locale)]

  return prepareMetadata({
    alternates: {canonical: localizedPath(locale, '/contact')},
    contentLocale: locale,
    description: copy.metaDescription,
    title: copy.title,
  })
}

export default async function ContactPage({params}: ContactPageProps) {
  const locale = publicLocale((await params).locale)
  const contentLocale = publicCopyLocale(locale)
  const copy = contactCopy[contentLocale]
  const contact = await getPublicContactInfo(contentLocale)
  const shellCopy = publicShellCopyFor(locale)
  const inquiryOptions = [
    {
      description: copy.serviceDescriptions.availability,
      href: '/available-works',
      index: '01',
      label: shellCopy.availability,
    },
    {
      description: copy.serviceDescriptions.commission,
      href: '/commission-a-work',
      index: '02',
      label: shellCopy.commission,
    },
    {
      description: copy.serviceDescriptions.privateViewing,
      href: '/private-viewings',
      index: '03',
      label: shellCopy.privateViewing,
    },
    {
      description: copy.exhibitionDescription,
      href: '/exhibitions',
      index: '04',
      label: shellCopy.exhibitions,
    },
  ] as const

  return (
    <div className="heritage-contact">
      <PublicEditorialHero
        eyebrow="Bekten Studio"
        fallbackAlt="Bekten Usubaliev"
        fallbackSrc="/me.jpg"
        paragraphs={[copy.description]}
        title={copy.title}
      />

      <section
        aria-labelledby="contact-inquiry-title"
        className="heritage-section heritage-section--paper-light heritage-contact__conversation"
      >
        <div className="heritage-shell heritage-contact__conversation-grid">
          <PublicInquiryForm
            className="heritage-contact__form"
            locale={contentLocale}
            type="GENERAL"
          />

          <aside className="heritage-contact__services">
            <p className="heritage-kicker">02 · Bekten Studio</p>
            <h2 id="contact-inquiry-title">{copy.inquiryType}</h2>
            <p>{copy.inquiryIntro}</p>
            <nav aria-label={copy.inquiryType}>
              {inquiryOptions.map(option => (
                <Link
                  aria-label={option.label}
                  className="heritage-contact__service-card"
                  href={localizedPath(locale, option.href)}
                  key={option.href}
                  transitionTypes={[...NAV_FORWARD_TRANSITION]}
                >
                  <span aria-hidden="true">{option.index}</span>
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      </section>

      <section
        aria-labelledby="contact-details-title"
        className="heritage-contact__lower heritage-paper-grain"
      >
        <div className="heritage-shell heritage-contact__lower-grid">
          <div className="heritage-contact__direct">
            <p className="heritage-kicker">03 · Bekten Studio</p>
            <h2 id="contact-details-title">{copy.contactDetails}</h2>
            <address className="heritage-contact__details">
              {contact?.email ? (
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              ) : null}
              {contact?.phone ? (
                <div>
                  <span>{copy.phone}</span>
                  <a href={`tel:${contact.phone.replace(/\s/gu, '')}`}>
                    {contact.phone}
                  </a>
                </div>
              ) : null}
              {contact?.address ? (
                <div>
                  <span>{copy.address}</span>
                  <p>
                    {contact.address.split('\n').map(line => (
                      <span key={line}>{line}</span>
                    ))}
                  </p>
                </div>
              ) : null}
              {contact?.socials.map(social => (
                <div key={social.id}>
                  <span>{copy.instagram}</span>
                  <a href={social.url} rel="noreferrer" target="_blank">
                    {social.url.replace(/^https?:\/\/(?:www\.)?/u, '')}
                  </a>
                </div>
              ))}
            </address>
          </div>

          {contact?.mapEmbedUrl ? (
            <div className="heritage-contact__map">
              <p className="heritage-kicker">04 · {copy.address}</p>
              <ConsentGoogleMap
                src={contact.mapEmbedUrl}
                title={copy.mapTitle}
              />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
