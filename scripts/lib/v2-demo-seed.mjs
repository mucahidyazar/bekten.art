const PRODUCTION_CONFIRMATION = 'bekten-art-v2-demo'
const PUBLISHED_AT = new Date('2026-08-11T00:00:00.000Z')

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value))
    return value

  for (const child of Object.values(value)) deepFreeze(child)

  return Object.freeze(value)
}

function uuid(namespace, index) {
  return `${namespace}0000000-0000-4000-8000-${String(index).padStart(12, '0')}`
}

const media = deepFreeze([
  {
    assetPath: 'public/img/art/art-0.png',
    checksumSha256:
      '5569d6cf9508eacf4ac7a377fec9a76f4972a89a200b0d3c36c78a4eaeb93af4',
    filename: 'earth-study-i.png',
    height: 228,
    id: uuid('2', 1),
    mimeType: 'image/png',
    objectKey: 'v2-demo/artworks/earth-study-i.png',
    sizeBytes: 68_684,
    width: 176,
  },
  {
    assetPath: 'public/img/art/art-1.png',
    checksumSha256:
      '2d6d165576a4417be912b6e2a3b511c07b9a6130389deb145574d43638a730a8',
    filename: 'earth-study-ii.png',
    height: 269,
    id: uuid('2', 2),
    mimeType: 'image/png',
    objectKey: 'v2-demo/artworks/earth-study-ii.png',
    sizeBytes: 150_670,
    width: 245,
  },
  {
    assetPath: 'public/img/art/art-2.png',
    checksumSha256:
      '43b8cf1f99b9d03728d08e6cc5f678d5e12f75a2a023724d2f90fb62681f4626',
    filename: 'earth-study-iii.png',
    height: 218,
    id: uuid('2', 3),
    mimeType: 'image/png',
    objectKey: 'v2-demo/artworks/earth-study-iii.png',
    sizeBytes: 72_097,
    width: 152,
  },
  {
    assetPath: 'public/img/art/art-3.png',
    checksumSha256:
      '13be0cfc078c5915b50cb4d0cfbb5286c18486d645beca157b633b342b5751e9',
    filename: 'archive-study.png',
    height: 246,
    id: uuid('2', 4),
    mimeType: 'image/png',
    objectKey: 'v2-demo/editorial/archive-study.png',
    sizeBytes: 106_053,
    width: 195,
  },
  {
    assetPath: 'public/img/art/art-4.png',
    checksumSha256:
      'caed3af6cc50207f568ce4ef3ac3f646c40fcc237372965be38a451e9ade71db',
    filename: 'exhibition-study.png',
    height: 294,
    id: uuid('2', 5),
    mimeType: 'image/png',
    objectKey: 'v2-demo/editorial/exhibition-study.png',
    sizeBytes: 99_407,
    width: 233,
  },
  {
    assetPath: 'public/img/art/art-5.png',
    checksumSha256:
      '94db6b10b9b49e6eba94cc6d042d1293075b27d47d2e2aca4a2f91968987f061',
    filename: 'journal-study.png',
    height: 227,
    id: uuid('2', 6),
    mimeType: 'image/png',
    objectKey: 'v2-demo/editorial/journal-study.png',
    sizeBytes: 157_678,
    width: 300,
  },
  {
    assetPath: 'public/img/art/art-6.png',
    checksumSha256:
      '725778fac260e00aebb819442f029722fc0ee92518b95c62e5f1a395d2da7d8c',
    filename: 'press-study.png',
    height: 217,
    id: uuid('2', 7),
    mimeType: 'image/png',
    objectKey: 'v2-demo/editorial/press-study.png',
    sizeBytes: 85_307,
    width: 182,
  },
  {
    assetPath: 'public/img/heritage-landscape-hero.jpg',
    checksumSha256:
      'a16bb2d72feaeb7f7311a47a1ee65478a74643d9611dc0decdef734236c6436f',
    filename: 'heritage-landscape-hero.jpg',
    height: 941,
    id: uuid('2', 8),
    mimeType: 'image/jpeg',
    objectKey: 'v2-demo/heritage/heritage-landscape-hero.jpg',
    sizeBytes: 501_047,
    width: 1672,
  },
  {
    assetPath: 'public/img/heritage-collection-hero.jpg',
    checksumSha256:
      '6625db9797429bfc8fecda65da931243761c7ad0cc66ad66cf6250d05207493f',
    filename: 'heritage-collection-hero.jpg',
    height: 1086,
    id: uuid('2', 9),
    mimeType: 'image/jpeg',
    objectKey: 'v2-demo/heritage/heritage-collection-hero.jpg',
    sizeBytes: 793_403,
    width: 1448,
  },
  {
    assetPath: 'public/img/heritage-studio-hero.jpg',
    checksumSha256:
      '9451a68bffda69c35cc1ecfa81fc3c94351ca286684dde0456a5397df822715f',
    filename: 'heritage-studio-hero.jpg',
    height: 941,
    id: uuid('2', 10),
    mimeType: 'image/jpeg',
    objectKey: 'v2-demo/heritage/heritage-studio-hero.jpg',
    sizeBytes: 553_221,
    width: 1672,
  },
  {
    assetPath: 'public/img/heritage-three-voices.jpg',
    checksumSha256:
      '9fb826378d79087181629a966c779f0f36519159c27eb741583ea05d6a580af7',
    filename: 'heritage-three-voices.jpg',
    height: 1402,
    id: uuid('2', 11),
    mimeType: 'image/jpeg',
    objectKey: 'v2-demo/artworks/heritage-three-voices.jpg',
    sizeBytes: 769_084,
    width: 1122,
  },
  {
    assetPath: 'public/img/heritage-returning-home.jpg',
    checksumSha256:
      'ca8f0b0f7ebba09ef86ca883d7d8a97532c50dce8ca7dbeb19f954b814a4bb82',
    filename: 'heritage-returning-home.jpg',
    height: 1086,
    id: uuid('2', 12),
    mimeType: 'image/jpeg',
    objectKey: 'v2-demo/artworks/heritage-returning-home.jpg',
    sizeBytes: 770_980,
    width: 1448,
  },
])

