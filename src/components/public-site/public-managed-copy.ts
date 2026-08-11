import type {PublicLocale} from './public-copy'

type LinkCopy = Readonly<{
  body: string
  label: string
  title: string
}>

type StepCopy = Readonly<{
  body: string
  title: string
}>

type FaqCopy = Readonly<{
  answer: string
  question: string
}>

type ManagedPageCopy = Readonly<{
  artist: Readonly<{
    biography: string
    explore: string
    exhibitions: string
    journal: string
    notes: string
    works: string
  }>
  collectors: Readonly<{
    inquiry: string
    services: readonly [LinkCopy, LinkCopy, LinkCopy]
    ways: string
  }>
  commission: Readonly<{
    faq: string
    faqs: readonly [FaqCopy, FaqCopy, FaqCopy]
    inquiry: string
    process: string
    steps: readonly [StepCopy, StepCopy, StepCopy, StepCopy, StepCopy]
  }>
  privateViewings: Readonly<{
    benefits: string
    benefitItems: readonly [StepCopy, StepCopy, StepCopy, StepCopy]
    expect: string
    expectationItems: readonly [StepCopy, StepCopy, StepCopy]
    inquiry: string
  }>
  studio: Readonly<{
    inside: string
    materials: string
    note: string
    process: string
    processItems: readonly [StepCopy, StepCopy, StepCopy]
  }>
}>

export const publicManagedCopy: Readonly<
  Record<PublicLocale, ManagedPageCopy>
