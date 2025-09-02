export interface Testimonial {
  id: number
  name: string
  title: string
  company?: string
  location: string
  quote: string
  avatar: string
  rating: number
  category: 'artist' | 'businessman' | 'politician' | 'collector' | 'critic'
}

export const testimonialsData: Testimonial[] = [
  {
    id: 1,
    name: 'Ahmet Davutoğlu',
    title: 'Eski Başbakan',
    company: 'Türkiye Cumhuriyeti',
    location: 'Ankara, Türkiye',
    quote: 'Bekten Usubaliev\'in sanatı, Türk-Kırgız kardeşliğinin en güzel ifadesidir. Onun eserlerinde geleneksel değerlerle modern sanatın mükemmel bir sentezini görüyoruz.',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=male&id=1',
    rating: 5,
    category: 'politician'
  },
  {
    id: 2,
    name: 'Prof. Dr. Mustafa Cezar',
    title: 'Sanat Tarihçisi',
    company: 'İstanbul Üniversitesi',
    location: 'İstanbul, Türkiye',
    quote: 'Bekten\'in fırça darbeleri, sadece renkleri değil, ruhları da tuval üzerine aktarıyor. Her eseri, Orta Asya kültürünün derinliklerine yapılan bir yolculuk.',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=male&id=2',
    rating: 5,
    category: 'critic'
  },
  {
    id: 3,
    name: 'Rahmi M. Koç',
    title: 'İş İnsanı & Koleksiyoner',
    company: 'Koç Holding',
    location: 'İstanbul, Türkiye',
    quote: 'Yıllardır sanat koleksiyonculuğu yapıyorum. Bekten Usubaliev\'in eserleri, koleksiyonumun en değerli parçaları arasında. Onun sanatında hem teknik mükemmellik hem de derin duygusal ifade var.',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=male&id=3',
    rating: 5,
    category: 'businessman'
  },
  {
    id: 4,
    name: 'Erol Akyavaş',
    title: 'Ressam',
    company: 'Türk Resim Sanatı',
    location: 'İstanbul, Türkiye',
    quote: 'Bekten kardeşimle tanışmak, benim için büyük bir şans oldu. Onun sanatındaki samimilik ve ustalık, genç sanatçılara örnek olmalı.',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=male&id=4',
    rating: 5,
    category: 'artist'
  },
  {
    id: 5,
    name: 'Dr. Müjdat Gezen',
    title: 'Sanat Yönetmeni',
    company: 'Müjdat Gezen Sanat Merkezi',
    location: 'İstanbul, Türkiye',
    quote: 'Bekten Usubaliev, çağdaş sanatın en özgün seslerinden biri. Onun eserleri, kültürler arası diyalogun en güzel örnekleri.',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=male&id=5',
    rating: 5,
    category: 'critic'
  },
  {
    id: 6,
    name: 'Zülfü Livaneli',
    title: 'Sanatçı & Yazar',
    company: 'UNESCO Sanatçısı',
    location: 'İstanbul, Türkiye',
    quote: 'Bekten\'in sanatı, sadece görsel bir deneyim değil, aynı zamanda ruhsal bir yolculuk. Her eseri, insanlığın ortak değerlerini yansıtıyor.',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=male&id=6',
    rating: 5,
    category: 'artist'
  },
  {
    id: 7,
    name: 'Suna Kıraç',
    title: 'Sanat Koleksiyoneri',
    company: 'Suna ve İnan Kıraç Vakfı',
    location: 'İstanbul, Türkiye',
    quote: 'Bekten Usubaliev\'in eserleri, vakfımızın koleksiyonunda özel bir yere sahip. Onun sanatındaki kültürel zenginlik ve teknik mükemmellik takdire şayan.',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=female&id=1',
    rating: 5,
    category: 'collector'
  },
  {
    id: 8,
    name: 'Bedri Rahmi Eyüboğlu',
    title: 'Ressam & Şair',
    company: 'Akademi Resim Bölümü',
    location: 'İstanbul, Türkiye',
    quote: 'Genç Bekten\'de büyük bir yetenek gördüm. Onun sanatı, geleneksel Türk sanatının çağdaş yorumu olarak son derece değerli.',
    avatar: 'https://xsgames.co/randomusers/avatar.php?g=male&id=7',
    rating: 5,
    category: 'artist'
  }
]