const copy = deepFreeze({
  en: {
    artworks: [
      [
        'silent-steppe',
        'Silent Steppe',
        'A layered study in ochre, charcoal, and remembered horizons.',
      ],
      [
        'earth-script',
        'Earth Script',
        'Pigment, gesture, and surface form an imagined material alphabet.',
      ],
      [
        'winter-light',
        'Winter Light',
        'A quiet composition shaped by mineral colour and diffused northern light.',
      ],
    ],
    collection: [
      'archive-of-earth',
      'Archive of Earth',
      'A replaceable editorial collection exploring material memory, landscape, and inherited forms.',
    ],
    exhibition: [
      'earth-memory',
      'My Soul Sings',
      'Landscapes, still lifes, and portraits',
      'In February 2013, Al Hayat Gallery in Bishkek presented 36 paintings by Bekten Usubaliev, bringing together landscapes, still lifes, and portraits in an exhibition open through 7 March.',
    ],
    journal: [
      'from-the-studio',
      'From the studio',
      'Notes on material, memory, and the pace of making.',
      'A demonstration journal entry for testing long-form editorial rhythm. Every sentence can be replaced in Bekten Studio.',
    ],
    pages: {
      about: [
        'The artist',
        'Practice',
        'Bekten Usubaliev was born in 1958 in Kurmenty, Issyk-Kul. He studied at the Semyon Chuikov art school and later completed his training at the Repin Institute in Saint Petersburg.\n\nAfter returning to Kyrgyzstan in 1989, he began teaching at the national art school. His practice moves between portrait, landscape, memory, and everyday life.\n\nThis source-grounded Studio biography remains fully editable and should be reviewed with the artist before production publication.',
      ],
      collectors: [
        'For collectors',
        'Private dialogue',
        'Request availability, arrange a private viewing, or begin a direct conversation with the studio.',
      ],
      commission: [
        'Commission a work',
        'Commission',
        'Begin with context, scale, timeline, and the atmosphere the work should hold.',
      ],
      'private-viewings': [
        'Private viewings',
        'By appointment',
        'Arrange a focused viewing of available works with the studio.',
      ],
      studio: [
        'The studio',
        'Working archive',
        'Bekten’s studio holds a working archive shaped by painting, drawing, teaching, and continual creative search. This demonstration profile intentionally contains no private address and can be replaced in Bekten Studio.',
      ],
    },
    press: [
      'landscapes-remembered',
      'My Soul Sings opens in Bishkek',
      'A 2013 report on the Al Hayat Gallery exhibition of 36 paintings by Bekten Usubaliev.',
    ],
  },
  ky: {
    artworks: [
      [
        'tinch-dala',
        'Тынч талаа',
        'Охра, көмүр жана эсте калган горизонттор тууралуу катмарлуу изилдөө.',
      ],
      [
        'jer-jazuusu',
        'Жер жазуусу',
        'Пигмент, жаңсоо жана бет элестүү материалдык алфавитти түзөт.',
      ],
      [
        'kyshky-zharyk',
        'Кышкы жарык',
        'Минералдык түс жана жумшак түндүк жарыгы түзгөн тынч композиция.',
      ],
    ],
    collection: [
      'jer-arkhivi',
      'Жер архиви',
      'Материалдык эс, пейзаж жана мурасталган формаларды изилдеген өзгөртүлүүчү редакциялык коллекция.',
    ],
    exhibition: [
      'jer-es-tutumu',
      'Жаным ырдайт',
      'Пейзаждар, натюрморттор жана портреттер',
      '2013-жылдын февралында Бишкектеги «Аль Хаят» галереясында Бектен Усубалиевдин 36 картинасы коюлуп, көргөзмө 7-мартка чейин уланган.',
    ],
    journal: [
      'ustakanadan',
      'Устаканадан',
      'Материал, эс жана жай чыгармачылык тууралуу жазуулар.',
      'Узак форматтагы редакциялык ритмди сыноо үчүн демо журнал жазмасы. Ар бир сүйлөмдү Bekten Studio аркылуу алмаштырууга болот.',
    ],
    pages: {
      about: [
        'Сүрөтчү',
        'Практика',
        'Бектен Усубалиев 1958-жылы Ысык-Көлдүн Күрмөнтү айылында төрөлгөн. С. Чуйков атындагы көркөм окуу жайында жана Санкт-Петербургдагы Репин институтунда билим алган.\n\n1989-жылы Кыргызстанга кайтып келип, көркөм окуу жайында сабак бере баштаган. Бул Studio тексти сүрөтчү менен такталып, толугу менен өзгөртүлө алат.',
      ],
      collectors: [
        'Коллекционерлер үчүн',
        'Жеке диалог',
        'Жеткиликтүүлүктү сураңыз, жеке көрүүнү уюштуруңуз же студия менен түз сүйлөшүңүз.',
      ],
      commission: [
        'Буйрутма берүү',
        'Буйрутма',
        'Контекст, өлчөм, мөөнөт жана чыгарма алып жүрчү маанайдан баштаңыз.',
      ],
      'private-viewings': [
        'Жеке көрүүлөр',
        'Алдын ала жазылуу менен',
        'Студия менен жеткиликтүү иштерди көңүл коюп көрүүнү уюштуруңуз.',
      ],
      studio: [
        'Устакана',
        'Иштөөчү архив',
        'Чыныгы дарек, процесс жана архив менен алмаштырылуучу демо студия профили.',
      ],
    },
    press: [
      'estelgen-peizajdar',
      'Эсте калган пейзаждар',
      'Редакциялык контекстти баштапкы жарыялоо менен байланыштырган демо басма материалы.',
    ],
  },
  ru: {
    artworks: [
      [
        'tikhaya-step',
        'Тихая степь',
        'Многослойное исследование охры, угля и запомнившихся горизонтов.',
      ],
      [
        'pismo-zemli',
        'Письмо земли',
        'Пигмент, жест и поверхность образуют воображаемый материальный алфавит.',
      ],
      [
        'zimniy-svet',
        'Зимний свет',
        'Спокойная композиция, построенная на минеральном цвете и рассеянном северном свете.',
      ],
    ],
    collection: [
      'arkhiv-zemli',
      'Архив земли',
      'Редактируемая коллекция о материальной памяти, ландшафте и унаследованных формах.',
    ],
    exhibition: [
      'pamyat-zemli',
      'Моя душа поёт',
      'Пейзажи, натюрморты и портреты',
      'В феврале 2013 года галерея «Аль Хаят» в Бишкеке представила 36 картин Бектена Усубалиева; выставка продолжалась до 7 марта.',
    ],
    journal: [
      'iz-masterskoy',
      'Из мастерской',
      'Заметки о материале, памяти и ритме работы.',
      'Демонстрационная журнальная запись для проверки длинного редакционного формата. Весь текст можно заменить в Bekten Studio.',
    ],
    pages: {
      about: [
        'Художник',
        'Практика',
        'Бектен Усубалиев родился в 1958 году в Курменты Иссык-Кульской области. Учился в художественном училище имени С. Чуйкова и в Институте имени Репина в Санкт-Петербурге.\n\nВернувшись в Кыргызстан в 1989 году, он начал преподавать. Этот текст Studio полностью редактируется и должен быть согласован с художником.',
      ],
      collectors: [
        'Коллекционерам',
        'Частный диалог',
        'Уточните доступность, организуйте частный просмотр или начните прямой разговор со студией.',
      ],
      commission: [
        'Заказать работу',
        'Заказ',
        'Начните с контекста, масштаба, сроков и атмосферы будущей работы.',
      ],
      'private-viewings': [
        'Частные просмотры',
        'По записи',
        'Организуйте сосредоточенный просмотр доступных работ вместе со студией.',
      ],
      studio: [
        'Студия',
        'Рабочий архив',
        'Демонстрационный профиль, который можно заменить реальным адресом, процессом и архивом.',
      ],
    },
    press: [
      'zapomnennye-landshafty',
      'Запомненные ландшафты',
      'Демонстрационный материал, связывающий редакционный контекст с оригинальной публикацией.',
    ],
  },
  tr: {
    artworks: [
      [
        'sessiz-bozkir',
        'Sessiz Bozkır',
        'Okra, kömür ve hatırlanan ufuklar üzerine katmanlı bir çalışma.',
      ],
      [
        'topragin-yazisi',
        'Toprağın Yazısı',
        'Pigment, hareket ve yüzey düşsel bir maddi alfabe oluşturuyor.',
      ],
      [
        'kis-isigi',
        'Kış Işığı',
        'Mineral renk ve dağınık kuzey ışığıyla şekillenen sakin bir kompozisyon.',
      ],
    ],
    collection: [
      'toprak-arsivi',
      'Toprak Arşivi',
      'Maddi hafıza, peyzaj ve miras kalan formları inceleyen değiştirilebilir bir editorial koleksiyon.',
    ],
    exhibition: [
      'topragin-hafizasi',
      'Ruhum Şarkı Söylüyor',
      'Peyzajlar, natürmortlar ve portreler',
      'Şubat 2013’te Bişkek’teki Al Hayat Galerisi, Bekten Usubaliev’in 36 resmini bir araya getiren ve 7 Mart’a kadar süren sergiyi açtı.',
    ],
    journal: [
      'atolyeden',
      'Atölyeden',
      'Malzeme, hafıza ve üretimin ritmi üzerine notlar.',
      'Uzun biçimli editorial ritmi sınamak için hazırlanmış demo yazı. Her cümle Bekten Studio üzerinden değiştirilebilir.',
    ],
    pages: {
      about: [
        'Sanatçı',
        'Pratik',
        'Bekten Usubaliev 1958’de Issık Göl bölgesindeki Kurmenty’de doğdu. Semyon Chuikov sanat okulunda ve Saint Petersburg’daki Repin Enstitüsü’nde eğitim gördü.\n\n1989’da Kırgızistan’a dönerek sanat okulunda ders vermeye başladı. Bu Studio metni tamamen düzenlenebilir ve yayın öncesinde sanatçıyla doğrulanmalıdır.',
      ],
      collectors: [
        'Koleksiyonerler için',
        'Özel diyalog',
        'Uygunluk sorun, özel gösterim planlayın veya stüdyoyla doğrudan konuşun.',
      ],
      commission: [
        'Eser siparişi',
        'Sipariş',
        'Bağlam, ölçek, zamanlama ve eserin taşıması istenen atmosferle başlayın.',
      ],
      'private-viewings': [
        'Özel gösterimler',
        'Randevuyla',
        'Uygun eserleri stüdyoyla odaklı biçimde görmek için randevu alın.',
      ],
      studio: [
        'Stüdyo',
        'Çalışan arşiv',
        'Gerçek adres, süreç ve arşivle değiştirilebilecek demo stüdyo profili.',
      ],
    },
    press: [
      'hatirlanan-peyzajlar',
      'Hatırlanan Peyzajlar',
      'Editorial bağlamı özgün yayına bağlayan demo basın kaydı.',
    ],
  },
})

