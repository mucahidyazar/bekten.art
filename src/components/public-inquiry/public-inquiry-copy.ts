import type {
  PublicInquiryLocale,
  PublicInquiryType,
} from './public-inquiry-form'

type InquiryCopy = Readonly<{
  action: string
  attendees: string
  availabilityDescription: string
  availabilityTitle: string
  commissionBrief: string
  commissionBriefDescription: string
  commissionDescription: string
  commissionTitle: string
  consent: string
  email: string
  error: string
  generalDescription: string
  generalTitle: string
  message: string
  name: string
  note: string
  phone: string
  preferredDate: string
  preferredDatesDescription: string
  privacyPolicy: string
  privateViewingDescription: string
  privateViewingTitle: string
  secondDate: string
  sending: string
  subject: string
  success: string
  thirdDate: string
  timeline: string
}>

export function inquiryHeading(copy: InquiryCopy, type: PublicInquiryType) {
  if (type === 'AVAILABILITY') {
    return {
      description: copy.availabilityDescription,
      title: copy.availabilityTitle,
    }
  }

  if (type === 'COMMISSION') {
    return {
      description: copy.commissionDescription,
      title: copy.commissionTitle,
    }
  }

  if (type === 'PRIVATE_VIEWING') {
    return {
      description: copy.privateViewingDescription,
      title: copy.privateViewingTitle,
    }
  }

  return {description: copy.generalDescription, title: copy.generalTitle}
}

export const publicInquiryCopy: Readonly<
  Record<PublicInquiryLocale, InquiryCopy>
