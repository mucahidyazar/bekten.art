// Mock news data converted from posts.json
export type NewsItem = {
  id: string
  title: string
  subtitle?: string
  description: string
  image: string
  date: Date
  location?: string
  address?: string
  note?: string
  created_at: Date
}

export const mockNewsData: NewsItem[] = [
  {
    id: '1',
    title: 'Solo Exhibition: "Echoes of the Soul"',
    subtitle: 'A Journey Through Contemporary Kyrgyz Art',
    description: 'Join us for an intimate exploration of Bekten Usubaliev\'s latest collection, featuring 25 new paintings that delve deep into the human psyche. This exhibition showcases a decade of artistic evolution, where traditional Kyrgyz motifs meet contemporary expression. Each piece tells a story of cultural identity, personal growth, and the universal language of emotions.',
    image: '/img/posts/post-3619922312392024400_28145032908-image-1.jpg',
    date: new Date('2024-02-15T18:00:00Z'),
    location: 'Bishkek Art Gallery',
    address: '123 Chuy Avenue, Bishkek, Kyrgyzstan',
    note: 'Opening reception with the artist. Light refreshments will be served.',
    created_at: new Date('2024-01-15T10:00:00Z'),
  },
  {
    id: '2',
    title: 'Art Workshop: "Painting with Passion"',
    subtitle: 'Master Class in Oil Painting Techniques',
    description: 'An exclusive hands-on workshop where participants will learn advanced oil painting techniques directly from master artist Bekten Usubaliev. This intensive 3-day course covers color theory, composition, brushwork, and the emotional aspects of artistic expression. Students will work on their own pieces while receiving personalized guidance.',
    image: '/img/posts/post-3587332812265915833_62643835481-image-1.jpg',
    date: new Date('2024-03-01T10:00:00Z'),
    location: 'Bekten Art Studio',
    address: '456 Manas Street, Bishkek, Kyrgyzstan',
    note: 'Limited to 12 participants. Materials provided. Registration required.',
    created_at: new Date('2024-02-01T10:00:00Z'),
  },
  {
    id: '3',
    title: 'International Art Fair Participation',
    subtitle: 'Representing Kyrgyz Art in Moscow',
    description: 'Bekten Usubaliev will represent contemporary Kyrgyz art at the prestigious Moscow International Art Fair. This marks a significant milestone in promoting Central Asian artistic heritage on the global stage. The exhibition will feature a curated selection of 15 paintings spanning the artist\'s career.',
    image: '/img/posts/post-3238556931117497609_28145032908-image-1.jpg',
    date: new Date('2024-03-20T12:00:00Z'),
    location: 'Moscow Expo Center',
    address: 'Krasnaya Presnya, 14, Moscow, Russia',
    note: 'Part of the Central Asian Artists Pavilion. Meet the artist on March 22nd.',
    created_at: new Date('2024-02-20T10:00:00Z'),
  },
  {
    id: '4',
    title: 'Art Lecture Series: "The Evolution of Modern Art"',
    subtitle: 'Understanding Contemporary Artistic Movements',
    description: 'A comprehensive lecture series exploring the development of modern art from the 20th century to present day. Bekten Usubaliev shares insights from his 25+ years in the art world, discussing influential movements, key artists, and the role of cultural identity in contemporary expression.',
    image: '/img/posts/post-3227749973078728824_28145032908-image-1.jpg',
    date: new Date('2024-04-05T19:00:00Z'),
    location: 'National Academy of Sciences',
    address: '265 Chuy Avenue, Bishkek, Kyrgyzstan',
    note: 'Free admission. Part of the Cultural Heritage Month program.',
    created_at: new Date('2024-03-05T10:00:00Z'),
  },
  {
    id: '5',
    title: 'Charity Auction: "Art for Education"',
    subtitle: 'Supporting Young Artists in Kyrgyzstan',
    description: 'A special charity auction featuring donated works from Bekten Usubaliev and other prominent Kyrgyz artists. All proceeds will support art education programs in rural schools across Kyrgyzstan. The event includes a silent auction, live bidding, and a special presentation about the importance of arts education.',
    image: '/img/posts/post-3224765720254667334_28145032908-image-1.jpg',
    date: new Date('2024-04-18T17:00:00Z'),
    location: 'Hyatt Regency Bishkek',
    address: '191 Abdrakhmanov Street, Bishkek, Kyrgyzstan',
    note: 'Black-tie optional. Cocktail reception starts at 5 PM, auction at 7 PM.',
    created_at: new Date('2024-03-18T10:00:00Z'),
  },
  {
    id: '6',
    title: 'Documentary Film Premiere: "The Artist\'s Journey"',
    subtitle: 'Behind the Scenes with Bekten Usubaliev',
    description: 'World premiere of an intimate documentary following Bekten Usubaliev\'s artistic process over the course of a year. The film captures the creation of his latest masterpiece series, revealing the inspiration, struggles, and triumphs of a working artist. Interviews with art critics, fellow artists, and family members provide insight into the man behind the canvas.',
    image: '/img/posts/post-3224214231899650243_28145032908-image-1.jpg',
    date: new Date('2024-05-10T20:00:00Z'),
    location: 'Ala-Too Cinema',
    address: '148 Chuy Avenue, Bishkek, Kyrgyzstan',
    note: 'Q&A session with the artist and filmmaker after the screening.',
    created_at: new Date('2024-04-10T10:00:00Z'),
  },
  {
    id: '7',
    title: 'New Painting Series: "Mountain Flowers"',
    subtitle: 'Celebrating Kyrgyz Natural Beauty',
    description: 'Bekten Usubaliev unveils his latest painting series inspired by the wildflowers of the Tian Shan mountains. This collection of 12 oil paintings captures the delicate beauty and resilience of alpine flora, rendered with the artist\'s signature blend of realism and emotional depth.',
    image: '/img/posts/post-3072114497564063718_28145032908-image-1.jpg',
    date: new Date('2024-05-25T16:00:00Z'),
    location: 'Artist\'s Studio',
    address: 'Private viewing by appointment',
    note: 'Contact gallery for private viewing appointments.',
    created_at: new Date('2024-05-01T10:00:00Z'),
  },
  {
    id: '8',
    title: 'Cultural Exchange Exhibition',
    subtitle: 'Kyrgyz-Turkish Artistic Dialogue',
    description: 'A groundbreaking exhibition featuring works by Bekten Usubaliev alongside Turkish contemporary artists. This cultural exchange explores the shared heritage and artistic traditions between the two nations, highlighting common themes of nomadic culture, landscape, and spiritual expression.',
    image: '/img/posts/post-3070662642153759473_28145032908-image-1.jpg',
    date: new Date('2024-06-08T18:30:00Z'),
    location: 'Turkish Cultural Center',
    address: '789 Erkindik Boulevard, Bishkek, Kyrgyzstan',
    note: 'Joint exhibition with Istanbul Modern Art Museum.',
    created_at: new Date('2024-05-15T10:00:00Z'),
  }
]