function localizedSeedPath(locale, pathname) {
  const normalizedPath = `/${pathname}`
    .replace(/\/+/gu, '/')
    .replace(/\/$/u, '')
  const publicPath = normalizedPath || '/'

  return locale === 'en'
    ? publicPath
    : publicPath === '/'
      ? `/${locale}`
      : `/${locale}${publicPath}`
}

function seo(locale, segment, slug, title, description) {
  const canonicalPath = localizedSeedPath(
    locale,
    `/${segment ? `${segment}/` : ''}${slug}`,
  )
  const completeDescription =
    description.length >= 50
      ? description
      : `${description} Bekten Studio editorial archive.`

  return {
    canonicalPath,
    description: completeDescription.slice(0, 170),
    noIndex: false,
    title: `${title} — Bekten Studio`.slice(0, 70),
  }
}

function placement(entityId, entityType, mediaObject, index, altText) {
  const editable = {
    altText,
    caption: 'Replaceable demonstration media',
    credit: 'Bekten Studio demo',
    crop: 'ORIGINAL',
    displayOrder: 0,
    focalPoint: null,
    mediaObjectId: mediaObject.id,
    role: 'HERO',
  }

  return {
    database: {
      altText: editable.altText,
      caption: editable.caption,
      credit: editable.credit,
      crop: editable.crop,
      displayOrder: editable.displayOrder,
      entityId,
      entityType,
      id: uuid('4', index),
      mediaObjectId: editable.mediaObjectId,
      role: editable.role,
    },
    editable,
  }
}