> = {
  en: {
    action: 'Send private request',
    attendees: 'Attendees (optional)',
    availabilityDescription:
      'Request discreet information about this work directly from the studio.',
    availabilityTitle: 'Availability inquiry',
    commissionBrief: 'Commission brief',
    commissionBriefDescription:
      'Describe the setting, scale and atmosphere you have in mind.',
    commissionDescription:
      'Begin a private conversation with the studio about a commissioned work.',
    commissionTitle: 'Commission inquiry',
    consent:
      'I accept the Privacy Policy and consent to the studio contacting me about this request.',
    email: 'Email address',
    error: 'We could not receive your request. Please try again.',
    generalDescription:
      'Write to the studio about the archive, exhibitions or another private request.',
    generalTitle: 'Contact the studio',
    message: 'Message',
    name: 'Full name',
    note: 'Your note (optional)',
    phone: 'Phone (optional)',
    preferredDate: 'Preferred date',
    preferredDatesDescription:
      'Choose up to three dates. The studio will confirm arrangements privately.',
    privacyPolicy: 'Privacy Policy',
    privateViewingDescription:
      'Request a private viewing and the studio will reply with suitable arrangements.',
    privateViewingTitle: 'Private viewing',
    secondDate: 'Alternative date (optional)',
    sending: 'Sending request',
    subject: 'Subject',
    success: 'Your private request has been received.',
    thirdDate: 'Second alternative date (optional)',
    timeline: 'Preferred timeline (optional)',
  },
  ky: {
    action: 'Жеке өтүнүч жөнөтүү',
    attendees: 'Катышуучулар (милдеттүү эмес)',
    availabilityDescription:
      'Бул чыгарма тууралуу маалыматты түздөн-түз студиядан купуя сураңыз.',
    availabilityTitle: 'Чыгарма тууралуу суроо',
    commissionBrief: 'Тапшырыктын сүрөттөлүшү',
    commissionBriefDescription:
      'Каалаган мейкиндикти, өлчөмдү жана маанайды сүрөттөп бериңиз.',
    commissionDescription:
      'Жеке чыгарма тууралуу студия менен купуя сүйлөшүүнү баштаңыз.',
    commissionTitle: 'Жеке чыгармага өтүнүч',
    consent:
      'Купуялык саясатын кабыл алам жана студиянын бул өтүнүч боюнча мага кайрылышына макулмун.',
    email: 'Электрондук почта',
    error: 'Өтүнүчүңүздү кабыл ала алган жокпуз. Кайра аракет кылыңыз.',
    generalDescription:
      'Архив, көргөзмөлөр же башка жеке өтүнүч боюнча студияга жазыңыз.',
    generalTitle: 'Студия менен байланышуу',
    message: 'Билдирүү',
    name: 'Толук аты-жөнү',
    note: 'Кошумча билдирүү (милдеттүү эмес)',
    phone: 'Телефон (милдеттүү эмес)',
    preferredDate: 'Каалаган күн',
    preferredDatesDescription:
      'Үч күнгө чейин тандаңыз. Студия шарттарды жеке ырастайт.',
    privacyPolicy: 'Купуялык саясаты',
    privateViewingDescription:
      'Жеке көрүү үчүн өтүнүч калтырыңыз, студия ылайыктуу шарттар менен жооп берет.',
    privateViewingTitle: 'Жеке көрүү',
    secondDate: 'Башка күн (милдеттүү эмес)',
    sending: 'Өтүнүч жөнөтүлүүдө',
    subject: 'Тема',
    success: 'Жеке өтүнүчүңүз кабыл алынды.',
    thirdDate: 'Экинчи башка күн (милдеттүү эмес)',
    timeline: 'Каалаган мөөнөт (милдеттүү эмес)',
  },
  ru: {
    action: 'Отправить частный запрос',
    attendees: 'Количество гостей (необязательно)',
    availabilityDescription:
      'Запросите информацию об этой работе напрямую у студии в частном порядке.',
    availabilityTitle: 'Запрос о работе',
    commissionBrief: 'Описание заказа',
    commissionBriefDescription:
      'Опишите пространство, масштаб и атмосферу, которые вы представляете.',
    commissionDescription:
      'Начните частный разговор со студией о создании работы на заказ.',
    commissionTitle: 'Индивидуальный заказ',
    consent:
      'Я принимаю Политику конфиденциальности и разрешаю студии связаться со мной по этому запросу.',
    email: 'Электронная почта',
    error: 'Не удалось принять ваш запрос. Пожалуйста, попробуйте ещё раз.',
    generalDescription:
      'Напишите студии об архиве, выставках или другом частном запросе.',
    generalTitle: 'Связаться со студией',
    message: 'Сообщение',
    name: 'Имя и фамилия',
    note: 'Комментарий (необязательно)',
    phone: 'Телефон (необязательно)',
    preferredDate: 'Предпочтительная дата',
    preferredDatesDescription:
      'Выберите до трёх дат. Студия подтвердит детали в личном ответе.',
    privacyPolicy: 'Политика конфиденциальности',
    privateViewingDescription:
      'Запросите частный просмотр, и студия предложит подходящие условия.',
    privateViewingTitle: 'Частный просмотр',
    secondDate: 'Другая дата (необязательно)',
    sending: 'Запрос отправляется',
    subject: 'Тема',
    success: 'Ваш частный запрос получен.',
    thirdDate: 'Ещё одна дата (необязательно)',
    timeline: 'Желаемые сроки (необязательно)',
  },
  tr: {
    action: 'Özel talep gönder',
    attendees: 'Katılımcı sayısı (isteğe bağlı)',
    availabilityDescription:
      'Bu eser hakkında doğrudan stüdyodan özel olarak bilgi isteyin.',
    availabilityTitle: 'Eser uygunluk talebi',
    commissionBrief: 'Özel eser açıklaması',
    commissionBriefDescription:
      'Aklınızdaki mekânı, ölçeği ve atmosferi anlatın.',
    commissionDescription:
      'Size özel bir eser için stüdyo ile gizli bir görüşme başlatın.',
    commissionTitle: 'Özel eser talebi',
    consent:
      'Gizlilik Politikası’nı kabul ediyor ve stüdyonun bu taleple ilgili benimle iletişim kurmasına izin veriyorum.',
    email: 'E-posta adresi',
    error: 'Talebinizi alamadık. Lütfen tekrar deneyin.',
    generalDescription:
      'Arşiv, sergiler veya başka bir özel talep için stüdyoya yazın.',
    generalTitle: 'Stüdyo ile iletişim',
    message: 'Mesaj',
    name: 'Ad soyad',
    note: 'Notunuz (isteğe bağlı)',
    phone: 'Telefon (isteğe bağlı)',
    preferredDate: 'Tercih edilen tarih',
    preferredDatesDescription:
      'En fazla üç tarih seçin. Stüdyo ayrıntıları özel olarak teyit edecektir.',
    privacyPolicy: 'Gizlilik Politikası',
    privateViewingDescription:
      'Özel gösterim talebinde bulunun; stüdyo uygun düzenlemelerle yanıt versin.',
    privateViewingTitle: 'Özel gösterim',
    secondDate: 'Alternatif tarih (isteğe bağlı)',
    sending: 'Talep gönderiliyor',
    subject: 'Konu',
    success: 'Özel talebiniz alındı.',
    thirdDate: 'İkinci alternatif tarih (isteğe bağlı)',
    timeline: 'Tercih edilen zamanlama (isteğe bağlı)',
  },
}
