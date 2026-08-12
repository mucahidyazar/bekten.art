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
      'An editorial collection tracing material memory, landscape, and inherited forms.',
    ],
    exhibition: [
      'earth-memory',
      'My Soul Sings',
      'Landscapes, still lifes, and portraits',
      'In January 2013, Al Hayat Gallery in Bishkek presented 36 paintings by Bekten Usubaliev, bringing together landscapes, still lifes, and portraits in an exhibition open through 9 February.',
    ],
    journal: [
      'from-the-studio',
      'From the studio',
      'Notes on landscape, portraiture, teaching, and a practice in continual search.',
      'Bekten Usubaliev’s documented practice moves between landscape, still life, portraiture, and scenes of everyday life. The subjects change, but close attention to people and place remains constant.\n\nHis path combines making and teaching. After graduating from the Repin Institute in 1989, he returned to Kyrgyzstan and began teaching at the S. A. Chuikov Kyrgyz State Art College.\n\nAt the 2013 exhibition “My Soul Sings” in Bishkek, thirty-six paintings brought these strands together. Usubaliev described a wish to preserve Kyrgyzstan’s beautiful places on canvas, while colleagues emphasized the recognizable character of his painting and his continuing creative search.\n\nThe archive extends beyond the studio: an Open Studio Tour in 2015 welcomed visitors into the artists’ working environment, and that same year a TÜRKSOY plein-air gathering in Aksaray brought together artists from eighteen countries.',
    ],
    pages: {
      about: [
        'The artist',
        'Practice',
        'Bekten Usubaliev is a Kyrgyz painter whose work moves between landscape, still life, portraiture, and everyday life, repeatedly returning to the people and places of Kyrgyzstan.\n\nBorn on 5 October 1958 in Kurmenty in the Issyk-Kul region, he studied at the S. A. Chuikov Art College in Frunze. From 1981 to 1983 he worked as an artist at the Goznak factory in Leningrad, and in 1989 graduated from the I. E. Repin Institute of Painting, Sculpture and Architecture. Since 1989 he has taught at the S. A. Chuikov Kyrgyz State Art College; in 1991 he became a member of the Union of Artists of the Kyrgyz Republic.\n\nHis 2013 solo exhibition “My Soul Sings” at Al Hayat Gallery assembled 36 paintings—landscapes, still lifes, and portraits. Contemporary accounts describe a recognizable painter in continual creative search; Usubaliev spoke of wanting to preserve Kyrgyzstan’s beautiful places on canvas.\n\nHis public practice includes the 2015 B’Art Open Studio Tour and a TÜRKSOY plein-air gathering in Aksaray with artists from 18 countries, where he made five paintings. Later group contexts include the Great Silk Road exhibition in Bishkek in 2021 and Spring Inspiration at Gallery M in 2023.',
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
        'Bekten’s studio holds a working archive shaped by painting, drawing, teaching, and continual creative search.\n\nIn 2015, B’Art Contemporary’s Open Studio Tour welcomed more than 100 visitors to artists’ studios in a former Soviet-era art factory, including Usubaliev’s working environment.\n\nThe studio is presented here as a place where the artist’s practice and decades of teaching meet; private address details are intentionally not published.',
      ],
    },
    press: [
      'landscapes-remembered',
      'My Soul Sings opens in Bishkek',
      'A January 2013 report on the Al Hayat Gallery exhibition of 36 paintings by Bekten Usubaliev.',
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
      'Материалдык эс, пейзаж жана мурасталган формаларды изилдеген редакциялык коллекция.',
    ],
    exhibition: [
      'jer-es-tutumu',
      'Жаным ырдайт',
      'Пейзаждар, натюрморттор жана портреттер',
      '2013-жылдын январында Бишкектеги «Аль Хаят» галереясында Бектен Усубалиевдин пейзаж, натюрморт жана портреттен турган 36 картинасы коюлуп, көргөзмө 9-февралга чейин уланган.',
    ],
    journal: [
      'ustakanadan',
      'Устаканадан',
      'Пейзаж, портрет, окутуу жана тынымсыз чыгармачылык изденүү тууралуу жазуулар.',
      'Бектен Усубалиевдин документтелген чыгармачылыгы пейзаж, натюрморт, портрет жана күнүмдүк турмуш көрүнүштөрүн камтыйт. Темалар өзгөргөнү менен адамдарга жана жерге кылдат мамиле туруктуу бойдон калат.\n\n1989-жылы Репин институтун бүтүргөндөн кийин Кыргызстанга кайтып келип, С. А. Чуйков атындагы Кыргыз мамлекеттик көркөм окуу жайында сабак бере баштаган.\n\n2013-жылкы «Жаным ырдайт» көргөзмөсү бул багыттарды 36 картинада бириктирген. Сүрөтчү Кыргызстандын кооз жерлерин полотнодо калтыргысы келерин айткан; кесиптештери анын таанымал живописин жана үзгүлтүксүз изденүүсүн белгилешкен.\n\n2015-жылкы ачык студия туру көрүүчүлөрдү сүрөтчүлөрдүн иш мейкиндигине киргизген, ошол эле жылы Аксарайдагы ТҮРКСОЙ пленэрине 18 өлкөнүн сүрөтчүлөрү катышкан.',
    ],
    pages: {
      about: [
        'Сүрөтчү',
        'Практика',
        'Бектен Усубалиев — чыгармачылыгында пейзаж, натюрморт, портрет жана күнүмдүк турмушту бириктирген кыргыз живописчиси. Анын эмгектери Кыргызстандагы адамдарга жана жерлерге кайра-кайра кайрылат.\n\nАл 1958-жылдын 5-октябрында Ысык-Көл облусунун Күрмөнтү айылында төрөлгөн. Фрунзедеги С. А. Чуйков атындагы көркөм окуу жайында окуп, 1981–1983-жылдары Ленинграддагы Гознак фабрикасында сүрөтчү болуп иштеген. 1989-жылы И. Е. Репин атындагы живопись, скульптура жана архитектура институтун бүтүргөн. Ошол жылдан бери С. А. Чуйков атындагы Кыргыз мамлекеттик көркөм окуу жайында сабак берет; 1991-жылдан Кыргыз Республикасынын Сүрөтчүлөр союзунун мүчөсү.\n\n2013-жылы «Аль Хаят» галереясындагы «Жаным ырдайт» жеке көргөзмөсү пейзаж, натюрморт жана портреттен турган 36 картинаны бириктирген. Ошол учурда сүрөтчү Кыргызстандын кооз жерлерин полотнодо сактап калгысы келерин айткан.\n\nАнын коомдук чыгармачылык таржымалына 2015-жылкы B’Art ачык студия туру, 18 өлкөнүн сүрөтчүлөрү катышкан Аксарайдагы ТҮРКСОЙ пленэри, 2021-жылкы Улуу Жибек жолу көргөзмөсү жана 2023-жылкы «Жазгы илхам» көргөзмөсү кирет.',
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
        'Бектендин устаканасы живопись, сүрөт, окутуу жана үзгүлтүксүз чыгармачылык изденүү калыптандырган иш архивин сактайт.\n\n2015-жылы B’Art Contemporary уюштурган ачык студия туру мурдагы советтик көркөм фабрикадагы сүрөтчүлөрдүн иш мейкиндигине 100дөн ашык көрүүчүнү алып келген; алардын арасында Усубалиевдин устаканасы да болгон.\n\nБул барак устакананы сүрөтчүнүн практикасы менен көп жылдык окутуусу жолуккан мейкиндик катары көрсөтөт; жеке дарек жарыяланбайт.',
      ],
    },
    press: [
      'estelgen-peizajdar',
      'Эсте калган пейзаждар',
      '2013-жылы «Аль Хаят» галереясында өткөн 36 картинадан турган көргөзмө тууралуу материал.',
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
      'Редакционная коллекция о материальной памяти, ландшафте и унаследованных формах.',
    ],
    exhibition: [
      'pamyat-zemli',
      'Моя душа поёт',
      'Пейзажи, натюрморты и портреты',
      'В январе 2013 года галерея «Аль Хаят» в Бишкеке представила 36 картин Бектена Усубалиева — пейзажи, натюрморты и портреты; выставка продолжалась до 9 февраля.',
    ],
    journal: [
      'iz-masterskoy',
      'Из мастерской',
      'Заметки о пейзаже, портрете, преподавании и непрерывном творческом поиске.',
      'Документированная практика Бектена Усубалиева охватывает пейзаж, натюрморт, портрет и сцены повседневной жизни. Темы меняются, но внимательное отношение к людям и месту остаётся постоянным.\n\nПосле окончания Института имени Репина в 1989 году он вернулся в Кыргызстан и начал преподавать в Кыргызском государственном художественном училище имени С. А. Чуйкова.\n\nВыставка «Душа моя поёт» в 2013 году объединила 36 картин. Усубалиев говорил о желании запечатлеть красоту Кыргызстана на холсте, а коллеги отмечали узнаваемость его живописи и постоянный творческий поиск.\n\nВ 2015 году тур открытых студий познакомил публику с рабочей средой художников; в том же году пленэр ТЮРКСОЙ в Аксарае собрал участников из 18 стран.',
    ],
    pages: {
      about: [
        'Художник',
        'Практика',
        'Бектен Усубалиев — кыргызский живописец, работающий с пейзажем, натюрмортом, портретом и сценами повседневной жизни. Его произведения вновь и вновь обращаются к людям и местам Кыргызстана.\n\nОн родился 5 октября 1958 года в селе Курменты Иссык-Кульской области. Учился во Фрунзенском художественном училище имени С. А. Чуйкова, в 1981–1983 годах работал художником на фабрике Гознак в Ленинграде. В 1989 году окончил Институт живописи, скульптуры и архитектуры имени И. Е. Репина. С того же года преподаёт в Кыргызском государственном художественном училище имени С. А. Чуйкова; с 1991 года состоит в Союзе художников Кыргызской Республики.\n\nПерсональная выставка «Душа моя поёт» в галерее «Аль Хаят» в 2013 году объединила 36 пейзажей, натюрмортов и портретов. Усубалиев говорил о стремлении сохранить красоту Кыргызстана на холсте.\n\nСреди последующих публичных контекстов — тур открытых студий B’Art и пленэр ТЮРКСОЙ в Аксарае с художниками из 18 стран в 2015 году, выставка «Великий Шёлковый путь» в 2021-м и «Весеннее вдохновение» в Галерее М в 2023-м.',
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
        'Мастерская Бектена хранит рабочий архив, сформированный живописью, рисунком, преподаванием и постоянным творческим поиском.\n\nВ 2015 году тур открытых студий B’Art Contemporary привёл более 100 посетителей в рабочие пространства художников в здании бывшей советской художественной фабрики, включая мастерскую Усубалиева.\n\nЗдесь мастерская представлена как место встречи художественной практики и многолетнего преподавания; частный адрес не публикуется.',
      ],
    },
    press: [
      'zapomnennye-landshafty',
      'Запомненные ландшафты',
      'Материал о выставке 36 работ Бектена Усубалиева в галерее «Аль Хаят» в 2013 году.',
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
      'Maddi hafıza, peyzaj ve miras kalan formları izleyen editoryal bir koleksiyon.',
    ],
    exhibition: [
      'topragin-hafizasi',
      'Ruhum Şarkı Söylüyor',
      'Peyzajlar, natürmortlar ve portreler',
      'Ocak 2013’te Bişkek’teki Al Hayat Galerisi, Bekten Usubaliev’in peyzaj, natürmort ve portrelerden oluşan 36 resmini bir araya getirdi; sergi 9 Şubat’a kadar sürdü.',
    ],
    journal: [
      'atolyeden',
      'Atölyeden',
      'Peyzaj, portre, eğitim ve süren yaratıcı arayış üzerine notlar.',
      'Bekten Usubaliev’in belgelenmiş pratiği peyzaj, natürmort, portre ve gündelik yaşam sahneleri arasında dolaşır. Konular değişse de insanlara ve mekâna gösterdiği dikkat sabit kalır.\n\n1989’da Repin Enstitüsü’nden mezun olduktan sonra Kırgızistan’a döndü ve S. A. Chuikov Kırgız Devlet Sanat Koleji’nde ders vermeye başladı.\n\n2013’teki “Ruhum Şarkı Söylüyor” sergisi bu yönleri 36 tabloda bir araya getirdi. Usubaliev, Kırgızistan’ın güzel yerlerini tuvale kaydetme isteğini anlatırken meslektaşları resimlerinin ayırt edici niteliğine ve bitmeyen yaratıcı arayışına dikkat çekti.\n\n2015’te açık stüdyo turu izleyicileri sanatçıların çalışma alanlarıyla buluşturdu; aynı yıl Aksaray’daki TÜRKSOY açık hava çalışması 18 ülkeden sanatçıları bir araya getirdi.',
    ],
    pages: {
      about: [
        'Sanatçı',
        'Pratik',
        'Bekten Usubaliev; peyzaj, natürmort, portre ve gündelik yaşam sahneleri arasında çalışan Kırgız bir ressamdır. Yapıtları Kırgızistan’ın insanlarına ve mekânlarına tekrar tekrar döner.\n\n5 Ekim 1958’de Issık Göl bölgesindeki Kurmenty köyünde doğdu. Frunze’deki S. A. Chuikov Sanat Koleji’nde eğitim gördü; 1981–1983 arasında Leningrad’daki Goznak fabrikasında sanatçı olarak çalıştı. 1989’da I. E. Repin Resim, Heykel ve Mimarlık Enstitüsü’nden mezun oldu. Aynı yıldan bu yana S. A. Chuikov Kırgız Devlet Sanat Koleji’nde ders veriyor; 1991’den beri Kırgız Cumhuriyeti Sanatçılar Birliği üyesi.\n\n2013’te Al Hayat Galerisi’ndeki “Ruhum Şarkı Söylüyor” kişisel sergisi 36 peyzaj, natürmort ve portreyi buluşturdu. Usubaliev o dönemde Kırgızistan’ın güzel yerlerini tuvale kaydetmek istediğini söyledi.\n\nKamusal üretim çizgisinde 2015 B’Art Açık Stüdyo Turu, 18 ülkeden sanatçının katıldığı Aksaray TÜRKSOY buluşması, 2021’de Bişkek’teki Büyük İpek Yolu sergisi ve 2023’te Galeri M’deki Bahar İlhamı sergisi yer alıyor.',
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
        'Bekten’in stüdyosu resim, çizim, eğitim ve süren yaratıcı arayışın biçimlendirdiği çalışan bir arşiv barındırıyor.\n\n2015’te B’Art Contemporary’nin Açık Stüdyo Turu, eski bir Sovyet sanat fabrikasındaki sanatçı çalışma alanlarına 100’den fazla ziyaretçi getirdi; Usubaliev’in stüdyosu da bu turun parçasıydı.\n\nBu sayfa stüdyoyu sanat pratiği ile uzun yıllara yayılan eğitimin buluştuğu yer olarak ele alır; özel adres yayımlanmaz.',
      ],
    },
    press: [
      'hatirlanan-peyzajlar',
      'Hatırlanan Peyzajlar',
      'Bekten Usubaliev’in 2013’te Al Hayat Galerisi’nde açılan 36 eserlik sergisi üzerine bir haber.',
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
    caption: 'Editorial archive image',
    credit: 'Bekten Studio archive',
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
  translationGroupId,
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
    translationGroupId,
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
    const groupId = (kind, order = 0) => {
      const groupOffsets = {
        artwork: 10,
        collection: 1,
        exhibition: 20,
        journal: 30,
        page: 40,
        press: 50,
      }

      return uuid('9', groupOffsets[kind] + order)
    }
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
        groupId('collection'),
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
          groupId('artwork', artworkOrder),
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
        groupId('exhibition'),
      ),
      body: exhibitionBody,
      city: 'Bishkek',
      country: 'Kyrgyzstan',
      endsAt: new Date('2013-02-09T00:00:00.000Z'),
      startsAt: new Date('2013-01-19T00:00:00.000Z'),
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
        groupId('journal'),
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
      const pageGroupOrder = [
        'about',
        'collectors',
        'commission',
        'private-viewings',
        'studio',
      ].indexOf(slug)
      const pageRow = {
        ...sharedRow(
          pageId,
          locale,
          slug,
          title,
          body,
          pageOrder,
          '',
          groupId('page', pageGroupOrder),
        ),
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
        groupId('press'),
      ),
      category: 'FEATURE',
      content: `${pressExcerpt} The linked Vecherniy Bishkek report remains the authority for the exhibition record.`,
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