function sharedRow(
  id,
  locale,
  slug,
  title,
  description,
  displayOrder,
  segment,
) {
  const metadata = seo(locale, segment, slug, title, description)

  return {
    createdAt: PUBLISHED_AT,
    displayOrder,
    id,
    locale,
    publishedAt: PUBLISHED_AT,
    seoCanonicalPath: metadata.canonicalPath,
    seoDescription: metadata.description,
    seoNoIndex: metadata.noIndex,
    seoTitle: metadata.title,
    slug,
    status: 'PUBLISHED',
    title,
    updatedAt: PUBLISHED_AT,
    version: 1,
  }
}

function contentItem({
  delegate,
  displayOrder,
  entityId,
  entityType,
  locale,
  mediaAssetPath,
  placementIndex,
  row,
  segment,
  snapshot,
}) {
  const selectedMedia = mediaAssetPath
    ? media.find(item => item.assetPath === mediaAssetPath)
    : media[(placementIndex - 1) % media.length]
  const selectedPlacement = selectedMedia
    ? placement(entityId, entityType, selectedMedia, placementIndex, row.title)
    : null
  const placements = selectedPlacement ? [selectedPlacement.database] : []
  const editablePlacements = selectedPlacement
    ? [selectedPlacement.editable]
    : []
  const completeSnapshot = {
    displayOrder,
    locale,
    mediaPlacements: editablePlacements,
    seo: seo(
      locale,
      segment,
      row.slug,
      row.title,
      snapshot.description ?? snapshot.excerpt ?? snapshot.body,
    ),
    slug: row.slug,
    ...snapshot,
  }

  return {
    delegate,
    entityId,
    entityType,
    identity: `${entityType}:${locale}:${row.slug}`,
    placements,
    revision: {
      entityId,
      entityType,
      id: uuid('3', placementIndex),
      locale,
      operation: 'PUBLISH',
      snapshot: completeSnapshot,
      version: 1,
    },
    row,
    segment,
  }
}