> = Object.freeze({
  en: {
    artist: {
      biography: 'Biography & statement',
      explore: 'Explore the practice',
      exhibitions: 'View exhibitions',
      journal: 'Read the journal',
      notes: 'Practice notes',
      works: 'View works',
    },
    collectors: {
      inquiry: 'Begin a collector inquiry',
      services: [
        {
          body: 'Discover the works currently open to an availability conversation.',
          label: 'View available works',
          title: 'Available works',
        },
        {
          body: 'Request time to encounter selected works in a more focused setting.',
          label: 'Arrange a private viewing',
          title: 'Private viewings',
        },
        {
          body: 'Open a direct conversation about a work developed for a particular context.',
          label: 'Discuss a commission',
          title: 'Commissions',
        },
      ],
      ways: 'Ways to collect',
    },
    commission: {
      faq: 'Frequently asked questions',
      faqs: [
        {
          answer:
            'Share the context, preferred scale and any references that help express what you have in mind.',
          question: 'What can I include in my inquiry?',
        },
        {
          answer:
            'Yes. The inquiry is a starting point for questions and does not by itself confirm a commission.',
          question: 'Can I ask questions before deciding?',
        },
        {
          answer:
            'The studio discusses the direction and practical details with you directly before any work begins.',
          question: 'How are the next steps confirmed?',
        },
      ],
      inquiry: 'Start a commission inquiry',
      process: 'The commission process',
      steps: [
        {
          body: 'Introduce your idea, context and questions through the inquiry form.',
          title: 'Inquiry',
        },
        {
          body: 'The studio listens closely and helps clarify the intended direction.',
          title: 'Conversation',
        },
        {
          body: 'The artistic and practical scope is discussed directly with you.',
          title: 'Direction',
        },
        {
          body: 'Work begins only after the next steps have been clearly agreed.',
          title: 'Studio process',
        },
        {
          body: 'The studio remains in contact as the conversation develops.',
          title: 'Continuation',
        },
      ],
    },
    privateViewings: {
      benefits: 'A closer encounter',
      benefitItems: [
        {
          body: 'Spend focused time with selected works away from a crowded setting.',
          title: 'Close attention',
        },
        {
          body: 'Ask questions and hear the available context around the work.',
          title: 'Personal dialogue',
        },
        {
          body: 'Shape the request around the works and questions most relevant to you.',
          title: 'Considered selection',
        },
        {
          body: 'Continue the conversation privately with Bekten Studio.',
          title: 'Meaningful connection',
        },
      ],
      expect: 'What to expect',
      expectationItems: [
        {
          body: 'A brief introduction to the selected works and their published context.',
          title: 'Welcome & context',
        },
        {
          body: 'Unhurried time to look closely and form your own response.',
          title: 'Time with the work',
        },
        {
          body: 'Space for questions about the works and possible next steps.',
          title: 'Conversation',
        },
      ],
      inquiry: 'Request a private viewing',
    },
    studio: {
      inside: 'Inside the studio',
      materials: 'Materials & technique',
      note: 'Studio note',
      process: 'Creative process',
      processItems: [
        {
          body: 'Ideas, observations and references are gathered before a work takes shape.',
          title: 'Observe',
        },
        {
          body: 'Composition, material and rhythm are developed through the studio practice.',
          title: 'Develop',
        },
        {
          body: 'Each work is considered as a whole before it leaves the studio.',
          title: 'Resolve',
        },
      ],
    },
  },
  ky: {
    artist: {
      biography: 'Өмүр баян жана сүрөтчүнүн сөзү',
      explore: 'Чыгармачылыкты изилдөө',
      exhibitions: 'Көргөзмөлөрдү көрүү',
      journal: 'Журналды окуу',
      notes: 'Чыгармачылык жазмалар',
      works: 'Эмгектерди көрүү',
    },
    collectors: {
      inquiry: 'Коллекционердин суроосун баштоо',
      services: [
        {
          body: 'Учурда жеткиликтүүлүк боюнча талкууга ачык эмгектерди көрүңүз.',
          label: 'Жеткиликтүү эмгектер',
          title: 'Жеткиликтүү эмгектер',
        },
        {
          body: 'Тандалган эмгектерди тынч шартта жакындан көрүү үчүн өтүнүч калтырыңыз.',
          label: 'Жеке көрүүнү уюштуруу',
          title: 'Жеке көрүүлөр',
        },
        {
          body: 'Белгилүү бир контекст үчүн эмгек тууралуу түз маекти баштаңыз.',
          label: 'Буйрутманы талкуулоо',
          title: 'Буйрутмалар',
        },
      ],
      ways: 'Коллекция түзүүнүн жолдору',
    },
    commission: {
      faq: 'Көп берилүүчү суроолор',
      faqs: [
        {
          answer:
            'Оюңузду түшүндүрүүгө жардам берген контекстти, өлчөмдү жана шилтемелерди жазыңыз.',
          question: 'Суроого эмнелерди кошсом болот?',
        },
        {
          answer:
            'Ооба. Суроо — бул сүйлөшүүнүн башталышы жана өзү эле буйрутманы ырастабайт.',
          question: 'Чечим чыгарардан мурда суроо берсем болобу?',
        },
        {
          answer:
            'Иш башталганга чейин багыт жана практикалык деталдар сиз менен түз талкууланат.',
          question: 'Кийинки кадамдар кантип ырасталат?',
        },
      ],
      inquiry: 'Буйрутма тууралуу суроо жөнөтүү',
      process: 'Буйрутма процесси',
      steps: [
        {body: 'Оюңузду жана суроолоруңузду форма аркылуу жазыңыз.', title: 'Суроо'},
        {body: 'Студия ниетиңизди угуп, багытты тактоого жардам берет.', title: 'Сүйлөшүү'},
        {body: 'Чыгармачылык жана практикалык алкак түз талкууланат.', title: 'Багыт'},
        {body: 'Иш кийинки кадамдар так макулдашылгандан кийин башталат.', title: 'Студия процесси'},
        {body: 'Маек өнүккөн сайын студия сиз менен байланышта болот.', title: 'Улантуу'},
      ],
    },
    privateViewings: {
      benefits: 'Жакындан таанышуу',
      benefitItems: [
        {body: 'Тандалган эмгектерди тынч шартта кунт коюп көрүңүз.', title: 'Кунт коюу'},
        {body: 'Суроо берип, эмгек тууралуу жеткиликтүү маалыматты угуңуз.', title: 'Жеке маек'},
        {body: 'Суроону сиз үчүн маанилүү эмгектерге ылайыктаңыз.', title: 'Ойлонулган тандоо'},
        {body: 'Bekten Studio менен маекти жеке улантыңыз.', title: 'Маанилүү байланыш'},
      ],
      expect: 'Эмнени күтүүгө болот',
      expectationItems: [
        {body: 'Тандалган эмгектер жана алардын жарыяланган контексти менен таанышуу.', title: 'Таанышуу жана контекст'},
        {body: 'Жакындан карап, өз оюңузду түзүүгө жетиштүү убакыт.', title: 'Эмгек менен убакыт'},
        {body: 'Эмгектер жана кийинки кадамдар тууралуу суроо берүүгө мейкиндик.', title: 'Маек'},
      ],
      inquiry: 'Жеке көрүүгө өтүнүч',
    },
    studio: {
      inside: 'Студиянын ичинде',
      materials: 'Материалдар жана техника',
      note: 'Студия жазмасы',
      process: 'Чыгармачылык процесс',
      processItems: [
        {body: 'Иш калыптанганга чейин идеялар жана байкоолор чогултулат.', title: 'Байкоо'},
        {body: 'Композиция, материал жана ритм студияда өнүгөт.', title: 'Өнүктүрүү'},
        {body: 'Ар бир эмгек студиядан чыгар алдында толугу менен каралат.', title: 'Жыйынтыктоо'},
      ],
    },
  },
  ru: {
    artist: {
      biography: 'Биография и высказывание',
      explore: 'Исследовать практику',
      exhibitions: 'Смотреть выставки',
      journal: 'Читать журнал',
      notes: 'Заметки о практике',
      works: 'Смотреть работы',
    },
    collectors: {
      inquiry: 'Начать запрос коллекционера',
      services: [
        {body: 'Откройте работы, доступность которых можно обсудить сейчас.', label: 'Смотреть доступные работы', title: 'Доступные работы'},
        {body: 'Запросите время для внимательного знакомства с выбранными работами.', label: 'Организовать частный просмотр', title: 'Частные просмотры'},
        {body: 'Начните прямой разговор о работе для определённого контекста.', label: 'Обсудить заказ', title: 'Работы на заказ'},
      ],
      ways: 'Способы коллекционирования',
    },
    commission: {
      faq: 'Частые вопросы',
      faqs: [
        {answer: 'Расскажите о контексте, желаемом масштабе и приложите уместные ориентиры.', question: 'Что можно указать в запросе?'},
        {answer: 'Да. Запрос начинает разговор и сам по себе не подтверждает заказ.', question: 'Можно ли задать вопросы до решения?'},
        {answer: 'Направление и практические детали обсуждаются с вами до начала работы.', question: 'Как подтверждаются следующие шаги?'},
      ],
      inquiry: 'Начать запрос на заказ',
      process: 'Процесс заказа',
      steps: [
        {body: 'Опишите идею, контекст и вопросы в форме запроса.', title: 'Запрос'},
        {body: 'Студия внимательно выслушает и поможет уточнить направление.', title: 'Разговор'},
        {body: 'Художественные и практические рамки обсуждаются напрямую.', title: 'Направление'},
        {body: 'Работа начинается после ясного согласования дальнейших шагов.', title: 'Процесс в студии'},
        {body: 'Студия остаётся на связи по мере развития разговора.', title: 'Продолжение'},
      ],
    },
    privateViewings: {
      benefits: 'Встреча с искусством',
      benefitItems: [
        {body: 'Проведите время с выбранными работами в спокойной обстановке.', title: 'Внимательный взгляд'},
        {body: 'Задайте вопросы и узнайте доступный контекст работ.', title: 'Личный диалог'},
        {body: 'Сформируйте запрос вокруг наиболее важных для вас работ.', title: 'Продуманный выбор'},
        {body: 'Продолжите разговор с Bekten Studio конфиденциально.', title: 'Значимая связь'},
      ],
      expect: 'Чего ожидать',
      expectationItems: [
        {body: 'Краткое знакомство с выбранными работами и опубликованным контекстом.', title: 'Знакомство и контекст'},
        {body: 'Спокойное время, чтобы внимательно посмотреть и составить своё впечатление.', title: 'Время с работой'},
        {body: 'Возможность задать вопросы о работах и дальнейших шагах.', title: 'Разговор'},
      ],
      inquiry: 'Запросить частный просмотр',
    },
    studio: {
      inside: 'Внутри студии',
      materials: 'Материалы и техника',
      note: 'Заметка из студии',
      process: 'Творческий процесс',
      processItems: [
        {body: 'Идеи, наблюдения и ориентиры собираются до появления формы.', title: 'Наблюдение'},
        {body: 'Композиция, материал и ритм развиваются в студийной практике.', title: 'Развитие'},
        {body: 'Каждая работа рассматривается как целое до выхода из студии.', title: 'Завершение'},
      ],
    },
  },
  tr: {
    artist: {
      biography: 'Biyografi ve sanatçı anlatısı',
      explore: 'Pratiği keşfet',
      exhibitions: 'Sergileri gör',
      journal: 'Journal’ı oku',
      notes: 'Pratik notları',
      works: 'Eserleri gör',
    },
    collectors: {
      inquiry: 'Koleksiyoner talebi başlat',
      services: [
        {body: 'Şu anda uygunluk görüşmesine açık eserleri keşfedin.', label: 'Uygun eserleri gör', title: 'Uygun eserler'},
        {body: 'Seçili eserlerle daha odaklı bir ortamda karşılaşmak için talep oluşturun.', label: 'Kişisel gösterim düzenle', title: 'Kişisel gösterimler'},
        {body: 'Belirli bir bağlam için geliştirilecek eser hakkında doğrudan konuşun.', label: 'Özel eseri görüş', title: 'Özel eserler'},
      ],
      ways: 'Koleksiyon oluşturma yolları',
    },
    commission: {
      faq: 'Sık sorulan sorular',
      faqs: [
        {answer: 'Aklınızdakini anlatan bağlamı, tercih ettiğiniz ölçeği ve ilgili referansları paylaşın.', question: 'Talebime neler ekleyebilirim?'},
        {answer: 'Evet. Talep bir konuşma başlangıcıdır ve tek başına özel eseri kesinleştirmez.', question: 'Karar vermeden önce soru sorabilir miyim?'},
        {answer: 'Yön ve uygulamaya ilişkin ayrıntılar, çalışma başlamadan önce sizinle doğrudan görüşülür.', question: 'Sonraki adımlar nasıl kesinleşir?'},
      ],
      inquiry: 'Özel eser talebi başlat',
      process: 'Özel eser süreci',
      steps: [
        {body: 'Fikrinizi, bağlamı ve sorularınızı talep formuyla paylaşın.', title: 'Talep'},
        {body: 'Stüdyo sizi dinler ve amaçlanan yönü netleştirmeye yardımcı olur.', title: 'Görüşme'},
        {body: 'Sanatsal ve uygulamaya ilişkin kapsam doğrudan görüşülür.', title: 'Yön'},
        {body: 'Çalışma ancak sonraki adımlar açıkça kararlaştırıldıktan sonra başlar.', title: 'Stüdyo süreci'},
        {body: 'Konuşma geliştikçe stüdyo sizinle iletişimde kalır.', title: 'Devam'},
      ],
    },
    privateViewings: {
      benefits: 'Daha yakından bir karşılaşma',
      benefitItems: [
        {body: 'Seçili eserlerle kalabalıktan uzakta, odaklanarak zaman geçirin.', title: 'Yakından bakış'},
        {body: 'Sorular sorun ve eserlerin mevcut bağlamını dinleyin.', title: 'Kişisel diyalog'},
        {body: 'Talebi sizin için önemli eser ve sorular etrafında şekillendirin.', title: 'Özenli seçki'},
        {body: 'Bekten Studio ile konuşmayı özel olarak sürdürün.', title: 'Anlamlı bağ'},
      ],
      expect: 'Neler bekleyebilirsiniz',
      expectationItems: [
        {body: 'Seçili eserlere ve yayımlanmış bağlamlarına kısa bir giriş.', title: 'Karşılama ve bağlam'},
        {body: 'Yakından bakmak ve kendi karşılığınızı oluşturmak için sakin bir zaman.', title: 'Eserle zaman'},
        {body: 'Eserler ve olası sonraki adımlar hakkında soru alanı.', title: 'Görüşme'},
      ],
      inquiry: 'Kişisel gösterim talep et',
    },
    studio: {
      inside: 'Stüdyonun içinde',
      materials: 'Malzeme ve teknik',
      note: 'Stüdyo notu',
      process: 'Yaratıcı süreç',
      processItems: [
        {body: 'Bir eser biçim kazanmadan önce fikirler, gözlemler ve referanslar birikir.', title: 'Gözlem'},
        {body: 'Kompozisyon, malzeme ve ritim stüdyo pratiği içinde gelişir.', title: 'Geliştirme'},
        {body: 'Her eser stüdyodan ayrılmadan önce bir bütün olarak değerlendirilir.', title: 'Tamamlama'},
      ],
    },
  },
})