function buildContent() {
  const items = []
  let index = 1

  for (const locale of ['en', 'tr', 'ru', 'ky']) {
    const localeCopy = copy[locale]
    const collectionId = uuid('1', index)
    const [collectionSlug, collectionTitle, collectionDescription] =
      localeCopy.collection
    const collectionRow = {
      ...sharedRow(
        collectionId,
        locale,
        collectionSlug,
        collectionTitle,
        collectionDescription,
        0,
        'collections',
      ),
      description: collectionDescription,
    }

    items.push(
      contentItem({
        delegate: 'collection',
        displayOrder: 0,
        entityId: collectionId,
        entityType: 'COLLECTION',
        locale,
        mediaAssetPath: 'public/img/heritage-collection-hero.jpg',
        placementIndex: index,
        row: collectionRow,
        segment: 'collections',
        snapshot: {description: collectionDescription, title: collectionTitle},
      }),
    )
    index += 1

    for (const [artworkOrder, artwork] of localeCopy.artworks.entries()) {
      const [slug, title, description] = artwork
      const entityId = uuid('1', index)
      const row = {
        ...sharedRow(
          entityId,
          locale,
          slug,
          title,
          description,
          artworkOrder,
          'works',
        ),
        availability: artworkOrder === 2 ? 'AVAILABLE' : 'ON_REQUEST',
        collectionId,
        description,
        dimensions: artworkOrder === 1 ? '80 × 60 cm' : '120 × 90 cm',
        medium: 'Oil and mineral pigment on canvas',
        year: 2026 - artworkOrder,
      }

      items.push(
        contentItem({
          delegate: 'artwork',
          displayOrder: artworkOrder,
          entityId,
          entityType: 'ARTWORK',
          locale,
          mediaAssetPath: [
            'public/img/heritage-landscape-hero.jpg',
            'public/img/heritage-three-voices.jpg',
            'public/img/heritage-returning-home.jpg',
          ][artworkOrder],
          placementIndex: index,
          row,
          segment: 'works',
          snapshot: {
            availability: row.availability,
            collectionId,
            description,
            dimensions: row.dimensions,
            medium: row.medium,
            title,
            year: row.year,
          },
        }),
      )
      index += 1
    }

    const [
      exhibitionSlug,
      exhibitionTitle,
      exhibitionSubtitle,
      exhibitionBody,
    ] = localeCopy.exhibition
    const exhibitionId = uuid('1', index)
    const exhibitionRow = {
      ...sharedRow(
        exhibitionId,
        locale,
        exhibitionSlug,
        exhibitionTitle,
        exhibitionBody,
        0,
        'exhibitions',
      ),
      body: exhibitionBody,
      city: 'Bishkek',
      country: 'Kyrgyzstan',
      endsAt: new Date('2013-03-07T00:00:00.000Z'),
      startsAt: new Date('2013-02-14T00:00:00.000Z'),
      subtitle: exhibitionSubtitle,
      venue: 'Al Hayat Gallery',
    }

    items.push(
      contentItem({
        delegate: 'exhibition',
        displayOrder: 0,
        entityId: exhibitionId,
        entityType: 'EXHIBITION',
        locale,
        placementIndex: index,
        row: exhibitionRow,
        segment: 'exhibitions',
        snapshot: {
          body: exhibitionBody,
          city: exhibitionRow.city,
          country: exhibitionRow.country,
          endsAt: exhibitionRow.endsAt.toISOString(),
          startsAt: exhibitionRow.startsAt.toISOString(),
          subtitle: exhibitionSubtitle,
          title: exhibitionTitle,
          venue: exhibitionRow.venue,
        },
      }),
    )
    index += 1

    const [journalSlug, journalTitle, journalExcerpt, journalBody] =
      localeCopy.journal
    const journalId = uuid('1', index)
    const journalRow = {
      ...sharedRow(
        journalId,
        locale,
        journalSlug,
        journalTitle,
        journalExcerpt,
        0,
        'journal',
      ),
      body: journalBody,
      excerpt: journalExcerpt,
    }

    items.push(
      contentItem({
        delegate: 'journalEntry',
        displayOrder: 0,
        entityId: journalId,
        entityType: 'JOURNAL_ENTRY',
        locale,
        placementIndex: index,
        row: journalRow,
        segment: 'journal',
        snapshot: {
          body: journalBody,
          excerpt: journalExcerpt,
          title: journalTitle,
        },
      }),
    )
    index += 1

    for (const [pageOrder, [slug, page]] of Object.entries(
      localeCopy.pages,
    ).entries()) {
      const [title, eyebrow, body] = page
      const pageId = uuid('1', index)
      const pageRow = {
        ...sharedRow(pageId, locale, slug, title, body, pageOrder, ''),
        body,
        eyebrow,
      }

      items.push(
        contentItem({
          delegate: 'page',
          displayOrder: pageOrder,
          entityId: pageId,
          entityType: 'PAGE',
          locale,
          mediaAssetPath:
            slug === 'studio'
              ? 'public/img/heritage-studio-hero.jpg'
              : undefined,
          placementIndex: index,
          row: pageRow,
          segment: '',
          snapshot: {body, eyebrow, title},
        }),
      )
      index += 1
    }

    const [pressSlug, pressTitle, pressExcerpt] = localeCopy.press
    const pressId = uuid('1', index)
    const pressRow = {
      ...sharedRow(
        pressId,
        locale,
        pressSlug,
        pressTitle,
        pressExcerpt,
        0,
        'press',
      ),
      category: 'FEATURE',
      content: `${pressExcerpt} The linked source remains the authority; this Studio summary is editable.`,
      description: pressExcerpt,
      outlet: 'Vecherniy Bishkek',
      publishedOn: new Date('2013-02-14T00:00:00.000Z'),
      sourceUrl:
        'https://www.vb.kg/doc/212800_v_bishkeke_otkrylas_vystavka_bektena_ysybalieva_.html',
      subtitle: null,
    }

    items.push(
      contentItem({
        delegate: 'pressItem',
        displayOrder: 0,
        entityId: pressId,
        entityType: 'PRESS_ENTRY',
        locale,
        placementIndex: index,
        row: pressRow,
        segment: 'press',
        snapshot: {
          body: pressRow.content,
          excerpt: pressExcerpt,
          outlet: pressRow.outlet,
          pressCategory: pressRow.category,
          publishedOn: pressRow.publishedOn.toISOString(),
          sourceUrl: pressRow.sourceUrl,
          subtitle: null,
          title: pressTitle,
        },
      }),
    )
    index += 1
  }

  return deepFreeze(items)
}

const content = buildContent()

export function assertDemoSeedAllowed(environment) {
  if (
    environment.ALLOW_V2_DEMO_SEED !== 'true' ||
    environment.V2_DEMO_SEED_CONFIRMATION !== PRODUCTION_CONFIRMATION
  ) {
    throw new Error('V2_DEMO_SEED_NOT_AUTHORIZED')
  }
}

export function createDemoSeedPlan() {
  return deepFreeze({content, media})
}

function mediaRow(item) {
  return {
    checksumSha256: item.checksumSha256,
    filename: item.filename,
    height: item.height,
    id: item.id,
    mimeType: item.mimeType,
    objectKey: item.objectKey,
    originalFilename: item.filename,
    provider: 'garage',
    sizeBytes: item.sizeBytes,
    status: 'READY',
    visibility: 'PUBLIC',
    width: item.width,
  }
}

async function ensureMediaIdentities(database, mediaItems) {
  const existing = await database.mediaObject.findMany({
    select: {
      checksumSha256: true,
      filename: true,
      height: true,
      id: true,
      mimeType: true,
      objectKey: true,
      originalFilename: true,
      provider: true,
      sizeBytes: true,
      status: true,
      visibility: true,
      width: true,
    },
    where: {
      OR: [
        {id: {in: mediaItems.map(item => item.id)}},
        {objectKey: {in: mediaItems.map(item => item.objectKey)}},
      ],
    },
  })

  for (const row of existing) {
    const expected = mediaItems.find(
      item => item.id === row.id || item.objectKey === row.objectKey,
    )

    if (
      !expected ||
      expected.id !== row.id ||
      expected.objectKey !== row.objectKey
    ) {
      throw new Error('V2_DEMO_MEDIA_IDENTITY_CONFLICT')
    }
  }

  return new Map(existing.map(row => [row.id, row]))
}

function isCurrentMediaRow(row, item) {
  return Object.entries(mediaRow(item)).every(
    ([key, value]) => row[key] === value,
  )
}

function cacheRevalidationJob(item) {
  const localeRoot = localizedSeedPath(item.row.locale, '/')
  const listingPath = item.segment
    ? localizedSeedPath(item.row.locale, `/${item.segment}`)
    : localeRoot
  const detailPath = localizedSeedPath(
    item.row.locale,
    `/${item.segment ? `${item.segment}/` : ''}${item.row.slug}`,
  )

  return {
    idempotencyKey: `editorial.cache-revalidate:${item.entityType}:${item.entityId}:v1`,
    maxAttempts: 5,
    payload: {
      entityId: item.entityId,
      entityType: item.entityType,
      locale: item.row.locale,
      paths: [...new Set([localeRoot, listingPath, detailPath])],
      version: 1,
    },
    type: 'editorial.cache-revalidate',
  }
}

function isStableDemoSeedError(error) {
  return error instanceof Error && /^V2_DEMO_[A-Z0-9_]+$/u.test(error.message)
}

async function executeDemoSeedPlanUnchecked({
  content: contentItems = content,
  database,
  media: mediaItems = media,
  uploadAsset,
}) {
  const existingMedia = await ensureMediaIdentities(database, mediaItems)

  for (const item of mediaItems) await uploadAsset(item)

  for (const item of mediaItems) {
    const existing = existingMedia.get(item.id)

    if (!existing || isCurrentMediaRow(existing, item)) continue

    const expected = mediaRow(item)
    const data = {
      checksumSha256: expected.checksumSha256,
      filename: expected.filename,
      height: expected.height,
      mimeType: expected.mimeType,
      originalFilename: expected.originalFilename,
      provider: expected.provider,
      sizeBytes: expected.sizeBytes,
      status: expected.status,
      visibility: expected.visibility,
      width: expected.width,
    }
    const repaired = await database.mediaObject.updateMany({
      data,
      where: {id: item.id, objectKey: item.objectKey},
    })

    if (repaired.count !== 1) {
      throw new Error('V2_DEMO_MEDIA_REPAIR_CONFLICT')
    }
  }

  const newMedia = mediaItems.filter(item => !existingMedia.has(item.id))

  if (newMedia.length > 0) {
    const createdMedia = await database.mediaObject.createMany({
      data: newMedia.map(mediaRow),
      skipDuplicates: true,
    })

    if (createdMedia.count !== newMedia.length) {
      throw new Error('V2_DEMO_MEDIA_WRITE_CONFLICT')
    }
  }

  let created = 0
  let existing = 0

  for (const item of contentItems) {
    const outcome = await database.$transaction(async transaction => {
      const delegate = transaction[item.delegate]

      if (!delegate || typeof delegate.createMany !== 'function') {
        throw new Error('V2_DEMO_SEED_CONFIGURATION_INVALID')
      }

      const inserted = await delegate.createMany({
        data: [item.row],
        skipDuplicates: true,
      })

      if (inserted.count === 0) {
        if (typeof delegate.findUnique !== 'function') {
          throw new Error('V2_DEMO_SEED_CONFIGURATION_INVALID')
        }

        const preservedByIdentity = await delegate.findUnique({
          select: {id: true, version: true},
          where: {
            locale_slug: {locale: item.row.locale, slug: item.row.slug},
          },
        })
        const preserved =
          preservedByIdentity ??
          (await delegate.findUnique({
            select: {id: true, version: true},
            where: {id: item.entityId},
          }))

        if (
          !preserved ||
          typeof preserved.id !== 'string' ||
          !Number.isInteger(preserved.version)
        ) {
          throw new Error('V2_DEMO_EXISTING_CONTENT_INVALID')
        }

        await transaction.auditEvent.create({
          data: {
            action: 'editorial.demo-seed-skipped',
            entityId: preserved.id,
            entityType: item.entityType,
            metadata: {
              identity: item.identity,
              preservedVersion: preserved.version,
            },
            requestId: `v2-demo-seed:${item.entityId}`,
          },
        })

        return 'existing'
      }
      if (inserted.count !== 1) throw new Error('V2_DEMO_CONTENT_WRITE_INVALID')

      if (item.placements.length > 0) {
        const insertedPlacements =
          await transaction.contentMediaPlacement.createMany({
            data: item.placements,
            skipDuplicates: true,
          })

        if (insertedPlacements.count !== item.placements.length) {
          throw new Error('V2_DEMO_PLACEMENT_WRITE_CONFLICT')
        }
      }

      const insertedRevision = await transaction.contentRevision.createMany({
        data: [item.revision],
        skipDuplicates: true,
      })

      if (insertedRevision.count !== 1) {
        throw new Error('V2_DEMO_REVISION_WRITE_CONFLICT')
      }

      await transaction.auditEvent.create({
        data: {
          action: 'editorial.demo-seeded',
          entityId: item.entityId,
          entityType: item.entityType,
          metadata: {identity: item.identity, version: 1},
          requestId: `v2-demo-seed:${item.entityId}`,
        },
      })

      if (!transaction.outboxJob?.create) {
        throw new Error('V2_DEMO_SEED_CONFIGURATION_INVALID')
      }
      await transaction.outboxJob.create({data: cacheRevalidationJob(item)})

      return 'created'
    })

    if (outcome === 'created') created += 1
    else existing += 1
  }

  return Object.freeze({created, existing, media: mediaItems.length})
}

export async function executeDemoSeedPlan(input) {
  assertDemoSeedAllowed(input.environment)

  try {
    return await executeDemoSeedPlanUnchecked(input)
  } catch (error) {
    if (isStableDemoSeedError(error)) throw error

    throw new Error('V2_DEMO_SEED_FAILED')
  }
}
